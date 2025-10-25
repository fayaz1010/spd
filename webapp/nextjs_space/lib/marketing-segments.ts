
/**
 * Marketing Segmentation Logic
 * 
 * Automatically categorizes customers based on their profile data
 * for targeted marketing campaigns and sales follow-ups
 */

export type MarketingSegment = 
  | 'standard'
  | 'pool_owner'
  | 'ev_owner'
  | 'high_consumption'
  | 'business'
  | 'eco_enthusiast';

export interface ProfileData {
  quarterlyBill: number;
  hasEv: boolean;
  planningEv: boolean;
  evCount: number;
  poolType?: string;  // 'none' | 'unheated' | 'heated'
  acTier?: string;    // 'minimal' | 'moderate' | 'heavy'
  homeOfficeCount?: number;
  dailyConsumption?: number;
  batterySizeKwh: number;
  propertyType: string;
}

/**
 * Determine the best marketing segment for a customer
 * based on their profile data
 */
export function determineMarketingSegment(profile: ProfileData): MarketingSegment {
  const {
    quarterlyBill,
    hasEv,
    planningEv,
    evCount,
    poolType,
    acTier,
    homeOfficeCount,
    dailyConsumption,
    batterySizeKwh,
    propertyType,
  } = profile;

  // Calculate annual bill
  const annualBill = quarterlyBill * 4;

  // Business segment (commercial properties or multiple home offices)
  if (propertyType === 'commercial' || (homeOfficeCount && homeOfficeCount >= 2)) {
    return 'business';
  }

  // High consumption segment (annual bill > $4,000 or daily consumption > 40 kWh)
  if (annualBill > 4000 || (dailyConsumption && dailyConsumption > 40)) {
    return 'high_consumption';
  }

  // EV owner segment (priority for EV owners with multiple vehicles)
  if (hasEv && evCount >= 2) {
    return 'ev_owner';
  }

  // Pool owner segment (especially heated pools)
  if (poolType === 'heated' || poolType === 'unheated') {
    return 'pool_owner';
  }

  // Eco enthusiast segment (planning EV + large battery system)
  if (planningEv && batterySizeKwh >= 25) {
    return 'eco_enthusiast';
  }

  // EV owner segment (single EV)
  if (hasEv || planningEv) {
    return 'ev_owner';
  }

  // Default to standard segment
  return 'standard';
}

/**
 * Get marketing copy/messaging tailored to each segment
 */
export function getSegmentMessaging(segment: MarketingSegment) {
  const messaging = {
    standard: {
      headline: 'Save on Your Energy Bills',
      focus: 'Cost savings, reliability, warranty',
      emailSubject: '70-95% Off Your Electricity Bills with Solar',
      followUpTone: 'Focus on ROI and savings',
    },
    pool_owner: {
      headline: 'Power Your Pool for Free',
      focus: 'Pool pump optimization, summer savings, heat pumps',
      emailSubject: 'Solar-Powered Pool Heating & Pumping',
      followUpTone: 'Emphasize pool energy costs and savings',
    },
    ev_owner: {
      headline: 'Charge Your EV with Free Solar Power',
      focus: 'EV charging, battery storage, night-time power',
      emailSubject: 'Save $2,500/Year on EV Charging with Solar',
      followUpTone: 'Focus on EV charging economics and battery storage',
    },
    high_consumption: {
      headline: 'Massive Energy Bills? We Can Help',
      focus: 'Large systems, maximum savings, premium equipment',
      emailSubject: 'Cut Your $X,XXX Power Bills by 70-95%',
      followUpTone: 'Emphasize large savings potential and system size',
    },
    business: {
      headline: 'Solar for Your Business',
      focus: 'Tax benefits, depreciation, commercial warranties',
      emailSubject: 'Business Solar: Tax Deductions + Energy Savings',
      followUpTone: 'Professional tone, focus on business benefits and ROI',
    },
    eco_enthusiast: {
      headline: 'Go Fully Off-Grid',
      focus: 'Sustainability, energy independence, latest tech',
      emailSubject: 'Achieve Energy Independence with Solar + Battery',
      followUpTone: 'Focus on environmental benefits and cutting-edge technology',
    },
  };

  return messaging[segment];
}

/**
 * Get recommended follow-up timing based on segment
 */
export function getFollowUpTiming(segment: MarketingSegment): {
  firstFollowUp: string;
  secondFollowUp: string;
  priority: 'high' | 'medium' | 'low';
} {
  // High-value segments get faster follow-ups
  if (['high_consumption', 'business', 'ev_owner'].includes(segment)) {
    return {
      firstFollowUp: '4 hours',
      secondFollowUp: '24 hours',
      priority: 'high',
    };
  }

  // Medium priority
  if (['pool_owner', 'eco_enthusiast'].includes(segment)) {
    return {
      firstFollowUp: '8 hours',
      secondFollowUp: '48 hours',
      priority: 'medium',
    };
  }

  // Standard timing
  return {
    firstFollowUp: '24 hours',
    secondFollowUp: '3 days',
    priority: 'medium',
  };
}
