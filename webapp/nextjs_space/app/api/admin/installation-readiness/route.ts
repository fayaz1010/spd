import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all leads with their related data
    const leads = await prisma.lead.findMany({
      include: {
        CustomerQuote: true,
        siteVisit: true,
        regulatoryApplication: true,
        rebateTracking: true,
        loanApplication: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to readiness format
    const readinessLeads = leads.map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      address: lead.address,
      systemSize: lead.systemSizeKw,
      hasBattery: lead.batterySizeKwh > 0,
      status: lead.status,
      depositPaid: lead.depositPaid,
      siteVisitCompleted: !!lead.siteVisitCompletedAt,
      regulatoryApproved: lead.regulatoryApplication?.synergyStatus === 'APPROVED' && 
                          lead.regulatoryApplication?.westernPowerStatus === 'APPROVED',
      rebatesApproved: lead.rebateTracking?.stcStatus === 'APPROVED',
      loanApproved: lead.loanApplication ? lead.loanApplication.status === 'APPROVED' : null,
      readyForInstallation: lead.readyForInstallation,
      blockedReason: lead.installationBlockedReason,
    }));

    return NextResponse.json({ leads: readinessLeads });
  } catch (error) {
    console.error('Error fetching installation readiness:', error);
    return NextResponse.json({ leads: [] }, { status: 500 });
  }
}
