
/**
 * Installer Jobs API
 * Returns jobs based on role:
 * - Admin: All jobs
 * - Team Member: Jobs assigned to their team
 * - Subcontractor: Jobs assigned to their subcontractor company
 */

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    console.log('[Installer Jobs] Token decoded:', {
      role: decoded.role,
      teamMemberId: decoded.teamMemberId,
      subcontractorId: decoded.subcontractorId,
      electricianId: decoded.electricianId,
    });
    
    let whereClause: any = {
      status: {
        in: ['READY_TO_SCHEDULE', 'PENDING_SCHEDULE', 'SCHEDULED', 'PENDING_SUB_CONFIRM', 'SUB_CONFIRMED', 'MATERIALS_ORDERED', 'MATERIALS_READY', 'IN_PROGRESS', 'COMPLETED'],
      },
    };

    // Role-based filtering
    if (decoded.role === 'admin') {
      // Admin sees ALL jobs - no additional filter
    } else if (decoded.teamMemberId) {
      // Team member sees jobs assigned to their team
      const teamMember = await prisma.teamMember.findUnique({
        where: { id: decoded.teamMemberId },
        select: { teamId: true },
      });
      
      if (teamMember?.teamId) {
        whereClause.teamId = teamMember.teamId;
      } else {
        // No team assigned, return empty
        return NextResponse.json({ jobs: [], userRole: 'team_member' });
      }
    } else if (decoded.subcontractorId) {
      // Subcontractor sees only their jobs
      whereClause.subcontractorId = decoded.subcontractorId;
    } else if (decoded.electricianId) {
      // Electrician token - find their team through TeamMember
      console.log('[Installer Jobs] Looking for electrician:', decoded.electricianId);
      
      const teamMember = await prisma.teamMember.findFirst({
        where: { electricianId: decoded.electricianId },
        select: { teamId: true, name: true },
      });
      
      console.log('[Installer Jobs] Team member found:', teamMember);
      
      if (teamMember?.teamId) {
        // Show jobs assigned to their team
        console.log('[Installer Jobs] Using team filter:', teamMember.teamId);
        whereClause.teamId = teamMember.teamId;
      } else {
        // Fallback: show jobs where they are the lead electrician
        console.log('[Installer Jobs] Using lead electrician filter');
        whereClause.leadElectricianId = decoded.electricianId;
      }
    } else {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    console.log('[Installer Jobs] Final where clause:', JSON.stringify(whereClause, null, 2));

    // Fetch jobs with full details
    const jobs = await prisma.installationJob.findMany({
      where: whereClause,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            suburb: true,
            postcode: true,
            systemSizeKw: true,
            batterySizeKwh: true,
            numPanels: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        subcontractor: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    return NextResponse.json({ 
      jobs,
      userRole: decoded.role || 'installer',
      userId: decoded.teamMemberId || decoded.subcontractorId || decoded.electricianId,
    });
  } catch (error) {
    console.error('Installer jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
