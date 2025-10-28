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

    // Get all emails grouped by category
    const emailsByCategory = await prisma.emailMessage.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      where: {
        category: { not: null }
      }
    });

    // Get detailed stats for each category
    const categoryStats = await Promise.all(
      emailsByCategory.map(async (group) => {
        const category = group.category!;
        
        // Get subcategory breakdown
        const subCategories = await prisma.emailMessage.groupBy({
          by: ['subCategory'],
          _count: { id: true },
          where: {
            category,
            subCategory: { not: null }
          }
        });

        // Get approval stats for this category
        const approvalStats = await prisma.emailMessage.groupBy({
          by: ['approvalStatus'],
          _count: { id: true },
          where: {
            category,
            requiresApproval: true
          }
        });

        // Get recent emails in this category
        const recentEmails = await prisma.emailMessage.findMany({
          where: { category },
          orderBy: { receivedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            from: true,
            subject: true,
            receivedAt: true,
            subCategory: true,
            approvalStatus: true,
            requiresApproval: true,
            externalSystem: true,
            externalId: true,
            priority: true,
            isRead: true
          }
        });

        // Count unread
        const unreadCount = await prisma.emailMessage.count({
          where: {
            category,
            isRead: false
          }
        });

        // Count pending approvals
        const pendingApprovals = await prisma.emailMessage.count({
          where: {
            category,
            approvalStatus: 'pending'
          }
        });

        return {
          category,
          total: group._count.id,
          unread: unreadCount,
          pendingApprovals,
          subCategories: subCategories.map(sc => ({
            name: sc.subCategory,
            count: sc._count.id
          })),
          approvalBreakdown: approvalStats.map(as => ({
            status: as.approvalStatus,
            count: as._count.id
          })),
          recentEmails
        };
      })
    );

    // Get emails by external system
    const externalSystems = await prisma.emailMessage.groupBy({
      by: ['externalSystem'],
      _count: { id: true },
      where: {
        externalSystem: { not: null }
      }
    });

    const externalSystemStats = await Promise.all(
      externalSystems.map(async (system) => {
        const emails = await prisma.emailMessage.findMany({
          where: { externalSystem: system.externalSystem! },
          orderBy: { receivedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            from: true,
            subject: true,
            receivedAt: true,
            externalId: true,
            category: true,
            subCategory: true,
            approvalStatus: true,
            isRead: true
          }
        });

        return {
          system: system.externalSystem,
          total: system._count.id,
          emails
        };
      })
    );

    // Get approval summary
    const approvalSummary = await prisma.emailMessage.groupBy({
      by: ['approvalStatus'],
      _count: { id: true },
      where: {
        requiresApproval: true
      }
    });

    // Get priority breakdown
    const priorityBreakdown = await prisma.emailMessage.groupBy({
      by: ['priority'],
      _count: { id: true }
    });

    return NextResponse.json({
      categoryStats,
      externalSystemStats,
      approvalSummary: approvalSummary.map(a => ({
        status: a.approvalStatus,
        count: a._count.id
      })),
      priorityBreakdown: priorityBreakdown.map(p => ({
        priority: p.priority,
        count: p._count.id
      })),
      totalEmails: await prisma.emailMessage.count()
    });
  } catch (error) {
    console.error('Error fetching email groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email groups' },
      { status: 500 }
    );
  }
}
