import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/electricians/expiry-alerts
 * Check for expiring licenses and CEC accreditations
 * Returns electricians with credentials expiring within specified days
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysAhead = parseInt(searchParams.get('days') || '30'); // Default 30 days
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    // Fetch all active electricians
    const electricians = await prisma.electrician.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          {
            licenseExpiry: {
              lte: futureDate,
              gte: today,
            },
          },
          {
            cecExpiry: {
              lte: futureDate,
              gte: today,
            },
          },
        ],
      },
      include: {
        teamMember: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            Team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignedJobs: {
          where: {
            status: {
              in: ['SCHEDULED', 'IN_PROGRESS'],
            },
          },
          select: {
            id: true,
            jobNumber: true,
            scheduledDate: true,
          },
        },
      },
      orderBy: [
        { licenseExpiry: 'asc' },
        { cecExpiry: 'asc' },
      ],
    });
    
    // Also check for expired credentials
    const expiredElectricians = await prisma.electrician.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          {
            licenseExpiry: {
              lt: today,
            },
          },
          {
            cecExpiry: {
              lt: today,
            },
          },
        ],
      },
      include: {
        teamMember: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            Team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignedJobs: {
          where: {
            status: {
              in: ['SCHEDULED', 'IN_PROGRESS'],
            },
          },
          select: {
            id: true,
            jobNumber: true,
            scheduledDate: true,
          },
        },
      },
    });
    
    // Process alerts
    const alerts = electricians.map((electrician: any) => {
      const licenseAlert = electrician.licenseExpiry ? {
        type: 'license',
        expiryDate: electrician.licenseExpiry,
        daysUntilExpiry: Math.floor(
          (new Date(electrician.licenseExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ),
        severity: getDaysUntilExpiry(electrician.licenseExpiry, today) < 7 ? 'critical' : 
                  getDaysUntilExpiry(electrician.licenseExpiry, today) < 14 ? 'high' : 'medium',
      } : null;
      
      const cecAlert = electrician.cecExpiry ? {
        type: 'cec',
        expiryDate: electrician.cecExpiry,
        daysUntilExpiry: Math.floor(
          (new Date(electrician.cecExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ),
        severity: getDaysUntilExpiry(electrician.cecExpiry, today) < 7 ? 'critical' : 
                  getDaysUntilExpiry(electrician.cecExpiry, today) < 14 ? 'high' : 'medium',
      } : null;
      
      return {
        electricianId: electrician.id,
        name: `${electrician.firstName} ${electrician.lastName}`,
        email: electrician.email,
        type: electrician.type,
        teamMember: electrician.teamMember,
        activeJobs: electrician.assignedJobs.length,
        upcomingJobs: electrician.assignedJobs,
        alerts: [licenseAlert, cecAlert].filter(Boolean),
      };
    });
    
    const expiredAlerts = expiredElectricians.map((electrician: any) => {
      const licenseExpired = electrician.licenseExpiry && new Date(electrician.licenseExpiry) < today;
      const cecExpired = electrician.cecExpiry && new Date(electrician.cecExpiry) < today;
      
      return {
        electricianId: electrician.id,
        name: `${electrician.firstName} ${electrician.lastName}`,
        email: electrician.email,
        type: electrician.type,
        teamMember: electrician.teamMember,
        activeJobs: electrician.assignedJobs.length,
        upcomingJobs: electrician.assignedJobs,
        expired: {
          license: licenseExpired ? {
            expiryDate: electrician.licenseExpiry,
            daysExpired: Math.floor(
              (today.getTime() - new Date(electrician.licenseExpiry).getTime()) / (1000 * 60 * 60 * 24)
            ),
          } : null,
          cec: cecExpired ? {
            expiryDate: electrician.cecExpiry,
            daysExpired: Math.floor(
              (today.getTime() - new Date(electrician.cecExpiry).getTime()) / (1000 * 60 * 60 * 24)
            ),
          } : null,
        },
      };
    });
    
    return NextResponse.json({
      success: true,
      summary: {
        totalExpiring: alerts.length,
        totalExpired: expiredAlerts.length,
        criticalAlerts: alerts.filter(a => a.alerts.some((alert: any) => alert.severity === 'critical')).length,
        highAlerts: alerts.filter(a => a.alerts.some((alert: any) => alert.severity === 'high')).length,
        affectedJobs: [...alerts, ...expiredAlerts].reduce((sum, a) => sum + a.activeJobs, 0),
      },
      expiring: alerts,
      expired: expiredAlerts,
      daysAhead,
    });
  } catch (error: any) {
    console.error('Error fetching expiry alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function getDaysUntilExpiry(expiryDate: Date | string, today: Date): number {
  return Math.floor(
    (new Date(expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}
