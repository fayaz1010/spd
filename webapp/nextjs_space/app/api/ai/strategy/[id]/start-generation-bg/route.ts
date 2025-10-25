import { NextRequest, NextResponse } from 'next/server';
import { startBackgroundJob, executeContentGenerationJob } from '@/lib/background-jobs';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Start content generation as background job
 * POST /api/ai/strategy/[id]/start-generation-bg
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const strategyId = params.id;
    
    console.log(`Starting background job for strategy: ${strategyId}`);
    
    // Start background job
    const jobId = await startBackgroundJob(
      'CONTENT_GENERATION',
      executeContentGenerationJob,
      strategyId
    );
    
    console.log(`✅ Background job started: ${jobId}`);
    
    return NextResponse.json({
      success: true,
      jobId,
      message: 'Content generation started in background',
      pollUrl: `/api/ai/jobs/${jobId}`,
    });
  } catch (error: any) {
    console.error('Background job start error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start background job' },
      { status: 500 }
    );
  }
}
