import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and images are allowed.' },
        { status: 400 }
      );
    }

    // Get material order
    const order = await prisma.materialOrder.findUnique({
      where: { id },
      include: {
        job: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Material order not found' },
        { status: 404 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'po-confirmations', order.jobId);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${order.poNumber}-confirmation-${timestamp}.${extension}`;
    const filepath = join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/po-confirmations/${order.jobId}/${filename}`;

    // Update material order
    const updatedOrder = await prisma.materialOrder.update({
      where: { id },
      data: {
        confirmationDocumentUrl: publicUrl,
        confirmationUploadedBy: 'admin', // TODO: Get from session
        confirmationUploadedAt: new Date(),
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'PO confirmation uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading PO confirmation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload PO confirmation' },
      { status: 500 }
    );
  }
}
