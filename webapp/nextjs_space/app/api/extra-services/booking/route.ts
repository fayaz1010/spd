import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Handle service booking requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, serviceName, name, email, phone, address, message } = body;

    // Validate required fields
    if (!serviceId || !name || !email || !phone || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a lead in the CRM for this service booking
    const lead = await prisma.lead.create({
      data: {
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        email,
        phone,
        address,
        source: 'WEBSITE',
        status: 'NEW',
        notes: `Service Booking Request: ${serviceName}\n\n${message || 'No additional details provided.'}`,
        metadata: {
          serviceId,
          serviceName,
          bookingType: 'extra_service',
          requestedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });

    // TODO: Send email notification to admin
    // TODO: Send confirmation email to customer

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      message: 'Booking request submitted successfully',
    });

  } catch (error: any) {
    console.error('Error creating service booking:', error);
    return NextResponse.json(
      { error: 'Failed to submit booking', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
