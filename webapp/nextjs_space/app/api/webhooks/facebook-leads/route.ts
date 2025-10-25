import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { autoCreateDeal } from '@/lib/crm-auto-deal';

const prisma = new PrismaClient();

const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'your_verify_token_here';
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';

// Webhook verification (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Facebook webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// Webhook receiver (POST)
export async function POST(req: NextRequest) {
  try {
    // Verify signature
    const signature = req.headers.get('x-hub-signature-256');
    const body = await req.text();

    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);

    // Process lead
    if (data.object === 'page') {
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            await processLeadgen(change.value);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Facebook webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature || !APP_SECRET) return false;

  const expectedSignature =
    'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

async function processLeadgen(value: any) {
  const leadgenId = value.leadgen_id;
  const formId = value.form_id;

  // Fetch full lead data from Facebook
  const leadData = await fetchLeadData(leadgenId);

  if (!leadData) return;

  // Extract field data
  const fields = extractFields(leadData.field_data);

  // Create lead in database
  const lead = await prisma.lead.create({
    data: {
      id: `lead_fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: fields.full_name || fields.first_name + ' ' + fields.last_name || '',
      email: fields.email || '',
      phone: fields.phone_number || '',
      address: fields.street_address || fields.city || 'TBD',
      suburb: fields.city,
      leadSource: 'facebook',
      leadSourceDetails: `Form: ${formId}`,
      utmSource: 'facebook',
      utmMedium: 'lead_ad',
      utmCampaign: formId,
      initialNotes: `Facebook Lead Ad submission. Form ID: ${formId}`,
      status: 'new',
      leadType: 'confirmed', // Has contact info
      quarterlyBill: parseFloat(fields.quarterly_bill) || null,
      propertyType: fields.property_type || '',
      householdSize: parseInt(fields.household_size) || 4,
      systemSizeKw: 0,
      numPanels: 0,
      batterySizeKwh: 0,
      quoteData: {},
      quoteReference: `FB-${Date.now()}`,
      updatedAt: new Date(),
    },
  });

  console.log('Facebook lead created:', fields.email);

  // Auto-create deal for Facebook lead
  try {
    await autoCreateDeal({
      leadId: lead.id,
      leadName: fields.full_name || fields.name || 'Facebook Lead',
      leadEmail: fields.email || '',
      leadPhone: fields.phone_number || fields.phone || '',
      systemSizeKw: 0, // Will be determined later
      batterySizeKwh: 0,
      totalValue: 0, // Will be calculated when quote is generated
      leadSource: 'FACEBOOK',
      utmSource: 'facebook',
      utmMedium: 'social',
      utmCampaign: fields.campaign_name || 'facebook_leadgen',
    });
    console.log(`✅ Deal auto-created for Facebook lead ${lead.id}`);
  } catch (dealError) {
    console.error('Failed to auto-create deal for Facebook lead:', dealError);
    // Don't fail the webhook if deal creation fails
  }
}

async function fetchLeadData(leadgenId: string) {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('Facebook access token not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${accessToken}`
    );

    if (!response.ok) {
      console.error('Failed to fetch lead data from Facebook');
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Facebook lead data:', error);
    return null;
  }
}

function extractFields(fieldData: any[]): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const field of fieldData) {
    fields[field.name] = field.values[0];
  }

  return fields;
}

export const dynamic = 'force-dynamic';
