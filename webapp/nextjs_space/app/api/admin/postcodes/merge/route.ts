
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Helper function to merge multiple polygons into one
function mergePolygons(polygons: any[]): any {
  if (polygons.length === 0) return null;
  if (polygons.length === 1) return polygons[0];

  // Find the bounding box that contains all polygons
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  polygons.forEach(polygon => {
    const coords = polygon.coordinates[0];
    coords.forEach(([lng, lat]: [number, number]) => {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });
  });

  // Create a merged polygon from the bounding box
  const mergedCoordinates = [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat], // Close the polygon
  ];

  return {
    type: 'Polygon',
    coordinates: [mergedCoordinates],
  };
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { polygons } = body;

    if (!Array.isArray(polygons) || polygons.length === 0) {
      return NextResponse.json({ error: 'Polygons array required' }, { status: 400 });
    }

    const mergedPolygon = mergePolygons(polygons);

    return NextResponse.json({ polygon: mergedPolygon });
  } catch (error: any) {
    console.error('Error merging polygons:', error);
    return NextResponse.json(
      { error: 'Failed to merge polygons' },
      { status: 500 }
    );
  }
}
