
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle, Home, Sun, Activity, AlertCircle, MapPin, Compass, TrendingUp, Zap, Car, Waves, Wind, Laptop, Clock, Battery } from 'lucide-react';
import { CalculatorData } from './calculator-flow';
import Image from 'next/image';
import { RoofVisualization } from './roof-visualization';
import { ConfidenceIndicator } from './confidence-indicator';
import { SegmentCard } from './segment-card';
import { generateConfigurations, SystemConfiguration } from '@/lib/recommendation-engine';
import { analyzeRoofSegments } from '@/lib/segment-analysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Step3Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function Step3RoofAnalysis({ data, updateData, nextStep, prevStep }: Step3Props) {
  const [loading, setLoading] = useState(true);
  const [roofData, setRoofData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [roofSegments, setRoofSegments] = useState<any[]>([]);
  const [consumptionAnalysis, setConsumptionAnalysis] = useState<any>(null);

  useEffect(() => {
    analyzeRoofAndConsumption();
  }, []);

  const calculateConsumption = () => {
    // Base household consumption (core appliances, lighting, entertainment only)
    // Updated based on actual customer data analysis
    const householdSizeConsumption: Record<number, number> = {
      1: 4,
      2: 6,
      3: 7.5,
      4: 9,
      5: 10.5,
      6: 12
    };
    const baseConsumption = householdSizeConsumption[Math.min(data?.householdSize ?? 4, 6)] || 9;
    
    // Pool consumption (updated values)
    let poolConsumption = 0;
    if (data?.hasPool) {
      poolConsumption = data?.poolHeated ? 30 : 7; // kWh per day - corrected values
    }
    
    // EV consumption - Enhanced with usage tiers
    let evConsumption = 0;
    if (data?.hasEv || data?.planningEv) {
      const evCountActual = data?.evCount ?? 1;
      
      // EV daily consumption based on usage tier
      // Light: 20-30km/day (~4-6 kWh) = 5 kWh average
      // Average: 40-60km/day (~8-12 kWh) = 10 kWh average
      // Heavy: 75km/day (~15 kWh) = 15 kWh average - FIXED to match UI label
      // Very Heavy: 100km+/day (~20 kWh) = 20 kWh average - FIXED to match UI label
      const evKwhPerTier: Record<string, number> = {
        light: 5,
        average: 10,
        heavy: 15,        // ✅ Fixed from 20 to match UI label
        very_heavy: 20,   // ✅ Fixed from 35 to match UI label
      };
      
      const evTier = data?.evUsageTier ?? 'average';
      const kwhPerEv = evKwhPerTier[evTier] || 10;
      evConsumption = kwhPerEv * evCountActual;
    }
    
    // Hot water (corrected value)
    const hotWaterConsumption = data?.hasElectricHotWater ? 6 : 0; // kWh per day - corrected
    
    // Cooking (new field)
    const cookingConsumption = data?.hasElectricCooking ? 4 : 0; // kWh per day
    
    // HVAC/AC (corrected values - now additive, not adjustment)
    const hvacDaily: Record<string, number> = {
      minimal: 3,
      moderate: 10,  // Corrected to 10 kWh/day
      heavy: 25
    };
    const hvacConsumption = hvacDaily[data?.hvacUsage ?? 'moderate'];
    
    // Home offices (corrected value)
    const officeConsumption = (data?.homeOffices ?? 0) * 1.5; // 1.5 kWh per office per day - corrected
    
    // Calculate total
    const totalCalculated = baseConsumption + poolConsumption + evConsumption + 
                           hotWaterConsumption + cookingConsumption + hvacConsumption + officeConsumption;
    
    // Smart consumption hierarchy: Bill vs Profile with seasonal awareness
    let actualFromBill = 0;
    let finalDaily = totalCalculated;
    let usageSource = 'profile';
    let consumptionNote = 'Estimated from household profile';
    
    if (data?.quarterlyBill && data.quarterlyBill > 0) {
      // Convert bi-monthly bill to daily kWh
      // Australia receives bills every 2 months (60 days), not quarterly
      // Using Synergy Home Plan A1 tariff: $0.3237/kWh (WA)
      const biMonthlyKwh = data.quarterlyBill / 0.3237;
      actualFromBill = biMonthlyKwh / 60; // 60 days in bi-monthly period
      
      // Check if bills cover all seasons (for accurate annual average)
      // Bills must include summer (Dec-Feb) when AC usage is typically highest in Perth
      const hasBillData = data?.billData && Array.isArray(data.billData) && data.billData.length > 0;
      let hasAllSeasons = false;
      
      if (hasBillData && data.billData && data.billData.length >= 4) {
        // Check if we have coverage across all 4 seasons
        type Season = 'summer' | 'autumn' | 'winter' | 'spring';
        const seasons: Season[] = data.billData.map((bill: any) => {
          const month = new Date(bill.endDate).getMonth(); // 0-11
          if (month >= 11 || month <= 1) return 'summer' as Season;
          if (month >= 2 && month <= 4) return 'autumn' as Season;
          if (month >= 5 && month <= 7) return 'winter' as Season;
          return 'spring' as Season;
        });
        const allSeasons: Season[] = ['summer', 'autumn', 'winter', 'spring'];
        hasAllSeasons = allSeasons.every(season => seasons.includes(season));
      }
      
      if (hasAllSeasons) {
        // Full year coverage - trust the bill average
        finalDaily = actualFromBill;
        usageSource = 'bill_annual';
        consumptionNote = 'Based on 12 months of actual bills covering all seasons';
      } else {
        // Incomplete seasonal coverage - use HIGHER value to account for missing peaks
        // This prevents under-sizing when summer AC bills are missing
        finalDaily = Math.max(actualFromBill, totalCalculated);
        usageSource = finalDaily === actualFromBill ? 'bill_partial' : 'profile_adjusted';
        consumptionNote = `Using ${usageSource === 'bill_partial' ? 'bill average' : 'profile estimate'} - bills don't cover all seasons (may be missing summer AC usage)`;
      }
    }
    
    // Estimate overnight usage (for battery sizing)
    // CRITICAL: Account for EV charging time explicitly
    // Base household overnight usage: 35-45% of non-EV consumption
    const baseOvernightPercentage = 0.40; // 40% base for household appliances
    const nonEvConsumption = finalDaily - evConsumption;
    let overnightUsage = nonEvConsumption * baseOvernightPercentage;
    
    // Add EV consumption if charging at night
    if ((data?.hasEv || data?.planningEv) && data?.evChargingTime === 'night') {
      overnightUsage += evConsumption;
    } else if ((data?.hasEv || data?.planningEv) && data?.evChargingTime === 'day') {
      // EV charging during day - only base overnight usage
      // Already calculated above
    } else if ((data?.hasEv || data?.planningEv)) {
      // No charging time specified - assume night charging (safer for battery sizing)
      overnightUsage += evConsumption;
    }
    
    // Estimate peak usage time
    let peakTime = 'evening';
    if (data?.homeOffices && data.homeOffices > 0) {
      peakTime = 'all_day';
    } else if (data?.evChargingTime === 'night') {
      peakTime = 'night';
    }
    
    return {
      breakdown: {
        baseHousehold: baseConsumption,
        pool: poolConsumption,
        ev: evConsumption,
        hotWater: hotWaterConsumption,
        cooking: cookingConsumption,
        hvac: hvacConsumption,
        homeOffices: officeConsumption,
      },
      totalCalculated,
      actualFromBill,
      finalDaily,
      usageSource,
      consumptionNote,
      overnightUsage,
      peakTime,
      annualConsumption: finalDaily * 365,
    };
  };

  const analyzeRoofAndConsumption = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Calculate consumption profile
      const consumption = calculateConsumption();
      setConsumptionAnalysis(consumption);
      
      // Step 2: Call Google Solar API via our backend
      const response = await fetch('/api/solar-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: data?.address,
          sessionId: data?.sessionId,
          quoteId: data?.quoteId,
          leadId: (data as any)?.leadId
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.error ?? 'Failed to analyze roof');
      }

      const analysisData = result.analysis;
      setRoofData(analysisData);
      
      // Analyze roof segments if available
      if (analysisData?.roofSegments && Array.isArray(analysisData.roofSegments)) {
        const segments = analyzeRoofSegments(
          analysisData.roofSegments, 
          analysisData?.panelCapacityWatts || 440
        );
        setRoofSegments(segments);
      }
      
      // Generate intelligent configurations for Step 4
      // CRITICAL: Must handle 0 values from Google API explicitly
      const roofAnalysisData = {
        maxArrayPanelsCount: analysisData?.maxArrayPanelsCount || 30,
        maxArrayAreaMeters2: analysisData?.maxArrayAreaMeters2 || 100,
        maxSunshineHoursPerYear: analysisData?.maxSunshineHoursPerYear || 5.5,
        panelCapacityWatts: analysisData?.panelCapacityWatts || 440,
        roofSegments: analysisData?.roofSegments ?? [],
        financialAnalyses: analysisData?.financialAnalyses ?? [],
        carbonOffsetKgPerMwh: analysisData?.carbonOffsetKgPerMwh || 680
      };
      
      const userProfile = {
        quarterlyBill: data?.quarterlyBill ?? 0,
        usagePattern: data?.usagePattern as any,
        hasEv: data?.hasEv,
        planningEv: data?.planningEv,
        evCount: data?.evCount,
        bedrooms: data?.bedrooms,
        hasPool: data?.hasPool,
        poolHeated: data?.poolHeated,
        homeOffices: data?.homeOffices,
        hvacUsage: data?.hvacUsage as any,
        hasElectricHotWater: data?.hasElectricHotWater,
        // CRITICAL: Pass actual consumption values from Step 3
        dailyConsumption: consumption.finalDaily,
        overnightUsage: consumption.overnightUsage
      };
      
      const configs = await generateConfigurations(roofAnalysisData, userProfile);
      
      // Store roof data, consumption analysis, and configurations for next step
      // Use corrected roofAnalysisData (not raw result) to ensure fallback values are used
      const combinedData = {
        roofArea: roofAnalysisData.maxArrayAreaMeters2,
        solarIrradiance: roofAnalysisData.maxSunshineHoursPerYear,
        // Store corrected analysis data for Step 4
        roofAnalysisData: roofAnalysisData,
        configurations: configs,
        roofSegments: roofSegments,
        // Store Google financial analyses for later use
        financialAnalyses: result?.financialAnalyses ?? [],
        // Store consumption analysis
        consumptionAnalysis: consumption,
        // Key figures for all future steps
        dailyConsumption: consumption.finalDaily,
        annualConsumption: consumption.annualConsumption,
        overnightUsage: consumption.overnightUsage,
        usageSource: consumption.usageSource,
        consumptionNote: consumption.consumptionNote,
        peakTime: consumption.peakTime,
        // Store breakdown for transparency
        billBasedDaily: consumption.actualFromBill,
        profileBasedDaily: consumption.totalCalculated,
      };
      
      updateData(combinedData);
      
      // Save complete analysis data to database (progressive quote saving)
      // This ensures all future steps have access to these calculated figures
      try {
        await fetch('/api/quotes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data?.sessionId,
            quoteId: data?.quoteId,
            // Roof analysis
            roofAnalysisData: roofAnalysisData,
            roofArea: roofAnalysisData.maxArrayAreaMeters2,
            solarIrradiance: roofAnalysisData.maxSunshineHoursPerYear,
            configurations: configs,
            roofSegments: roofSegments,
            financialAnalyses: result?.financialAnalyses ?? [],
            // Consumption analysis - CRITICAL for all future calculations
            dailyConsumption: consumption.finalDaily,
            annualConsumption: consumption.annualConsumption,
            overnightUsage: consumption.overnightUsage,
            usageSource: consumption.usageSource,
            peakTime: consumption.peakTime,
            consumptionBreakdown: consumption.breakdown,
          }),
        });
      } catch (error) {
        console.error('Error saving analysis data:', error);
        // Continue anyway - don't block user
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Roof analysis error:', err);
      setError(err?.message ?? 'Unable to analyze roof');
      
      // Fallback: Use estimated values
      updateData({
        roofArea: 100,
        solarIrradiance: 5.5,
        roofAnalysisData: null,
      });
      
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 animate-fade-in text-center">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-coral/20 rounded-full blur-xl animate-pulse"></div>
          <Loader2 className="relative h-20 w-20 animate-spin text-coral mx-auto" />
        </div>
        <h2 className="text-3xl font-bold text-primary mb-4">
          🛰️ Analyzing Your Roof with AI...
        </h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          We're using satellite imagery and artificial intelligence to analyze your roof's solar potential in real-time.
        </p>
        
        <div className="space-y-4 max-w-sm mx-auto">
          {[
            { icon: Home, text: 'Measuring roof dimensions', delay: '0s' },
            { icon: Sun, text: 'Calculating sun exposure patterns', delay: '0.5s' },
            { icon: Activity, text: 'Analyzing shading and obstructions', delay: '1s' },
            { icon: MapPin, text: 'Identifying roof segments', delay: '1.5s' }
          ].map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx} 
                className="flex items-center text-left bg-gradient-to-r from-emerald-50 to-white rounded-xl p-4 shadow-sm animate-slide-in-left"
                style={{ animationDelay: step.delay }}
              >
                <div className="h-10 w-10 rounded-full bg-gradient-emerald flex items-center justify-center mr-4 flex-shrink-0">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{step.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-emerald rounded-full p-2 mr-3">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-primary">
              Complete Property Analysis ✅
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Roof potential and current energy consumption analyzed
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONSUMPTION ANALYSIS - Top Priority */}
      {consumptionAnalysis && (
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center">
              <Activity className="h-6 w-6 mr-2" />
              Your Current Energy Consumption
            </h3>

            {/* Big Number - Daily Usage */}
            <div className="text-center mb-6">
              <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Estimated Daily Usage</p>
                <p className="text-6xl font-bold text-primary mb-2">
                  {consumptionAnalysis.finalDaily.toFixed(1)}
                </p>
                <p className="text-2xl text-gray-700 font-semibold">kWh per day</p>
                {consumptionAnalysis.usageSource === 'actual' && (
                  <div className="mt-4 inline-block bg-emerald-100 border border-emerald-300 rounded-full px-4 py-2">
                    <p className="text-sm font-bold text-emerald-700">
                      ✓ Based on your actual bill data
                    </p>
                  </div>
                )}
                {consumptionAnalysis.usageSource === 'calculated' && (
                  <div className="mt-4 inline-block bg-amber-100 border border-amber-300 rounded-full px-4 py-2">
                    <p className="text-sm font-bold text-amber-700">
                      ⚡ Estimated from household characteristics
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Consumption Breakdown */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Daily Usage Breakdown
                </h4>
                <div className="space-y-3">
                  {consumptionAnalysis.breakdown.baseHousehold > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Base Household ({data?.bedrooms} bedrooms)</span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {consumptionAnalysis.breakdown.baseHousehold.toFixed(1)} kWh
                      </span>
                    </div>
                  )}
                  {consumptionAnalysis.breakdown.pool > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Waves className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">
                          Pool {data?.poolHeated ? '(Heated)' : ''}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {consumptionAnalysis.breakdown.pool.toFixed(1)} kWh
                      </span>
                    </div>
                  )}
                  {consumptionAnalysis.breakdown.ev > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm text-gray-700">
                          EV Charging ({data?.evCount} {data?.evCount === 1 ? 'vehicle' : 'vehicles'})
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {consumptionAnalysis.breakdown.ev.toFixed(1)} kWh
                      </span>
                    </div>
                  )}
                  {consumptionAnalysis.breakdown.hotWater > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-coral" />
                        <span className="text-sm text-gray-700">Electric Hot Water</span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {consumptionAnalysis.breakdown.hotWater.toFixed(1)} kWh
                      </span>
                    </div>
                  )}
                  {consumptionAnalysis.breakdown.hvac > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-sky-600" />
                        <span className="text-sm text-gray-700">Air Conditioning / HVAC</span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {consumptionAnalysis.breakdown.hvac.toFixed(1)} kWh
                      </span>
                    </div>
                  )}
                  {consumptionAnalysis.breakdown.homeOffices > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-gray-700">Home Office(s)</span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {consumptionAnalysis.breakdown.homeOffices.toFixed(1)} kWh
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Usage Pattern Insights
                </h4>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Annual Consumption</p>
                    <p className="text-3xl font-bold text-primary">
                      {Math.round(consumptionAnalysis.annualConsumption).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">kWh per year</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Overnight Usage (6pm-6am)</p>
                    <p className="text-3xl font-bold text-primary">
                      {consumptionAnalysis.overnightUsage.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">kWh per night</p>
                    <p className="text-xs text-blue-600 mt-2">
                      <Battery className="inline h-3 w-3 mr-1" />
                      Used for battery sizing
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Peak Usage Time</p>
                    <p className="text-lg font-bold text-primary capitalize">
                      {consumptionAnalysis.peakTime.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison if we have both calculated and actual */}
            {consumptionAnalysis.usageSource === 'actual' && consumptionAnalysis.totalCalculated > 0 && (
              <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-gray-800 mb-3 text-sm">📊 Actual vs. Estimated Comparison</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">From Your Bill</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {consumptionAnalysis.actualFromBill.toFixed(1)} kWh/day
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">From Household Profile</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {consumptionAnalysis.totalCalculated.toFixed(1)} kWh/day
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  {Math.abs(consumptionAnalysis.actualFromBill - consumptionAnalysis.totalCalculated) < 5 
                    ? '✓ Close match - your bill aligns with household characteristics' 
                    : consumptionAnalysis.actualFromBill > consumptionAnalysis.totalCalculated
                    ? '⚡ Higher than expected - you may have additional energy demands'
                    : '💡 Lower than expected - you may have efficient appliances or usage habits'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confidence Indicator */}
      {roofData && !roofData?.estimated && (
        <div className="mb-6">
          <ConfidenceIndicator
            level={roofData?.confidenceLevel || 'MEDIUM'}
            imageryDate={roofData?.imageryDate}
            imageryQuality={roofData?.imageryQuality}
            imageryAgeInDays={roofData?.imageryAgeInDays}
          />
        </div>
      )}


      {/* Satellite Roof Visualization */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-primary-50 via-white to-primary-50 p-6 rounded-xl border-2 border-primary-100 shadow-lg">
          <h3 className="font-bold text-primary mb-4 flex items-center text-lg">
            <Home className="h-5 w-5 mr-2" />
            Your Property
          </h3>
          
          {/* Satellite Imagery */}
          {roofData && roofData?.latitude && roofData?.longitude ? (
            <>
              <RoofVisualization
                latitude={roofData.latitude}
                longitude={roofData.longitude}
                roofArea={data?.roofArea ?? 100}
              />
              
              <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mt-4 shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-bold text-emerald-900 mb-1">
                      🛰️ Real Satellite Imagery of Your Roof
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      This is your actual property captured by satellite. We use this real imagery combined with AI 
                      analysis to accurately determine your roof's solar potential, orientation, and shading factors.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-md">
              <Image
                src="/images/solar_installation.jpg"
                alt="Professional solar panel installation"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
          )}

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start mt-4">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>Satellite imagery not available for this address. Using estimated values based on typical Perth properties.</span>
            </div>
          )}
        </div>
      </div>

      {/* Simplified Roof Analysis - 2 Column Grid */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-primary mb-4 flex items-center">
          <Sun className="h-5 w-5 mr-2" />
          Your Roof's Solar Potential
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Roof Space */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-6 shadow-lg">
            <h4 className="text-sm font-bold text-primary mb-4 flex items-center">
              <Home className="h-4 w-4 mr-2" />
              Available Roof Space
            </h4>
            
            <div className="text-center bg-white rounded-lg p-6 shadow-md">
              <p className="text-5xl font-bold text-primary mb-2">
                {(roofData?.maxArrayAreaMeters2 || 100).toFixed(1)}m²
              </p>
              <p className="text-sm text-gray-600">suitable for solar panels</p>
            </div>
          </div>

          {/* Solar Exposure */}
          <div className="bg-gradient-to-br from-gold-50 to-yellow-50 border-2 border-gold-200 rounded-xl p-6 shadow-lg">
            <h4 className="text-sm font-bold text-primary mb-4 flex items-center">
              <Sun className="h-4 w-4 mr-2" />
              Daily Sunshine Hours
            </h4>
            
            <div className="text-center bg-white rounded-lg p-6 shadow-md">
              <p className="text-5xl font-bold text-gold mb-2">
                {((roofData?.maxSunshineHoursPerYear || 2920) / 365).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">hours per day average</p>
            </div>
          </div>
        </div>
      </div>


      {/* Detailed Roof Segment Analysis (if available) */}
      {roofSegments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-primary mb-4 flex items-center">
            <Compass className="h-5 w-5 mr-2" />
            Detailed Roof Segment Analysis
          </h3>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-bold text-gray-800">
                  {roofSegments.length} Roof Segment{roofSegments.length > 1 ? 's' : ''} Identified
                </h4>
                <p className="text-sm text-gray-600">
                  Each segment analyzed for orientation, pitch, and sun exposure
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {roofSegments.map((segment, idx) => (
              <SegmentCard
                key={idx}
                number={idx + 1}
                area={segment.areaMeters2}
                orientation={segment.orientation}
                pitch={segment.pitchDegrees}
                sunHours={segment.avgSunshineHours}
                recommendedPanels={segment.maxPanels}
                pitchRating={segment.pitchRating}
              />
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-6">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Overall Summary
            </h4>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Roof Area</p>
                <p className="text-2xl font-bold text-primary">
                  {roofSegments.reduce((sum, s) => sum + s.areaMeters2, 0).toFixed(1)}m²
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Combined Capacity</p>
                <p className="text-2xl font-bold text-coral">
                  {roofSegments.reduce((sum, s) => sum + s.maxPanels, 0)} panels
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Avg. Sun Hours/Day</p>
                <p className="text-2xl font-bold text-gold">
                  {(roofSegments.reduce((sum, s) => sum + s.avgSunshineHours, 0) / roofSegments.length).toFixed(1)} hrs
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Best Orientation</p>
                <p className="text-2xl font-bold text-emerald">
                  {roofSegments.find(s => s.orientation.includes('⭐⭐⭐'))?.orientation.split(' ')[0] || 'Mixed'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
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
        
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Ready to see your options?</p>
          <Button 
            type="button"
            size="lg"
            onClick={nextStep}
            className="bg-gradient-primary hover:opacity-90 text-white px-8 shadow-lg"
          >
            View System Recommendations
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
