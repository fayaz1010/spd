import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { communicationId } = await request.json();

    // Get communication
    const communication = await prisma.communication.findUnique({
      where: { id: communicationId },
      include: {
        lead: true,
      },
    });

    if (!communication) {
      return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
    }

    // Analyze sentiment with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
Analyze the sentiment of this customer communication:

Type: ${communication.type}
Subject: ${communication.subject || 'N/A'}
Message: ${communication.body}

Provide:
1. Overall sentiment: POSITIVE, NEUTRAL, or NEGATIVE
2. Confidence score (0-100)
3. Key emotions detected (e.g., frustrated, happy, confused, urgent)
4. Urgency level: LOW, MEDIUM, HIGH, CRITICAL
5. Recommended action for the team
6. Brief reasoning (1-2 sentences)

Format as JSON:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "confidence": number,
  "emotions": ["emotion1", "emotion2"],
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "recommendedAction": "string",
  "reasoning": "string"
}
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Update communication with sentiment
    await prisma.communication.update({
      where: { id: communicationId },
      data: {
        sentiment: analysis.sentiment,
        sentimentScore: analysis.confidence,
        sentimentAnalyzedAt: new Date(),
      },
    });

    // If negative sentiment with high urgency, create alert
    if (analysis.sentiment === 'NEGATIVE' && ['HIGH', 'CRITICAL'].includes(analysis.urgency)) {
      await prisma.activity.create({
        data: {
          leadId: communication.leadId,
          type: 'ALERT',
          description: `⚠️ Negative sentiment detected: ${analysis.reasoning}. Action: ${analysis.recommendedAction}`,
          performedBy: 'system',
          priority: analysis.urgency === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        },
      });
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Sentiment analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}

// Batch analyze recent communications
export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Get recent communications without sentiment analysis
    const communications = await prisma.communication.findMany({
      where: {
        sentimentAnalyzedAt: null,
        createdAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
        type: {
          in: ['EMAIL_RECEIVED', 'SMS_RECEIVED'],
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    let analyzed = 0;
    const results: any[] = [];

    for (const comm of communications) {
      try {
        const token = request.headers.get('authorization');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/crm/sentiment/analyze`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token || '',
            },
            body: JSON.stringify({ communicationId: comm.id }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          analyzed++;
          results.push({
            communicationId: comm.id,
            sentiment: data.analysis.sentiment,
            urgency: data.analysis.urgency,
          });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to analyze communication ${comm.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      analyzed,
      total: communications.length,
      results,
    });
  } catch (error) {
    console.error('Batch sentiment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to batch analyze sentiment' },
      { status: 500 }
    );
  }
}
