import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { signToken, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, quoteNumber } = await request.json();

    if (!email || !quoteNumber) {
      return NextResponse.json(
        { error: 'Email and quote number are required' },
        { status: 400 }
      );
    }

    // Find quote
    const quote = await prisma.customerQuote.findUnique({
      where: { quoteReference: quoteNumber },
      include: {
        lead: {
          include: { user: true }
        }
      },
    });

    if (!quote || !quote.lead || quote.lead.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create account if doesn't exist
    let user = quote.lead.user;
    
    if (!user) {
      // Hash the quote number as password
      const hashedPassword = await bcrypt.hash(quoteNumber, 10);
      
      user = await prisma.admin.create({
        data: {
          email: quote.lead.email,
          password: hashedPassword,
          name: quote.lead.name,
          role: UserRole.CUSTOMER,
          leadId: quote.lead.id,
          permissions: ['view_own_project'],
          isActive: true,
        },
      });

      // Update lead
      await prisma.lead.update({
        where: { id: quote.lead.id },
        data: { accountCreated: true },
      });
    } else {
      // Verify password for existing account
      const isValid = await bcrypt.compare(quoteNumber, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // Update last login
    await prisma.admin.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Build auth payload
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
      permissions: user.permissions,
      leadId: quote.lead.id,
    };

    const token = signToken(payload);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      redirectTo: '/portal/dashboard',
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
