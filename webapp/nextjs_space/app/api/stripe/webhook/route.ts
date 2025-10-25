import { NextRequest, NextResponse } from 'next/server';
import { getStripeInstance, getStripeWebhookSecret } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { updateDealStage } from '@/lib/crm-auto-deal';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    const stripe = await getStripeInstance();
    const webhookSecret = await getStripeWebhookSecret();

    if (!stripe || !webhookSecret) {
      console.error('Stripe webhook not configured');
      return NextResponse.json(
        { error: 'Stripe webhook not configured' },
        { status: 503 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: error?.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const leadId = session.metadata?.leadId;
  const paymentType = session.metadata?.paymentType;

  if (!leadId) {
    console.error('No leadId in session metadata');
    return;
  }

  try {
    // Fetch the lead to get full details
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      console.error(`Lead ${leadId} not found`);
      return;
    }

    const updateData: any = {
      paymentStatus: 'paid',
      stripePaymentId: session.payment_intent as string,
      stripeSessionId: session.id,
      stripeCustomerId: session.customer as string,
      paymentCompletedAt: new Date(),
      status: 'won', // Update lead status to won
    };

    if (paymentType === 'deposit') {
      updateData.depositPaid = true;
      updateData.depositAmount = session.amount_total ? session.amount_total / 100 : 0;
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    console.log(`Payment completed for lead ${leadId}`);

    // ============= AUTO-UPDATE CRM DEAL STAGE =============
    if (paymentType === 'deposit') {
      try {
        await updateDealStage(leadId, 'DEPOSIT_PAID', 'system');
        console.log(`✅ Deal stage updated to DEPOSIT_PAID for lead ${leadId}`);
      } catch (dealError) {
        console.error('Failed to update deal stage:', dealError);
        // Don't fail the webhook if deal update fails
      }
    }

    // ============= PHASE 5: AUTO-CREATE INSTALLATION JOB =============
    
    // Check if job already exists (prevent duplicate creation)
    const existingJob = await prisma.installationJob.findUnique({
      where: { leadId: leadId },
    });

    if (existingJob) {
      console.log(`Installation job already exists for lead ${leadId}`);
      return;
    }

    // Generate unique job number
    const jobNumber = await generateJobNumber();

    // Parse quote data to extract component details
    const quoteData = lead.quoteData as any;
    
    // Find best matching team based on location
    const assignedTeam = await findBestTeam(lead.suburb, lead.latitude, lead.longitude);

    // Calculate scheduling deadline (14 days from payment)
    const schedulingDeadline = new Date();
    schedulingDeadline.setDate(schedulingDeadline.getDate() + 14);

    // Determine if this is a commercial job based on size or property type
    const isCommercial = lead.propertyType === 'commercial' || lead.systemSizeKw > 30;

    // Extract selected components from quote data
    const selectedComponents = {
      panel: quoteData?.selectedPanel || null,
      battery: quoteData?.selectedBattery || null,
      inverter: quoteData?.selectedInverter || null,
      addons: lead.selectedAddons || [],
    };

    // Create installation job
    const newJob = await prisma.installationJob.create({
      data: {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        leadId: leadId,
        jobNumber: jobNumber,
        
        // Auto-assign to team if found
        teamId: assignedTeam?.id,
        assignedAt: assignedTeam ? new Date() : null,
        assignmentMethod: assignedTeam ? 'auto_location' : null,
        assignedBy: 'system',
        
        // Initial status
        status: 'PENDING_SCHEDULE',
        schedulingDeadline: schedulingDeadline,
        
        // Site location
        siteLatitude: lead.latitude,
        siteLongitude: lead.longitude,
        siteSuburb: lead.suburb,
        
        // System details
        systemSize: lead.systemSizeKw,
        panelCount: lead.numPanels,
        batteryCapacity: lead.batterySizeKwh || 0,
        inverterModel: quoteData?.inverterBrand || 'Standard',
        isCommercial: isCommercial,
        
        // Component selection
        selectedComponents: selectedComponents,
        
        // Estimated installation time (based on system size)
        estimatedDuration: calculateEstimatedDuration(lead.systemSizeKw, lead.batterySizeKwh),
        
        updatedAt: new Date(),
        
        // Installation notes from lead
        installationNotes: `
Property: ${lead.propertyType}
Roof Type: ${lead.roofType}
Household Size: ${lead.householdSize}
Has EV: ${lead.hasEv ? 'Yes' : 'No'}
${lead.notes ? `Additional Notes: ${lead.notes}` : ''}
        `.trim(),
      },
    });

    console.log(`✅ Installation job ${jobNumber} created for lead ${leadId}`);
    
    if (assignedTeam) {
      console.log(`📍 Job auto-assigned to team: ${assignedTeam.name}`);
    } else {
      console.log(`⚠️ No team found for location: ${lead.suburb}. Manual assignment required.`);
    }

    // Generate JWT token for customer scheduling (valid for 30 days)
    const schedulingToken = jwt.sign(
      { 
        jobId: newJob.id,
        leadId: leadId,
        purpose: 'customer_scheduling',
      },
      process.env.NEXTAUTH_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    // Generate scheduling URL
    const schedulingUrl = `${process.env.NEXTAUTH_URL}/schedule/${newJob.id}?token=${schedulingToken}`;

    // Send scheduling email to customer
    console.log('=== CUSTOMER SCHEDULING EMAIL ===');
    console.log(`To: ${lead.email}`);
    console.log(`Subject: Schedule Your Solar Installation - Job ${jobNumber}`);
    console.log(`Scheduling URL: ${schedulingUrl}`);
    console.log('=====================================');
    
    // TODO: Implement actual email sending via SendGrid/Resend
    // await sendSchedulingEmail({
    //   to: lead.email,
    //   customerName: lead.name,
    //   jobNumber: jobNumber,
    //   systemSize: lead.systemSizeKw,
    //   schedulingUrl: schedulingUrl,
    //   deadline: schedulingDeadline,
    // });

    // Notify admin/operations team
    console.log(`📧 Scheduling email would be sent to: ${lead.email}`);

    // ============= PRIORITY 3: AUTO-GENERATE MATERIAL ORDERS =============
    
    console.log(`\n🔄 Generating material orders for Job ${jobNumber}...`);
    
    // Import order generator (dynamic import to avoid circular dependencies)
    const { autoGenerateOrders } = await import('@/lib/order-generator');
    
    const orderResult = await autoGenerateOrders(newJob.id);
    
    if (orderResult.success) {
      console.log(`✅ Material orders generated successfully`);
      console.log(`   • Total Orders: ${orderResult.summary.totalOrders}`);
      console.log(`   • Total Cost: $${orderResult.summary.totalCost.toFixed(2)}`);
      
      for (const supplier of orderResult.summary.supplierBreakdown) {
        console.log(`   • ${supplier.supplierName}: ${supplier.itemCount} items, $${supplier.subtotal.toFixed(2)}`);
      }
      
      // Notify admin about new orders
      console.log('\n📦 NEW ORDERS READY FOR REVIEW:');
      for (const order of orderResult.orders) {
        console.log(`   • PO ${order.poNumber} - ${order.supplier.name}`);
      }
    } else {
      console.error(`❌ Failed to generate orders:`);
      for (const error of orderResult.errors) {
        console.error(`   • ${error}`);
      }
      
      // Don't fail the webhook if order generation fails
      // Admin can manually create orders later
    }
    
    console.log('=====================================\n');
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
    throw error; // Re-throw to ensure webhook retry
  }
}

// Generate unique job number (format: SDI-YYYYMMDD-XXX)
async function generateJobNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find highest job number for today
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));
  
  const todayJobs = await prisma.installationJob.findMany({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: {
      jobNumber: 'desc',
    },
    take: 1,
  });

  let sequence = 1;
  if (todayJobs.length > 0) {
    const lastJobNumber = todayJobs[0].jobNumber;
    const lastSequence = parseInt(lastJobNumber.split('-')[2] || '0');
    sequence = lastSequence + 1;
  }

  return `SDI-${dateStr}-${sequence.toString().padStart(3, '0')}`;
}

// Find best matching team based on location
async function findBestTeam(
  suburb: string | null, 
  latitude: number | null, 
  longitude: number | null
): Promise<any> {
  if (!suburb && (!latitude || !longitude)) {
    return null;
  }

  // Get all active teams with defined service areas
  const teams = await prisma.team.findMany({
    where: {
      isActive: true,
    },
    include: {
      _count: {
        select: {
          jobs: {
            where: {
              status: {
                in: ['SCHEDULED', 'IN_PROGRESS', 'MATERIALS_READY'],
              },
            },
          },
        },
      },
    },
  });

  // Filter teams that have service areas defined
  const teamsWithServiceAreas = teams.filter(
    team => team.serviceSuburbs.length > 0 || team.serviceAreaGeoJSON !== null
  );

  // First try to match by suburb
  if (suburb) {
    const suburbLower = suburb.toLowerCase();
    const suburbMatches = teamsWithServiceAreas.filter(team =>
      team.serviceSuburbs.some(s => s.toLowerCase().includes(suburbLower))
    );

    if (suburbMatches.length > 0) {
      // If multiple matches, choose team with least current jobs
      return suburbMatches.sort((a, b) => 
        (a._count?.jobs || 0) - (b._count?.jobs || 0)
      )[0];
    }
  }

  // If no suburb match and we have coordinates, try GeoJSON polygon matching
  if (latitude && longitude && teamsWithServiceAreas.some(t => t.serviceAreaGeoJSON)) {
    for (const team of teamsWithServiceAreas) {
      if (team.serviceAreaGeoJSON) {
        const geoJSON = team.serviceAreaGeoJSON as any;
        if (isPointInPolygon(latitude, longitude, geoJSON)) {
          return team;
        }
      }
    }
  }

  // No match found
  return null;
}

// Simple point-in-polygon check for GeoJSON
function isPointInPolygon(lat: number, lng: number, geoJSON: any): boolean {
  try {
    if (geoJSON.type === 'FeatureCollection' && geoJSON.features) {
      // Check each feature
      for (const feature of geoJSON.features) {
        if (feature.geometry?.type === 'Polygon') {
          const coordinates = feature.geometry.coordinates[0]; // Outer ring
          if (pointInPolygon(lat, lng, coordinates)) {
            return true;
          }
        }
      }
    } else if (geoJSON.type === 'Polygon') {
      const coordinates = geoJSON.coordinates[0];
      return pointInPolygon(lat, lng, coordinates);
    }
  } catch (error) {
    console.error('Error checking point in polygon:', error);
  }
  return false;
}

// Ray casting algorithm for point in polygon
function pointInPolygon(lat: number, lng: number, coordinates: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const xi = coordinates[i][0], yi = coordinates[i][1];
    const xj = coordinates[j][0], yj = coordinates[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Calculate estimated installation duration based on system complexity
function calculateEstimatedDuration(systemSizeKw: number, batterySizeKwh: number): number {
  let baseDuration = 4; // Base 4 hours for small system
  
  // Add time for larger systems (0.5 hour per additional 5kW)
  if (systemSizeKw > 10) {
    baseDuration += Math.ceil((systemSizeKw - 10) / 5) * 0.5;
  }
  
  // Add time for battery installation (2-3 hours depending on size)
  if (batterySizeKwh > 0) {
    baseDuration += batterySizeKwh > 20 ? 3 : 2;
  }
  
  return Math.min(baseDuration, 10); // Cap at 10 hours (full day + buffer)
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
  // Additional handling if needed
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Find lead by payment intent ID
  const lead = await prisma.lead.findFirst({
    where: { stripePaymentId: paymentIntent.id },
  });

  if (lead) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { paymentStatus: 'failed' },
    });

    console.log(`Payment failed for lead ${lead.id}`);
    // Here you would send failure notification
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // Find lead by payment intent ID
  const lead = await prisma.lead.findFirst({
    where: { stripePaymentId: charge.payment_intent as string },
  });

  if (lead) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { paymentStatus: 'refunded' },
    });

    console.log(`Payment refunded for lead ${lead.id}`);
    // Here you would send refund notification
  }
}
