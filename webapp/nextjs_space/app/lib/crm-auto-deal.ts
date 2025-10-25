/**
 * CRM Auto-Deal Creation
 * Centralized function to auto-create CRM deals from various lead sources
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateDealParams {
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  systemSizeKw: number;
  batterySizeKwh: number;
  totalValue: number;
  leadSource: string; // 'WEBSITE', 'FACEBOOK', 'GOOGLE', 'WHATSAPP', 'SMS', 'MANUAL', 'EMAIL'
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Calculate lead score based on lead attributes
 */
function calculateLeadScore(params: CreateDealParams): number {
  let score = 50; // Base score
  
  // System size scoring (bigger system = higher score)
  if (params.systemSizeKw >= 10) score += 20;
  else if (params.systemSizeKw >= 6.6) score += 15;
  else if (params.systemSizeKw >= 5) score += 10;
  
  // Battery scoring (battery = higher intent)
  if (params.batterySizeKwh > 0) score += 15;
  
  // Lead source scoring
  if (params.leadSource === 'WEBSITE') score += 10; // Organic = high intent
  else if (params.leadSource === 'FACEBOOK') score += 5;
  else if (params.leadSource === 'GOOGLE') score += 8;
  else if (params.leadSource === 'MANUAL') score += 15; // Sales qualified
  
  // Contact info completeness
  if (params.leadEmail && params.leadPhone) score += 5;
  
  return Math.min(score, 100); // Cap at 100
}

/**
 * Determine initial deal stage based on lead source
 */
function getInitialStage(leadSource: string): string {
  switch (leadSource) {
    case 'MANUAL':
      return 'QUALIFIED'; // Sales already qualified
    case 'WEBSITE':
      return 'NEW_LEAD'; // Needs qualification
    case 'FACEBOOK':
    case 'GOOGLE':
    case 'WHATSAPP':
    case 'SMS':
    case 'EMAIL':
      return 'NEW_LEAD'; // Needs qualification
    default:
      return 'NEW_LEAD';
  }
}

/**
 * Get default sales rep (owner) for the deal
 */
async function getDefaultOwner(): Promise<string> {
  // Try to find an active admin
  const admin = await prisma.admin.findFirst({
    where: {
      role: 'ADMIN',
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc', // Get the first admin
    },
  });
  
  if (admin) return admin.id;
  
  // Fallback: get any admin
  const anyAdmin = await prisma.admin.findFirst();
  if (anyAdmin) return anyAdmin.id;
  
  throw new Error('No admin users found. Please create an admin user first.');
}

/**
 * Auto-create CRM deal from lead
 * This is called whenever a new lead is created from any source
 */
export async function autoCreateDeal(params: CreateDealParams): Promise<any> {
  try {
    // Check if deal already exists for this lead
    const existingDeal = await prisma.deal.findUnique({
      where: { leadId: params.leadId },
    });
    
    if (existingDeal) {
      console.log(`Deal already exists for lead ${params.leadId}`);
      return existingDeal;
    }
    
    // Get default owner
    const ownerId = await getDefaultOwner();
    
    // Calculate lead score
    const leadScore = calculateLeadScore(params);
    
    // Determine initial stage
    const initialStage = getInitialStage(params.leadSource);
    
    // Determine initial probability based on stage
    const probability = initialStage === 'QUALIFIED' ? 50 : 25;
    
    // Create deal title
    const batteryText = params.batterySizeKwh > 0 
      ? ` + ${params.batterySizeKwh}kWh Battery` 
      : '';
    const title = `${params.leadName} - ${params.systemSizeKw}kW Solar${batteryText}`;
    
    // Create the deal
    const deal = await prisma.deal.create({
      data: {
        leadId: params.leadId,
        title,
        value: params.totalValue,
        stage: initialStage,
        status: 'OPEN',
        ownerId,
        leadScore,
        probability,
        scoreFactors: {
          systemSize: params.systemSizeKw,
          hasBattery: params.batterySizeKwh > 0,
          leadSource: params.leadSource,
          calculatedScore: leadScore,
        },
      },
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        dealId: deal.id,
        type: 'NOTE_ADDED',
        title: 'Deal Created',
        description: `Deal automatically created from ${params.leadSource} lead source`,
        performedBy: ownerId,
        completedAt: new Date(),
      },
    });
    
    console.log(`✅ Auto-created deal ${deal.id} for lead ${params.leadId} (${params.leadSource})`);
    
    return deal;
    
  } catch (error) {
    console.error('Error auto-creating deal:', error);
    throw error;
  }
}

/**
 * Update deal stage
 * This is called when lead progresses through the workflow
 */
export async function updateDealStage(
  leadId: string,
  newStage: string,
  performedBy?: string
): Promise<any> {
  try {
    const deal = await prisma.deal.findUnique({
      where: { leadId },
    });
    
    if (!deal) {
      console.log(`No deal found for lead ${leadId}`);
      return null;
    }
    
    // Update deal stage
    const updatedDeal = await prisma.deal.update({
      where: { id: deal.id },
      data: {
        stage: newStage,
        previousStage: deal.stage,
        stageChangedAt: new Date(),
      },
    });
    
    // Log activity
    if (performedBy) {
      await prisma.activity.create({
        data: {
          dealId: deal.id,
          type: 'STAGE_CHANGED',
          title: 'Stage Updated',
          description: `Deal moved from ${deal.stage} to ${newStage}`,
          performedBy,
          completedAt: new Date(),
        },
      });
    }
    
    console.log(`✅ Updated deal ${deal.id} stage: ${deal.stage} → ${newStage}`);
    
    return updatedDeal;
    
  } catch (error) {
    console.error('Error updating deal stage:', error);
    throw error;
  }
}
