
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * API Route to generate actual satellite images of customer roofs
 * Uses Google Static Maps API with satellite view
 */
export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, zoom = 20, size = '600x400' } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Generate Static Maps URL with satellite imagery
    const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${size}&maptype=satellite&key=${apiKey}`;

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Roof image generation error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to generate roof image' },
      { status: 500 }
    );
  }
}
