import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT - Update FAQ
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const faq = await prisma.fAQ.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json({ success: true, faq });
  } catch (error: any) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to update FAQ', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete FAQ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.fAQ.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'FAQ deleted' });
  } catch (error: any) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to delete FAQ', details: error.message },
      { status: 500 }
    );
  }
}
