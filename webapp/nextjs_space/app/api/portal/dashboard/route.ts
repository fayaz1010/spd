import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, [UserRole.CUSTOMER]);

    if (!user.leadId) {
      return NextResponse.json(
        { error: 'Customer not linked to a lead' },
        { status: 400 }
      );
    }

    // Fetch customer data
    const lead = await prisma.lead.findUnique({
      where: { id: user.leadId },
      include: {
        CustomerQuote: true,
        InstallationJob: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
            materialOrders: {
              include: {
                supplier: true,
              },
            },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Customer data not found' },
        { status: 404 }
      );
    }

    // Calculate installation progress
    const job = lead.InstallationJob;
    let progress = 0;
    let currentStage = 'Quote Received';
    let nextStep = 'Review and accept your quote';

    if (job) {
      const stages = [
        { key: 'quote_accepted', label: 'Quote Accepted', progress: 20 },
        { key: 'deposit_paid', label: 'Deposit Paid', progress: 40 },
        { key: 'materials_ordered', label: 'Materials Ordered', progress: 60 },
        { key: 'installation_scheduled', label: 'Installation Scheduled', progress: 70 },
        { key: 'installation_in_progress', label: 'Installation In Progress', progress: 85 },
        { key: 'installation_completed', label: 'Installation Complete', progress: 95 },
        { key: 'system_activated', label: 'System Activated', progress: 100 },
      ];

      // Determine current stage based on job status
      if (job.status === 'COMPLETED') {
        progress = 100;
        currentStage = 'System Activated';
        nextStep = 'Enjoy your solar savings!';
      } else if (job.status === 'IN_PROGRESS') {
        progress = 85;
        currentStage = 'Installation In Progress';
        nextStep = 'Our team is installing your system';
      } else if (job.scheduledDate) {
        progress = 70;
        currentStage = 'Installation Scheduled';
        nextStep = `Installation on ${new Date(job.scheduledDate).toLocaleDateString()}`;
      } else if (job.materialOrders && job.materialOrders.length > 0) {
        progress = 60;
        currentStage = 'Materials Ordered';
        nextStep = 'Waiting for materials to arrive';
      } else if (lead.depositPaid) {
        progress = 40;
        currentStage = 'Deposit Paid';
        nextStep = 'Ordering materials';
      } else if (lead.CustomerQuote?.status === 'accepted') {
        progress = 20;
        currentStage = 'Quote Accepted';
        nextStep = 'Pay your deposit to proceed';
      }
    } else if (lead.CustomerQuote?.status === 'accepted') {
      progress = 20;
      currentStage = 'Quote Accepted';
      nextStep = 'We are preparing your installation';
    }

    // Calculate days until installation
    let daysUntilInstallation = null;
    if (job?.scheduledDate) {
      const today = new Date();
      const installDate = new Date(job.scheduledDate);
      const diffTime = installDate.getTime() - today.getTime();
      daysUntilInstallation = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      success: true,
      customer: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        suburb: lead.suburb,
      },
      quote: lead.CustomerQuote ? {
        id: lead.CustomerQuote.id,
        quoteReference: lead.CustomerQuote.quoteReference,
        status: lead.CustomerQuote.status,
        systemSizeKw: lead.systemSizeKw,
        numPanels: lead.numPanels,
        batterySizeKwh: lead.batterySizeKwh,
        totalCost: lead.CustomerQuote.totalCostAfterRebates,
        depositAmount: lead.CustomerQuote.depositAmount,
        createdAt: lead.CustomerQuote.createdAt,
        expiresAt: lead.CustomerQuote.validUntil,
      } : null,
      job: job ? {
        id: job.id,
        jobNumber: job.jobNumber,
        status: job.status,
        scheduledDate: job.scheduledDate,
        completedAt: job.completedAt,
        team: job.team ? {
          name: job.team.name,
          members: job.team.members.map(m => ({
            name: m.name,
            role: m.role,
            phone: m.phone,
          })),
        } : null,
        materialOrders: job.materialOrders?.map(order => ({
          id: order.id,
          poNumber: order.poNumber,
          status: order.status,
          supplier: order.supplier.name,
          expectedDelivery: order.expectedDelivery,
        })) || [],
      } : null,
      progress: {
        percentage: progress,
        currentStage,
        nextStep,
        daysUntilInstallation,
      },
      payment: {
        depositPaid: lead.depositPaid,
        depositAmount: lead.depositAmount,
        paymentStatus: lead.paymentStatus,
        paymentMethod: lead.paymentMethod,
      },
    });
  } catch (error: any) {
    console.error('Get customer dashboard error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
