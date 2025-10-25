import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Geocode API - Convert address to coordinates
 * Uses Google Geocoding API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Get Google API key from environment
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.error('Google API key not configured');
      return NextResponse.json(
        { success: false, error: 'Geocoding service not configured' },
        { status: 503 }
      );
    }

    // Call Google Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=au&components=country:AU`
    );

    if (!response.ok) {
      throw new Error('Geocoding API request failed');
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Address not found' },
        { status: 404 }
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Extract suburb/locality
    const addressComponents = result.address_components || [];
    const suburbComponent = addressComponents.find((c: any) =>
      c.types.includes('locality') || c.types.includes('sublocality')
    );
    const stateComponent = addressComponents.find((c: any) =>
      c.types.includes('administrative_area_level_1')
    );

    // Verify it's in Western Australia
    if (stateComponent && stateComponent.short_name !== 'WA') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'We currently only service Western Australia. Please enter a WA address.' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      latitude: location.lat,
      longitude: location.lng,
      suburb: suburbComponent?.long_name || null,
      formattedAddress: result.formatted_address,
    });

  } catch (error: any) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to geocode address' },
      { status: 500 }
    );
  }
}
