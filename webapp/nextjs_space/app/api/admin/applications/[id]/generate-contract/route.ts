import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';
import { renderToStream } from '@react-pdf/renderer';
import { EmploymentContractPDF } from '@/lib/templates/employment-contract';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    // Get application with all details
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

    // Check if offer has been made
    if (!application.offerSalary || !application.offerStartDate || !application.offerProbationPeriod) {
      return NextResponse.json(
        { error: 'Offer details not found. Please generate offer letter first.' },
        { status: 400 }
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
    const pdfDoc = EmploymentContractPDF({
      application: {
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        phone: application.phone,
      },
      position: {
        title: application.vacancy.position.title,
        department: application.vacancy.position.department,
        level: application.vacancy.position.level,
        description: application.vacancy.position.description,
        responsibilities: application.vacancy.position.responsibilities,
        essentialRequirements: application.vacancy.position.essentialRequirements,
        desirableRequirements: application.vacancy.position.desirableRequirements,
      },
      offer: {
        salary: application.offerSalary,
        startDate: application.offerStartDate.toISOString(),
        probationPeriod: application.offerProbationPeriod,
        specialConditions: application.offerSpecialConditions || undefined,
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
    
    const filename = `employment-contract-${Date.now()}.pdf`;
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const contractUrl = `/uploads/applications/${params.id}/${filename}`;

    // Update application with contract URL
    await prisma.application.update({
      where: { id: params.id },
      data: {
        contractUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      contractUrl,
      message: 'Employment contract generated successfully',
    });
  } catch (error: any) {
    console.error('Generate contract error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to generate contract', details: error.message },
      { status: 500 }
    );
  }
}
