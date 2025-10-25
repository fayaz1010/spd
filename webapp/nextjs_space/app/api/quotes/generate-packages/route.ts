import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateRebates } from '@/lib/services/rebate-service';
import { calculateInstallationCost } from '@/lib/services/installation-pricing-service';
import { getAllBatteryBrands } from '@/lib/services/brand-compatibility';
import { 
  getPanelsAsOldFormat,
  getBatteriesAsOldFormat,
  getInvertersAsOldFormat,
  calculateProductCost 
} from '@/lib/services/product-compatibility-service';

const prisma = new PrismaClient();

/**
 * Generate custom system packages based on:
 * 1. Active package templates from database
 * 2. Customer's actual energy consumption
 * 3. Customer's roof capacity
 */
export async function POST(request: NextRequest) {
  console.log('🔵 /api/quotes/generate-packages called');
  try {
    const { sessionId } = await request.json();
    console.log('📋 Session ID:', sessionId);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // 1. Fetch customer quote data
    console.log('🔍 Fetching quote for session:', sessionId);
    const quote = await prisma.customerQuote.findUnique({
      where: { sessionId },
    });

    if (!quote) {
      console.log('❌ Quote not found');
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    console.log('✅ Quote found:', quote.id);

    // 2. Fetch roof analysis
    console.log('🔍 Fetching roof analysis...');
    const roofAnalysis = await prisma.roofAnalysis.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    if (!roofAnalysis) {
      console.log('❌ Roof analysis not found');
      return NextResponse.json(
        { error: 'Roof analysis not found' },
        { status: 404 }
      );
    }
    console.log('✅ Roof analysis found');

    // 3. Fetch active package templates
    console.log('🔍 Fetching package templates...');
    const templates = await (prisma as any).systemPackageTemplate.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (templates.length === 0) {
      console.log('❌ No templates found');
      return NextResponse.json(
        { error: 'No active package templates found' },
        { status: 404 }
      );
    }
    console.log(`✅ Found ${templates.length} templates`);

    // 4. Get pricing data and products from NEW Product system
    console.log('🔍 Fetching pricing data and products...');
    
    // Get panels from Product table
    const panelProducts = await getPanelsAsOldFormat({ isAvailable: true });
    
    // Get batteries from Product table
    const batteryBrands = await getBatteriesAsOldFormat({ isAvailable: true });
    
    // Get inverters from Product table
    const inverterProducts = await getInvertersAsOldFormat({ isAvailable: true });
    
    // Fallback to solarPricing for backward compatibility
    const solarPricing = await prisma.solarPricing.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (panelProducts.length === 0) {
      console.log('❌ No panel products found');
      return NextResponse.json(
        { error: 'No panel products available' },
        { status: 500 }
      );
    }
    console.log(`✅ Found ${panelProducts.length} panel options`);

    if (batteryBrands.length === 0) {
      console.warn('⚠️ No battery brands found - packages will have no battery');
    } else {
      console.log(`✅ Found ${batteryBrands.length} battery options`);
    }
    
    if (inverterProducts.length === 0) {
      console.warn('⚠️ No inverter products found');
    } else {
      console.log(`✅ Found ${inverterProducts.length} inverter options`);
    }

    // 5. Extract customer data
    console.log('📊 Extracting customer data...');
    const dailyConsumption = (quote as any).dailyConsumption || quote.dailyUsage || 25;
    const maxPanels = roofAnalysis.maxArrayPanelsCount || 40;
    
    // Use recommended panel or first available
    const defaultPanel = panelProducts.find(p => p.isRecommended) || panelProducts[0];
    const panelWattage = defaultPanel.wattage;
    const maxRoofKw = (maxPanels * panelWattage) / 1000;
    
    // Parse energy profile for time-of-use data
    const energyProfile = (quote as any).energyProfile as any;
    
    // CRITICAL: Use overnightUsage if available (most accurate from Step 2)
    // This already includes EV charging scheduled during overnight hours
    let nighttimeUsage = 0;
    let eveningUsage = 0;
    
    if (energyProfile?.timeOfUse?.night !== undefined) {
      nighttimeUsage = energyProfile.timeOfUse.night;
    } else {
      nighttimeUsage = dailyConsumption * 0.3;
    }
    
    if (energyProfile?.timeOfUse?.evening !== undefined) {
      eveningUsage = energyProfile.timeOfUse.evening;
    } else if (energyProfile?.timeOfUse?.eveningPeak !== undefined) {
      eveningUsage = energyProfile.timeOfUse.eveningPeak;
    } else {
      eveningUsage = dailyConsumption * 0.4;
    }
    
    // Get EV charging data
    const hasEv = quote.hasEv || quote.planningEv || false;
    const evChargingKwh = energyProfile?.breakdown?.ev || energyProfile?.breakdown?.evCharging || 0;
    
    // CRITICAL: Check if EV charging is already included in nighttime usage
    // If energyProfile has overnightUsage, it already includes EV charging
    const evAlreadyIncluded = energyProfile?.timeOfUse?.night !== undefined && evChargingKwh > 0;
    
    if (evChargingKwh > 0 && !evAlreadyIncluded) {
      nighttimeUsage += evChargingKwh;
      console.log(`🚗 EV charging detected: ${evChargingKwh.toFixed(1)}kWh - adding to nighttime usage`);
    } else if (evAlreadyIncluded) {
      console.log(`🚗 EV charging already included in nighttime usage: ${evChargingKwh.toFixed(1)}kWh`);
    }

    console.log(`📊 Customer Data:`, {
      dailyConsumption,
      maxPanels,
      maxRoofKw,
      nighttimeUsage,
      eveningUsage,
      hasEv,
      evChargingKwh,
    });

    // 6. Generate packages from templates
    console.log('🔨 Generating packages...');
    const packages = await Promise.all(templates.map(async (template: any) => {
      console.log(`  Processing template: ${template.displayName}`);
      // Calculate solar system size based on strategy
      let solarKw = 0;
      
      switch (template.solarSizingStrategy) {
        case 'coverage_percentage':
          const targetDaily = dailyConsumption * (template.solarCoveragePercent! / 100);
          // Assume 4.4 kWh per kW per day (Perth average)
          solarKw = Math.ceil((targetDaily / 4.4) * 2) / 2; // Round to nearest 0.5kW
          break;
        case 'fixed_kw':
          solarKw = template.solarFixedKw!;
          break;
        case 'max_roof':
          solarKw = maxRoofKw;
          break;
      }

      // Cap at roof capacity
      solarKw = Math.min(solarKw, maxRoofKw);
      const panelCount = Math.floor((solarKw * 1000) / panelWattage);

      // Calculate battery size based on strategy
      let batteryKwh = 0;
      
      // Get customer's total nighttime usage (evening + night)
      const nighttimeTotal = nighttimeUsage + eveningUsage;
      
      switch (template.batterySizingStrategy) {
        case 'none':
          batteryKwh = 0;
          break;
        case 'fixed_kwh':
          // Use fixed size but ensure it's reasonable for customer
          batteryKwh = template.batteryFixedKwh!;
          break;
        case 'dynamic_multiplier':
          // NEW: Dynamic sizing based on customer needs with tier multipliers
          // Budget = emergency backup only (partial evening)
          // Balanced = full evening + partial night coverage
          // Premium = full evening + night coverage (complete overnight independence)
          
          let targetCapacity = 0;
          
          if (template.tier === 'budget') {
            // Budget: Emergency backup - cover evening peak only (~60% of evening)
            targetCapacity = eveningUsage * 0.6;
          } else if (template.tier === 'mid') {
            // Balanced: Cover full evening + partial night (50% of night)
            targetCapacity = eveningUsage + (nighttimeUsage * 0.5);
          } else if (template.tier === 'premium') {
            // Premium: Full overnight coverage (evening + night)
            // Note: nighttimeUsage already includes EV charging if scheduled overnight
            targetCapacity = eveningUsage + nighttimeUsage;
            
            // Add small buffer for efficiency losses (10%)
            targetCapacity = targetCapacity * 1.1;
            
            console.log(`     🌙 Premium: Full overnight coverage`);
            console.log(`     Evening: ${eveningUsage.toFixed(1)}kWh`);
            console.log(`     Night: ${nighttimeUsage.toFixed(1)}kWh`);
            console.log(`     EV included in night: ${evAlreadyIncluded ? 'Yes' : 'No'}`);
          }
          
          // Round to nearest available battery size (prefer slightly larger)
          // Note: Larger sizes (40.5, 50.2) represent multiple battery units
          // e.g., 40.5 = 3x Tesla Powerwall 3 (13.5kWh each)
          const availableSizes = [5, 9.6, 10.5, 13.5, 13.8, 17.2, 20.5, 27.6, 40.5, 50.2];
          batteryKwh = availableSizes.find(size => size >= targetCapacity) 
            || availableSizes[availableSizes.length - 1]; // Default to largest if target exceeds all
          
          // If target exceeds largest available, use the target capacity rounded up
          if (targetCapacity > availableSizes[availableSizes.length - 1]) {
            batteryKwh = Math.ceil(targetCapacity);
            console.log(`     ⚠️ Target ${targetCapacity.toFixed(1)}kWh exceeds available sizes, using ${batteryKwh}kWh`);
          }
          
          console.log(`  📊 Dynamic battery sizing for ${template.displayName}:`);
          console.log(`     Evening usage: ${eveningUsage.toFixed(1)}kWh`);
          console.log(`     Night usage: ${nighttimeUsage.toFixed(1)}kWh`);
          console.log(`     Nighttime total: ${nighttimeTotal.toFixed(1)}kWh`);
          console.log(`     Target capacity: ${targetCapacity.toFixed(1)}kWh`);
          console.log(`     Selected size: ${batteryKwh}kWh`);
          break;
        case 'coverage_hours':
          // Calculate based on actual nighttime energy needs
          // Assume coverage hours span the nighttime period (typically 6pm-6am = 12 hours)
          const totalNighttimeHours = 12;
          const avgNightlyLoad = nighttimeTotal / totalNighttimeHours; // Average kW load
          
          // Battery needs to cover the requested hours at this load
          const targetHours = template.batteryCoverageHours!;
          
          if (targetHours >= totalNighttimeHours) {
            // Full overnight coverage - use total nighttime energy
            batteryKwh = Math.ceil(nighttimeTotal * 1.1); // 10% buffer for efficiency losses
          } else {
            // Partial coverage - scale proportionally
            batteryKwh = Math.ceil(avgNightlyLoad * targetHours * 1.1);
          }
          
          console.log(`  🔋 Coverage hours battery sizing:`);
          console.log(`     Nighttime total: ${nighttimeTotal.toFixed(1)}kWh over ${totalNighttimeHours}h`);
          console.log(`     Average load: ${avgNightlyLoad.toFixed(2)}kW`);
          console.log(`     Target coverage: ${targetHours}h`);
          console.log(`     Calculated battery: ${batteryKwh}kWh`);
          break;
        case 'full_overnight':
          batteryKwh = Math.ceil(nighttimeTotal);
          break;
      }

      // Find closest battery from brands with tier-based selection
      let selectedBattery = null;
      let batteryCount = 1; // Number of battery units needed
      
      if (batteryKwh > 0 && batteryBrands.length > 0) {
        // First, filter batteries by tier to ensure differentiation
        const tierBatteries = batteryBrands.filter((b: any) => 
          b.tier === template.tier
        );
        
        // If no batteries in this tier, use all batteries as fallback
        const availableBatteries = tierBatteries.length > 0 
          ? tierBatteries 
          : batteryBrands;
        
        console.log(`  🔋 Battery selection for ${template.displayName}:`);
        console.log(`     Target capacity: ${batteryKwh}kWh`);
        console.log(`     Template tier: ${template.tier}`);
        console.log(`     Tier batteries available: ${tierBatteries.length}`);
        console.log(`     Total batteries available: ${batteryBrands.length}`);
        
        // Find the largest available battery in the tier
        const largestBattery = availableBatteries.reduce((prev: any, curr: any) => 
          curr.capacity > prev.capacity ? curr : prev
        );
        
        // If target exceeds largest single battery, calculate multiple units
        if (batteryKwh > largestBattery.capacity) {
          batteryCount = Math.ceil(batteryKwh / largestBattery.capacity);
          selectedBattery = largestBattery;
          batteryKwh = selectedBattery.capacity * batteryCount;
          console.log(`     🔢 Multiple units needed: ${batteryCount}x ${selectedBattery.name}`);
          console.log(`     📦 Total capacity: ${batteryKwh}kWh`);
        } else {
          // Find closest capacity match, preferring slightly larger over smaller
          selectedBattery = availableBatteries.reduce((prev: any, curr: any) => {
            const prevDiff = Math.abs(prev.capacity - batteryKwh);
            const currDiff = Math.abs(curr.capacity - batteryKwh);
            
            // If current is closer, use it
            if (currDiff < prevDiff) return curr;
            
            // If same distance, prefer the one that meets or exceeds target
            if (currDiff === prevDiff) {
              if (curr.capacity >= batteryKwh && prev.capacity < batteryKwh) return curr;
              if (prev.capacity >= batteryKwh && curr.capacity < batteryKwh) return prev;
              // If both meet target or both don't, prefer recommended
              if (curr.isRecommended && !prev.isRecommended) return curr;
            }
            
            return prev;
          });
          
          batteryKwh = selectedBattery.capacity;
          console.log(`     ✅ Selected: ${selectedBattery.name} (${selectedBattery.capacity}kWh, ${selectedBattery.tier})`);
        }
      } else if (batteryKwh > 0) {
        // No battery brands in DB, use calculated size
        console.warn('⚠️ Using calculated battery size, no battery brands');
      }
      
      // Find appropriate inverter for system size
      let selectedInverter = null;
      if (inverterProducts.length > 0) {
        selectedInverter = inverterProducts.find((inv: any) => 
          inv.capacity >= solarKw && inv.capacity <= solarKw * 1.2
        ) || inverterProducts[0];
      }
      
      // Select panel for this package (tier-based)
      const selectedPanel = panelProducts.find((p: any) => 
        p.tier === template.tier
      ) || defaultPanel;

      // Calculate costs using NEW Product system
      let solarCost = 0;
      let solarInstallationCost = 0;
      let batteryCost = 0;
      let batteryInstallationCost = 0;
      let inverterCost = 0;
      let inverterInstallationCost = 0;
      
      console.log(`  💰 Calculating costs for ${template.displayName}...`);
      
      // Calculate panel cost with installation
      if (selectedPanel._productId) {
        console.log(`     Panel: ${selectedPanel.name}`);
        console.log(`     Product ID: ${selectedPanel._productId}`);
        console.log(`     Quantity: ${panelCount}`);
        console.log(`     Unit Cost: $${selectedPanel._unitCost}`);
        console.log(`     Retail Price: $${selectedPanel._retailPrice}`);
        
        // Pass supplier data to avoid re-querying
        const supplierData = {
          supplierId: selectedPanel._supplierId,
          unitCost: selectedPanel._unitCost,
          retailPrice: selectedPanel._retailPrice,
        };
        
        const panelCostData = await calculateProductCost(
          selectedPanel._productId,
          panelCount,
          { 
            includeInstallation: true,
            supplierData: supplierData,
          }
        );
        solarCost = panelCostData.productCost * template.priceMultiplier;
        solarInstallationCost = panelCostData.installationCost;
        
        console.log(`     Product Cost: $${panelCostData.productCost}`);
        console.log(`     Installation Cost: $${panelCostData.installationCost}`);
        console.log(`     Total Solar Cost: $${solarCost}`);
      } else {
        console.warn(`     ⚠️  No product ID for panel, using fallback pricing`);
        // Fallback to old pricing
        solarCost = solarKw * (solarPricing?.costPerKw || 1500) * template.priceMultiplier;
      }
      
      // Calculate battery cost with installation (accounting for multiple units)
      if (selectedBattery && selectedBattery._productId) {
        const supplierData = {
          supplierId: selectedBattery._supplierId,
          unitCost: selectedBattery._unitCost,
          retailPrice: selectedBattery._retailPrice,
        };
        
        const batteryCostData = await calculateProductCost(
          selectedBattery._productId,
          batteryCount, // Use batteryCount for multiple units
          { 
            includeInstallation: true,
            supplierData: supplierData,
          }
        );
        batteryCost = batteryCostData.productCost * template.priceMultiplier;
        batteryInstallationCost = batteryCostData.installationCost;
        
        console.log(`     Battery: ${batteryCount}x ${selectedBattery.name}`);
        console.log(`     Unit Cost: $${selectedBattery._unitCost}`);
        console.log(`     Total Battery Cost: $${batteryCost}`);
        console.log(`     Installation Cost: $${batteryInstallationCost}`);
      }
      
      // Calculate inverter cost with installation
      if (selectedInverter && selectedInverter._productId) {
        const supplierData = {
          supplierId: selectedInverter._supplierId,
          unitCost: selectedInverter._unitCost,
          retailPrice: selectedInverter._retailPrice,
        };
        
        const inverterCostData = await calculateProductCost(
          selectedInverter._productId,
          1,
          { 
            includeInstallation: true,
            supplierData: supplierData,
          }
        );
        inverterCost = inverterCostData.productCost * template.priceMultiplier;
        inverterInstallationCost = inverterCostData.installationCost;
      }
      
      const installationCost = solarInstallationCost + batteryInstallationCost + inverterInstallationCost;
      const totalBeforeRebates = solarCost + batteryCost + inverterCost + installationCost;

      // Calculate rebates using database formulas
      const rebateCalculation = await calculateRebates({
        systemSizeKw: solarKw,
        batterySizeKwh: batteryKwh,
        region: 'WA',
      });
      
      console.log(`   💰 Rebates for ${template.displayName}:`, {
        federal: rebateCalculation.federalSolar,
        battery: rebateCalculation.federalBattery,
        state: rebateCalculation.stateBattery,
        total: rebateCalculation.total,
      });
      
      const federalSolarRebate = rebateCalculation.federalSolar;
      const federalBatteryRebate = rebateCalculation.federalBattery;
      const stateBatteryRebate = rebateCalculation.stateBattery;
      const totalRebates = rebateCalculation.total;
      const totalAfterRebates = totalBeforeRebates - totalRebates;

      // Calculate savings
      const dailyGeneration = solarKw * 4.4; // kWh per day
      const dailySelfConsumption = Math.min(dailyGeneration, dailyConsumption);
      const dailyExport = Math.max(0, dailyGeneration - dailyConsumption);
      
      const retailRate = 0.32; // $/kWh
      const feedInTariff = 0.05; // $/kWh
      
      const annualSavings = (dailySelfConsumption * retailRate * 365) + (dailyExport * feedInTariff * 365);
      const paybackYears = totalAfterRebates / annualSavings;

      return {
        templateId: template.id,
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        tier: template.tier,
        badge: template.badge,
        highlightColor: template.highlightColor,
        features: Array.isArray(template.features) ? template.features : [],
        
        // System specs
        solarKw,
        panelCount,
        panelWattage,
        panelBrand: selectedPanel.manufacturer,
        panelModel: selectedPanel.name,
        panelProductId: selectedPanel._productId,
        batteryKwh,
        batteryCount, // Number of battery units
        batteryBrand: selectedBattery?.manufacturer || null,
        batteryModel: selectedBattery?.name || null,
        batteryProductId: selectedBattery?._productId || null,
        batteryUnitCapacity: selectedBattery?.capacity || null, // Individual unit capacity
        inverterBrand: selectedInverter?.manufacturer || null,
        inverterModel: selectedInverter?.name || null,
        inverterCapacity: selectedInverter?.capacity || null,
        inverterProductId: selectedInverter?._productId || null,
        
        // Performance
        dailyGeneration: Math.round(dailyGeneration * 10) / 10,
        dailySelfConsumption: Math.round(dailySelfConsumption * 10) / 10,
        dailyExport: Math.round(dailyExport * 10) / 10,
        coveragePercent: Math.round((dailySelfConsumption / dailyConsumption) * 100),
        
        // Costs
        solarCost: Math.round(solarCost),
        batteryCost: Math.round(batteryCost),
        inverterCost: Math.round(inverterCost),
        installationCost: Math.round(installationCost),
        installationBreakdown: {
          panel: Math.round(solarInstallationCost),
          battery: Math.round(batteryInstallationCost),
          inverter: Math.round(inverterInstallationCost),
        },
        totalBeforeRebates: Math.round(totalBeforeRebates),
        federalSolarRebate: Math.round(federalSolarRebate),
        federalBatteryRebate: Math.round(federalBatteryRebate),
        stateBatteryRebate: Math.round(stateBatteryRebate),
        totalRebates: Math.round(totalRebates),
        totalAfterRebates: Math.round(totalAfterRebates),
        
        // Savings
        annualSavings: Math.round(annualSavings),
        paybackYears: Math.round(paybackYears * 10) / 10,
        year10Savings: Math.round(annualSavings * 10),
        year25Savings: Math.round(annualSavings * 25),
        
        // Features
        includeMonitoring: template.includeMonitoring,
        includeWarranty: template.includeWarranty,
        includeMaintenance: template.includeMaintenance,
      };
    }));

    console.log(`✅ Generated ${packages.length} packages`);

    return NextResponse.json({
      success: true,
      packages,
      customerData: {
        dailyConsumption,
        maxRoofKw,
        maxPanels,
      },
    });

  } catch (error: any) {
    console.error('❌ Error generating packages:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to generate packages', details: error.message, stack: error.stack },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
