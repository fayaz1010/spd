import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get lead data
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Prepare context for AI
    const context = `
Analyze this solar lead and provide a qualification score from 0-100:

Lead Information:
- Name: ${lead.name}
- Email: ${lead.email || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
- Postcode: ${lead.postcode || 'Not provided'}
- Source: ${lead.source || 'Unknown'}
- Status: ${lead.status}
- Created: ${lead.createdAt}
- Last Contact: ${lead.lastContactAt || 'Never'}

System Requirements:
- Solar System Size: ${lead.systemSize || 'Not specified'}
- Battery: ${lead.batteryRequired ? 'Yes' : 'No'}
- Budget: ${lead.budget || 'Not specified'}
- Timeline: ${lead.timeline || 'Not specified'}

Recent Activity:
${lead.activities.map(a => `- ${a.type}: ${a.description}`).join('\n')}

Scoring Criteria:
1. Contact Information (0-20): Complete contact details, valid email/phone
2. System Requirements (0-20): Clear requirements, realistic system size
3. Budget & Timeline (0-20): Budget specified, timeline reasonable
4. Engagement (0-20): Recent activity, responses to communication
5. Fit Score (0-20): Location serviceable, requirements match offerings

Provide:
1. Overall score (0-100)
2. Category (HOT: 80-100, WARM: 50-79, COLD: 0-49)
3. Brief reasoning (2-3 sentences)
4. Recommended next action

Format as JSON:
{
  "score": number,
  "category": "HOT" | "WARM" | "COLD",
  "reasoning": "string",
  "nextAction": "string"
}
`;

    // Get AI scoring
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(context);
    const response = result.response.text();

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const scoring = JSON.parse(jsonMatch[0]);

    // Update lead with score
    await prisma.lead.update({
      where: { id: params.id },
      data: {
        score: scoring.score,
        scoreCategory: scoring.category,
        scoreReasoning: scoring.reasoning,
        scoreUpdatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        leadId: params.id,
        type: 'NOTE_ADDED',
        description: `AI Lead Scoring: ${scoring.score}/100 (${scoring.category}). ${scoring.reasoning}`,
        performedBy: 'system',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      score: scoring.score,
      category: scoring.category,
      reasoning: scoring.reasoning,
      nextAction: scoring.nextAction,
    });
  } catch (error: any) {
    console.error('Error scoring lead:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to score lead' },
      { status: 500 }
    );
  }
}
