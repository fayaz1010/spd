import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';
import { renderToStream } from '@react-pdf/renderer';
import { OfferLetterPDF } from '@/lib/templates/offer-letter';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const body = await request.json();

    const { salary, startDate, probationPeriod, specialConditions } = body;

    // Validate required fields
    if (!salary || !startDate || !probationPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get application with vacancy and position
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        vacancy: {
          include: {
            position: true,
          }
        }
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get company settings
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
    });

    const companySettings = {
      businessName: settings?.businessName || 'Sun Direct Power',
      businessAddress: settings?.businessAddress || '',
      businessABN: settings?.businessABN || '',
    };

    // Generate PDF
    const pdfDoc = OfferLetterPDF({
      application: {
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
      },
      position: {
        title: application.vacancy.position.title,
        department: application.vacancy.position.department,
      },
      offer: {
        salary: parseFloat(salary),
        startDate,
        probationPeriod: parseInt(probationPeriod),
        specialConditions,
      },
      companySettings,
    });

    const stream = await renderToStream(pdfDoc);
    const chunks: Buffer[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);

    // Save PDF to filesystem
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'applications', params.id);
    await mkdir(uploadsDir, { recursive: true });
    
    const filename = `offer-letter-${Date.now()}.pdf`;
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const offerLetterUrl = `/uploads/applications/${params.id}/${filename}`;

    // Update application with offer details
    await prisma.application.update({
      where: { id: params.id },
      data: {
        offerDate: new Date(),
        offerSalary: parseFloat(salary),
        offerStartDate: new Date(startDate),
        offerProbationPeriod: parseInt(probationPeriod),
        offerSpecialConditions: specialConditions,
        offerLetterUrl,
        status: 'OFFER_MADE',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      offerLetterUrl,
      message: 'Offer letter generated successfully',
    });
  } catch (error: any) {
    console.error('Generate offer error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to generate offer letter', details: error.message },
      { status: 500 }
    );
  }
}
