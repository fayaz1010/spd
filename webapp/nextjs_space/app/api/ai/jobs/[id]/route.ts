import { NextRequest, NextResponse } from 'next/server';
import { getJobStatus } from '@/lib/background-jobs';

export const dynamic = 'force-dynamic';

/**
 * Get job status
 * GET /api/ai/jobs/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    
    const job = await getJobStatus(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    );
  }
}
