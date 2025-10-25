/**
 * Subcontractor Login API
 * Authenticates subcontractors for portal access
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signToken, UserRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find subcontractor by email
    const subcontractor = await prisma.subcontractor.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if portal access is enabled
    if (!subcontractor.portalAccess) {
      return NextResponse.json(
        { error: 'Portal access is not enabled for this account. Please contact Sun Direct Power.' },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!subcontractor.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact Sun Direct Power.' },
        { status: 403 }
      );
    }

    // Verify password
    if (!subcontractor.password) {
      return NextResponse.json(
        { error: 'Password not set. Please contact Sun Direct Power to set up your account.' },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, subcontractor.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.subcontractor.update({
      where: { id: subcontractor.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const token = signToken({
      userId: subcontractor.id,
      email: subcontractor.email,
      role: UserRole.SUBCONTRACTOR,
      name: subcontractor.contactName,
      permissions: ['view_jobs', 'update_jobs', 'upload_photos'],
      subcontractorId: subcontractor.id,
      companyName: subcontractor.companyName,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: subcontractor.id,
        email: subcontractor.email,
        name: subcontractor.contactName,
        companyName: subcontractor.companyName,
        role: UserRole.SUBCONTRACTOR,
      },
    });
  } catch (error: any) {
    console.error('Subcontractor login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Login failed' },
      { status: 500 }
    );
  }
}
