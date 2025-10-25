
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sun, Battery, Zap, Star, CheckCircle2, TrendingUp, Leaf, Shield, DollarSign, Sparkles, Info } from 'lucide-react';
import { CalculatorData } from './calculator-flow';
import { formatCurrency } from '@/lib/calculations';
import { SystemConfiguration, generateConfigurations, RoofAnalysisData } from '@/lib/recommendation-engine';
import { getPricing } from '@/lib/calculations';

interface Step4Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function Step4SystemDesign({ data, updateData, nextStep, prevStep }: Step4Props) {
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load configurations
  useEffect(() => {
    async function loadConfigurations() {
      try {
        setLoading(true);
        
        // Check if configurations already exist from Step 3
        if (data.configurations && data.configurations.length > 0) {
          setConfigurations(data.configurations);
          
          // Auto-select recommended config if none selected
          if (!selectedConfig) {
            const recommended = data.configurations.find((c: SystemConfiguration) => c.priority === 'recommended');
            if (recommended) setSelectedConfig(recommended.id);
          }
        } else {
          // PHASE 1: Generate system designs (panels, battery sizing)
          const pricing = await getPricing();
          const roofAnalysis: RoofAnalysisData = {
            maxArrayPanelsCount: data.roofAnalysisData?.maxArrayPanelsCount ?? 30,
            maxArrayAreaMeters2: data.roofAnalysisData?.maxArrayAreaMeters2 ?? 50,
            maxSunshineHoursPerYear: data.roofAnalysisData?.maxSunshineHoursPerYear ?? 3000,
            panelCapacityWatts: data.panelWattage ?? 440,
            roofSegments: data.roofSegments ?? [],
            financialAnalyses: data.financialAnalyses ?? [],
            carbonOffsetKgPerMwh: 680,
          };
          
          const userProfile = {
            quarterlyBill: data.quarterlyBill ?? 0,
            householdSize: data.householdSize ?? 4,
            usagePattern: data.usagePattern ?? 'balanced',
            hasEv: data.hasEv ?? false,
            planningEv: data.planningEv ?? false,
            evCount: data.evCount ?? 1,
            bedrooms: data.bedrooms,
            hasPool: data.hasPool,
            poolHeated: data.poolHeated,
            homeOffices: data.homeOffices,
            hvacUsage: data.hvacUsage,
            // CRITICAL: Pass actual consumption values from Step 3
            dailyConsumption: data.dailyConsumption,
            overnightUsage: data.overnightUsage,
          };
          
          // Generate configurations (system design only)
          const configs = await generateConfigurations(roofAnalysis, userProfile, pricing);
          
          // PHASE 2: Fetch default brands to calculate accurate costs
          const brandsResponse = await fetch('/api/calculator/brands');
          const brands = await brandsResponse.json();
          
          // Get default brands
          const defaultPanel = brands.panelBrands?.find((b: any) => b.isRecommended) || brands.panelBrands?.[0];
          const defaultInverter = brands.inverterBrands?.find((b: any) => b.isRecommended) || brands.inverterBrands?.[0];
          
          // PHASE 3: Calculate accurate costs using NEW centralized calculator
          const configsWithAccurateCosts = await Promise.all(
            configs.map(async (config) => {
              try {
                // Find matching battery brand for this configuration
                const matchingBattery = brands.batteryBrands?.find((b: any) => 
                  Math.abs(b.capacityKwh - config.recommendedBatteryKwh) <= 1
                );
                
                // Call NEW calculator API with Google Solar data
                const calcResponse = await fetch('/api/calculate-complete-quote', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    googleSolarData: {
                      maxArrayPanelsCount: roofAnalysis.maxArrayPanelsCount,
                      maxArrayAreaMeters2: roofAnalysis.maxArrayAreaMeters2,
                      maxSunshineHoursPerYear: roofAnalysis.maxSunshineHoursPerYear,
                      panelCapacityWatts: roofAnalysis.panelCapacityWatts,
                    },
                    quarterlyBill: data.quarterlyBill || 0,
                    hasEv: data.hasEv || false,
                    planningEv: data.planningEv || false,
                    batterySizeKwh: config.recommendedBatteryKwh,
                    panelBrandId: defaultPanel?.id,
                    batteryBrandId: matchingBattery?.id || null,
                    inverterBrandId: defaultInverter?.id,
                  }),
                });
                
                const calcResult = await calcResponse.json();
                
                if (calcResult.success && calcResult.quote) {
                  // Update configuration with accurate financial data from NEW calculator
                  const quote = calcResult.quote;
                  return {
                    ...config,
                    estimatedCost: quote.totalCostAfterRebates,
                    annualSavings: quote.savings.total,
                    paybackYears: quote.roi.paybackYears,
                    savings25Years: quote.savings.year25,
                    annualProduction: quote.production?.annualGeneration || config.annualProduction,
                    co2SavedPerYear: quote.environmental.co2SavedPerYear,
                    equivalentTrees: quote.environmental.equivalentTrees,
                  };
                }
              } catch (error) {
                console.error('Error calculating costs for config:', config.id, error);
              }
              
              // Return original config if calculation fails
              return config;
            })
          );
          
          setConfigurations(configsWithAccurateCosts);
          
          // Store configurations in data
          updateData({ configurations: configsWithAccurateCosts });
          
          // Auto-select recommended config
          const recommended = configsWithAccurateCosts.find(c => c.priority === 'recommended');
          if (recommended) setSelectedConfig(recommended.id);
        }
      } catch (error) {
        console.error('Error loading configurations:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadConfigurations();
  }, [data.roofAnalysisData, data.quarterlyBill, data.configurations, selectedConfig, updateData]);

  const handleSelectConfig = (configId: string) => {
    setSelectedConfig(configId);
    const config = configurations.find(c => c.id === configId);
    if (config) {
      // Update calculator data with selected configuration
      updateData({
        systemSizeKw: config.systemKw,
        numPanels: config.numPanels,
        panelWattage: config.panelWattage,
        batterySizeKwh: config.recommendedBatteryKwh,
        recommendedSystemSizeKw: config.systemKw,
        recommendedNumPanels: config.numPanels,
        recommendedPanelWattage: config.panelWattage,
        recommendedBatterySizeKwh: config.recommendedBatteryKwh,
      });
    }
  };

  const handleContinue = async () => {
    if (!selectedConfig) return;
    
    const config = configurations.find(c => c.id === selectedConfig);
    if (!config) return;
    
    try {
      // Save selected configuration to database BEFORE moving to Step 5
      const sessionId = data.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Get brands for initial quote
      const brandsResponse = await fetch('/api/calculator/brands');
      const brands = await brandsResponse.json();
      
      const defaultPanel = brands.panelBrands?.find((b: any) => b.isRecommended) || brands.panelBrands?.[0];
      const defaultInverter = brands.inverterBrands?.find((b: any) => b.isRecommended) || brands.inverterBrands?.[0];
      const matchingBattery = brands.batteryBrands?.find((b: any) => 
        Math.abs(b.capacityKwh - config.recommendedBatteryKwh) <= 1
      );
      
      // Call calculation API to get full quote
      const calcResponse = await fetch('/api/calculate-complete-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleSolarData: {
            maxArrayPanelsCount: data.roofAnalysisData?.maxArrayPanelsCount ?? config.numPanels,
            maxArrayAreaMeters2: data.roofAnalysisData?.maxArrayAreaMeters2 ?? 50,
            maxSunshineHoursPerYear: data.roofAnalysisData?.maxSunshineHoursPerYear ?? 3000,
            panelCapacityWatts: config.panelWattage || data.panelWattage || 440,
          },
          quarterlyBill: data.quarterlyBill || 0,
          householdSize: data.householdSize || 4,
          acTier: data.hvacUsage || 'moderate',
          poolType: data.hasPool ? (data.poolHeated ? 'heated' : 'unheated') : 'none',
          homeOfficeCount: data.homeOffices || 0,
          hasEv: data.hasEv || false,
          planningEv: data.planningEv || false,
          dailyConsumption: data.dailyConsumption,
          evUsageTier: data.evUsageTier,
          evChargingTime: data.evChargingTime,
          evCount: data.evCount || 0,
          batterySizeKwh: config.recommendedBatteryKwh,
          panelBrandId: defaultPanel?.id,
          batteryBrandId: matchingBattery?.id || null,
          inverterBrandId: defaultInverter?.id,
        }),
      });
      
      const calcResult = await calcResponse.json();
      
      if (!calcResult.success) {
        console.error('Failed to calculate quote:', calcResult.error);
        alert('Error calculating quote. Please try again.');
        return;
      }
      
      const quote = calcResult.quote;
      
      // Flatten and save to database
      const flattenedQuote = {
        sessionId,
        leadId: data.leadId || null,
        
        // System specs - FROM SELECTED CONFIG
        systemSizeKw: config.systemKw,
        panelCount: config.numPanels,
        batterySizeKwh: config.recommendedBatteryKwh,
        
        // Brands
        panelBrandId: quote.panelBrand.id,
        panelBrandName: quote.panelBrand.name,
        panelBrandWattage: quote.panelBrand.wattage,
        panelBrandTier: quote.panelBrand.tier,
        
        batteryBrandId: quote.batteryBrand?.id || null,
        batteryBrandName: quote.batteryBrand?.name || null,
        batteryBrandCapacity: quote.batteryBrand?.capacityKwh || null,
        batteryBrandTier: quote.batteryBrand?.tier || null,
        
        inverterBrandId: quote.inverterBrand.id,
        inverterBrandName: quote.inverterBrand.name,
        inverterBrandCapacity: quote.inverterBrand.capacityKw,
        inverterBrandTier: quote.inverterBrand.tier,
        
        // Costs
        panelSystemCost: quote.costs.panelSystem,
        batteryCost: quote.costs.battery,
        inverterCost: quote.costs.inverter,
        installationCost: quote.costs.installation,
        totalCostBeforeRebates: quote.costs.totalBeforeRebates,
        
        // Rebates
        federalSolarRebate: quote.rebates.federalSolar,
        federalBatteryRebate: quote.rebates.federalBattery,
        stateBatteryRebate: quote.rebates.stateBattery,
        totalRebates: quote.rebates.total,
        
        // Final costs
        totalCostAfterRebates: quote.totalCostAfterRebates,
        upfrontPayment: quote.totalCostAfterRebates,
        depositAmount: quote.payment.depositAmount,
        depositPercentage: quote.payment.depositPercentage,
        installmentMonths: quote.payment.installmentMonths,
        monthlyPayment: quote.payment.monthlyPayment,
        
        // Savings
        annualSavings: quote.savings.total,
        year10Savings: quote.savings.year10,
        year25Savings: quote.savings.year25,
        paybackYears: quote.roi.paybackYears,
        roi: quote.roi.percentageReturn,
        
        // Environmental
        co2SavedPerYear: quote.environmental.co2SavedPerYear,
        equivalentTrees: quote.environmental.equivalentTrees,
        equivalentCars: quote.environmental.equivalentCars,
        
        // Usage
        quarterlyBill: quote.usage.quarterlyBill,
        dailyUsage: quote.usage.dailyUsageKwh,
        annualConsumption: quote.usage.dailyUsageKwh * 365,
        usageSource: quote.usage.source,
        
        // Household characteristics
        householdSize: data.householdSize || 4,
        bedrooms: data.bedrooms || null,
        usagePattern: data.usagePattern || null,
        hasElectricHotWater: data.hasElectricHotWater || false,
        hasPool: data.hasPool || false,
        poolHeated: data.poolHeated || false,
        homeOffices: data.homeOffices || 0,
        hvacUsage: data.hvacUsage || 'moderate',
        
        // EV data
        hasEv: data.hasEv || false,
        planningEv: data.planningEv || false,
        evCount: data.evCount || 0,
        evChargingTime: data.evChargingTime || null,
        evUsageTier: data.evUsageTier || null,
      };
      
      // Save to database
      const saveResponse = await fetch('/api/quote/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flattenedQuote),
      });
      
      const saveResult = await saveResponse.json();
      
      if (saveResult.success) {
        // Update calculator data with session/quote IDs
        updateData({
          sessionId,
          quoteId: saveResult.quote.id,
          // Store the SELECTED configuration details
          systemSizeKw: config.systemKw,
          numPanels: config.numPanels,
          panelWattage: config.panelWattage,
          batterySizeKwh: config.recommendedBatteryKwh,
        });
        
        // Move to Step 5
        nextStep();
      } else {
        console.error('Failed to save quote:', saveResult.error);
        alert('Error saving your selection. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleContinue:', error);
      alert('An error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Generating personalized system designs...</p>
          <p className="text-sm text-gray-500 mt-2">Analyzing your roof and energy needs</p>
        </div>
      </div>
    );
  }

  const selectedConfiguration = configurations.find(c => c.id === selectedConfig);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-3 flex items-center">
          <Sparkles className="h-8 w-8 mr-3 text-gold" />
          Choose Your Perfect Solar System
        </h2>
        <p className="text-gray-600 text-lg">
          Based on your roof analysis and energy usage, we've designed {configurations.length} system options tailored just for you.
        </p>
      </div>

      {/* Configuration Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {configurations.map((config) => (
          <ConfigurationCard
            key={config.id}
            config={config}
            isSelected={selectedConfig === config.id}
            onSelect={() => handleSelectConfig(config.id)}
          />
        ))}
      </div>

      {/* Selected Configuration Details */}
      {selectedConfiguration && (
        <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl p-6 mb-8 border-2 border-primary-200 animate-fade-in">
          <h3 className="font-bold text-primary text-xl mb-4 flex items-center">
            <CheckCircle2 className="h-6 w-6 mr-2 text-emerald" />
            Your Selected System: {selectedConfiguration.name}
          </h3>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <Sun className="h-6 w-6 text-gold mb-2" />
              <p className="text-xs text-gray-600 mb-1">Solar Panels</p>
              <p className="text-xl font-bold text-primary">{selectedConfiguration.numPanels} panels</p>
              <p className="text-xs text-gray-500">{selectedConfiguration.systemKw}kW system</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <Battery className="h-6 w-6 text-emerald mb-2" />
              <p className="text-xs text-gray-600 mb-1">Battery Storage</p>
              <p className="text-xl font-bold text-primary">{selectedConfiguration.recommendedBatteryKwh}kWh</p>
              <p className="text-xs text-gray-500">
                {selectedConfiguration.recommendedBatteryKwh === 0 ? 'Solar only' : 'With backup power'}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <Zap className="h-6 w-6 text-coral mb-2" />
              <p className="text-xs text-gray-600 mb-1">Annual Production</p>
              <p className="text-xl font-bold text-primary">{selectedConfiguration.annualProduction.toLocaleString()}</p>
              <p className="text-xs text-gray-500">kWh per year</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <DollarSign className="h-6 w-6 text-gold mb-2" />
              <p className="text-xs text-gray-600 mb-1">Annual Savings</p>
              <p className="text-xl font-bold text-emerald">{formatCurrency(selectedConfiguration.annualSavings)}</p>
              <p className="text-xs text-gray-500">per year</p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-primary rounded-lg p-4 text-white">
              <p className="text-sm opacity-90 mb-1">System Investment</p>
              <p className="text-2xl font-bold">{formatCurrency(selectedConfiguration.estimatedCost)}</p>
              <p className="text-xs opacity-75">After rebates</p>
            </div>
            
            <div className="bg-emerald rounded-lg p-4 text-white">
              <p className="text-sm opacity-90 mb-1">Payback Period</p>
              <p className="text-2xl font-bold">{selectedConfiguration.paybackYears.toFixed(1)} years</p>
              <p className="text-xs opacity-75">Return on investment</p>
            </div>
            
            <div className="bg-gold rounded-lg p-4 text-white">
              <p className="text-sm opacity-90 mb-1">25-Year Savings</p>
              <p className="text-2xl font-bold">{formatCurrency(selectedConfiguration.savings25Years)}</p>
              <p className="text-xs opacity-75">Total lifetime value</p>
            </div>
          </div>

          {/* Environmental Impact */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Leaf className="h-5 w-5 text-emerald mr-2" />
              <h4 className="font-semibold text-emerald-900">Environmental Impact</h4>
            </div>
            <p className="text-sm text-emerald-800">
              This system will offset approximately{' '}
              <strong>{selectedConfiguration.co2SavedPerYear.toLocaleString()} tonnes of CO₂</strong> per year,
              equivalent to planting <strong>{selectedConfiguration.equivalentTrees} trees</strong> annually.
            </p>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start">
        <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">What's Next?</p>
          <p>
            After selecting your system design, you'll be able to customize brands, add accessories, 
            and see a detailed financial breakdown with available rebates.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          type="button"
          variant="outline"
          size="lg"
          onClick={prevStep}
          className="px-8"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        
        <Button 
          type="button"
          size="lg"
          onClick={handleContinue}
          disabled={!selectedConfig}
          className="bg-coral hover:bg-coral-600 text-white px-8"
        >
          Continue to Customization
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// Configuration Card Component
interface ConfigurationCardProps {
  config: SystemConfiguration;
  isSelected: boolean;
  onSelect: () => void;
}

function ConfigurationCard({ config, isSelected, onSelect }: ConfigurationCardProps) {
  const priorityColors = {
    recommended: 'border-gold-400 bg-gold-50',
    high: 'border-emerald-400 bg-emerald-50',
    medium: 'border-blue-400 bg-blue-50',
    low: 'border-gray-400 bg-gray-50',
  };

  const priorityBadges = {
    recommended: { text: '⭐ RECOMMENDED', class: 'bg-gold text-white' },
    high: { text: '🔥 POPULAR', class: 'bg-emerald text-white' },
    medium: { text: '💡 GOOD OPTION', class: 'bg-blue-500 text-white' },
    low: { text: '💰 BUDGET', class: 'bg-gray-500 text-white' },
  };

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-xl p-6 border-2 cursor-pointer transition-all transform hover:scale-[1.02] ${
        isSelected
          ? 'border-primary bg-primary-50 shadow-xl ring-4 ring-primary/20'
          : priorityColors[config.priority] || 'border-gray-300 bg-white hover:border-primary-200'
      }`}
    >
      {/* Priority Badge */}
      <div className="absolute top-4 right-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          priorityBadges[config.priority]?.class || 'bg-gray-500 text-white'
        }`}>
          {priorityBadges[config.priority]?.text || 'OPTION'}
        </span>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 left-4">
          <CheckCircle2 className="h-8 w-8 text-primary fill-primary/10" />
        </div>
      )}

      {/* Configuration Name & Description */}
      <div className="mt-8 mb-4">
        <h3 className="text-2xl font-bold text-primary mb-2">{config.name}</h3>
        <p className="text-sm text-gray-700 mb-1">{config.description}</p>
        <p className="text-xs text-gray-600 italic">{config.useCase}</p>
      </div>

      {/* Key Specs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/70 rounded-lg p-3 border border-gray-200">
          <Sun className="h-5 w-5 text-gold mb-1" />
          <p className="text-xs text-gray-600">Solar System</p>
          <p className="text-lg font-bold text-primary">{config.systemKw}kW</p>
          <p className="text-xs text-gray-500">{config.numPanels} panels</p>
        </div>
        
        <div className="bg-white/70 rounded-lg p-3 border border-gray-200">
          <Battery className="h-5 w-5 text-emerald mb-1" />
          <p className="text-xs text-gray-600">Battery</p>
          <p className="text-lg font-bold text-primary">
            {config.recommendedBatteryKwh === 0 ? 'None' : `${config.recommendedBatteryKwh}kWh`}
          </p>
          <p className="text-xs text-gray-500">
            {config.recommendedBatteryKwh === 0 ? 'Solar only' : 'Storage'}
          </p>
        </div>
      </div>

      {/* Financial Highlights */}
      <div className="bg-white/70 rounded-lg p-3 border border-gray-200 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-700">Investment</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(config.estimatedCost)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-700">Annual Savings</span>
          <span className="text-lg font-bold text-emerald">{formatCurrency(config.annualSavings)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Payback</span>
          <span className="text-lg font-bold text-coral">{config.paybackYears.toFixed(1)} years</span>
        </div>
      </div>

      {/* Pros */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald" />
          Key Benefits
        </h4>
        <ul className="space-y-1">
          {config.pros.slice(0, 3).map((pro, idx) => (
            <li key={idx} className="text-xs text-gray-700 flex items-start">
              <span className="text-emerald mr-1">✓</span>
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cons */}
      {config.cons.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
            <Info className="h-3 w-3 mr-1 text-gray-500" />
            Considerations
          </h4>
          <ul className="space-y-1">
            {config.cons.slice(0, 2).map((con, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start">
                <span className="text-gray-400 mr-1">•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Roof Utilization */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">Roof Space Used</span>
          <span className="font-semibold text-primary">{config.roofUtilization}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div
            className="bg-primary rounded-full h-2 transition-all"
            style={{ width: `${config.roofUtilization}%` }}
          />
        </div>
      </div>

      {/* Select Button */}
      {!isSelected && (
        <Button
          className="w-full mt-4 bg-primary hover:bg-primary-600"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Select This System
        </Button>
      )}
    </div>
  );
}
