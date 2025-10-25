
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const teamId = searchParams.get('teamId');
    const search = searchParams.get('search');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (teamId && teamId !== 'all') {
      where.teamId = teamId;
    }

    if (search) {
      where.OR = [
        { jobNumber: { contains: search, mode: 'insensitive' } },
        { siteSuburb: { contains: search, mode: 'insensitive' } },
        { lead: { name: { contains: search, mode: 'insensitive' } } },
        { lead: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const jobs = await prisma.installationJob.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            quoteReference: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        subcontractor: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
        materialOrders: {
          select: {
            id: true,
            poNumber: true,
            status: true,
            total: true,
            confirmedAt: true,
            confirmationDocumentUrl: true,
            supplierEstimatedDelivery: true,
            supplier: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { schedulingDeadline: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Check if lead exists and has paid
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (!lead.depositPaid) {
      return NextResponse.json(
        { error: 'Deposit must be paid before creating job' },
        { status: 400 }
      );
    }

    // Check if job already exists
    const existingJob = await prisma.installationJob.findUnique({
      where: { leadId },
    });

    if (existingJob) {
      return NextResponse.json(
        { error: 'Installation job already exists for this lead' },
        { status: 400 }
      );
    }

    // Generate job number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const todayJobs = await prisma.installationJob.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });

    const jobNumber = `SDI-${dateStr}-${(todayJobs + 1).toString().padStart(3, '0')}`;

    // Calculate scheduling deadline
    const schedulingDeadline = new Date();
    schedulingDeadline.setDate(schedulingDeadline.getDate() + 14);

    const quoteData = lead.quoteData as any;

    // Create installation job
    const job = await prisma.installationJob.create({
      data: {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        leadId,
        jobNumber,
        status: 'PENDING_SCHEDULE',
        schedulingDeadline,
        siteLatitude: lead.latitude,
        siteLongitude: lead.longitude,
        siteSuburb: lead.suburb,
        systemSize: lead.systemSizeKw,
        panelCount: lead.numPanels,
        batteryCapacity: lead.batterySizeKwh || 0,
        inverterModel: quoteData?.inverterBrand || 'Standard',
        isCommercial: lead.propertyType === 'commercial',
        selectedComponents: {
          panel: quoteData?.selectedPanel || null,
          battery: quoteData?.selectedBattery || null,
          inverter: quoteData?.selectedInverter || null,
          addons: lead.selectedAddons || [],
        },
        estimatedDuration: 4,
        installationNotes: `Manual creation from admin dashboard`,
        assignedBy: 'admin',
        updatedAt: new Date(),
      },
      include: {
        lead: true,
      },
    });

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create job' },
      { status: 500 }
    );
  }
}
