import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Fetch user profile from database
    const lead = await prisma.lead.findUnique({
      where: { id: decoded.leadId },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        suburb: true,
        postcode: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone || '',
        address: lead.address || '',
        city: lead.suburb || '',
        postcode: lead.postcode || '',
      },
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const body = await request.json();

    // Update user profile in database
    await prisma.lead.update({
      where: { id: decoded.leadId },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        suburb: body.city,
        postcode: body.postcode,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
