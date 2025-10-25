import { NextRequest, NextResponse } from 'next/server';
import { generatePillarStrategyWithKeywords } from '@/lib/google-ads-keywords';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Generate Detailed Pillar Strategy
 * POST /api/ai/strategy/generate-pillars
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mainTopic, targetAudience } = body;

    if (!mainTopic) {
      return NextResponse.json(
        { error: 'Main topic is required' },
        { status: 400 }
      );
    }

    console.log('Generating detailed pillar strategy with keyword research for:', mainTopic);

    // Use Google Ads keyword research
    const result = await generatePillarStrategyWithKeywords(
      mainTopic,
      targetAudience,
      'Perth, Western Australia'
    );

    console.log(`✅ Pillar strategy generated with ${result.keywordData.length} keywords researched`);
    console.log(`📊 Sources: ${result.sources.length}`);

    return NextResponse.json({
      success: true,
      pillars: result.pillars,
      keywordData: result.keywordData,
      sources: result.sources,
    });

  } catch (error: any) {
    console.error('Pillar generation error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate pillar strategy',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
