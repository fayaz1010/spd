import { NextResponse } from 'next/server';
import { seedPostcodeZoneRatings } from '@/lib/services/postcode-zone-service';

/**
 * POST /api/admin/zone-ratings/seed
 * Seed all Australian postcode zone ratings
 */
export async function POST() {
  try {
    console.log('Starting zone ratings seed...');
    const result = await seedPostcodeZoneRatings();
    console.log('Seed completed:', result);
    
    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully seeded ${result.count} postcode zone ratings`,
    });
  } catch (error) {
    console.error('Error seeding zone ratings:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed zone ratings',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
