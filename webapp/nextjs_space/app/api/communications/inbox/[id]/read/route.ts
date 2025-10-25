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
    const { read } = body; // true or false

    const communication = await prisma.communication.update({
      where: { id },
      data: {
        openedAt: read ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      communication,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update read status' },
      { status: 500 }
    );
  }
}
