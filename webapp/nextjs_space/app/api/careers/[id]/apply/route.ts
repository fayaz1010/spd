import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

// POST - Submit application (PUBLIC - no auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const coverLetter = formData.get('coverLetter') as string;
    const linkedinUrl = formData.get('linkedinUrl') as string;
    const portfolioUrl = formData.get('portfolioUrl') as string;
    const screeningAnswers = formData.get('screeningAnswers') as string;
    const resumeFile = formData.get('resume') as File;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if vacancy exists and is published
    const vacancy = await prisma.vacancy.findUnique({
      where: { 
        id: params.id,
        status: 'PUBLISHED'
      }
    });

    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found or not accepting applications' },
        { status: 404 }
      );
    }

    // Check if closing date has passed
    if (vacancy.closingDate && new Date(vacancy.closingDate) < new Date()) {
      return NextResponse.json(
        { error: 'This vacancy is no longer accepting applications' },
        { status: 400 }
      );
    }

    // Handle resume upload
    let resumeUrl = '';
    if (resumeFile && resumeFile.size > 0) {
      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'applications');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = resumeFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${sanitizedName}`;
      const filepath = join(uploadsDir, filename);

      // Save file
      const bytes = await resumeFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      resumeUrl = `/uploads/applications/${filename}`;
    } else if (vacancy.requireResume) {
      return NextResponse.json(
        { error: 'Resume is required for this position' },
        { status: 400 }
      );
    }

    // Parse screening answers
    let parsedAnswers = null;
    if (screeningAnswers) {
      try {
        parsedAnswers = JSON.parse(screeningAnswers);
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        vacancyId: params.id,
        firstName,
        lastName,
        email,
        phone,
        resumeUrl,
        coverLetter: coverLetter || null,
        linkedinUrl: linkedinUrl || null,
        portfolioUrl: portfolioUrl || null,
        screeningAnswers: parsedAnswers,
        status: 'NEW',
      },
    });

    // Increment application count on vacancy
    await prisma.vacancy.update({
      where: { id: params.id },
      data: {
        applicationCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        firstName: application.firstName,
        lastName: application.lastName,
      },
    });
  } catch (error: any) {
    console.error('Submit application error:', error);
    
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
