import { NextRequest, NextResponse } from 'next/server';
import { 
  generateSectionContent, 
  generateIntroduction, 
  generateConclusion 
} from '@/lib/ai-blog-workflow';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

/**
 * Step 2: Generate individual section content
 * POST /api/ai/blog/section
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionType, section, context } = body;

    if (!sectionType || !context) {
      return NextResponse.json(
        { error: 'Section type and context are required' },
        { status: 400 }
      );
    }

    console.log(`Generating ${sectionType}...`);

    let content: string;

    switch (sectionType) {
      case 'intro':
        if (!section.prompt || !section.keyPoints) {
          return NextResponse.json(
            { error: 'Introduction prompt and key points required' },
            { status: 400 }
          );
        }
        content = await generateIntroduction(section, context);
        break;

      case 'section':
        if (!section.heading || !section.prompt) {
          return NextResponse.json(
            { error: 'Section heading and prompt required' },
            { status: 400 }
          );
        }
        content = await generateSectionContent(section, context);
        break;

      case 'conclusion':
        if (!section.prompt || !section.keyPoints) {
          return NextResponse.json(
            { error: 'Conclusion prompt and key points required' },
            { status: 400 }
          );
        }
        content = await generateConclusion(section, context);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown section type: ${sectionType}` },
          { status: 400 }
        );
    }

    console.log(`${sectionType} generated successfully`);

    return NextResponse.json({
      success: true,
      content,
      sectionType,
    });
  } catch (error: any) {
    console.error('Section generation error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate section',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
