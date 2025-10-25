import { NextRequest, NextResponse } from 'next/server';
import { compileCompleteBlogPost, BlogOutline, BlogSection } from '@/lib/ai-blog-workflow';

export const dynamic = 'force-dynamic';

/**
 * Step 3: Compile all sections into final blog post
 * POST /api/ai/blog/compile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outline, intro, sections, conclusion } = body;

    if (!outline || !intro || !sections || !conclusion) {
      return NextResponse.json(
        { error: 'Outline, intro, sections, and conclusion are required' },
        { status: 400 }
      );
    }

    console.log('Compiling blog post...');

    const completeBlog = await compileCompleteBlogPost(
      outline as BlogOutline,
      intro,
      sections as BlogSection[],
      conclusion
    );

    console.log('Blog post compiled successfully');

    return NextResponse.json({
      success: true,
      data: completeBlog,
    });
  } catch (error: any) {
    console.error('Compilation error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to compile blog post',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
