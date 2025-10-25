import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT - Update case study
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const caseStudy = await prisma.caseStudy.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json({ success: true, caseStudy });
  } catch (error: any) {
    console.error('Error updating case study:', error);
    return NextResponse.json(
      { error: 'Failed to update case study', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete case study
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.caseStudy.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Case study deleted' });
  } catch (error: any) {
    console.error('Error deleting case study:', error);
    return NextResponse.json(
      { error: 'Failed to delete case study', details: error.message },
      { status: 500 }
    );
  }
}
