
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { evaluateFormula } from '@/lib/formula-engine';

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const { formula, variables } = await request.json();

    if (!formula) {
      return NextResponse.json(
        { success: false, error: 'Formula is required' },
        { status: 400 }
      );
    }

    const result = evaluateFormula(formula, variables || {});

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error testing formula:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
