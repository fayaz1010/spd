import { NextRequest } from 'next/server';
import { resumeGeneration, ResumeOptions } from '@/lib/smart-resume-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/**
 * Resume Content Generation
 * POST /api/ai/strategy/[id]/resume
 * 
 * Resumes generation from where it stopped:
 * - Regenerates corrupted articles
 * - Resets stuck articles
 * - Generates planned articles
 * - Uses round-robin API keys with rate limiting
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const strategyId = params.id;

  try {
    const body = await request.json();
    const options: ResumeOptions = {
      regenerateCorrupted: body.regenerateCorrupted ?? true,
      generatePlanned: body.generatePlanned ?? true,
      resetStuck: body.resetStuck ?? true,
      skipGenerated: body.skipGenerated ?? true,
      fixLowQuality: body.fixLowQuality ?? false,
    };

    console.log('Resume options:', options);

    // Create SSE stream for real-time progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent({
            type: 'start',
            message: 'Starting resume process...',
            progress: 0,
          });

          const result = await resumeGeneration(
            strategyId,
            options,
            (step, progress, article) => {
              sendEvent({
                type: 'progress',
                step,
                progress,
                article,
              });
            }
          );

          sendEvent({
            type: 'complete',
            result,
            progress: 100,
          });

          controller.close();
        } catch (error: any) {
          console.error('Resume error:', error);
          sendEvent({
            type: 'error',
            error: error.message || 'Failed to resume generation',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Resume setup error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to start resume' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
