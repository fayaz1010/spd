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
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminEmail = decoded.email || 'admin';

    const { id } = params;
    const body = await request.json();
    const { action, notes } = body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const updateData: any = {
      approvalStatus: action === 'approve' ? 'approved' : 'rejected',
      approvalNotes: notes || null
    };

    if (action === 'approve') {
      updateData.approvedBy = adminEmail;
      updateData.approvedAt = new Date();
    } else {
      updateData.rejectedBy = adminEmail;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = notes || 'No reason provided';
    }

    const email = await prisma.emailMessage.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      email,
      message: `Email ${action}d successfully`
    });
  } catch (error: any) {
    console.error('Error updating approval status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update approval status' },
      { status: 500 }
    );
  }
}
