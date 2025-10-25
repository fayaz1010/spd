import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-admin';
import { autoCreateDeal } from '@/lib/crm/deal-automation';

const prisma = new PrismaClient();

/**
 * Migration API: Create Deals for Existing Leads
 * One-time migration to create deals for all existing leads that don't have them
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    // Find all leads without deals
    const leadsWithoutDeals = await prisma.lead.findMany({
      where: {
        deal: null,
        // Only create deals for leads with contact info (confirmed leads)
        AND: [
          { name: { not: '' } },
          { email: { not: '' } },
          { phone: { not: '' } },
        ],
      },
      include: {
        CustomerQuote: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${leadsWithoutDeals.length} leads without deals`);

    const results = {
      total: leadsWithoutDeals.length,
      successful: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Create deals for each lead
    for (const lead of leadsWithoutDeals) {
      try {
        await autoCreateDeal(lead.id);
        results.successful++;
        console.log(`✅ Deal created for lead ${lead.id} (${lead.name})`);
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          leadId: lead.id,
          leadName: lead.name,
          error: error.message,
        });
        console.error(`❌ Failed to create deal for lead ${lead.id}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
