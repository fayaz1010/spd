import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('[Installer Login] Attempt for:', email);
    console.log('[Installer Login] Password received:', password);
    console.log('[Installer Login] Password length:', password?.length);
    console.log('[Installer Login] Password type:', typeof password);

    if (!email || !password) {
      console.log('[Installer Login] Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find electrician by email with portal access
    const electrician = await prisma.electrician.findFirst({
      where: {
        email: email.toLowerCase(),
        portalAccess: true,
        status: 'ACTIVE',
      },
    });

    console.log('[Installer Login] Electrician found:', !!electrician);
    console.log('[Installer Login] Has portal password:', !!electrician?.portalPassword);
    console.log('[Installer Login] Portal access:', electrician?.portalAccess);
    console.log('[Installer Login] Status:', electrician?.status);

    if (!electrician || !electrician.portalPassword) {
      console.log('[Installer Login] No electrician or no portal password');
      return NextResponse.json(
        { error: 'Invalid credentials or portal access not enabled' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, electrician.portalPassword);

    console.log('[Installer Login] Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('[Installer Login] Invalid password');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        electricianId: electrician.id,
        email: electrician.email,
        type: 'installer'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token,
      electricianId: electrician.id,
      name: `${electrician.firstName} ${electrician.lastName}`,
    });

  } catch (error) {
    console.error('Installer login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
