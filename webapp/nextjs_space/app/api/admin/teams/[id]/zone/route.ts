
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const { serviceAreaGeoJSON } = body;

    // Validate GeoJSON structure if present
    if (serviceAreaGeoJSON) {
      if (!serviceAreaGeoJSON.type || serviceAreaGeoJSON.type !== 'Polygon') {
        return NextResponse.json(
          { error: 'Invalid GeoJSON: must be a Polygon' },
          { status: 400 }
        );
      }
      if (!Array.isArray(serviceAreaGeoJSON.coordinates)) {
        return NextResponse.json(
          { error: 'Invalid GeoJSON: coordinates must be an array' },
          { status: 400 }
        );
      }
    }

    const team = await prisma.team.update({
      where: { id: params.id },
      data: {
        serviceAreaGeoJSON: serviceAreaGeoJSON || null,
      },
    });

    return NextResponse.json({ team });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating team zone:', error);
    return NextResponse.json(
      { error: 'Failed to update team zone' },
      { status: 500 }
    );
  }
}
