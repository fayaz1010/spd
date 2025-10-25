import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const type = searchParams.get('type'); // EMAIL, SMS, ALL
    const direction = searchParams.get('direction'); // INBOUND, OUTBOUND, ALL
    const search = searchParams.get('search');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (dealId) {
      where.dealId = dealId;
    }

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (direction && direction !== 'ALL') {
      where.direction = direction;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } },
        { to: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get communications with related data
    const communications = await prisma.communication.findMany({
      where,
      include: {
        deal: {
          select: {
            id: true,
            title: true,
            lead: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        emailTracking: {
          select: {
            opened: true,
            openedAt: true,
            clicked: true,
            clickedAt: true,
            openCount: true,
            clickCount: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Group by thread
    const threads = new Map<string, any[]>();
    
    communications.forEach(comm => {
      const threadId = comm.threadId || comm.id;
      if (!threads.has(threadId)) {
        threads.set(threadId, []);
      }
      threads.get(threadId)!.push(comm);
    });

    // Convert to array and add thread metadata
    const threadArray = Array.from(threads.entries()).map(([threadId, messages]) => {
      const sortedMessages = messages.sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
      
      const firstMessage = sortedMessages[0];
      const lastMessage = sortedMessages[sortedMessages.length - 1];
      const hasUnread = messages.some(m => 
        m.direction === 'INBOUND' && !m.openedAt
      );

      return {
        threadId,
        messages: sortedMessages,
        messageCount: messages.length,
        firstMessage: {
          id: firstMessage.id,
          sentAt: firstMessage.sentAt,
          from: firstMessage.from,
        },
        lastMessage: {
          id: lastMessage.id,
          sentAt: lastMessage.sentAt,
          subject: lastMessage.subject,
          body: lastMessage.body,
          type: lastMessage.type,
          direction: lastMessage.direction,
        },
        deal: firstMessage.deal,
        hasUnread,
        hasReplies: messages.some(m => m.direction === 'INBOUND'),
      };
    });

    // Sort threads by last message date
    threadArray.sort((a, b) => 
      new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime()
    );

    // Get total count
    const totalCount = await prisma.communication.count({ where });

    return NextResponse.json({
      success: true,
      threads: threadArray,
      total: totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Inbox fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}
