import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { analyzeNEM12WithAI } from '@/lib/ai-nem12-analyzer';

const prisma = new PrismaClient();
const db = prisma as any;

export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;

    // Get the most recent NEM12 upload
    const upload = await db.nEM12Upload?.findFirst({
      where: { 
        leadId,
        status: 'COMPLETED',
      },
      orderBy: { uploadedAt: 'desc' },
    });

    if (!upload) {
      return NextResponse.json(
        { success: false, error: 'No NEM12 data found for this lead' },
        { status: 404 }
      );
    }

    // Check if AI analysis already exists
    if (upload.aiRecommendations) {
      return NextResponse.json({
        success: true,
        analysis: upload.aiRecommendations,
        cached: true,
      });
    }

    // Perform AI analysis
    const aiAnalysis = await analyzeNEM12WithAI({
      averageDaily: upload.averageDaily,
      peakDemand: upload.peakDemand,
      hourlyPattern: upload.hourlyPattern as number[],
      dailyPattern: upload.dailyPattern as number[],
      peakUsage: upload.peakUsage || undefined,
      shoulderUsage: upload.shoulderUsage || undefined,
      offPeakUsage: upload.offPeakUsage || undefined,
      totalConsumption: upload.totalConsumption,
      totalDays: upload.totalDays,
    });

    // Update NEM12Upload with AI recommendations
    await db.nEM12Upload?.update({
      where: { id: upload.id },
      data: {
        aiRecommendations: aiAnalysis as any,
        householdType: aiAnalysis.householdType,
      },
    });

    return NextResponse.json({
      success: true,
      analysis: aiAnalysis,
      cached: false,
    });
  } catch (error: any) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate AI analysis',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;

    // Get the most recent NEM12 upload with AI analysis
    const upload = await db.nEM12Upload?.findFirst({
      where: { 
        leadId,
        status: 'COMPLETED',
      } as any,
      orderBy: { uploadedAt: 'desc' },
      select: {
        aiRecommendations: true,
        householdType: true,
      },
    });

    if (!upload || !upload.aiRecommendations) {
      return NextResponse.json(
        { success: false, error: 'No AI analysis found. Please generate one first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: upload.aiRecommendations,
      householdType: upload.householdType,
    });
  } catch (error) {
    console.error('AI analysis fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI analysis' },
      { status: 500 }
    );
  }
}
