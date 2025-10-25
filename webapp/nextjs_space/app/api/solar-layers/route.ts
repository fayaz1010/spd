
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, radius = 100 } = await request.json();

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

    // Call Google Solar API Data Layers endpoint
    const response = await fetch(
      `https://solar.googleapis.com/v1/dataLayers:get?` +
      `location.latitude=${latitude}` +
      `&location.longitude=${longitude}` +
      `&radiusMeters=${radius}` +
      `&view=FULL_LAYERS` +
      `&requiredQuality=HIGH` +
      `&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Solar API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch solar layer data', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract layer URLs
    const layers = {
      annualFlux: data.annualFluxUrl || null,
      monthlyFlux: data.monthlyFluxUrl || null,
      hourlyShade: data.hourlyShadeUrls || null,
      dsm: data.dsmUrl || null,
      rgb: data.rgbUrl || null,
      mask: data.maskUrl || null,
    };

    return NextResponse.json({
      imageryDate: data.imageryDate || null,
      imageryQuality: data.imageryQuality || 'MEDIUM',
      imageryProcessedDate: data.imageryProcessedDate || null,
      layers,
    });
  } catch (error) {
    console.error('Error in solar-layers API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
