import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    // Pipeline Metrics - Use Leads as deals (since most data is in Lead table)
    const activeLeads = await prisma.lead.findMany({
      where: {
        status: {
          in: ['new', 'contacted', 'quoted', 'negotiating', 'approved'],
        },
      },
      select: {
        status: true,
        depositPaid: true,
        CustomerQuote: {
          select: {
            totalCostAfterRebates: true,
          },
        },
      },
    });

    const wonLeads = await prisma.lead.count({
      where: {
        status: 'approved',
        depositPaid: true,
        updatedAt: {
          gte: startOfMonth,
        },
      },
    });

    const totalLeadsThisMonth = await prisma.lead.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const totalValue = activeLeads.reduce((sum, lead) => sum + (lead.CustomerQuote?.totalCostAfterRebates || 0), 0);
    const avgDealSize = activeLeads.length > 0 ? totalValue / activeLeads.length : 0;
    const winRate = totalLeadsThisMonth > 0 ? (wonLeads / totalLeadsThisMonth) * 100 : 0;

    // Activity Metrics (Today)
    const activitiesToday = await prisma.activity.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
      _count: true,
    });

    const activityCounts = {
      callsToday: 0,
      emailsToday: 0,
      smsToday: 0,
      tasksCompleted: 0,
    };

    activitiesToday.forEach(activity => {
      if (activity.type === 'CALL_MADE' || activity.type === 'CALL_RECEIVED') {
        activityCounts.callsToday += activity._count;
      } else if (activity.type === 'EMAIL_SENT' || activity.type === 'EMAIL_RECEIVED') {
        activityCounts.emailsToday += activity._count;
      } else if (activity.type === 'NOTE_ADDED') {
        activityCounts.smsToday += activity._count;
      }
    });

    // Lead Metrics
    const newLeads = await prisma.lead.count({
      where: {
        createdAt: {
          gte: startOfWeek,
        },
      },
    });

    const hotLeads = await prisma.lead.count({
      where: {
        status: {
          in: ['quoted', 'negotiating'],
        },
        CustomerQuote: {
          totalCostAfterRebates: {
            gte: 10000, // High-value leads
          },
        },
      },
    });

    const contactedLeads = await prisma.lead.count({
      where: {
        status: 'contacted',
        updatedAt: {
          gte: startOfWeek,
        },
      },
    });

    const convertedLeads = await prisma.lead.count({
      where: {
        status: 'approved',
        depositPaid: true,
        updatedAt: {
          gte: startOfWeek,
        },
      },
    });

    // Revenue Forecast (Based on lead status probability)
    const quotedLeads = activeLeads.filter(lead => lead.status === 'quoted');
    const negotiatingLeads = activeLeads.filter(lead => lead.status === 'negotiating');
    const approvedLeads = activeLeads.filter(lead => lead.status === 'approved');

    // Quoted = 30% probability, Negotiating = 60%, Approved = 90%
    const thisMonthForecast = 
      quotedLeads.reduce((sum, lead) => sum + ((lead.CustomerQuote?.totalCostAfterRebates || 0) * 0.3), 0) +
      negotiatingLeads.reduce((sum, lead) => sum + ((lead.CustomerQuote?.totalCostAfterRebates || 0) * 0.6), 0) +
      approvedLeads.reduce((sum, lead) => sum + ((lead.CustomerQuote?.totalCostAfterRebates || 0) * 0.9), 0);

    const nextMonthForecast = thisMonthForecast * 0.7; // Estimate 70% of current pipeline

    const quarterForecast = thisMonthForecast * 2.5; // Estimate 2.5x current pipeline

    return NextResponse.json({
      pipeline: {
        totalDeals: activeLeads.length,
        totalValue: Math.round(totalValue),
        avgDealSize: Math.round(avgDealSize),
        winRate: Math.round(winRate * 10) / 10,
      },
      activity: activityCounts,
      leads: {
        newLeads,
        hotLeads,
        contacted: contactedLeads,
        converted: convertedLeads,
      },
      forecast: {
        thisMonth: Math.round(thisMonthForecast),
        nextMonth: Math.round(nextMonthForecast),
        thisQuarter: Math.round(quarterForecast),
      },
    });
  } catch (error) {
    console.error('Error fetching CRM metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
