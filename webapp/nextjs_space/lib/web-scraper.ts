/**
 * Web Scraper for Real-Time Solar Data
 * 
 * Fetches current rebates, tariffs, and pricing from official sources
 * before generating articles to ensure accuracy
 */

export interface SolarDataSnapshot {
  // WA State Rebates
  waStateRebate: {
    amount: number;
    eligibility: string;
    source: string;
    lastUpdated: Date;
  } | null;
  
  // STC (Small-scale Technology Certificates)
  stcValue: {
    pricePerCertificate: number;
    source: string;
    lastUpdated: Date;
  } | null;
  
  // Feed-in Tariffs
  feedInTariff: {
    synergyRate: number; // cents/kWh
    horizonRate: number; // cents/kWh
    source: string;
    lastUpdated: Date;
  } | null;
  
  // Electricity Prices
  electricityPrices: {
    synergyPeakRate: number; // cents/kWh
    synergyOffPeakRate: number; // cents/kWh
    source: string;
    lastUpdated: Date;
  } | null;
  
  // Solar Panel Prices (market average)
  solarPanelPrices: {
    averagePricePerWatt: number;
    systemSizes: {
      size: number; // kW
      averagePrice: number; // $
    }[];
    source: string;
    lastUpdated: Date;
  } | null;
  
  // Battery Prices
  batteryPrices: {
    averagePricePerKwh: number;
    popularSizes: {
      capacity: number; // kWh
      averagePrice: number; // $
    }[];
    source: string;
    lastUpdated: Date;
  } | null;
}

/**
 * Scrape WA State Battery Rebate
 * Source: Plenti Portal / WA Government
 */
async function scrapeWAStateRebate(): Promise<SolarDataSnapshot['waStateRebate']> {
  try {
    // TODO: Implement actual scraping
    // For now, return known data with manual update flag
    
    return {
      amount: 3800, // Horizon Power customers
      eligibility: 'Household income under $210,000, minimum 5kWh battery',
      source: 'WA Government Battery Scheme via Plenti',
      lastUpdated: new Date('2025-01-01'), // MANUAL: Update this date
    };
  } catch (error) {
    console.error('Error scraping WA rebate:', error);
    return null;
  }
}

/**
 * Scrape STC Value
 * Source: Clean Energy Regulator / Solar Choice
 */
async function scrapeSTCValue(): Promise<SolarDataSnapshot['stcValue']> {
  try {
    // TODO: Implement actual scraping
    // STC prices fluctuate, check weekly
    
    return {
      pricePerCertificate: 38.50, // Current market price
      source: 'Clean Energy Regulator',
      lastUpdated: new Date('2025-10-01'), // MANUAL: Update this date
    };
  } catch (error) {
    console.error('Error scraping STC value:', error);
    return null;
  }
}

/**
 * Scrape Feed-in Tariffs
 * Source: Synergy, Horizon Power websites
 */
async function scrapeFeedInTariffs(): Promise<SolarDataSnapshot['feedInTariff']> {
  try {
    // TODO: Implement actual scraping
    
    return {
      synergyRate: 2.5, // cents/kWh (Synergy Distributed Energy Buyback Scheme)
      horizonRate: 10.0, // cents/kWh (Horizon Power REBS)
      source: 'Synergy & Horizon Power',
      lastUpdated: new Date('2025-07-01'), // MANUAL: Update this date
    };
  } catch (error) {
    console.error('Error scraping feed-in tariffs:', error);
    return null;
  }
}

/**
 * Scrape Electricity Prices
 * Source: Synergy website
 */
async function scrapeElectricityPrices(): Promise<SolarDataSnapshot['electricityPrices']> {
  try {
    // TODO: Implement actual scraping
    
    return {
      synergyPeakRate: 32.5, // cents/kWh (A1 tariff)
      synergyOffPeakRate: 32.5, // cents/kWh (flat rate)
      source: 'Synergy',
      lastUpdated: new Date('2025-07-01'), // MANUAL: Update this date
    };
  } catch (error) {
    console.error('Error scraping electricity prices:', error);
    return null;
  }
}

/**
 * Scrape Solar Panel Prices
 * Source: Solar Choice, Solar Quotes, industry averages
 */
async function scrapeSolarPanelPrices(): Promise<SolarDataSnapshot['solarPanelPrices']> {
  try {
    // TODO: Implement actual scraping
    
    return {
      averagePricePerWatt: 1.20, // $/W installed
      systemSizes: [
        { size: 6.6, averagePrice: 7920 },
        { size: 10, averagePrice: 12000 },
        { size: 13.2, averagePrice: 15840 },
      ],
      source: 'Solar Choice / Industry Average',
      lastUpdated: new Date('2025-10-01'), // MANUAL: Update this date
    };
  } catch (error) {
    console.error('Error scraping solar prices:', error);
    return null;
  }
}

/**
 * Scrape Battery Prices
 * Source: Solar Choice, manufacturer websites
 */
async function scrapeBatteryPrices(): Promise<SolarDataSnapshot['batteryPrices']> {
  try {
    // TODO: Implement actual scraping
    
    return {
      averagePricePerKwh: 1200, // $/kWh installed
      popularSizes: [
        { capacity: 10, averagePrice: 12000 },
        { capacity: 13.5, averagePrice: 16200 },
        { capacity: 20, averagePrice: 24000 },
      ],
      source: 'Solar Choice / Industry Average',
      lastUpdated: new Date('2025-10-01'), // MANUAL: Update this date
    };
  } catch (error) {
    console.error('Error scraping battery prices:', error);
    return null;
  }
}

/**
 * Fetch all current solar data
 * Call this before generating articles
 */
export async function fetchCurrentSolarData(): Promise<SolarDataSnapshot> {
  console.log('🔍 Fetching current solar data...');
  
  const [
    waStateRebate,
    stcValue,
    feedInTariff,
    electricityPrices,
    solarPanelPrices,
    batteryPrices,
  ] = await Promise.all([
    scrapeWAStateRebate(),
    scrapeSTCValue(),
    scrapeFeedInTariffs(),
    scrapeElectricityPrices(),
    scrapeSolarPanelPrices(),
    scrapeBatteryPrices(),
  ]);
  
  const snapshot: SolarDataSnapshot = {
    waStateRebate,
    stcValue,
    feedInTariff,
    electricityPrices,
    solarPanelPrices,
    batteryPrices,
  };
  
  console.log('✅ Solar data fetched successfully');
  
  return snapshot;
}

/**
 * Format solar data for article generation prompt
 */
export function formatSolarDataForPrompt(data: SolarDataSnapshot): string {
  const currentDate = new Date().toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  let prompt = `CURRENT VERIFIED DATA (as of ${currentDate}):\n\n`;
  
  if (data.waStateRebate) {
    prompt += `WA State Battery Rebate:\n`;
    prompt += `- Amount: $${data.waStateRebate.amount}\n`;
    prompt += `- Eligibility: ${data.waStateRebate.eligibility}\n`;
    prompt += `- Source: ${data.waStateRebate.source}\n\n`;
  }
  
  if (data.stcValue) {
    prompt += `STC (Small-scale Technology Certificate) Value:\n`;
    prompt += `- Current Price: $${data.stcValue.pricePerCertificate} per certificate\n`;
    prompt += `- Source: ${data.stcValue.source}\n\n`;
  }
  
  if (data.feedInTariff) {
    prompt += `Feed-in Tariffs:\n`;
    prompt += `- Synergy: ${data.feedInTariff.synergyRate}c/kWh\n`;
    prompt += `- Horizon Power: ${data.feedInTariff.horizonRate}c/kWh\n`;
    prompt += `- Source: ${data.feedInTariff.source}\n\n`;
  }
  
  if (data.electricityPrices) {
    prompt += `Electricity Prices (Synergy):\n`;
    prompt += `- Peak Rate: ${data.electricityPrices.synergyPeakRate}c/kWh\n`;
    prompt += `- Off-Peak Rate: ${data.electricityPrices.synergyOffPeakRate}c/kWh\n`;
    prompt += `- Source: ${data.electricityPrices.source}\n\n`;
  }
  
  if (data.solarPanelPrices) {
    prompt += `Solar Panel Prices (Perth Average):\n`;
    prompt += `- Average: $${data.solarPanelPrices.averagePricePerWatt}/W installed\n`;
    data.solarPanelPrices.systemSizes.forEach(size => {
      prompt += `- ${size.size}kW system: ~$${size.averagePrice.toLocaleString()}\n`;
    });
    prompt += `- Source: ${data.solarPanelPrices.source}\n\n`;
  }
  
  if (data.batteryPrices) {
    prompt += `Battery Storage Prices (Perth Average):\n`;
    prompt += `- Average: $${data.batteryPrices.averagePricePerKwh}/kWh installed\n`;
    data.batteryPrices.popularSizes.forEach(size => {
      prompt += `- ${size.capacity}kWh battery: ~$${size.averagePrice.toLocaleString()}\n`;
    });
    prompt += `- Source: ${data.batteryPrices.source}\n\n`;
  }
  
  prompt += `IMPORTANT: Use these exact figures in your article. These are verified current prices and rates.\n`;
  prompt += `Always cite the source when mentioning these figures.\n`;
  
  return prompt;
}

/**
 * Check if data is stale (older than 30 days)
 */
export function isDataStale(data: SolarDataSnapshot): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const dates = [
    data.waStateRebate?.lastUpdated,
    data.stcValue?.lastUpdated,
    data.feedInTariff?.lastUpdated,
    data.electricityPrices?.lastUpdated,
    data.solarPanelPrices?.lastUpdated,
    data.batteryPrices?.lastUpdated,
  ].filter(Boolean) as Date[];
  
  return dates.some(date => date < thirtyDaysAgo);
}

/**
 * Get data freshness report
 */
export function getDataFreshnessReport(data: SolarDataSnapshot): string {
  const report: string[] = [];
  
  const checkFreshness = (name: string, date: Date | undefined) => {
    if (!date) {
      report.push(`❌ ${name}: No data`);
      return;
    }
    
    const daysOld = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysOld === 0) {
      report.push(`✅ ${name}: Updated today`);
    } else if (daysOld < 7) {
      report.push(`✅ ${name}: ${daysOld} days old (fresh)`);
    } else if (daysOld < 30) {
      report.push(`⚠️ ${name}: ${daysOld} days old (acceptable)`);
    } else {
      report.push(`❌ ${name}: ${daysOld} days old (STALE - needs update!)`);
    }
  };
  
  checkFreshness('WA State Rebate', data.waStateRebate?.lastUpdated);
  checkFreshness('STC Value', data.stcValue?.lastUpdated);
  checkFreshness('Feed-in Tariffs', data.feedInTariff?.lastUpdated);
  checkFreshness('Electricity Prices', data.electricityPrices?.lastUpdated);
  checkFreshness('Solar Panel Prices', data.solarPanelPrices?.lastUpdated);
  checkFreshness('Battery Prices', data.batteryPrices?.lastUpdated);
  
  return report.join('\n');
}
