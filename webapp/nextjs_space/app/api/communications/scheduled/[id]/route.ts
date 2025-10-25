import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { scheduledFor, status, body: messageBody, subject } = body;

    const updateData: any = {};
    if (scheduledFor) updateData.scheduledFor = new Date(scheduledFor);
    if (status) updateData.status = status;
    if (messageBody) updateData.body = messageBody;
    if (subject) updateData.subject = subject;

    const scheduled = await prisma.scheduledMessage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      scheduled,
    });
  } catch (error) {
    console.error('Update scheduled message error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update scheduled message' },
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

    await prisma.scheduledMessage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled message cancelled',
    });
  } catch (error) {
    console.error('Cancel scheduled message error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel scheduled message' },
      { status: 500 }
    );
  }
}
