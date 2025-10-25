import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// GET /api/admin/installation-costing - List all installation cost items
export async function GET(request: NextRequest) {
  try {
    // Optional auth - allow access for admin pages
    // const decoded = verifyToken(request);
    // if (!decoded) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const providerType = searchParams.get('providerType');
    const providerId = searchParams.get('providerId');
    const isActive = searchParams.get('isActive');

    const items = await prisma.installationCostItem.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(providerType ? { providerType } : {}),
        ...(providerId ? { providerId } : {}),
        ...(isActive !== null ? { isActive: isActive === 'true' } : {}),
      },
      orderBy: [
        { category: 'asc' },
        { priority: 'desc' },
        { sortOrder: 'asc' },
      ],
    });

    // Group by category
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      items,
      grouped,
      total: items.length,
    });
  } catch (error) {
    console.error('Error fetching installation cost items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/installation-costing - Create new installation cost item
export async function POST(request: NextRequest) {
  try {
    // Optional auth - allow access for admin pages
    // const decoded = verifyToken(request);
    // if (!decoded) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();

    const item = await prisma.installationCostItem.create({
      data: {
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating installation cost item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
