import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        lead: {
          include: {
            CustomerQuote: true,
            InstallationJob: {
              select: {
                id: true,
                jobNumber: true,
                status: true,
                scheduledDate: true,
              },
            },
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            performer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        proposals: {
          orderBy: {
            sentAt: 'desc',
          },
          include: {
            quote: true,
          },
        },
        communications: {
          orderBy: {
            sentAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { success: false, error: 'Deal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deal,
    });
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deal' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      title,
      value,
      probability,
      expectedCloseDate,
      status,
      lostReason,
    } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (value !== undefined) updateData.value = value;
    if (probability !== undefined) updateData.probability = probability;
    if (expectedCloseDate) updateData.expectedCloseDate = new Date(expectedCloseDate);
    if (status) {
      updateData.status = status;
      if (status === 'WON') updateData.wonAt = new Date();
      if (status === 'LOST') {
        updateData.lostAt = new Date();
        if (lostReason) updateData.lostReason = lostReason;
      }
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        lead: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      deal,
    });
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update deal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.deal.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Deal deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete deal' },
      { status: 500 }
    );
  }
}
