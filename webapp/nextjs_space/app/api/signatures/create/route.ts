import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { updateDealStage } from '@/lib/crm-auto-deal';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteId, signatureData, signerName, signatureMethod = 'draw' } = body;

    if (!quoteId || !signatureData || !signerName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get client IP and user agent for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if quote exists
    const quote = await prisma.customerQuote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Check if already signed
    const existingSignature = await prisma.quoteSignature.findUnique({
      where: { quoteId },
    });

    if (existingSignature) {
      return NextResponse.json(
        { success: false, error: 'Quote already signed' },
        { status: 400 }
      );
    }

    // Create signature record
    const signature = await prisma.quoteSignature.create({
      data: {
        quoteId,
        signatureData,
        signedBy: signerName,
        ipAddress,
        userAgent,
      },
    });

    // Update quote status to ACCEPTED and record signature details
    await prisma.customerQuote.update({
      where: { id: quoteId },
      data: { 
        status: 'ACCEPTED',
        customerSignature: signatureData
      }
    });

    // Auto-update CRM deal stage: PROPOSAL_ACCEPTED → WON
    try {
      // First update to PROPOSAL_ACCEPTED
      await updateDealStage(quote.leadId, 'PROPOSAL_ACCEPTED', 'system');
      console.log(`✅ Deal stage updated to PROPOSAL_ACCEPTED for lead ${quote.leadId}`);
      
      // Then immediately update to WON (deal is won when proposal is signed)
      await updateDealStage(quote.leadId, 'WON', 'system');
      console.log(`✅ Deal stage updated to WON for lead ${quote.leadId}`);
      
      // Update deal status to WON
      await prisma.deal.update({
        where: { leadId: quote.leadId },
        data: {
          status: 'WON',
          wonAt: new Date(),
          probability: 100,
        }
      });

      // Auto-handoff to operations pipeline
      await prisma.lead.update({
        where: { id: quote.leadId },
        data: {
          pipelineStatus: 'OPERATIONS',
          handoffAt: new Date(),
          handoffBy: 'system',
        }
      });
      console.log(`✅ Lead ${quote.leadId} handed off to OPERATIONS pipeline`);

      // TODO: Send email notification to operations team
      // await sendEmail({
      //   to: 'operations@sundirectpower.com.au',
      //   subject: 'New Customer Handoff',
      //   body: `Deal won for ${quote.lead?.name}. Ready for regulatory approvals.`
      // });

    } catch (dealError) {
      console.error('Failed to update deal stage:', dealError);
      // Don't fail the request if deal update fails
    }

    return NextResponse.json({
      success: true,
      signature: {
        id: signature.id,
        signedAt: signature.signedAt,
        signedBy: signature.signedBy,
      },
    });
  } catch (error) {
    console.error('Error creating signature:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create signature' },
      { status: 500 }
    );
  }
}
