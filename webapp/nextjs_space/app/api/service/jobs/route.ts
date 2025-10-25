import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      serviceType,
      priority,
      installationJobId,
      customerId,
      scheduledDate,
      assignedToId,
    } = body;

    if (!title || !serviceType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create service job
    const serviceJob = await prisma.serviceJob.create({
      data: {
        title,
        description,
        serviceType,
        priority: priority || 'MEDIUM',
        installationJobId,
        customerId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        assignedToId,
        status: 'PENDING',
      },
      include: {
        installationJob: {
          select: {
            id: true,
            lead: {
              select: {
                name: true,
                address: true,
                phone: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      job: serviceJob,
    });
  } catch (error) {
    console.error('Service job creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedToId = searchParams.get('assignedToId');

    const where: any = {};
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;

    const serviceJobs = await prisma.serviceJob.findMany({
      where,
      include: {
        installationJob: {
          select: {
            id: true,
            lead: {
              select: {
                name: true,
                address: true,
                phone: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      jobs: serviceJobs,
    });
  } catch (error) {
    console.error('Error fetching service jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service jobs' },
      { status: 500 }
    );
  }
}
