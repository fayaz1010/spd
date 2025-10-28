/**
 * Calculator Package Filtering Service
 * 
 * Smart filtering to show only relevant packages based on customer profile
 * - Limit to 3 main packages to avoid overwhelming customers
 * - Show EV packages only when EV charging detected
 * - Show standard packages for non-EV households
 * - Always show addons as optional upsells
 */

interface CustomerProfile {
  dailyConsumption: number; // kWh per day
  hasEV: boolean;
  evChargingKwh?: number;
  planningEV?: boolean;
}

interface PackageTemplate {
  id: string;
  name: string;
  displayName: string;
  displayCondition?: string | null;
  minDailyUsage?: number | null;
  maxDailyUsage?: number | null;
  requiresEV: boolean;
  sortOrder: number;
  isActive: boolean;
  [key: string]: any;
}

/**
 * Filter packages based on customer profile
 * Returns max 3 main packages + addons
 */
export function filterPackagesForCustomer(
  allPackages: PackageTemplate[],
  customerProfile: CustomerProfile
): {
  mainPackages: PackageTemplate[];
  addons: PackageTemplate[];
} {
  const { dailyConsumption, hasEV, evChargingKwh = 0, planningEV = false } = customerProfile;

  // Determine if customer has EV charging needs
  const hasEVCharging = hasEV || planningEV || evChargingKwh > 0 || dailyConsumption > 30;

  console.log('🔍 Filtering packages for customer:', {
    dailyConsumption,
    hasEV,
    evChargingKwh,
    hasEVCharging,
  });

  // Filter active packages only
  const activePackages = allPackages.filter(pkg => pkg.isActive);

  // Separate main packages from addons
  const mainPackagesList = activePackages.filter(
    pkg => pkg.displayCondition !== 'addon'
  );
  
  const addonsList = activePackages.filter(
    pkg => pkg.displayCondition === 'addon'
  );

  // Filter main packages based on conditions
  let filteredMainPackages = mainPackagesList.filter(pkg => {
    // Check display condition
    if (pkg.displayCondition === 'ev_only' && !hasEVCharging) {
      return false; // Don't show EV packages to non-EV customers
    }
    
    if (pkg.displayCondition === 'no_ev' && hasEVCharging) {
      return false; // Don't show standard packages to EV customers
    }

    // Check EV requirement
    if (pkg.requiresEV && !hasEVCharging) {
      return false;
    }

    // Check daily usage range
    if (pkg.minDailyUsage !== null && pkg.minDailyUsage !== undefined) {
      if (dailyConsumption < pkg.minDailyUsage) {
        return false;
      }
    }

    if (pkg.maxDailyUsage !== null && pkg.maxDailyUsage !== undefined) {
      if (dailyConsumption > pkg.maxDailyUsage) {
        return false;
      }
    }

    return true;
  });

  // Sort by sortOrder
  filteredMainPackages.sort((a, b) => a.sortOrder - b.sortOrder);

  // Limit to 3 main packages to avoid overwhelming customer
  filteredMainPackages = filteredMainPackages.slice(0, 3);

  console.log(`✅ Filtered to ${filteredMainPackages.length} main packages:`, 
    filteredMainPackages.map(p => p.displayName)
  );
  console.log(`✅ ${addonsList.length} addons available`);

  return {
    mainPackages: filteredMainPackages,
    addons: addonsList,
  };
}

/**
 * Get package display category for logging/debugging
 */
export function getPackageCategory(pkg: PackageTemplate): string {
  if (pkg.displayCondition === 'addon') return 'Addon';
  if (pkg.displayCondition === 'ev_only' || pkg.requiresEV) return 'EV Package';
  if (pkg.displayCondition === 'no_ev') return 'Standard Package';
  return 'General Package';
}

/**
 * Validate if a package should be shown to a customer
 * Useful for single package checks
 */
export function shouldShowPackage(
  pkg: PackageTemplate,
  customerProfile: CustomerProfile
): boolean {
  const { dailyConsumption, hasEV, evChargingKwh = 0, planningEV = false } = customerProfile;
  const hasEVCharging = hasEV || planningEV || evChargingKwh > 0 || dailyConsumption > 30;

  if (!pkg.isActive) return false;

  // Addons are always shown
  if (pkg.displayCondition === 'addon') return true;

  // Check display condition
  if (pkg.displayCondition === 'ev_only' && !hasEVCharging) return false;
  if (pkg.displayCondition === 'no_ev' && hasEVCharging) return false;

  // Check EV requirement
  if (pkg.requiresEV && !hasEVCharging) return false;

  // Check daily usage range
  if (pkg.minDailyUsage !== null && pkg.minDailyUsage !== undefined) {
    if (dailyConsumption < pkg.minDailyUsage) return false;
  }

  if (pkg.maxDailyUsage !== null && pkg.maxDailyUsage !== undefined) {
    if (dailyConsumption > pkg.maxDailyUsage) return false;
  }

  return true;
}
