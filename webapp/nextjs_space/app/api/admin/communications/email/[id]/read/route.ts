import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);

    const { id } = params;

    // Update email as read
    const email = await prisma.emailMessage.update({
      where: { id },
      data: { isRead: true }
    });

    return NextResponse.json({
      success: true,
      email
    });
  } catch (error: any) {
    console.error('Error marking email as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark email as read' },
      { status: 500 }
    );
  }
}
