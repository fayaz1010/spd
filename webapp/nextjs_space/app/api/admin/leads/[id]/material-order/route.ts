import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';
import { autoCreateMaterialOrder } from '@/lib/material-order-automation';

/**
 * GET /api/admin/leads/[id]/material-order
 * Get material order for a lead's installation job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const leadId = params.id;

    // Get lead with installation job
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        InstallationJob: {
          include: {
            materialOrders: {
              include: {
                supplier: true
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const materialOrder = lead.InstallationJob?.materialOrders?.[0] || null;

    return NextResponse.json({
      success: true,
      materialOrder
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching material order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch material order',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/leads/[id]/material-order
 * Manually create material order for a lead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const leadId = params.id;

    // Get lead with installation job
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        InstallationJob: true
      }
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (!lead.InstallationJob) {
      return NextResponse.json(
        { success: false, error: 'No installation job found for this lead' },
        { status: 400 }
      );
    }

    // Create material order
    const materialOrder = await autoCreateMaterialOrder(lead.InstallationJob.id);

    if (!materialOrder) {
      return NextResponse.json(
        { success: false, error: 'Failed to create material order. Job may not be ready.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      materialOrder
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error creating material order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create material order',
        details: error.message
      },
      { status: 500 }
    );
  }
}
