import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const rebates = await prisma.rebateTracking.findMany({
      include: {
        lead: {
          include: {
            CustomerQuote: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedRebates = rebates.map(rebate => ({
      id: rebate.id,
      leadId: rebate.leadId,
      leadName: rebate.lead.name,
      stcAmount: rebate.lead.CustomerQuote?.federalSolarRebate || 0,
      batteryRebate: rebate.lead.CustomerQuote?.stateBatteryRebate || 0,
      status: rebate.stcStatus,
      stcSubmittedAt: rebate.stcSubmittedAt,
      stcApprovedAt: rebate.stcApprovedAt,
    }));

    return NextResponse.json({ rebates: formattedRebates });
  } catch (error) {
    console.error('Error fetching rebate tracking:', error);
    return NextResponse.json({ rebates: [] }, { status: 500 });
  }
}
