import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const signedDate = formData.get('signedDate') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!signedDate) {
      return NextResponse.json(
        { error: 'Signing date is required' },
        { status: 400 }
      );
    }

    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: params.id },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'applications', params.id);
    await mkdir(uploadsDir, { recursive: true });
    
    const filename = `signed-contract-${Date.now()}.pdf`;
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const contractUrl = `/uploads/applications/${params.id}/${filename}`;

    // Update application
    await prisma.application.update({
      where: { id: params.id },
      data: {
        contractUrl,
        contractSignedDate: new Date(signedDate),
        status: 'OFFER_ACCEPTED', // Move to next stage
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      contractUrl,
      message: 'Signed contract uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload contract error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to upload contract', details: error.message },
      { status: 500 }
    );
  }
}
