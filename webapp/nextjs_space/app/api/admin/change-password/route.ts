import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newPassword } = await request.json();

    let user: any = null;
    let updatePromise: any = null;

    // Fetch user based on type
    if (decoded.adminId) {
      user = await prisma.admin.findUnique({
        where: { id: decoded.adminId },
      });
      if (user) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updatePromise = prisma.admin.update({
          where: { id: decoded.adminId },
          data: { password: hashedPassword },
        });
      }
    } else if (decoded.teamMemberId) {
      user = await prisma.teamMember.findUnique({
        where: { id: decoded.teamMemberId },
      });
      if (user) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updatePromise = prisma.teamMember.update({
          where: { id: decoded.teamMemberId },
          data: { password: hashedPassword },
        });
      }
    } else if (decoded.subcontractorId) {
      user = await prisma.subcontractor.findUnique({
        where: { id: decoded.subcontractorId },
      });
      if (user) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updatePromise = prisma.subcontractor.update({
          where: { id: decoded.subcontractorId },
          data: { password: hashedPassword },
        });
      }
    }

    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });
    }

    // Update password
    await updatePromise;

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
