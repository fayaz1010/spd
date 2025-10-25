import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { autoCreateDeal } from '@/lib/crm-auto-deal';

const prisma = new PrismaClient();

const WEBHOOK_SECRET = process.env.GOOGLE_ADS_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const secret = req.headers.get('x-webhook-secret');
    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Process lead form submission
    if (body.type === 'LEAD_FORM_SUBMISSION') {
      await processGoogleLead(body.data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Ads webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processGoogleLead(data: any) {
  const { leadFormId, campaignId, adGroupId, formSubmission } = data;

  // Extract form fields
  const fields = extractGoogleFields(formSubmission.fieldData);

  // Create lead in database
  const lead = await prisma.lead.create({
    data: {
      id: `lead_google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: fields.name || fields.full_name || '',
      email: fields.email || '',
      phone: fields.phone || fields.phone_number || '',
      address: fields.address || fields.street_address || 'TBD',
      suburb: fields.city,
      leadSource: 'google',
      leadSourceDetails: `Campaign: ${campaignId}, Ad Group: ${adGroupId}`,
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: campaignId,
      initialNotes: `Google Ads Lead Form submission. Form ID: ${leadFormId}`,
      status: 'new',
      leadType: 'confirmed', // Has contact info
      quarterlyBill: parseFloat(fields.quarterly_bill) || null,
      propertyType: fields.property_type || '',
      householdSize: parseInt(fields.household_size) || 4,
      systemSizeKw: 0,
      numPanels: 0,
      batterySizeKwh: 0,
      quoteData: {},
      quoteReference: `GOOGLE-${Date.now()}`,
      updatedAt: new Date(),
    },
  });

  console.log('Google Ads lead created:', fields.email);

  // Auto-create deal for Google Ads lead
  try {
    await autoCreateDeal({
      leadId: lead.id,
      leadName: fields.name || fields.full_name || 'Google Ads Lead',
      leadEmail: fields.email || '',
      leadPhone: fields.phone || fields.phone_number || '',
      systemSizeKw: 0, // Will be determined later
      batterySizeKwh: 0,
      totalValue: 0, // Will be calculated when quote is generated
      leadSource: 'GOOGLE',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: campaignId || 'google_leadgen',
    });
    console.log(`✅ Deal auto-created for Google Ads lead ${lead.id}`);
  } catch (dealError) {
    console.error('Failed to auto-create deal for Google Ads lead:', dealError);
    // Don't fail the webhook if deal creation fails
  }
}

function extractGoogleFields(fieldData: any[]): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const field of fieldData) {
    fields[field.fieldId] = field.value;
  }

  return fields;
}

export const dynamic = 'force-dynamic';
