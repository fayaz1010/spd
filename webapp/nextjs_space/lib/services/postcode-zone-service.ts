import { PrismaClient } from '@prisma/client';

// Use a singleton pattern for Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

interface ZoneRatingResult {
  zone: number;
  zoneRating: number;
  state?: string;
  description?: string;
}

/**
 * Get STC zone rating for a given postcode
 * Based on Clean Energy Regulator official postcode zone ratings
 */
export async function getZoneRatingByPostcode(postcode: string | number): Promise<ZoneRatingResult | null> {
  try {
    // Convert postcode to number
    const postcodeNum = typeof postcode === 'string' ? parseInt(postcode, 10) : postcode;
    
    if (isNaN(postcodeNum)) {
      console.warn(`Invalid postcode: ${postcode}`);
      return null;
    }

    // Look up postcode in database
    const zoneRating = await prisma.postcodeZoneRating.findFirst({
      where: {
        AND: [
          { postcodeStart: { lte: postcodeNum } },
          { postcodeEnd: { gte: postcodeNum } },
        ],
      },
      select: {
        zone: true,
        zoneRating: true,
        state: true,
        description: true,
      },
    });

    if (!zoneRating) {
      console.warn(`No zone rating found for postcode: ${postcode}`);
      return getDefaultZoneRating(postcodeNum);
    }

    return {
      zone: zoneRating.zone,
      zoneRating: Number(zoneRating.zoneRating),
      state: zoneRating.state || undefined,
      description: zoneRating.description || undefined,
    };
  } catch (error) {
    console.error('Error looking up zone rating:', error);
    return getDefaultZoneRating(typeof postcode === 'string' ? parseInt(postcode, 10) : postcode);
  }
}

/**
 * Get default zone rating based on postcode range
 * Fallback if database lookup fails
 */
function getDefaultZoneRating(postcodeNum: number): ZoneRatingResult {
  // WA (6000-6999) - mostly Zone 2
  if (postcodeNum >= 6000 && postcodeNum <= 6799) {
    return { zone: 2, zoneRating: 1.536, state: 'WA', description: 'Western Australia (default)' };
  }
  if (postcodeNum >= 6800 && postcodeNum <= 6999) {
    return { zone: 1, zoneRating: 1.622, state: 'WA', description: 'North WA (default)' };
  }

  // QLD (4000-4999) - mostly Zone 2, north is Zone 1
  if (postcodeNum >= 4000 && postcodeNum <= 4399) {
    return { zone: 2, zoneRating: 1.536, state: 'QLD', description: 'Brisbane area (default)' };
  }
  if (postcodeNum >= 4400 && postcodeNum <= 4999) {
    return { zone: 1, zoneRating: 1.622, state: 'QLD', description: 'North Queensland (default)' };
  }

  // NSW (2000-2999) - mostly Zone 3
  if (postcodeNum >= 2000 && postcodeNum <= 2999) {
    return { zone: 3, zoneRating: 1.382, state: 'NSW', description: 'New South Wales (default)' };
  }

  // VIC (3000-3999) - mostly Zone 3
  if (postcodeNum >= 3000 && postcodeNum <= 3999) {
    return { zone: 3, zoneRating: 1.382, state: 'VIC', description: 'Victoria (default)' };
  }

  // SA (5000-5999) - mostly Zone 3
  if (postcodeNum >= 5000 && postcodeNum <= 5999) {
    return { zone: 3, zoneRating: 1.382, state: 'SA', description: 'South Australia (default)' };
  }

  // TAS (7000-7999) - Zone 4
  if (postcodeNum >= 7000 && postcodeNum <= 7999) {
    return { zone: 4, zoneRating: 1.185, state: 'TAS', description: 'Tasmania (default)' };
  }

  // NT (800-999) - Zone 1
  if (postcodeNum >= 800 && postcodeNum <= 999) {
    return { zone: 1, zoneRating: 1.622, state: 'NT', description: 'Northern Territory (default)' };
  }

  // ACT (2600-2629) - Zone 3
  if (postcodeNum >= 2600 && postcodeNum <= 2629) {
    return { zone: 3, zoneRating: 1.382, state: 'ACT', description: 'Australian Capital Territory (default)' };
  }

  // Default to Zone 3 (most common)
  console.warn(`Postcode ${postcodeNum} not in known range, defaulting to Zone 3`);
  return { zone: 3, zoneRating: 1.382, description: 'Unknown postcode (default Zone 3)' };
}

/**
 * Get all zone ratings (for admin/reference)
 */
export async function getAllZoneRatings() {
  try {
    return await prisma.postcodeZoneRating.findMany({
      orderBy: [
        { state: 'asc' },
        { postcodeStart: 'asc' },
      ],
    });
  } catch (error) {
    console.error('Error fetching zone ratings:', error);
    return [];
  }
}

/**
 * Seed postcode zone ratings into database
 * Run this once to populate the table
 */
export async function seedPostcodeZoneRatings() {
  const zoneRatings = [
    // Western Australia
    { id: 'wa-perth-metro', postcodeStart: 6000, postcodeEnd: 6199, zone: 2, zoneRating: 1.536, state: 'WA', description: 'Perth Metro' },
    { id: 'wa-perth-outer', postcodeStart: 6200, postcodeEnd: 6299, zone: 2, zoneRating: 1.536, state: 'WA', description: 'Perth Outer Suburbs' },
    { id: 'wa-southwest', postcodeStart: 6300, postcodeEnd: 6399, zone: 2, zoneRating: 1.536, state: 'WA', description: 'Southwest WA' },
    { id: 'wa-south', postcodeStart: 6400, postcodeEnd: 6599, zone: 2, zoneRating: 1.536, state: 'WA', description: 'South WA' },
    { id: 'wa-central', postcodeStart: 6600, postcodeEnd: 6799, zone: 2, zoneRating: 1.536, state: 'WA', description: 'Central WA' },
    { id: 'wa-north', postcodeStart: 6800, postcodeEnd: 6999, zone: 1, zoneRating: 1.622, state: 'WA', description: 'North WA - Higher solar zone' },

    // New South Wales
    { id: 'nsw-sydney', postcodeStart: 2000, postcodeEnd: 2249, zone: 3, zoneRating: 1.382, state: 'NSW', description: 'Sydney Metro' },
    { id: 'nsw-central-coast', postcodeStart: 2250, postcodeEnd: 2299, zone: 3, zoneRating: 1.382, state: 'NSW', description: 'Central Coast' },
    { id: 'nsw-newcastle', postcodeStart: 2300, postcodeEnd: 2349, zone: 3, zoneRating: 1.382, state: 'NSW', description: 'Newcastle' },
    { id: 'nsw-north-coast', postcodeStart: 2350, postcodeEnd: 2499, zone: 2, zoneRating: 1.536, state: 'NSW', description: 'North Coast - Higher solar' },
    { id: 'nsw-south', postcodeStart: 2500, postcodeEnd: 2599, zone: 3, zoneRating: 1.382, state: 'NSW', description: 'South NSW' },
    { id: 'nsw-west', postcodeStart: 2600, postcodeEnd: 2899, zone: 3, zoneRating: 1.382, state: 'NSW', description: 'Western NSW' },
    { id: 'nsw-far-west', postcodeStart: 2900, postcodeEnd: 2999, zone: 2, zoneRating: 1.536, state: 'NSW', description: 'Far West - Higher solar' },

    // Victoria
    { id: 'vic-melbourne', postcodeStart: 3000, postcodeEnd: 3199, zone: 3, zoneRating: 1.382, state: 'VIC', description: 'Melbourne Metro' },
    { id: 'vic-geelong', postcodeStart: 3200, postcodeEnd: 3299, zone: 3, zoneRating: 1.382, state: 'VIC', description: 'Geelong' },
    { id: 'vic-west', postcodeStart: 3300, postcodeEnd: 3499, zone: 3, zoneRating: 1.382, state: 'VIC', description: 'Western Victoria' },
    { id: 'vic-north', postcodeStart: 3500, postcodeEnd: 3699, zone: 3, zoneRating: 1.382, state: 'VIC', description: 'Northern Victoria' },
    { id: 'vic-east', postcodeStart: 3700, postcodeEnd: 3899, zone: 3, zoneRating: 1.382, state: 'VIC', description: 'Eastern Victoria' },
    { id: 'vic-gippsland', postcodeStart: 3900, postcodeEnd: 3999, zone: 4, zoneRating: 1.185, state: 'VIC', description: 'Gippsland - Lower solar' },

    // Queensland
    { id: 'qld-brisbane', postcodeStart: 4000, postcodeEnd: 4199, zone: 2, zoneRating: 1.536, state: 'QLD', description: 'Brisbane Metro' },
    { id: 'qld-gold-coast', postcodeStart: 4200, postcodeEnd: 4299, zone: 2, zoneRating: 1.536, state: 'QLD', description: 'Gold Coast' },
    { id: 'qld-sunshine-coast', postcodeStart: 4300, postcodeEnd: 4399, zone: 2, zoneRating: 1.536, state: 'QLD', description: 'Sunshine Coast' },
    { id: 'qld-north', postcodeStart: 4400, postcodeEnd: 4699, zone: 1, zoneRating: 1.622, state: 'QLD', description: 'North Queensland - Highest solar' },
    { id: 'qld-central', postcodeStart: 4700, postcodeEnd: 4899, zone: 1, zoneRating: 1.622, state: 'QLD', description: 'Central Queensland - Highest solar' },
    { id: 'qld-far-north', postcodeStart: 4900, postcodeEnd: 4999, zone: 1, zoneRating: 1.622, state: 'QLD', description: 'Far North Queensland - Highest solar' },

    // South Australia
    { id: 'sa-adelaide', postcodeStart: 5000, postcodeEnd: 5199, zone: 3, zoneRating: 1.382, state: 'SA', description: 'Adelaide Metro' },
    { id: 'sa-south', postcodeStart: 5200, postcodeEnd: 5499, zone: 3, zoneRating: 1.382, state: 'SA', description: 'South SA' },
    { id: 'sa-north', postcodeStart: 5500, postcodeEnd: 5799, zone: 2, zoneRating: 1.536, state: 'SA', description: 'North SA - Higher solar' },
    { id: 'sa-outback', postcodeStart: 5800, postcodeEnd: 5999, zone: 1, zoneRating: 1.622, state: 'SA', description: 'SA Outback - Highest solar' },

    // Tasmania
    { id: 'tas-hobart', postcodeStart: 7000, postcodeEnd: 7199, zone: 4, zoneRating: 1.185, state: 'TAS', description: 'Hobart' },
    { id: 'tas-north', postcodeStart: 7200, postcodeEnd: 7299, zone: 4, zoneRating: 1.185, state: 'TAS', description: 'Northern Tasmania' },
    { id: 'tas-west', postcodeStart: 7300, postcodeEnd: 7499, zone: 4, zoneRating: 1.185, state: 'TAS', description: 'Western Tasmania' },

    // Northern Territory
    { id: 'nt-darwin', postcodeStart: 800, postcodeEnd: 849, zone: 1, zoneRating: 1.622, state: 'NT', description: 'Darwin - Highest solar' },
    { id: 'nt-central', postcodeStart: 850, postcodeEnd: 899, zone: 1, zoneRating: 1.622, state: 'NT', description: 'Central NT - Highest solar' },
    { id: 'nt-south', postcodeStart: 900, postcodeEnd: 999, zone: 1, zoneRating: 1.622, state: 'NT', description: 'Southern NT - Highest solar' },

    // Australian Capital Territory
    { id: 'act-canberra', postcodeStart: 2600, postcodeEnd: 2619, zone: 3, zoneRating: 1.382, state: 'ACT', description: 'Canberra' },
    { id: 'act-outer', postcodeStart: 2620, postcodeEnd: 2629, zone: 3, zoneRating: 1.382, state: 'ACT', description: 'ACT Outer' },
  ];

  try {
    console.log('🌏 Seeding postcode zone ratings...');
    
    for (const rating of zoneRatings) {
      await prisma.postcodeZoneRating.upsert({
        where: { id: rating.id },
        update: rating,
        create: rating,
      });
    }

    console.log(`✅ Seeded ${zoneRatings.length} postcode zone ratings`);
    return { success: true, count: zoneRatings.length };
  } catch (error) {
    console.error('❌ Error seeding postcode zone ratings:', error);
    throw error;
  }
}
