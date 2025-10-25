
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key-here';

    try {
      jwt.verify(token, secret);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');

    if (!postcode) {
      return NextResponse.json({ error: 'Postcode parameter required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    // Use Google Geocoding API to get postcode details
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postcode + ', Australia')}&key=${apiKey}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return NextResponse.json({ error: 'Postcode not found' }, { status: 404 });
    }

    const result = data.results[0];
    
    // Extract postcode from address components
    const postcodeComponent = result.address_components.find(
      (component: any) => component.types.includes('postal_code')
    );

    if (!postcodeComponent) {
      return NextResponse.json({ error: 'Invalid postcode result' }, { status: 400 });
    }

    // Get the bounds/viewport for the postcode area
    const viewport = result.geometry.viewport;
    const bounds = result.geometry.bounds || viewport;

    // Create a rectangular polygon from the bounds
    const coordinates = [
      [bounds.southwest.lng, bounds.southwest.lat],
      [bounds.northeast.lng, bounds.southwest.lat],
      [bounds.northeast.lng, bounds.northeast.lat],
      [bounds.southwest.lng, bounds.northeast.lat],
      [bounds.southwest.lng, bounds.southwest.lat], // Close the polygon
    ];

    // Extract locality/suburb name
    const locality = result.address_components.find(
      (component: any) => component.types.includes('locality')
    )?.long_name || '';

    const postcodeData = {
      postcode: postcodeComponent.long_name,
      locality,
      formatted_address: result.formatted_address,
      center: result.geometry.location,
      bounds: {
        northeast: bounds.northeast,
        southwest: bounds.southwest,
      },
      polygon: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
    };

    return NextResponse.json(postcodeData);
  } catch (error: any) {
    console.error('Error searching postcode:', error);
    return NextResponse.json(
      { error: 'Failed to search postcode' },
      { status: 500 }
    );
  }
}
