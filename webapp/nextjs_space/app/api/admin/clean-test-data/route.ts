import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Delete all test deals
    const deletedDeals = await prisma.deal.deleteMany({});
    
    // Delete all test activities
    const deletedActivities = await prisma.activity.deleteMany({});
    
    // Delete all test proposal tracking
    const deletedProposals = await prisma.proposalTracking.deleteMany({});
    
    // Delete all test communications
    const deletedComms = await prisma.communication.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: 'Test data cleaned successfully',
      deleted: {
        deals: deletedDeals.count,
        activities: deletedActivities.count,
        proposals: deletedProposals.count,
        communications: deletedComms.count,
      }
    });
  } catch (error: any) {
    console.error('Error cleaning test data:', error);
    return NextResponse.json(
      { error: 'Failed to clean test data', details: error.message },
      { status: 500 }
    );
  }
}
