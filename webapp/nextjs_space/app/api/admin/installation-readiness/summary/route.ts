import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch all leads where CustomerQuote status is ACCEPTED (Stage 8+)
    const acceptedLeads = await prisma.lead.findMany({
      where: {
        CustomerQuote: {
          status: 'ACCEPTED',
        },
      },
      include: {
        CustomerQuote: true,
        InstallationJob: true,
        regulatoryApplication: true,
        rebateTracking: true,
        loanApplication: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Helper function to map lead to summary format
    const mapLead = (lead: any) => ({
      id: lead.id,
      name: lead.name,
      address: lead.address,
      systemSizeKw: lead.systemSizeKw,
      batterySizeKwh: lead.batterySizeKwh,
      quoteReference: lead.quoteReference,
    });

    // 1. Applications Approved - All regulatory, rebate & loan approvals complete
    const applicationsApproved = acceptedLeads.filter((lead) => {
      const reg = lead.regulatoryApplication;
      const rebate = lead.rebateTracking;
      const loan = lead.loanApplication;

      // Check if all required approvals are done
      const synergyOk = reg?.synergyApproved || false;
      const wpOk = reg?.wpApproved || false;
      const stcOk = rebate?.stcConfirmed || false;
      
      // Loan only required if customer requested it
      const loanOk = lead.loanRequested ? (loan?.approved || false) : true;
      
      // State rebate optional
      const stateOk = rebate?.waStateConfirmed || true;

      return synergyOk && wpOk && stcOk && loanOk;
    }).map(mapLead);

    // 2. Team Assigned - Installation team allocated
    const teamAssigned = acceptedLeads.filter((lead) => {
      return lead.InstallationJob?.teamId || lead.InstallationJob?.subcontractorId;
    }).map(mapLead);

    // 3. Materials Ordered - Equipment purchase orders sent
    const materialsOrdered = acceptedLeads.filter((lead) => {
      return lead.InstallationJob?.materialsDelivered || lead.InstallationJob?.materialsReadyAt;
    }).map(mapLead);

    // 4. Scheduled - Installation date confirmed
    const scheduled = acceptedLeads.filter((lead) => {
      return lead.InstallationJob?.scheduledDate || lead.InstallationJob?.installationDate;
    }).map(mapLead);

    // 5. Completed - Installation finished
    const completed = acceptedLeads.filter((lead) => {
      return lead.InstallationJob?.completedAt || lead.InstallationJob?.status === 'COMPLETED';
    }).map(mapLead);

    // 6. Documentation Submitted - Compliance docs uploaded
    const documentationSubmitted = acceptedLeads.filter((lead) => {
      // For now, consider docs submitted if job is completed
      return lead.InstallationJob?.completedAt !== null;
    }).map(mapLead);

    return NextResponse.json({
      applicationsApproved,
      teamAssigned,
      materialsOrdered,
      scheduled,
      completed,
      documentationSubmitted,
      metrics: {
        totalAccepted: acceptedLeads.length,
        applicationsApprovedCount: applicationsApproved.length,
        teamAssignedCount: teamAssigned.length,
        materialsOrderedCount: materialsOrdered.length,
        scheduledCount: scheduled.length,
        completedCount: completed.length,
        documentationSubmittedCount: documentationSubmitted.length,
      },
    });
  } catch (error) {
    console.error('Error fetching installation readiness summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installation readiness data' },
      { status: 500 }
    );
  }
}
