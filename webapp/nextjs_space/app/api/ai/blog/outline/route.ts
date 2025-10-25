import { NextRequest, NextResponse } from 'next/server';
import { generateBlogOutline } from '@/lib/ai-blog-workflow';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

/**
 * Step 1: Generate blog outline
 * POST /api/ai/blog/outline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, keywords, targetLength, tone, includePackages, targetAudience } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    console.log('Generating blog outline for:', topic);

    const outline = await generateBlogOutline({
      topic,
      keywords,
      targetLength,
      tone,
      includePackages,
      targetAudience,
    });

    console.log('Outline generated successfully');

    return NextResponse.json({
      success: true,
      outline,
    });
  } catch (error: any) {
    console.error('Outline generation error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate outline',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
