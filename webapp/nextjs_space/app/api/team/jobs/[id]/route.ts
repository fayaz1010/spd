import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, canAccessJob, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);

    const job = await prisma.installationJob.findUnique({
      where: { id: params.id },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            suburb: true,
            latitude: true,
            longitude: true,
            systemSizeKw: true,
            numPanels: true,
            batterySizeKwh: true,
            selectedAddons: true,
            roofType: true,
            propertyType: true,
          },
        },
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
        subcontractor: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check access
    if (!canAccessJob(user, job)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error('Get job error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const body = await request.json();

    const job = await prisma.installationJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check access
    if (!canAccessJob(user, job)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Team members can only update certain fields
    const allowedFields: any = {};
    
    if (user.role === UserRole.TEAM_MEMBER) {
      // Team members can update status and notes
      if (body.status) allowedFields.status = body.status;
      if (body.notes !== undefined) allowedFields.notes = body.notes;
      if (body.actualStartDate) allowedFields.actualStartDate = new Date(body.actualStartDate);
      if (body.actualEndDate) allowedFields.actualEndDate = new Date(body.actualEndDate);
    } else {
      // Admins can update all fields
      Object.assign(allowedFields, body);
      
      // Convert date strings to Date objects
      if (body.scheduledDate) allowedFields.scheduledDate = new Date(body.scheduledDate);
      if (body.actualStartDate) allowedFields.actualStartDate = new Date(body.actualStartDate);
      if (body.actualEndDate) allowedFields.actualEndDate = new Date(body.actualEndDate);
      if (body.deliveryDate) allowedFields.deliveryDate = new Date(body.deliveryDate);
    }

    const updated = await prisma.installationJob.update({
      where: { id: params.id },
      data: allowedFields,
      include: {
        lead: true,
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      job: updated,
    });
  } catch (error: any) {
    console.error('Update job error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
