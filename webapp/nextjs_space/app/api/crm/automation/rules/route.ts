import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await prisma.followUpRule.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, trigger, action, delay, conditions, templateId } = body;

    if (!name || !trigger || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: name, trigger, action' },
        { status: 400 }
      );
    }

    const rule = await prisma.followUpRule.create({
      data: {
        name,
        trigger,
        action,
        delay: delay || 0,
        conditions: conditions || {},
        templateId,
        enabled: true,
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}
