
import { NextResponse } from 'next/server';
import { getActivePricing } from '@/lib/pricing-service';

export async function GET() {
  try {
    const pricing = await getActivePricing();
    
    return NextResponse.json({
      success: true,
      pricing,
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing data' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
