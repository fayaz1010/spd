import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, category, subject, body: templateBody, variables } = body;

    if (!name || !type || !templateBody) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const template = await prisma.messageTemplate.create({
      data: {
        name,
        type,
        category,
        subject,
        body: templateBody,
        variables: variables || [],
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Template creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
