
/**
 * API Route: Create Early Lead (Potential Lead)
 * Creates a minimal lead record as soon as address is entered
 * This helps track all potential customers even if they don't complete the form
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateQuoteReference } from '@/lib/quote-reference';
import { autoCreateDeal } from '@/lib/crm/deal-automation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      address,
      propertyType,
      roofType,
      latitude,
      longitude,
      suburb,
      // Contact details (if provided, this is a confirmed lead)
      name,
      firstName,
      lastName,
      email,
      phone,
      preferredContactTime,
      // Energy profile
      quarterlyBill,
      householdSize,
      hasEv,
      planningEv,
      evCount,
      evChargingTime,
      hasPool,
      poolHeated,
      homeOfficeCount,
      // System selection
      systemSizeKw,
      numPanels,
      batterySizeKwh,
      selectedAddons,
      quoteData,
      quoteId,
    } = body;

    if (!address || !sessionId) {
      return NextResponse.json(
        { error: 'Address and sessionId are required' },
        { status: 400 }
      );
    }

    // Determine lead type and status based on provided data
    const hasContactInfo = email && phone && name;
    const leadType = hasContactInfo ? 'confirmed' : 'potential';
    const leadStatus = hasContactInfo ? 'contacted' : 'new';

    // Check if lead already exists for this session
    const existingQuote = await prisma.customerQuote.findUnique({
      where: { sessionId },
      include: { lead: true },
    });

    // If lead exists and we have contact info, update it to confirmed lead
    if (existingQuote?.lead && hasContactInfo) {
      const updatedLead = await prisma.lead.update({
        where: { id: existingQuote.lead.id },
        data: {
          name: name || existingQuote.lead.name,
          email: email || existingQuote.lead.email,
          phone: phone || existingQuote.lead.phone,
          preferredContactTime: preferredContactTime || existingQuote.lead.preferredContactTime,
          leadType: 'confirmed', // Upgrade from potential to confirmed
          status: 'contacted', // Update status
          quarterlyBill: quarterlyBill || existingQuote.lead.quarterlyBill,
          householdSize: householdSize || existingQuote.lead.householdSize,
          hasEv: hasEv !== undefined ? hasEv : existingQuote.lead.hasEv,
          planningEv: planningEv !== undefined ? planningEv : existingQuote.lead.planningEv,
          evCount: evCount || existingQuote.lead.evCount,
          evChargingTime: evChargingTime || existingQuote.lead.evChargingTime,
          systemSizeKw: systemSizeKw || existingQuote.lead.systemSizeKw,
          numPanels: numPanels || existingQuote.lead.numPanels,
          batterySizeKwh: batterySizeKwh || existingQuote.lead.batterySizeKwh,
          selectedAddons: selectedAddons ? selectedAddons : existingQuote.lead.selectedAddons,
          quoteData: quoteData || existingQuote.lead.quoteData,
          updatedAt: new Date(),
        },
      });

      // Auto-create deal for confirmed lead
      try {
        await autoCreateDeal(updatedLead.id);
        console.log(`Deal auto-created for confirmed lead ${updatedLead.id}`);
      } catch (dealError) {
        console.error('Failed to auto-create deal:', dealError);
        // Don't fail the lead update if deal creation fails
      }

      return NextResponse.json({
        success: true,
        leadId: updatedLead.id,
        quoteId: existingQuote.id,
        quoteReference: updatedLead.quoteReference,
        message: 'Lead updated to confirmed status',
      });
    }

    // If lead exists but no contact info, just return existing lead
    if (existingQuote?.lead) {
      return NextResponse.json({
        success: true,
        leadId: existingQuote.lead.id,
        quoteId: existingQuote.id,
        quoteReference: existingQuote.lead.quoteReference,
        message: 'Lead already exists for this session',
      });
    }

    // Generate quote reference
    let quoteReference = generateQuoteReference();
    let referenceExists = await prisma.lead.findUnique({
      where: { quoteReference },
    });
    
    while (referenceExists) {
      quoteReference = generateQuoteReference();
      referenceExists = await prisma.lead.findUnique({
        where: { quoteReference },
      });
    }

    // Create lead with appropriate type and status
    const lead = await prisma.lead.create({
      data: {
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        address,
        propertyType: propertyType || '',
        roofType: roofType || '',
        latitude,
        longitude,
        suburb,
        quoteReference,
        // Contact details (if provided)
        name: name || '',
        email: email || '',
        phone: phone || '',
        preferredContactTime: preferredContactTime || '',
        // Lead classification
        leadType: leadType, // 'potential' or 'confirmed'
        status: leadStatus, // 'new' or 'contacted'
        // Energy profile
        quarterlyBill: quarterlyBill || null,
        householdSize: householdSize || 4,
        hasEv: hasEv || false,
        planningEv: planningEv || false,
        evCount: evCount || 0,
        evChargingTime: evChargingTime || null,
        // System selection
        systemSizeKw: systemSizeKw || 0,
        numPanels: numPanels || 0,
        batterySizeKwh: batterySizeKwh || 0,
        selectedAddons: selectedAddons || [],
        quoteData: quoteData || {}, // Empty JSON object for potential leads
        updatedAt: new Date(),
      },
    });

    // Create or update customer quote with lead connection
    let quote;
    if (existingQuote) {
      quote = await prisma.customerQuote.update({
        where: { id: existingQuote.id },
        data: { leadId: lead.id },
      });
    } else {
      quote = await prisma.customerQuote.create({
        data: {
          id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId,
          leadId: lead.id,
          quoteReference,
          status: 'draft',
          quoteSource: 'calculator', // Mark as calculator-generated
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      });
    }

    // Auto-create deal for confirmed leads (those with contact info)
    if (hasContactInfo) {
      try {
        await autoCreateDeal(lead.id);
        console.log(`Deal auto-created for new confirmed lead ${lead.id}`);
      } catch (dealError) {
        console.error('Failed to auto-create deal:', dealError);
        // Don't fail the lead creation if deal creation fails
      }
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      quoteId: quote.id,
      quoteReference,
      message: hasContactInfo ? 'Confirmed lead created successfully' : 'Potential lead created successfully',
    });
  } catch (error: any) {
    console.error('Error creating early lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead', details: error.message },
      { status: 500 }
    );
  }
}
