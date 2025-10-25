import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-admin';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    requireAdmin(request);

    const checklist = await prisma.siteVisitChecklist.findUnique({
      where: { leadId: params.leadId },
    });

    return NextResponse.json({ success: true, checklist });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching site visit checklist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    requireAdmin(request);

    const body = await request.json();

    const checklist = await prisma.siteVisitChecklist.update({
      where: { leadId: params.leadId },
      data: body,
    });

    return NextResponse.json({ success: true, checklist });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating site visit checklist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
