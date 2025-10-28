import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface RouteParams {
  params: {
    id: string;
  };
}

async function detectLeadOrQuote(emailContent: string, fromEmail: string) {
  // Search for existing lead by email
  const lead = await prisma.lead.findFirst({
    where: {
      email: {
        equals: fromEmail,
        mode: 'insensitive'
      }
    }
  });

  if (lead) {
    return { leadId: lead.id, quoteId: null };
  }

  // Search for quote by email
  const quote = await prisma.quote.findFirst({
    where: {
      email: {
        equals: fromEmail,
        mode: 'insensitive'
      }
    }
  });

  if (quote) {
    return { leadId: null, quoteId: quote.id };
  }

  // Check if email content mentions quote or lead keywords
  const lowerContent = emailContent.toLowerCase();
  const hasQuoteKeywords = /quote|quotation|pricing|estimate|proposal/i.test(lowerContent);
  const hasLeadKeywords = /solar|panel|battery|installation|interested|inquiry/i.test(lowerContent);

  return { 
    leadId: null, 
    quoteId: null,
    isLikely: hasQuoteKeywords || hasLeadKeywords,
    keywords: { hasQuoteKeywords, hasLeadKeywords }
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);

    const { id } = params;

    // Fetch email
    const email = await prisma.emailMessage.findUnique({
      where: { id }
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Get API settings
    const apiSettings = await prisma.apiSettings.findFirst();
    
    if (!apiSettings?.geminiEnabled || !apiSettings.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini AI is not configured' },
        { status: 400 }
      );
    }

    // Parse API keys (stored as JSON array)
    let apiKeys: string[] = [];
    try {
      apiKeys = JSON.parse(apiSettings.geminiApiKey);
    } catch {
      apiKeys = [apiSettings.geminiApiKey];
    }

    const genAI = new GoogleGenerativeAI(apiKeys[0]);
    const model = genAI.getGenerativeModel({ 
      model: apiSettings.geminiModel || 'gemini-2.0-flash-exp' 
    });

    // Create prompt for AI summarization
    const prompt = `Analyze this email and provide detailed categorization:

Email Details:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Analyze and respond in JSON format:
{
  "summary": "brief 2-3 sentence summary",
  "sentiment": "positive|neutral|negative",
  "keyPoints": ["point 1", "point 2", ...],
  "category": "rebate|approval|marketing|support|quote|lead|general",
  "subCategory": "specific type (e.g., rebate_form, synergy_approval, westernpower_approval, hubspot, meta_ads, google_ads, stc_certificate, etc)",
  "emailGroup": "group identifier if part of a thread or related emails",
  "priority": "urgent|high|normal|low",
  "requiresApproval": true/false,
  "externalSystem": "system name if detected (hubspot, meta, synergy, westernpower, etc)",
  "externalId": "ID or reference number if found in email",
  "isBusinessRelated": true/false
}

Category Detection Rules:
- "rebate": Emails about STC certificates, government rebates, solar rebate forms, rebate applications
- "approval": Emails requiring approval from Synergy, Western Power, network providers, regulatory bodies
- "marketing": Emails from HubSpot, Meta Ads, Google Ads, marketing platforms, campaign reports
- "support": Customer support, technical issues, complaints
- "quote": Quote requests, pricing inquiries
- "lead": New lead inquiries, potential customers
- "general": Everything else

SubCategory Examples:
- rebate_form, stc_certificate, federal_rebate, state_rebate
- synergy_approval, westernpower_approval, network_approval, regulatory_approval
- hubspot, meta_ads, google_ads, facebook_ads, campaign_report
- customer_support, technical_issue, complaint

Priority Rules:
- "urgent": Contains words like urgent, asap, immediate, deadline today
- "high": Approvals, rebates, time-sensitive matters
- "normal": Regular business emails
- "low": Newsletters, marketing reports

Approval Detection:
- Set requiresApproval to true if email is from Synergy, Western Power, or contains approval/permit/certificate keywords`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    let aiAnalysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      aiAnalysis = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      aiAnalysis = {
        summary: text.substring(0, 500),
        sentiment: 'neutral',
        keyPoints: [],
        isBusinessRelated: false,
        category: 'general'
      };
    }

    // Detect lead or quote
    const detection = await detectLeadOrQuote(email.body, email.from);

    // Update email with AI analysis
    const updatedEmail = await prisma.emailMessage.update({
      where: { id },
      data: {
        aiSummary: aiAnalysis.summary,
        sentiment: aiAnalysis.sentiment,
        keyPoints: aiAnalysis.keyPoints,
        aiProcessedAt: new Date(),
        
        // Categorization
        category: aiAnalysis.category || 'general',
        subCategory: aiAnalysis.subCategory || null,
        emailGroup: aiAnalysis.emailGroup || null,
        priority: aiAnalysis.priority || 'normal',
        
        // Approval tracking
        requiresApproval: aiAnalysis.requiresApproval || false,
        approvalStatus: aiAnalysis.requiresApproval ? 'pending' : 'not_required',
        
        // External system linking
        externalSystem: aiAnalysis.externalSystem || null,
        externalId: aiAnalysis.externalId || null,
        linkedAt: aiAnalysis.externalSystem ? new Date() : null,
        
        // Lead/Quote detection
        detectedLeadId: detection.leadId,
        detectedQuoteId: detection.quoteId,
        detectedAt: detection.leadId || detection.quoteId ? new Date() : null,
        confidenceScore: detection.leadId || detection.quoteId ? 1.0 : 
                        (detection as any).isLikely ? 0.7 : 0.0
      }
    });

    return NextResponse.json({
      success: true,
      summary: aiAnalysis.summary,
      sentiment: aiAnalysis.sentiment,
      keyPoints: aiAnalysis.keyPoints,
      category: aiAnalysis.category,
      detectedLeadId: detection.leadId,
      detectedQuoteId: detection.quoteId
    });
  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI summary' },
      { status: 500 }
    );
  }
}
