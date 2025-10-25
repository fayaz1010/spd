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

// GET /api/admin/installation-costing/[id] - Get specific item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Optional auth
    // const decoded = verifyToken(request);
    // if (!decoded) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const item = await prisma.installationCostItem.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching installation cost item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/installation-costing/[id] - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Optional auth
    // const decoded = verifyToken(request);
    // if (!decoded) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();

    const item = await prisma.installationCostItem.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating installation cost item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/installation-costing/[id] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Optional auth
    // const decoded = verifyToken(request);
    // if (!decoded) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await prisma.installationCostItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting installation cost item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
