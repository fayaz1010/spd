
/**
 * Complete Installation API
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

    const formData = await request.formData();
    const notes = formData.get('notes') as string;

    // TODO: Handle photo uploads to cloud storage
    // For now, just update the job status

    const job = await db.installationJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const updatedJob = await db.installationJob.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        installationNotes: notes,
        updatedAt: new Date(),
      },
    });

    // TODO: Send completion email to customer

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('Complete installation error:', error);
    return NextResponse.json(
      { error: 'Failed to complete installation' },
      { status: 500 }
    );
  }
}
