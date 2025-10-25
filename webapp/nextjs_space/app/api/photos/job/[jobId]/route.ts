import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    const photos = await prisma.jobPhoto.findMany({
      where: { jobId },
      include: {
        uploadedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      photos: photos.map(p => ({
        id: p.id,
        url: p.url,
        filename: p.filename,
        category: p.category,
        description: p.description,
        uploadedBy: p.uploadedByUser.name,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
