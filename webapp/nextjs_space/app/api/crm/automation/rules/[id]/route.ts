import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, name, trigger, action, delay, conditions, templateId } = body;

    const rule = await prisma.followUpRule.update({
      where: { id: params.id },
      data: {
        ...(enabled !== undefined && { enabled }),
        ...(name && { name }),
        ...(trigger && { trigger }),
        ...(action && { action }),
        ...(delay !== undefined && { delay }),
        ...(conditions && { conditions }),
        ...(templateId && { templateId }),
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error updating automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to update rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.followUpRule.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    );
  }
}
