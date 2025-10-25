/**
 * Performance & Incentive Calculation Functions
 * 
 * These functions calculate employment costs, performance metrics,
 * and bonus payments for the solar installation team.
 */

// ========================================
// EMPLOYMENT COST CALCULATIONS
// ========================================

export interface EmploymentCostBreakdown {
  baseWage: number;
  superannuation: number;
  workersComp: number;
  annualLeave: number;
  sickLeave: number;
  publicHolidays: number;
  longServiceLeave: number;
  toolAllowance: number;
  training: number;
  overhead: number;
  totalCost: number;
  costMultiplier: number;
}

/**
 * Calculate true employment cost with detailed breakdown
 */
export function calculateTrueEmploymentCost(
  hourlyRate: number,
  options: {
    superRate?: number;
    workersCompRate?: number;
    annualLeaveRate?: number;
    sickLeaveRate?: number;
    publicHolidayRate?: number;
    longServiceRate?: number;
    toolAllowanceHourly?: number;
    trainingCostHourly?: number;
    overheadRate?: number;
  } = {}
): EmploymentCostBreakdown {
  // Default rates (Australian standards 2025)
  const superRate = options.superRate ?? 11.5;
  const workersCompRate = options.workersCompRate ?? 6.5;
  const annualLeaveRate = options.annualLeaveRate ?? 10.5;
  const sickLeaveRate = options.sickLeaveRate ?? 5.1;
  const publicHolidayRate = options.publicHolidayRate ?? 4.2;
  const longServiceRate = options.longServiceRate ?? 1.7;
  const toolAllowanceHourly = options.toolAllowanceHourly ?? 2.5;
  const trainingCostHourly = options.trainingCostHourly ?? 0.5;
  const overheadRate = options.overheadRate ?? 1.0;

  // Calculate each component
  const baseWage = hourlyRate;
  const superannuation = hourlyRate * (superRate / 100);
  const workersComp = hourlyRate * (workersCompRate / 100);
  const annualLeave = hourlyRate * (annualLeaveRate / 100);
  const sickLeave = hourlyRate * (sickLeaveRate / 100);
  const publicHolidays = hourlyRate * (publicHolidayRate / 100);
  const longServiceLeave = hourlyRate * (longServiceRate / 100);
  const toolAllowance = toolAllowanceHourly;
  const training = trainingCostHourly;
  const overhead = hourlyRate * (overheadRate / 100);

  const totalCost = 
    baseWage +
    superannuation +
    workersComp +
    annualLeave +
    sickLeave +
    publicHolidays +
    longServiceLeave +
    toolAllowance +
    training +
    overhead;

  const costMultiplier = totalCost / baseWage;

  return {
    baseWage,
    superannuation,
    workersComp,
    annualLeave,
    sickLeave,
    publicHolidays,
    longServiceLeave,
    toolAllowance,
    training,
    overhead,
    totalCost,
    costMultiplier,
  };
}

/**
 * Quick calculation using multiplier (default 1.45)
 */
export function calculateTrueCost(hourlyRate: number, multiplier: number = 1.45): number {
  return hourlyRate * multiplier;
}

/**
 * Calculate team cost for a job
 */
export function calculateTeamCost(
  teamMembers: Array<{ hourlyRate: number; costMultiplier?: number }>,
  hours: number
): {
  baseCost: number;
  trueCost: number;
  breakdown: Array<{ baseWage: number; trueCost: number }>;
} {
  let baseCost = 0;
  let trueCost = 0;
  const breakdown = [];

  for (const member of teamMembers) {
    const memberBaseCost = member.hourlyRate * hours;
    const memberTrueCost = member.hourlyRate * (member.costMultiplier ?? 1.45) * hours;
    
    baseCost += memberBaseCost;
    trueCost += memberTrueCost;
    
    breakdown.push({
      baseWage: memberBaseCost,
      trueCost: memberTrueCost,
    });
  }

  return { baseCost, trueCost, breakdown };
}

// ========================================
// PERFORMANCE CALCULATIONS
// ========================================

export interface JobPerformance {
  // Time metrics
  standardHours: number;
  actualHours: number;
  timeSaved: number;
  actualHoursPerKw: number;
  speedEfficiency: number;
  performanceRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  
  // Cost metrics
  teamBaseCost: number;
  teamTrueCost: number;
  costSaved: number;
  
  // Bonus calculation
  bonusEligible: boolean;
  bonusPool: number;
  teamBonus: number;
  companyProfit: number;
}

/**
 * Calculate job performance metrics and bonus
 */
export function calculateJobPerformance(params: {
  systemSizeKw: number;
  actualHours: number;
  standardHoursPerKw: number;
  teamMembers: Array<{ 
    hourlyRate: number; 
    costMultiplier?: number;
    role: string;
  }>;
  qualityScore: number;
}): JobPerformance {
  const { systemSizeKw, actualHours, standardHoursPerKw, teamMembers, qualityScore } = params;
  
  // Calculate standard time
  const standardHours = systemSizeKw * standardHoursPerKw;
  const timeSaved = standardHours - actualHours;
  const actualHoursPerKw = actualHours / systemSizeKw;
  
  // Calculate speed efficiency
  const speedEfficiency = (standardHours / actualHours) * 100;
  
  // Determine performance rating
  let performanceRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  if (speedEfficiency >= 120) performanceRating = 'EXCELLENT';  // 20%+ faster
  else if (speedEfficiency >= 105) performanceRating = 'GOOD';  // 5-20% faster
  else if (speedEfficiency >= 95) performanceRating = 'AVERAGE'; // Within 5%
  else performanceRating = 'POOR';  // Slower than standard
  
  // Calculate team costs
  const teamBaseCost = teamMembers.reduce((sum, m) => sum + (m.hourlyRate * actualHours), 0);
  const teamTrueCost = teamMembers.reduce((sum, m) => 
    sum + (m.hourlyRate * (m.costMultiplier ?? 1.45) * actualHours), 0
  );
  
  // Calculate cost saved (based on true cost)
  const standardTrueCost = teamMembers.reduce((sum, m) => 
    sum + (m.hourlyRate * (m.costMultiplier ?? 1.45) * standardHours), 0
  );
  const costSaved = standardTrueCost - teamTrueCost;
  
  // Bonus eligibility: must be faster AND quality must be good (80%+)
  const bonusEligible = timeSaved > 0 && qualityScore >= 80;
  
  // Calculate bonus pool (50/50 split)
  const bonusPool = bonusEligible && costSaved > 0 ? costSaved : 0;
  const teamBonus = bonusPool * 0.5;
  const companyProfit = bonusPool * 0.5;
  
  return {
    standardHours,
    actualHours,
    timeSaved,
    actualHoursPerKw,
    speedEfficiency,
    performanceRating,
    teamBaseCost,
    teamTrueCost,
    costSaved,
    bonusEligible,
    bonusPool,
    teamBonus,
    companyProfit,
  };
}

/**
 * Split team bonus among members based on role
 */
export function splitTeamBonus(
  teamBonus: number,
  teamMembers: Array<{ role: string; id: string; name: string }>
): Array<{ staffId: string; name: string; role: string; bonus: number; percentage: number }> {
  // Default split percentages
  const rolePercentages: Record<string, number> = {
    LEAD: 0.40,        // 40%
    INSTALLER: 0.35,   // 35%
    ASSISTANT: 0.25,   // 25%
    ELECTRICIAN: 0.40, // Same as lead
    SUPERVISOR: 0.40,  // Same as lead
  };
  
  // Calculate total percentage (in case team composition is different)
  const totalPercentage = teamMembers.reduce((sum, m) => {
    const role = m.role.toUpperCase();
    return sum + (rolePercentages[role] ?? 0.33); // Default to equal split if role unknown
  }, 0);
  
  // Split bonus
  return teamMembers.map(member => {
    const role = member.role.toUpperCase();
    const percentage = (rolePercentages[role] ?? 0.33) / totalPercentage;
    const bonus = teamBonus * percentage;
    
    return {
      staffId: member.id,
      name: member.name,
      role: member.role,
      bonus,
      percentage,
    };
  });
}

// ========================================
// PERFORMANCE METRICS AGGREGATION
// ========================================

export interface MonthlyPerformance {
  jobsCompleted: number;
  totalHours: number;
  totalKw: number;
  avgSystemSize: number;
  avgHoursPerKw: number;
  speedEfficiency: number;
  timeSaved: number;
  qualityScore: number;
  callbackRate: number;
  bonusEarned: number;
  savingsGenerated: number;
}

/**
 * Aggregate performance metrics for a month
 */
export function aggregateMonthlyPerformance(
  jobs: Array<{
    systemSize: number;
    actualHours: number;
    standardHours: number;
    qualityScore: number;
    callbackRequired: boolean;
    bonusEarned: number;
    costSaved: number;
  }>
): MonthlyPerformance {
  const jobsCompleted = jobs.length;
  
  if (jobsCompleted === 0) {
    return {
      jobsCompleted: 0,
      totalHours: 0,
      totalKw: 0,
      avgSystemSize: 0,
      avgHoursPerKw: 0,
      speedEfficiency: 0,
      timeSaved: 0,
      qualityScore: 0,
      callbackRate: 0,
      bonusEarned: 0,
      savingsGenerated: 0,
    };
  }
  
  const totalHours = jobs.reduce((sum, j) => sum + j.actualHours, 0);
  const totalKw = jobs.reduce((sum, j) => sum + j.systemSize, 0);
  const avgSystemSize = totalKw / jobsCompleted;
  const avgHoursPerKw = totalHours / totalKw;
  
  const totalStandardHours = jobs.reduce((sum, j) => sum + j.standardHours, 0);
  const speedEfficiency = (totalStandardHours / totalHours) * 100;
  const timeSaved = totalStandardHours - totalHours;
  
  const avgQualityScore = jobs.reduce((sum, j) => sum + (j.qualityScore || 0), 0) / jobsCompleted;
  const callbackCount = jobs.filter(j => j.callbackRequired).length;
  const callbackRate = (callbackCount / jobsCompleted) * 100;
  
  const bonusEarned = jobs.reduce((sum, j) => sum + (j.bonusEarned || 0), 0);
  const savingsGenerated = jobs.reduce((sum, j) => sum + (j.costSaved || 0), 0);
  
  return {
    jobsCompleted,
    totalHours,
    totalKw,
    avgSystemSize,
    avgHoursPerKw,
    speedEfficiency,
    timeSaved,
    qualityScore: avgQualityScore,
    callbackRate,
    bonusEarned,
    savingsGenerated,
  };
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format hours
 */
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} hrs`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get performance rating color
 */
export function getPerformanceColor(rating: string): string {
  switch (rating) {
    case 'EXCELLENT': return 'text-green-600 bg-green-50';
    case 'GOOD': return 'text-blue-600 bg-blue-50';
    case 'AVERAGE': return 'text-yellow-600 bg-yellow-50';
    case 'POOR': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}
