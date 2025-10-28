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

    // Determine user type and fetch appropriate profile
    let profile = null;
    
    if (decoded.adminId) {
      // Admin user
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId },
        select: { name: true, email: true, role: true },
      });
      if (admin) {
        profile = { ...admin, phone: '' };
      }
    } else if (decoded.teamMemberId) {
      // Team member
      const member = await prisma.teamMember.findUnique({
        where: { id: decoded.teamMemberId },
        select: { name: true, email: true, phone: true, role: true },
      });
      if (member) {
        profile = member;
      }
    } else if (decoded.subcontractorId) {
      // Subcontractor
      const subcontractor = await prisma.subcontractor.findUnique({
        where: { id: decoded.subcontractorId },
        select: { name: true, email: true, phone: true },
      });
      if (subcontractor) {
        profile = { ...subcontractor, role: 'SUBCONTRACTOR' };
      }
    }

    if (!profile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile,
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

    // Update based on user type
    if (decoded.adminId) {
      await prisma.admin.update({
        where: { id: decoded.adminId },
        data: {
          name: body.name,
          email: body.email,
        },
      });
    } else if (decoded.teamMemberId) {
      await prisma.teamMember.update({
        where: { id: decoded.teamMemberId },
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
        },
      });
    } else if (decoded.subcontractorId) {
      await prisma.subcontractor.update({
        where: { id: decoded.subcontractorId },
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
        },
      });
    }

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
