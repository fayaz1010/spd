import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse, AIMessage } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Generate Cluster Articles for a Pillar
 * POST /api/ai/strategy/generate-clusters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pillarTitle, pillarKeyword, targetAudience, clusterCount } = body;

    if (!pillarTitle || !pillarKeyword) {
      return NextResponse.json(
        { error: 'Pillar title and keyword are required' },
        { status: 400 }
      );
    }

    console.log('Generating clusters for pillar:', pillarTitle);

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert SEO strategist creating cluster content strategies.

Generate ${clusterCount || 6} cluster article topics that support a pillar article.

Cluster articles should:
- Target related long-tail keywords
- Answer specific questions
- Support the pillar with internal links
- Be 1200-1800 words
- Mix informational and commercial intent

Return ONLY valid JSON with this exact structure:
{
  "clusters": [
    {
      "title": "Specific article title (SEO-optimized)",
      "targetKeyword": "long-tail keyword phrase",
      "searchVolume": 720,
      "intent": "INFORMATIONAL",
      "wordCount": 1500,
      "heroImagePrompt": "Professional photograph description",
      "infographicPrompt": "Infographic description with specific elements"
    }
  ]
}`,
      },
      {
        role: 'user',
        content: `Pillar Article: ${pillarTitle}
Pillar Keyword: ${pillarKeyword}
Target Audience: ${targetAudience}
Number of Clusters: ${clusterCount || 6}

Generate ${clusterCount || 6} cluster article topics that support this pillar. Include:
- How-to guides
- Comparison articles
- Cost/pricing guides
- Product reviews
- FAQ-style articles
- Location-specific variations (if relevant)

Each cluster should link back to the pillar and target a related keyword.

For each cluster, create TWO image prompts:
1. HERO IMAGE: Professional photograph relevant to the specific topic (Perth context)
2. INFOGRAPHIC: Data visualization or process diagram (blue/orange theme, vertical layout)

CRITICAL: Return ONLY valid JSON. No explanations, no markdown, no text. Just the JSON object starting with { and ending with }.`,
      },
    ];

    const response = await generateAIResponse(messages); // No token limit - accept full response
    
    // Parse JSON from response
    let jsonContent = response.content.trim();
    
    // Remove markdown code blocks
    if (jsonContent.includes('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/\n?```/g, '');
    } else if (jsonContent.includes('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }
    
    // Extract JSON object (use greedy match to get complete JSON)
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/s);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    } else {
      console.error('No JSON found in response:', response.content.substring(0, 500));
      console.error('Full response length:', response.content.length);
      console.error('Response appears truncated. Increase maxTokens.');
      throw new Error('AI returned invalid response. No JSON found or response truncated.');
    }
    
    // Validate JSON is not empty
    if (!jsonContent || jsonContent.trim().length === 0) {
      console.error('Empty JSON content');
      throw new Error('AI returned empty response.');
    }

    const result = JSON.parse(jsonContent);

    console.log('Clusters generated:', result.clusters.length);

    return NextResponse.json({
      success: true,
      clusters: result.clusters,
    });
  } catch (error: any) {
    console.error('Cluster generation error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate clusters',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
