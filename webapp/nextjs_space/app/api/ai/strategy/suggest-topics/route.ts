import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse, AIMessage } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * AI Strategy Topic Suggestions
 * POST /api/ai/strategy/suggest-topics
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

    console.log('Generating strategy suggestions for:', mainTopic);

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert SEO strategist specializing in pillar/cluster content strategies.

Your task is to analyze a main topic and suggest a complete content strategy with:
1. 5 pillar topics (main money pages)
2. 5-8 cluster articles per pillar (supporting content)
3. Estimated search volumes
4. Competition levels
5. Traffic and lead estimates

Return ONLY valid JSON with this structure:
{
  "pillars": [
    {
      "title": "Pillar topic title",
      "targetKeyword": "main keyword",
      "searchVolume": 2900,
      "competition": "MEDIUM",
      "intent": "COMMERCIAL",
      "clusterCount": 8
    }
  ],
  "totalArticles": 45,
  "estimatedTraffic": 15000,
  "estimatedLeads": 300,
  "timeToGenerate": "2-3 hours"
}`,
      },
      {
        role: 'user',
        content: `Main Topic: ${mainTopic}
Target Audience: ${targetAudience}

Suggest a complete pillar/cluster content strategy for this topic. Focus on:
- High-value commercial keywords
- Topics that drive conversions
- Perth/Western Australia specific angles (if relevant)
- Mix of informational and commercial intent
- Realistic search volumes and estimates

Return ONLY the JSON response, no other text.`,
      },
    ];

    const response = await generateAIResponse(messages, { maxTokens: 2000 });
    
    // Parse JSON from response
    let jsonContent = response.content.trim();
    
    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to find JSON object
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const suggestions = JSON.parse(jsonContent);

    console.log('Strategy suggestions generated:', suggestions.totalArticles, 'articles');

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error('Strategy suggestion error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate strategy suggestions',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
