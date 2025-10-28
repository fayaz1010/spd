import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAdminFromRequest } from '@/lib/auth-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

interface HeroSlidePrompt {
  topic: string;
  targetAudience?: string;
  callToAction?: string;
  additionalContext?: string;
}

// POST - Generate hero slide with AI
export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, targetAudience, callToAction, additionalContext }: HeroSlidePrompt = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Get Gemini API key from settings
    const apiSettings = await prisma.apiSettings.findFirst({
      where: { active: true, geminiEnabled: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!apiSettings || !apiSettings.geminiApiKey) {
      return NextResponse.json({ 
        error: 'Gemini API not configured. Please configure it in API Settings.' 
      }, { status: 400 });
    }

    // Decrypt Gemini API key
    const geminiKeys = decryptGeminiKeys(apiSettings.geminiApiKey);
    if (geminiKeys.length === 0) {
      return NextResponse.json({ 
        error: 'No valid Gemini API keys found' 
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(geminiKeys[0]);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Generate hero slide content
    const prompt = `You are a professional marketing copywriter for Sun Direct Power, a solar energy company in Perth, Western Australia.

Create compelling hero carousel slide content for the following topic:
**Topic:** ${topic}
${targetAudience ? `**Target Audience:** ${targetAudience}` : ''}
${callToAction ? `**Call to Action:** ${callToAction}` : ''}
${additionalContext ? `**Additional Context:** ${additionalContext}` : ''}

Generate a JSON object with the following structure:
{
  "title": "Short, punchy headline (3-6 words)",
  "subtitle": "Supporting headline with key benefit (8-12 words)",
  "description": "Detailed description explaining the offer/benefit (20-30 words)",
  "ctaText": "Action button text (2-4 words)",
  "ctaLink": "Suggested link (e.g., /calculator-v2, /packages, /contact)",
  "iconName": "One of: Zap, DollarSign, Leaf, TreePine, Battery",
  "gradient": "One of: from-primary/20 to-emerald/20, from-gold/20 to-coral/20, from-emerald/20 to-primary/20, from-emerald/20 to-gold/20, from-purple/20 to-pink/20",
  "stats": [
    {"value": "e.g., $400-600", "label": "e.g., Per kW SRES"},
    {"value": "e.g., 30% Off", "label": "e.g., Battery Rebate"},
    {"value": "e.g., $20,000+", "label": "e.g., Total Savings"}
  ],
  "imagePrompt": "Detailed prompt for generating a hero image (describe the scene, lighting, composition, mood)"
}

**Brand Guidelines:**
- Company: Sun Direct Power
- Location: Perth, Western Australia
- Tone: Professional, trustworthy, optimistic
- Focus: Solar panels, batteries, rebates, savings, sustainability
- Colors: Coral/Orange (primary), Blue (trust), Green (environment)

**Important:**
- Make it specific to Perth/WA market
- Emphasize government rebates and incentives
- Include realistic statistics
- Use action-oriented language
- Keep it concise and scannable

Return ONLY the JSON object, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let generatedData;
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      generatedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json({ 
        error: 'Failed to parse AI response', 
        details: text 
      }, { status: 500 });
    }

    // Generate image using the imagePrompt
    let imageUrl = '/images/hero/default-solar.jpg'; // Default fallback
    
    try {
      // Use the AI image generator to create the hero image
      const imagePrompt = generatedData.imagePrompt || `Professional solar panel installation on a Perth home, clear blue sky, modern architecture, optimistic mood`;
      
      // For now, we'll use a placeholder. In production, you'd call an image generation API
      // or use the existing ai-image-generator.ts
      console.log('Image generation prompt:', imagePrompt);
      
      // TODO: Integrate with actual image generation service
      // const imageResult = await generateHeroImage(imagePrompt);
      // imageUrl = imageResult.url;
      
    } catch (imageError) {
      console.error('Image generation failed:', imageError);
      // Continue with default image
    }

    // Get the next sort order
    const lastSlide = await prisma.heroSlide.findFirst({
      orderBy: { sortOrder: 'desc' },
    });
    const nextSortOrder = (lastSlide?.sortOrder || 0) + 1;

    // Create the hero slide
    const slide = await prisma.heroSlide.create({
      data: {
        title: generatedData.title,
        subtitle: generatedData.subtitle,
        description: generatedData.description,
        ctaText: generatedData.ctaText,
        ctaLink: generatedData.ctaLink || '/calculator-v2',
        iconName: generatedData.iconName || 'Zap',
        imageUrl: imageUrl,
        gradient: generatedData.gradient || 'from-primary/20 to-emerald/20',
        stats: generatedData.stats || [],
        sortOrder: nextSortOrder,
        isActive: false, // Start as inactive for review
      },
    });

    return NextResponse.json({ 
      success: true,
      slide,
      imagePrompt: generatedData.imagePrompt,
      message: 'Hero slide generated successfully. Review and activate when ready.'
    });

  } catch (error: any) {
    console.error('Error generating hero slide:', error);
    return NextResponse.json({ 
      error: 'Failed to generate hero slide', 
      details: error.message 
    }, { status: 500 });
  }
}

// Helper: Decrypt Gemini API keys
function decryptGeminiKeys(encryptedData: string): string[] {
  if (!encryptedData) return [];
  try {
    const encryptedKeys = JSON.parse(encryptedData);
    if (!Array.isArray(encryptedKeys)) return [];
    return encryptedKeys.map(key => decryptKey(key)).filter(key => key);
  } catch {
    // Fallback: treat as single key
    const singleKey = decryptKey(encryptedData);
    return singleKey ? [singleKey] : [];
  }
}

function decryptKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  try {
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}
