import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = params;

    // Update vacancy with foreign tracking data
    const vacancy = await prisma.vacancy.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      include: {
        position: {
          select: {
            title: true,
            positionCode: true,
          },
        },
      },
    });

    // Auto-enable foreign applicants if all criteria met
    if (vacancy.advertisingStartDate) {
      const startDate = new Date(vacancy.advertisingStartDate);
      const eligibilityDate = new Date(vacancy.foreignEligibilityDate || '');
      const today = new Date();
      
      const platformsOk = (vacancy.advertisingPlatforms as any[])?.length >= 3;
      const feesOk = vacancy.sponsorFeePaid && vacancy.nominationFeePaid && vacancy.safLevyPaid;
      const timeOk = today >= eligibilityDate;
      
      if (platformsOk && feesOk && timeOk && !vacancy.allowForeignApplicants) {
        await prisma.vacancy.update({
          where: { id },
          data: { allowForeignApplicants: true },
        });
      }
    }

    return NextResponse.json({ vacancy }, { status: 200 });
  } catch (error) {
    console.error('Error updating foreign tracking:', error);
    return NextResponse.json(
      { error: 'Failed to update foreign tracking' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
