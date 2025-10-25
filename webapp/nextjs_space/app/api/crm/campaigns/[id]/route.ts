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
    const { name, description, trigger, enabled, steps } = body;

    // If steps are provided, delete old ones and create new ones
    if (steps) {
      await prisma.campaignStep.deleteMany({
        where: { campaignId: params.id },
      });
    }

    const campaign = await prisma.dripCampaign.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(trigger && { trigger }),
        ...(enabled !== undefined && { enabled }),
        ...(steps && {
          steps: {
            create: steps.map((step: any, index: number) => ({
              order: index + 1,
              delay: step.delay,
              action: step.action,
              templateId: step.templateId,
            })),
          },
        }),
      },
      include: {
        steps: true,
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
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

    // Delete campaign steps first
    await prisma.campaignStep.deleteMany({
      where: { campaignId: params.id },
    });

    // Delete campaign
    await prisma.dripCampaign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
