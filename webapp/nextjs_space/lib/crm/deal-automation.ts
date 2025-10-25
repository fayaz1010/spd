import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate lead score based on multiple factors
 * Score range: 0-100
 */
export function calculateLeadScore(
  lead: any,
  quote?: any
): number {
  let score = 50; // Base score

  // System Value (30 points max)
  const systemValue = quote?.totalCostAfterRebates || lead.systemSizeKw * 5000;
  if (systemValue > 15000) score += 30;
  else if (systemValue > 10000) score += 20;
  else if (systemValue > 5000) score += 10;

  // Battery (10 points)
  if (lead.batterySizeKwh > 0) score += 10;

  // Engagement (20 points max)
  if (lead.contactAttempts > 0) score += 5;
  if (lead.proposalViewCount > 0) score += 10;
  if (lead.proposalViewCount > 3) score += 5;

  // Payment Intent (20 points max)
  if (lead.depositPaid) score += 20;
  else if (lead.depositAmount && lead.depositAmount > 0) score += 10;

  // Marketing Segment (10 points max)
  if (lead.marketingSegment === 'high_consumption') score += 10;
  else if (lead.marketingSegment === 'business') score += 8;
  else if (lead.marketingSegment === 'ev_owner') score += 6;
  else if (lead.marketingSegment === 'pool_owner') score += 5;

  // Property Type (5 points)
  if (lead.propertyType === 'house') score += 5;

  // Recent Activity (5 points)
  if (lead.lastContactedAt) {
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(lead.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceContact < 7) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Automatically create a deal from a lead
 */
export async function autoCreateDeal(
  leadId: string,
  ownerId?: string
): Promise<any> {
  try {
    // Check if deal already exists
    const existingDeal = await prisma.deal.findUnique({
      where: { leadId },
    });

    if (existingDeal) {
      console.log(`Deal already exists for lead ${leadId}`);
      return existingDeal;
    }

    // Fetch lead with quote data
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        CustomerQuote: true,
      },
    });

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    // Assign owner if not provided
    let assignedOwnerId = ownerId;
    if (!assignedOwnerId) {
      assignedOwnerId = await assignDealOwner(lead);
    }

    // Calculate deal value
    const dealValue = lead.CustomerQuote?.totalCostAfterRebates || lead.systemSizeKw * 5000;

    // Calculate lead score
    const leadScore = calculateLeadScore(lead, lead.CustomerQuote);

    // Determine initial stage based on lead status
    let initialStage: any = 'NEW_LEAD';
    if (lead.status === 'contacted') initialStage = 'CONTACTED';
    else if (lead.proposalSentAt) initialStage = 'QUOTE_SENT';
    else if (lead.depositPaid) initialStage = 'NEGOTIATION';

    // Create deal
    const deal = await prisma.deal.create({
      data: {
        leadId: lead.id,
        title: `${lead.name} - ${lead.systemSizeKw}kW Solar${lead.batterySizeKwh > 0 ? ` + ${lead.batterySizeKwh}kWh Battery` : ''}`,
        value: dealValue,
        probability: calculateProbability(initialStage, leadScore),
        stage: initialStage,
        status: 'OPEN',
        ownerId: assignedOwnerId,
        leadScore,
        firstContactAt: lead.firstContactedAt || new Date(),
        lastContactAt: lead.lastContactedAt,
        contactCount: lead.contactAttempts || 0,
      },
    });

    // Log initial activity
    await prisma.activity.create({
      data: {
        dealId: deal.id,
        type: 'NOTE_ADDED',
        title: 'Deal Created',
        description: `Deal automatically created from lead. System: ${lead.systemSizeKw}kW solar${lead.batterySizeKwh > 0 ? ` + ${lead.batterySizeKwh}kWh battery` : ''}. Value: $${dealValue.toFixed(0)}`,
        performedBy: assignedOwnerId,
        completedAt: new Date(),
      },
    });

    console.log(`Deal created successfully for lead ${leadId}: ${deal.id}`);
    return deal;
  } catch (error) {
    console.error('Error auto-creating deal:', error);
    throw error;
  }
}

/**
 * Assign deal owner using round-robin or territory-based logic
 */
async function assignDealOwner(lead: any): Promise<string> {
  try {
    // Get all active admins with ADMIN or SUPER_ADMIN role
    const admins = await prisma.admin.findMany({
      where: {
        isActive: true,
        role: {
          in: ['ADMIN', 'SUPER_ADMIN'],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (admins.length === 0) {
      throw new Error('No active admins found for deal assignment');
    }

    // Simple round-robin: get count of deals per admin
    const dealCounts = await Promise.all(
      admins.map(async (admin) => ({
        adminId: admin.id,
        count: await prisma.deal.count({
          where: {
            ownerId: admin.id,
            status: 'OPEN',
          },
        }),
      }))
    );

    // Find admin with least deals
    const leastBusyAdmin = dealCounts.reduce((prev, current) =>
      current.count < prev.count ? current : prev
    );

    return leastBusyAdmin.adminId;
  } catch (error) {
    console.error('Error assigning deal owner:', error);
    // Fallback: return first admin
    const fallbackAdmin = await prisma.admin.findFirst({
      where: { isActive: true },
    });
    if (!fallbackAdmin) {
      throw new Error('No admins available for assignment');
    }
    return fallbackAdmin.id;
  }
}

/**
 * Calculate deal probability based on stage and score
 */
function calculateProbability(stage: string, leadScore: number): number {
  const stageProbabilities: Record<string, number> = {
    NEW_LEAD: 10,
    CONTACTED: 25,
    QUOTE_SENT: 40,
    FOLLOW_UP: 50,
    NEGOTIATION: 70,
    WON: 100,
    LOST: 0,
    ON_HOLD: 30,
  };

  const baseProbability = stageProbabilities[stage] || 50;
  
  // Adjust based on lead score
  const scoreAdjustment = (leadScore - 50) * 0.3; // -15 to +15
  
  return Math.min(100, Math.max(0, Math.round(baseProbability + scoreAdjustment)));
}

/**
 * Update deal stage based on lead status changes
 */
export async function syncDealStageFromLead(leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        deal: true,
        CustomerQuote: true,
        InstallationJob: true,
      },
    });

    if (!lead || !lead.deal) {
      return; // No deal to update
    }

    let newStage: any = lead.deal.stage;
    let newStatus: any = lead.deal.status;

    // Determine new stage based on lead status and events
    if (lead.status === 'won' || lead.InstallationJob) {
      newStage = 'WON';
      newStatus = 'WON';
    } else if (lead.status === 'lost') {
      newStage = 'LOST';
      newStatus = 'LOST';
    } else if (lead.depositPaid) {
      newStage = 'NEGOTIATION';
    } else if (lead.proposalSentAt) {
      newStage = 'QUOTE_SENT';
    } else if (lead.firstContactedAt) {
      newStage = 'CONTACTED';
    }

    // Only update if stage changed
    if (newStage !== lead.deal.stage || newStatus !== lead.deal.status) {
      const updatedDeal = await prisma.deal.update({
        where: { id: lead.deal.id },
        data: {
          stage: newStage,
          status: newStatus,
          previousStage: lead.deal.stage,
          stageChangedAt: new Date(),
          probability: calculateProbability(newStage, lead.deal.leadScore),
          ...(newStatus === 'WON' && { wonAt: new Date() }),
          ...(newStatus === 'LOST' && { lostAt: new Date() }),
        },
      });

      // Log stage change activity
      await prisma.activity.create({
        data: {
          dealId: lead.deal.id,
          type: 'STAGE_CHANGED',
          title: 'Stage Changed',
          description: `Deal stage changed from ${lead.deal.stage} to ${newStage}`,
          performedBy: lead.deal.ownerId,
          completedAt: new Date(),
        },
      });

      console.log(`Deal ${lead.deal.id} stage updated: ${lead.deal.stage} → ${newStage}`);
    }
  } catch (error) {
    console.error('Error syncing deal stage:', error);
  }
}

/**
 * Recalculate and update lead score
 */
export async function updateLeadScore(leadId: string): Promise<number> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        CustomerQuote: true,
        deal: true,
      },
    });

    if (!lead || !lead.deal) {
      return 0;
    }

    const newScore = calculateLeadScore(lead, lead.CustomerQuote);

    await prisma.deal.update({
      where: { id: lead.deal.id },
      data: {
        leadScore: newScore,
        probability: calculateProbability(lead.deal.stage, newScore),
      },
    });

    console.log(`Lead score updated for ${leadId}: ${newScore}`);
    return newScore;
  } catch (error) {
    console.error('Error updating lead score:', error);
    return 0;
  }
}
