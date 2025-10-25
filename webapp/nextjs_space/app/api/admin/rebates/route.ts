
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-admin';
import { validateFormula } from '@/lib/formula-engine';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const rebates = await prisma.rebateConfig.findMany({
      orderBy: { type: 'asc' },
    });

    return NextResponse.json({ success: true, rebates });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching rebates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const data = await request.json();

    // Validate formula if provided
    if (data.formula && data.calculationType === 'formula') {
      const validationResult = validateFormula(data.formula);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: `Invalid formula: ${validationResult.error}` },
          { status: 400 }
        );
      }
    }

    // Ensure value is set for non-formula types
    if (data.calculationType !== 'formula' && !data.value) {
      return NextResponse.json(
        { error: 'Value is required for non-formula rebates' },
        { status: 400 }
      );
    }

    // For formula type, value can be 0 (it's calculated from formula)
    if (data.calculationType === 'formula' && !data.formula) {
      return NextResponse.json(
        { error: 'Formula is required when calculation type is "formula"' },
        { status: 400 }
      );
    }

    const rebate = await prisma.rebateConfig.create({
      data: {
        id: `rebate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        type: data.type,
        calculationType: data.calculationType,
        value: data.value || 0,
        maxAmount: data.maxAmount || null,
        description: data.description,
        eligibilityCriteria: data.eligibilityCriteria,
        formula: data.formula || null,
        variables: data.variables || null,
        active: data.active ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, rebate });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating rebate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);

    const { id, ...data } = await request.json();

    // Validate formula if provided
    if (data.formula && data.calculationType === 'formula') {
      const validationResult = validateFormula(data.formula);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: `Invalid formula: ${validationResult.error}` },
          { status: 400 }
        );
      }
    }

    const rebate = await prisma.rebateConfig.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, rebate });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating rebate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rebate ID is required' }, { status: 400 });
    }

    await prisma.rebateConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting rebate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
