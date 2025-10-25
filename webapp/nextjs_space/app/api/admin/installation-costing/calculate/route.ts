import { NextRequest, NextResponse } from 'next/server';
import { calculateInstallationCost, calculateInstallationCostComparison } from '@/lib/installation-cost-calculator';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// POST /api/admin/installation-costing/calculate - Test calculator
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobSpecs, compare } = body;

    if (compare) {
      // Compare internal vs subcontractor
      const comparison = await calculateInstallationCostComparison(jobSpecs);
      return NextResponse.json(comparison);
    } else {
      // Single calculation
      const result = await calculateInstallationCost(jobSpecs);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error calculating installation cost:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
