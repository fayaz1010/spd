import { PrismaClient } from '@prisma/client';

// Use singleton pattern for Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface TeamInstallationParams {
  systemSizeKw: number;
  batterySizeKwh?: number;
  teamId?: string; // Optional: specify which team to use
}

export interface TeamMemberCost {
  memberId: string;
  name: string;
  role: string;
  hours: number;
  hourlyRate: number;
  costMultiplier: number;
  trueCostPerHour: number;
  totalCost: number;
}

export interface TeamInstallationResult {
  // Solar Installation
  solarTeamId: string;
  solarTeamName: string;
  solarHours: number;
  solarTeamMembers: TeamMemberCost[];
  solarTotalCost: number;
  
  // Battery Installation (if applicable)
  batteryTeamId?: string;
  batteryTeamName?: string;
  batteryHours?: number;
  batteryTeamMembers?: TeamMemberCost[];
  batteryTotalCost?: number;
  
  // Totals
  totalHours: number;
  totalInstallationCost: number;
  
  // Breakdown for display
  breakdown: {
    method: 'team-based';
    solarInstall: number;
    batteryInstall: number;
    totalLabor: number;
  };
}

/**
 * Calculate installation cost based on in-house team rates and time standards
 * This gives TRUE COST for internal teams (not subcontractor rates)
 */
export async function calculateTeamBasedInstallation(
  params: TeamInstallationParams
): Promise<TeamInstallationResult> {
  
  // ============================================
  // 1. GET TIME STANDARDS
  // ============================================
  
  // Get solar installation time standard
  const solarTimeStandard = await prisma.installationTimeStandard.findFirst({
    where: {
      category: 'SOLAR',
      systemSizeMin: { lte: params.systemSizeKw },
      systemSizeMax: { gte: params.systemSizeKw },
    },
  });
  
  // Fallback: 1.5 hours per kW if no standard found
  const hoursPerKw = solarTimeStandard?.hoursPerKw || 1.5;
  const solarHours = params.systemSizeKw * hoursPerKw;
  
  // Get battery installation time standard (if battery included)
  let batteryHours = 0;
  let batteryTimeStandard = null;
  
  if (params.batterySizeKwh && params.batterySizeKwh > 0) {
    batteryTimeStandard = await prisma.installationTimeStandard.findFirst({
      where: {
        category: 'BATTERY',
        capacityMin: { lte: params.batterySizeKwh },
        capacityMax: { gte: params.batterySizeKwh },
      },
    });
    
    // Fallback: 7 hours base for battery if no standard found
    batteryHours = batteryTimeStandard?.baseHours || 7;
  }
  
  // ============================================
  // 2. GET TEAM(S)
  // ============================================
  
  // Get solar installation team
  const solarTeam = await prisma.team.findFirst({
    where: {
      id: params.teamId || undefined, // Use specified team or find first active
      isActive: true,
    },
    include: {
      members: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          role: true,
          hourlyRate: true,
          costMultiplier: true,
          trueCostPerHour: true,
        },
      },
    },
  });
  
  if (!solarTeam) {
    throw new Error('No active installation team found');
  }
  
  // Get battery team (can be same as solar team or different)
  let batteryTeam = null;
  if (params.batterySizeKwh && params.batterySizeKwh > 0) {
    batteryTeam = await prisma.team.findFirst({
      where: {
        isActive: true,
      },
      include: {
        members: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            role: true,
            hourlyRate: true,
            costMultiplier: true,
            trueCostPerHour: true,
          },
        },
      },
    });
  }
  
  // ============================================
  // 3. CALCULATE COSTS
  // ============================================
  
  // Calculate solar team costs
  const solarTeamMembers: TeamMemberCost[] = solarTeam.members.map(member => {
    const trueCost = member.trueCostPerHour || 
                     ((member.hourlyRate || 0) * (member.costMultiplier || 1.45));
    const totalCost = solarHours * trueCost;
    
    return {
      memberId: member.id,
      name: member.name,
      role: member.role,
      hours: solarHours,
      hourlyRate: member.hourlyRate || 0,
      costMultiplier: member.costMultiplier || 1.45,
      trueCostPerHour: trueCost,
      totalCost,
    };
  });
  
  const solarTotalCost = solarTeamMembers.reduce((sum, m) => sum + m.totalCost, 0);
  
  // Calculate battery team costs (if applicable)
  let batteryTeamMembers: TeamMemberCost[] = [];
  let batteryTotalCost = 0;
  
  if (batteryTeam && batteryHours > 0) {
    batteryTeamMembers = batteryTeam.members.map(member => {
      const trueCost = member.trueCostPerHour || 
                       ((member.hourlyRate || 0) * (member.costMultiplier || 1.45));
      const totalCost = batteryHours * trueCost;
      
      return {
        memberId: member.id,
        name: member.name,
        role: member.role,
        hours: batteryHours,
        hourlyRate: member.hourlyRate || 0,
        costMultiplier: member.costMultiplier || 1.45,
        trueCostPerHour: trueCost,
        totalCost,
      };
    });
    
    batteryTotalCost = batteryTeamMembers.reduce((sum, m) => sum + m.totalCost, 0);
  }
  
  // ============================================
  // 4. BUILD RESULT
  // ============================================
  
  const totalHours = solarHours + batteryHours;
  const totalInstallationCost = Math.round(solarTotalCost + batteryTotalCost);
  
  return {
    solarTeamId: solarTeam.id,
    solarTeamName: solarTeam.name,
    solarHours: Math.round(solarHours * 10) / 10,
    solarTeamMembers,
    solarTotalCost: Math.round(solarTotalCost),
    
    batteryTeamId: batteryTeam?.id,
    batteryTeamName: batteryTeam?.name,
    batteryHours: batteryHours > 0 ? Math.round(batteryHours * 10) / 10 : undefined,
    batteryTeamMembers: batteryTeamMembers.length > 0 ? batteryTeamMembers : undefined,
    batteryTotalCost: batteryTotalCost > 0 ? Math.round(batteryTotalCost) : undefined,
    
    totalHours: Math.round(totalHours * 10) / 10,
    totalInstallationCost,
    
    breakdown: {
      method: 'team-based',
      solarInstall: Math.round(solarTotalCost),
      batteryInstall: Math.round(batteryTotalCost),
      totalLabor: totalInstallationCost,
    },
  };
}

/**
 * Get all active teams
 */
export async function getActiveTeams() {
  return await prisma.team.findMany({
    where: { isActive: true },
    include: {
      members: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          role: true,
          hourlyRate: true,
          costMultiplier: true,
          trueCostPerHour: true,
        },
      },
    },
  });
}

/**
 * Get installation time standards
 */
export async function getInstallationTimeStandards() {
  return await prisma.installationTimeStandard.findMany({
    orderBy: [
      { category: 'asc' },
      { systemSizeMin: 'asc' },
    ],
  });
}
