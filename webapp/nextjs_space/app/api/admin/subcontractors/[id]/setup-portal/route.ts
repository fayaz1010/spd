/**
 * Setup Subcontractor Portal Access
 * Allows admins to enable portal access and set initial password for subcontractors
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, UserRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    const { id } = params;
    const body = await request.json();
    const { enablePortalAccess, password, sendEmail } = body;

    // Find subcontractor
    const subcontractor = await prisma.subcontractor.findUnique({
      where: { id },
    });

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subcontractor not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      portalAccess: enablePortalAccess ?? true,
      updatedAt: new Date(),
    };

    // If password is provided, hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    } else if (enablePortalAccess && !subcontractor.password) {
      // Generate a random password if enabling access and no password exists
      const randomPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      updateData.password = hashedPassword;
      updateData.tempPassword = randomPassword; // Store temporarily for email
    }

    // Update subcontractor
    const updatedSubcontractor = await prisma.subcontractor.update({
      where: { id },
      data: updateData,
    });

    // TODO: Send email with login credentials if sendEmail is true
    if (sendEmail && updateData.tempPassword) {
      console.log(`Email would be sent to ${subcontractor.email} with password: ${updateData.tempPassword}`);
      // Implement email sending logic here
    }

    return NextResponse.json({
      success: true,
      message: enablePortalAccess 
        ? 'Portal access enabled successfully' 
        : 'Portal access disabled',
      subcontractor: {
        id: updatedSubcontractor.id,
        companyName: updatedSubcontractor.companyName,
        email: updatedSubcontractor.email,
        portalAccess: updatedSubcontractor.portalAccess,
      },
      // Only return temp password if it was generated
      ...(updateData.tempPassword && { tempPassword: updateData.tempPassword }),
    });
  } catch (error: any) {
    console.error('Setup portal access error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to setup portal access' },
      { status: 500 }
    );
  }
}
