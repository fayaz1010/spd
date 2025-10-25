
/**
 * API Route: Admin Quote Management
 * List, filter, and search customer quotes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Search filter (by quote reference or customer details from related lead)
    if (search) {
      where.OR = [
        {
          quoteReference: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lead: {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      ];
    }

    // Fetch quotes with related lead data
    const [quotes, total] = await Promise.all([
      prisma.customerQuote.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              status: true,
              depositPaid: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.customerQuote.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      quotes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error.message },
      { status: 500 }
    );
  }
}
