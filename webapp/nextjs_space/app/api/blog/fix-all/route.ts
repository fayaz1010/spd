import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { batchScanBlogPosts, getRecommendedAction } from '@/lib/blog-quality-scanner';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for batch operations

/**
 * Fix all blog posts with issues
 * POST /api/blog/fix-all
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Get all blog posts
        const posts = await prisma.blogPost.findMany({
          select: {
            id: true,
            title: true,
            content: true,
            status: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        sendEvent({
          progress: 5,
          step: `Scanning ${posts.length} blog posts...`,
        });

        // Scan all posts
        const reports = await batchScanBlogPosts(posts);

        // Filter posts that need fixing
        const postsNeedingFix = reports.filter(r => 
          r.needsRegeneration || r.needsEnhancement
        );

        sendEvent({
          progress: 10,
          step: `Found ${postsNeedingFix.length} posts needing fixes`,
          summary: {
            total: posts.length,
            needsFix: postsNeedingFix.length,
            needsRegeneration: reports.filter(r => r.needsRegeneration).length,
            needsEnhancement: reports.filter(r => r.needsEnhancement).length,
          },
        });

        if (postsNeedingFix.length === 0) {
          sendEvent({
            progress: 100,
            step: 'No posts need fixing!',
            complete: true,
          });
          controller.close();
          return;
        }

        // Process each post
        let completed = 0;
        const results = {
          regenerated: [] as string[],
          enhanced: [] as string[],
          failed: [] as { id: string; error: string }[],
        };

        for (const report of postsNeedingFix) {
          const action = getRecommendedAction(report);
          const progressPercent = 10 + Math.round((completed / postsNeedingFix.length) * 85);

          try {
            if (action === 'REGENERATE') {
              sendEvent({
                progress: progressPercent,
                step: `Regenerating: ${report.postTitle}`,
              });

              // Call regenerate API
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/posts/${report.postId}/regenerate`,
                { method: 'POST' }
              );

              if (!response.ok) {
                throw new Error('Regeneration failed');
              }

              results.regenerated.push(report.postTitle);
            } else if (action === 'ENHANCE') {
              sendEvent({
                progress: progressPercent,
                step: `Enhancing: ${report.postTitle}`,
              });

              // Call enhance API
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/posts/${report.postId}/enhance`,
                { method: 'POST' }
              );

              if (!response.ok) {
                throw new Error('Enhancement failed');
              }

              results.enhanced.push(report.postTitle);
            }

            completed++;
          } catch (error: any) {
            console.error(`Error fixing ${report.postTitle}:`, error);
            results.failed.push({
              id: report.postId,
              error: error.message,
            });
            completed++;
          }

          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        sendEvent({
          progress: 100,
          step: 'All fixes complete!',
          complete: true,
          results: {
            regenerated: results.regenerated.length,
            enhanced: results.enhanced.length,
            failed: results.failed.length,
          },
          details: results,
        });

        controller.close();
      } catch (error: any) {
        console.error('Fix all error:', error);
        sendEvent({
          error: error.message || 'Failed to fix posts',
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
}
