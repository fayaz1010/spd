import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scanBlogPost } from '@/lib/blog-quality-scanner';
import { scanBlogSEO } from '@/lib/blog-seo-scanner';
import { fixArticleComplete } from '@/lib/ai-article-fixer';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for AI fix

/**
 * AI-powered article fix
 * POST /api/blog/posts/[id]/ai-fix
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const postId = params.id;

        // Fetch post with strategy info
        const post = await prisma.blogPost.findUnique({
          where: { id: postId },
          include: {
            pillar: {
              include: {
                strategy: true,
              },
            },
            cluster: {
              include: {
                pillar: {
                  include: {
                    strategy: true,
                  },
                },
              },
            },
          },
        });

        if (!post) {
          throw new Error('Post not found');
        }

        sendEvent({
          progress: 5,
          step: 'Scanning article for issues...',
        });

        // Get target keyword
        let targetKeyword = post.keywords?.[0] || '';
        let strategyName = null;

        if (post.pillar) {
          targetKeyword = post.pillar.targetKeyword || targetKeyword;
          strategyName = post.pillar.strategy?.name;
        } else if (post.cluster) {
          targetKeyword = post.cluster.targetKeyword || targetKeyword;
          strategyName = post.cluster.pillar?.strategy?.name;
        }

        // Scan quality
        const qualityReport = scanBlogPost(post.content, post.title, post.id);

        // Scan SEO
        const seoReport = scanBlogSEO(post.content, post.title, post.id, {
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          keywords: post.keywords,
          targetKeyword,
          slug: post.slug,
        });

        sendEvent({
          progress: 10,
          step: `Found ${qualityReport.issues.length} quality issues and ${seoReport.issues.length} SEO issues`,
          analysis: {
            qualityScore: qualityReport.overallScore,
            seoScore: seoReport.seoScore,
            qualityIssues: qualityReport.issues.length,
            seoIssues: seoReport.issues.length,
          },
        });

        // Execute AI fix
        const result = await fixArticleComplete(
          {
            postId: post.id,
            postTitle: post.title,
            currentContent: post.content,
            targetKeyword,
            strategyName: strategyName || undefined,
            qualityReport,
            seoReport,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
          },
          (step, progress) => {
            sendEvent({ progress, step });
          }
        );

        if (!result.success) {
          throw new Error(result.error || 'Fix failed');
        }

        sendEvent({
          progress: 90,
          step: 'Saving fixed article...',
        });

        // Update post with fixed content
        await prisma.blogPost.update({
          where: { id: postId },
          data: {
            content: result.fixedContent,
            status: 'ENHANCED',
            updatedAt: new Date(),
          },
        });

        sendEvent({
          progress: 100,
          step: 'Article fixed successfully!',
          complete: true,
          result: {
            changesApplied: result.changesApplied,
            qualityImprovement: result.qualityImprovement,
            seoImprovement: result.seoImprovement,
            fixPrompt: result.fixPrompt,
          },
        });

        controller.close();
      } catch (error: any) {
        console.error('AI fix error:', error);
        sendEvent({
          error: error.message || 'Failed to fix article',
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
