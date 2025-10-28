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

    // Get approval emails (Synergy, Western Power)
    const approvalEmails = await prisma.emailMessage.findMany({
      where: {
        category: 'approval',
        subCategory: {
          in: ['synergy_approval', 'westernpower_approval', 'network_approval']
        }
      },
      orderBy: { receivedAt: 'desc' },
      take: 20
    });

    // Group by lead/job and get latest status
    const approvalsMap = new Map();
    for (const email of approvalEmails) {
      const key = email.detectedLeadId || email.emailGroup || email.from;
      if (!approvalsMap.has(key)) {
        approvalsMap.set(key, {
          id: email.id,
          type: email.subCategory || 'approval',
          status: email.approvalStatus || 'pending',
          subject: email.subject,
          relatedRecord: email.detectedLeadId ? 'Lead' : 'Unknown',
          recordType: 'leads',
          recordId: email.detectedLeadId || '',
          lastUpdate: email.receivedAt,
          emailCount: 1,
          requiresAction: email.approvalStatus === 'pending'
        });
      } else {
        const existing = approvalsMap.get(key);
        existing.emailCount++;
        if (new Date(email.receivedAt) > new Date(existing.lastUpdate)) {
          existing.lastUpdate = email.receivedAt;
          existing.status = email.approvalStatus || existing.status;
        }
      }
    }

    // Get rebate emails
    const rebateEmails = await prisma.emailMessage.findMany({
      where: {
        category: 'rebate',
        subCategory: {
          in: ['stc_certificate', 'rebate_form', 'federal_rebate', 'state_rebate']
        }
      },
      orderBy: { receivedAt: 'desc' },
      take: 20
    });

    const rebatesMap = new Map();
    for (const email of rebateEmails) {
      const key = email.detectedLeadId || email.emailGroup || email.externalId || email.from;
      if (!rebatesMap.has(key)) {
        rebatesMap.set(key, {
          id: email.id,
          type: email.subCategory || 'rebate',
          status: email.approvalStatus || 'pending',
          subject: email.subject,
          relatedRecord: email.detectedLeadId ? 'Lead' : 'Rebate Application',
          recordType: 'leads',
          recordId: email.detectedLeadId || '',
          lastUpdate: email.receivedAt,
          emailCount: 1,
          requiresAction: email.approvalStatus === 'pending'
        });
      } else {
        const existing = rebatesMap.get(key);
        existing.emailCount++;
        if (new Date(email.receivedAt) > new Date(existing.lastUpdate)) {
          existing.lastUpdate = email.receivedAt;
          existing.status = email.approvalStatus || existing.status;
        }
      }
    }

    // Get order/supplier emails
    const orderEmails = await prisma.emailMessage.findMany({
      where: {
        OR: [
          { category: 'support', subCategory: 'order_update' },
          { externalSystem: { in: ['supplier', 'vendor'] } },
          { 
            from: { 
              contains: 'order',
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: { receivedAt: 'desc' },
      take: 20
    });

    const ordersMap = new Map();
    for (const email of orderEmails) {
      const key = email.externalId || email.emailGroup || email.from;
      if (!ordersMap.has(key)) {
        ordersMap.set(key, {
          id: email.id,
          type: 'order',
          status: 'active',
          subject: email.subject,
          relatedRecord: email.from,
          recordType: 'orders',
          recordId: email.externalId || '',
          lastUpdate: email.receivedAt,
          emailCount: 1,
          requiresAction: false
        });
      } else {
        const existing = ordersMap.get(key);
        existing.emailCount++;
        if (new Date(email.receivedAt) > new Date(existing.lastUpdate)) {
          existing.lastUpdate = email.receivedAt;
        }
      }
    }

    // Get subcontractor emails
    const subcontractorEmails = await prisma.emailMessage.findMany({
      where: {
        OR: [
          { externalSystem: 'subcontractor' },
          { 
            from: { 
              contains: 'subcontractor',
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: { receivedAt: 'desc' },
      take: 15
    });

    const subcontractorsMap = new Map();
    for (const email of subcontractorEmails) {
      const key = email.from;
      if (!subcontractorsMap.has(key)) {
        subcontractorsMap.set(key, {
          id: email.id,
          type: 'subcontractor',
          status: 'active',
          subject: email.subject,
          relatedRecord: email.from,
          recordType: 'subcontractors',
          recordId: '',
          lastUpdate: email.receivedAt,
          emailCount: 1,
          requiresAction: false
        });
      } else {
        const existing = subcontractorsMap.get(key);
        existing.emailCount++;
        if (new Date(email.receivedAt) > new Date(existing.lastUpdate)) {
          existing.lastUpdate = email.receivedAt;
        }
      }
    }

    // Get Plenti finance emails
    const plentiEmails = await prisma.emailMessage.findMany({
      where: {
        OR: [
          { externalSystem: 'plenti' },
          { 
            from: { 
              contains: 'plenti',
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: { receivedAt: 'desc' },
      take: 10
    });

    const plentiMap = new Map();
    for (const email of plentiEmails) {
      const key = email.detectedLeadId || email.externalId || email.from;
      if (!plentiMap.has(key)) {
        plentiMap.set(key, {
          id: email.id,
          type: 'finance',
          status: email.approvalStatus || 'pending',
          subject: email.subject,
          relatedRecord: email.detectedLeadId ? 'Lead' : 'Finance Application',
          recordType: 'leads',
          recordId: email.detectedLeadId || '',
          lastUpdate: email.receivedAt,
          emailCount: 1,
          requiresAction: email.approvalStatus === 'pending'
        });
      } else {
        const existing = plentiMap.get(key);
        existing.emailCount++;
        if (new Date(email.receivedAt) > new Date(existing.lastUpdate)) {
          existing.lastUpdate = email.receivedAt;
        }
      }
    }

    // Calculate stats
    const pendingApprovals = Array.from(approvalsMap.values()).filter(
      a => a.status === 'pending'
    ).length;

    const pendingRebates = Array.from(rebatesMap.values()).filter(
      r => r.status === 'pending'
    ).length;

    const activeOrders = ordersMap.size;

    const unlinkedEmails = await prisma.emailMessage.count({
      where: {
        AND: [
          { detectedLeadId: null },
          { detectedQuoteId: null },
          { externalId: null },
          { category: { not: 'general' } }
        ]
      }
    });

    const requiresAction = Array.from(approvalsMap.values()).filter(
      a => a.requiresAction
    ).length + Array.from(rebatesMap.values()).filter(
      r => r.requiresAction
    ).length;

    return NextResponse.json({
      approvals: Array.from(approvalsMap.values()),
      rebates: Array.from(rebatesMap.values()),
      orders: Array.from(ordersMap.values()),
      subcontractors: Array.from(subcontractorsMap.values()),
      plenti: Array.from(plentiMap.values()),
      stats: {
        pendingApprovals,
        pendingRebates,
        activeOrders,
        unlinkedEmails,
        requiresAction
      }
    });
  } catch (error) {
    console.error('Error fetching operations data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operations data' },
      { status: 500 }
    );
  }
}
