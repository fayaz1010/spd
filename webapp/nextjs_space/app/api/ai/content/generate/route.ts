import { NextRequest, NextResponse } from 'next/server';
import { 
  generateBlogPost, 
  generateFAQ, 
  generateCaseStudy, 
  enhanceTestimonial 
} from '@/lib/ai';
import { generateBlogPostWorkflow } from '@/lib/ai-blog-workflow';

export const dynamic = 'force-dynamic';

/**
 * AI Content Generation API
 * POST /api/ai/content/generate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, input } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'blog':
        if (!input.topic && !input.rawContent) {
          return NextResponse.json(
            { error: 'Topic or raw content is required for blog generation' },
            { status: 400 }
          );
        }
        // Use new multi-step workflow for better results
        result = await generateBlogPostWorkflow({
          topic: input.topic,
          keywords: input.keywords,
          targetLength: input.targetLength,
          tone: input.tone || 'marketing',
          includePackages: input.includePackages !== false,
          targetAudience: input.targetAudience,
        });
        break;

      case 'faq':
        if (!input.question && !input.topic) {
          return NextResponse.json(
            { error: 'Question or topic is required for FAQ generation' },
            { status: 400 }
          );
        }
        result = await generateFAQ(input);
        break;

      case 'case-study':
        if (!input.rawNotes && !input.systemSize) {
          return NextResponse.json(
            { error: 'Raw notes or system details required for case study' },
            { status: 400 }
          );
        }
        result = await generateCaseStudy(input);
        break;

      case 'testimonial':
        if (!input.rawReview || !input.customerName) {
          return NextResponse.json(
            { error: 'Customer name and raw review are required' },
            { status: 400 }
          );
        }
        result = await enhanceTestimonial(input);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown content type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate content',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
