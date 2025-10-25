import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Addon {
  id: string;
  addonId: string;
  name: string;
  description: string;
  cost: number;
  installationCost: number;
  benefits: string[];
  category: string;
  iconName: string;
  sortOrder: number;
}

export interface SelectedAddon {
  addonId: string;
  name: string;
  cost: number;
  installationCost: number;
  quantity: number;
}

export interface AddonCalculation {
  addons: SelectedAddon[];
  totalAddonCost: number;
  totalInstallationCost: number;
  totalAddonWithInstallation: number;
  updatedTotalCost: number;
  updatedFinalInvestment: number;
}

/**
 * Get all active addons from database
 */
export async function getActiveAddons(): Promise<Addon[]> {
  try {
    const addons = await prisma.addonPricing.findMany({
      where: { active: true },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
    });

    return addons.map(addon => ({
      id: addon.id,
      addonId: addon.addonId,
      name: addon.name,
      description: addon.description,
      cost: addon.cost,
      installationCost: addon.installationCost || 0,
      benefits: Array.isArray(addon.benefits) ? addon.benefits as string[] : [],
      category: addon.category,
      iconName: addon.iconName,
      sortOrder: addon.sortOrder,
    }));
  } catch (error) {
    console.error('Error fetching addons:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get addons by category
 */
export async function getAddonsByCategory(): Promise<Record<string, Addon[]>> {
  const addons = await getActiveAddons();
  
  const categorized: Record<string, Addon[]> = {};
  
  addons.forEach(addon => {
    if (!categorized[addon.category]) {
      categorized[addon.category] = [];
    }
    categorized[addon.category].push(addon);
  });
  
  return categorized;
}

/**
 * Calculate addon costs and update total
 */
export async function calculateAddonCosts(
  selectedAddonIds: string[],
  currentTotalCost: number,
  currentRebates: number
): Promise<AddonCalculation> {
  try {
    // Fetch selected addons
    const addons = await prisma.addonPricing.findMany({
      where: {
        addonId: { in: selectedAddonIds },
        active: true,
      },
    });

    // Count quantities (in case same addon selected multiple times)
    const addonCounts: Record<string, number> = {};
    selectedAddonIds.forEach(id => {
      addonCounts[id] = (addonCounts[id] || 0) + 1;
    });

    // Build selected addons list
    const selectedAddons: SelectedAddon[] = addons.map(addon => ({
      addonId: addon.addonId,
      name: addon.name,
      cost: addon.cost,
      installationCost: (addon as any).installationCost || 0,
      quantity: addonCounts[addon.addonId] || 1,
    }));

    // Calculate total addon cost (product cost only)
    const totalAddonCost = selectedAddons.reduce(
      (sum, addon) => sum + (addon.cost * addon.quantity),
      0
    );

    // Calculate total installation cost
    const totalInstallationCost = selectedAddons.reduce(
      (sum, addon) => sum + (addon.installationCost * addon.quantity),
      0
    );

    // Total addon cost including installation
    const totalAddonWithInstallation = totalAddonCost + totalInstallationCost;

    // Update totals
    const updatedTotalCost = currentTotalCost + totalAddonWithInstallation;
    const updatedFinalInvestment = updatedTotalCost - currentRebates;

    return {
      addons: selectedAddons,
      totalAddonCost,
      totalInstallationCost,
      totalAddonWithInstallation,
      updatedTotalCost,
      updatedFinalInvestment,
    };
  } catch (error) {
    console.error('Error calculating addon costs:', error);
    return {
      addons: [],
      totalAddonCost: 0,
      totalInstallationCost: 0,
      totalAddonWithInstallation: 0,
      updatedTotalCost: currentTotalCost,
      updatedFinalInvestment: currentTotalCost - currentRebates,
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Save selected addons to quote
 */
export async function saveAddonsToQuote(
  sessionId: string,
  selectedAddonIds: string[]
): Promise<boolean> {
  try {
    // Fetch addon details
    const addons = await prisma.addonPricing.findMany({
      where: {
        addonId: { in: selectedAddonIds },
        active: true,
      },
    });

    // Build addon data
    const addonData = addons.map(addon => ({
      addonId: addon.addonId,
      name: addon.name,
      cost: addon.cost,
    }));

    // Update quote
    await prisma.customerQuote.update({
      where: { sessionId },
      data: {
        selectedAddons: addonData,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Saved ${addonData.length} addons to quote ${sessionId}`);
    return true;
  } catch (error) {
    console.error('Error saving addons to quote:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get popular/recommended addons
 */
export async function getRecommendedAddons(
  systemSizeKw: number,
  hasBattery: boolean
): Promise<Addon[]> {
  try {
    const allAddons = await getActiveAddons();
    
    // Filter based on system characteristics
    const recommended = allAddons.filter(addon => {
      // Always recommend monitoring
      if (addon.category === 'monitoring') return true;
      
      // Recommend battery addons only if they have a battery
      if (addon.category === 'battery' && hasBattery) return true;
      
      // Recommend EV charger for larger systems
      if (addon.category === 'ev_charging' && systemSizeKw >= 6.6) return true;
      
      // Recommend surge protection for all
      if (addon.category === 'protection') return true;
      
      return false;
    });
    
    return recommended.slice(0, 4); // Top 4 recommendations
  } catch (error) {
    console.error('Error getting recommended addons:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}
