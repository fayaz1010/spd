
/**
 * Installer Job Detail API
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    console.log('[Job Detail] Fetching job:', params.id);
    console.log('[Job Detail] User:', decoded.electricianId || decoded.teamMemberId || decoded.role);

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
            postcode: true,
            systemSizeKw: true,
            batterySizeKwh: true,
            numPanels: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        subcontractor: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
      },
    });

    if (!job) {
      console.log('[Job Detail] Job not found:', params.id);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log('[Job Detail] Job found:', job.jobNumber, 'Status:', job.status);

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Installer job detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}
