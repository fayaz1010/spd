import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter') || 'all';

    let whereClause: any = {};

    if (filter === 'unread') {
      whereClause.isRead = false;
    } else if (filter === 'starred') {
      whereClause.isStarred = true;
    } else if (filter === 'leads') {
      whereClause.OR = [
        { detectedLeadId: { not: null } },
        { detectedQuoteId: { not: null } }
      ];
    }

    const emails = await prisma.emailMessage.findMany({
      where: whereClause,
      orderBy: { receivedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        quote: {
          select: {
            id: true,
            systemSizeKw: true,
            totalPrice: true
          }
        }
      }
    });

    const total = await prisma.emailMessage.count({ where: whereClause });

    return NextResponse.json({
      emails,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
