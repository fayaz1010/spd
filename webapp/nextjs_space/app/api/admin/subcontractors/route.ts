
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const where: any = {};

    if (active === 'true') {
      where.isActive = true;
    }

    const subcontractors = await prisma.subcontractor.findMany({
      where,
      orderBy: {
        companyName: 'asc',
      },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    return NextResponse.json({ subcontractors });
  } catch (error: any) {
    console.error('Error fetching subcontractors:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch subcontractors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyName,
      contactName,
      email,
      phone,
      serviceSuburbs,
      dayRate,
      hourlyRate,
      costPerJob,
    } = body;

    // Validation
    if (!companyName || !contactName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.subcontractor.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A subcontractor with this email already exists' },
        { status: 400 }
      );
    }

    const subcontractor = await prisma.subcontractor.create({
      data: {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        companyName,
        contactName,
        email,
        phone,
        serviceSuburbs: serviceSuburbs || [],
        dayRate: dayRate ? parseFloat(dayRate) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        costPerJob: costPerJob ? parseFloat(costPerJob) : null,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ subcontractor });
  } catch (error: any) {
    console.error('Error creating subcontractor:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create subcontractor' },
      { status: 500 }
    );
  }
}
