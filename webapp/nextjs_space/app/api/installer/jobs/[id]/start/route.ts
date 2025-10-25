
/**
 * Start Installation API
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const job = await db.installationJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const updatedJob = await db.installationJob.update({
      where: { id: params.id },
      data: {
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('Start installation error:', error);
    return NextResponse.json(
      { error: 'Failed to start installation' },
      { status: 500 }
    );
  }
}
