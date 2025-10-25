
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-admin';
import { autoCreateDeal, syncDealStageFromLead, updateLeadScore } from '@/lib/crm/deal-automation';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const sourceFilter = searchParams.get('source');
    const assignedToFilter = searchParams.get('assignedTo');
    const searchQuery = searchParams.get('search');
    const bookingTypeFilter = searchParams.get('bookingType'); // NEW: Filter by booking type
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build where clause
    const where: any = {};
    
    if (statusFilter && statusFilter !== 'all' && statusFilter !== 'converted') {
      where.status = statusFilter;
    }
    
    if (sourceFilter && sourceFilter !== 'all') {
      where.leadSource = sourceFilter;
    }
    
    if (assignedToFilter && assignedToFilter !== 'all') {
      if (assignedToFilter === 'unassigned') {
        where.assignedTo = null;
      } else {
        where.assignedTo = assignedToFilter;
      }
    }
    
    // NEW: Filter by booking type (for extra services)
    if (bookingTypeFilter) {
      where.metadata = {
        path: ['bookingType'],
        equals: bookingTypeFilter
      };
    }
    
    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { phone: { contains: searchQuery } },
        { address: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Build query
    let leadsQuery: any = {
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        siteVisit: true,
      },
    };

    // If filtering for converted leads (leads with jobs)
    if (statusFilter === 'converted') {
      leadsQuery.where = {
        InstallationJob: {
          isNot: null
        }
      };
      leadsQuery.include.InstallationJob = {
        select: {
          id: true,
          jobNumber: true,
          status: true,
          scheduledDate: true,
        }
      };
    }

    const leads = await prisma.lead.findMany(leadsQuery);

    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();
    
    const leadId = body.id || `LEAD-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const lead = await prisma.lead.create({
      data: {
        id: leadId,
        name: body.name || '',
        email: body.email || '',
        phone: body.phone || '',
        address: body.address || 'TBD',
        suburb: body.suburb,
        propertyType: body.propertyType || '',
        quarterlyBill: body.quarterlyBill ? parseFloat(body.quarterlyBill) : null,
        householdSize: body.householdSize ? parseInt(body.householdSize) : 4,
        systemSizeKw: body.systemSizeKw || 0,
        numPanels: body.numPanels || 0,
        batterySizeKwh: body.batterySizeKwh || 0,
        quoteData: body.quoteData || {},
        quoteReference: body.quoteReference || `QUOTE-${Date.now()}`,
        
        // New lead source fields
        leadSource: body.leadSource || 'manual',
        leadSourceDetails: body.leadSourceDetails,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        utmContent: body.utmContent,
        utmTerm: body.utmTerm,
        
        // Assignment
        assignedTo: body.assignedTo,
        assignedAt: body.assignedTo ? new Date() : null,
        
        // Notes
        initialNotes: body.notes || body.initialNotes,
        
        status: 'new',
        updatedAt: new Date(),
      },
    });
    
    // Create initial activity if notes provided
    if (body.notes || body.initialNotes) {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'note',
          description: body.notes || body.initialNotes,
          createdBy: body.createdBy || 'system',
        },
      });
    }
    
    // Auto-create deal if autoCreateDeal flag is true (default: true)
    if (body.autoCreateDeal !== false) {
      try {
        await autoCreateDeal(lead.id, body.assignedTo);
        console.log(`Deal auto-created for lead ${lead.id}`);
      } catch (error) {
        console.error('Failed to auto-create deal:', error);
        // Don't fail the lead creation if deal creation fails
      }
    }
    
    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);

    const { id, ...data } = await request.json();

    const lead = await prisma.lead.update({
      where: { id },
      data,
    });

    // Auto-sync deal if it exists
    try {
      await syncDealStageFromLead(id);
      await updateLeadScore(id);
      console.log(`Deal auto-synced for lead ${id}`);
    } catch (syncError) {
      console.error('Failed to sync deal:', syncError);
      // Don't fail the lead update if sync fails
    }

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
