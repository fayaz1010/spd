import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/leads-map
 * Fetch all leads with coordinates for map display
 */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('statuses');

    const where: any = {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } },
      ],
    };

    // Filter by status if provided
    if (statusFilter) {
      const statuses = statusFilter.split(',');
      where.AND.push({
        status: { in: statuses },
      });
    }

    const leads = await prisma.lead.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        suburb: true,
        latitude: true,
        longitude: true,
        status: true,
        systemSizeKw: true,
        numPanels: true,
        batterySizeKwh: true,
        quarterlyBill: true,
        quoteReference: true,
        depositPaid: true,
        depositAmount: true,
        createdAt: true,
        updatedAt: true,
        CustomerQuote: {
          select: {
            id: true,
            status: true,
            totalCostAfterRebates: true,
          },
        },
        InstallationJob: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
            scheduledDate: true,
            teamId: true,
            subcontractorId: true,
            team: {
              select: {
                name: true,
                color: true,
              },
            },
            subcontractor: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedLeads = leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      suburb: lead.suburb,
      latitude: lead.latitude,
      longitude: lead.longitude,
      status: lead.status,
      systemSizeKw: lead.systemSizeKw,
      numPanels: lead.numPanels,
      batterySizeKwh: lead.batterySizeKwh,
      quarterlyBill: lead.quarterlyBill,
      quoteReference: lead.quoteReference,
      depositPaid: lead.depositPaid,
      depositAmount: lead.depositAmount,
      createdAt: lead.createdAt,
      quote: lead.CustomerQuote,
      job: lead.InstallationJob,
    }));

    return NextResponse.json({
      success: true,
      leads: formattedLeads,
      count: formattedLeads.length,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching leads map data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads map data', details: error.message },
      { status: 500 }
    );
  }
}
