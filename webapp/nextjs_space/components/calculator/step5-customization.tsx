
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sun, Battery, Zap, DollarSign, Sparkles, Loader2, Check } from 'lucide-react';
import { CalculatorData } from './calculator-flow';
import { formatCurrency } from '@/lib/calculations';
import { Slider } from '@/components/ui/slider';

interface Step5Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

// Simple quote structure from database
interface SavedQuote {
  id: string;
  sessionId: string;
  
  // System details
  systemSizeKw: number;
  panelCount: number;
  batterySizeKwh: number;
  
  // Brands
  panelBrandId: string;
  panelBrandName: string;
  panelBrandWattage: number;
  panelBrandTier: string;
  
  batteryBrandId: string | null;
  batteryBrandName: string | null;
  batteryBrandCapacity: number | null;
  batteryBrandTier: string | null;
  
  inverterBrandId: string;
  inverterBrandName: string;
  inverterBrandCapacity: number;
  inverterBrandTier: string;
  
  // Costs
  panelSystemCost: number;
  batteryCost: number;
  inverterCost: number;
  installationCost: number;
  totalCostBeforeRebates: number;
  
  // Rebates
  federalSolarRebate: number;
  federalBatteryRebate: number;
  stateBatteryRebate: number;
  totalRebates: number;
  
  // Final
  totalCostAfterRebates: number;
  depositAmount: number;
  
  // Savings & ROI
  annualSavings: number;
  paybackYears: number;
  year10Savings?: number;
  year25Savings?: number;
  
  // Environmental
  co2SavedPerYear: number;
  equivalentTrees: number;
  equivalentCars: number;
}

interface BrandOption {
  id: string;
  name: string;
  manufacturer: string;
  wattage?: number;
  capacityKwh?: number;
  capacityKw?: number;
  tier: string;
  warrantyYears: number;
  features?: string[];
}

export function Step5Customization({ data, updateData, nextStep, prevStep }: Step5Props) {
  // State
  const [quote, setQuote] = useState<SavedQuote | null>(null);
  const [brands, setBrands] = useState<{
    panelBrands: BrandOption[];
    batteryBrands: BrandOption[];
    inverterBrands: BrandOption[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Temporary selections (before saving)
  const [selectedBatterySize, setSelectedBatterySize] = useState<number>(0);
  const [selectedPanelBrandId, setSelectedPanelBrandId] = useState<string>('');
  const [selectedBatteryBrandId, setSelectedBatteryBrandId] = useState<string>('');
  const [selectedInverterBrandId, setSelectedInverterBrandId] = useState<string>('');
  
  // UI state
  const [expandedSection, setExpandedSection] = useState<'panels' | 'battery' | 'inverter' | null>(null);

  // Load quote and brands on mount
  useEffect(() => {
    loadQuoteAndBrands();
  }, []);

  async function loadQuoteAndBrands() {
    try {
      setLoading(true);
      
      if (!data.quoteId) {
        alert('Error: No quote found. Please go back and complete Step 4.');
        return;
      }

      // Fetch saved quote from database
      const quoteRes = await fetch(`/api/quote/get?quoteId=${data.quoteId}`);
      const quoteData = await quoteRes.json();
      
      if (!quoteData.success || !quoteData.quote) {
        alert('Failed to load quote. Please go back and try again.');
        return;
      }

      setQuote(quoteData.quote);
      
      // Initialize selections from saved quote
      setSelectedBatterySize(quoteData.quote.batterySizeKwh);
      setSelectedPanelBrandId(quoteData.quote.panelBrandId);
      setSelectedBatteryBrandId(quoteData.quote.batteryBrandId || '');
      setSelectedInverterBrandId(quoteData.quote.inverterBrandId);

      // Fetch available brands
      const brandsRes = await fetch('/api/calculator/brands');
      const brandsData = await brandsRes.json();
      setBrands(brandsData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handle recalculation when user changes selections
  async function handleRecalculate() {
    if (!quote || !data.roofAnalysisData) return;
    
    try {
      setUpdating(true);

      // Call calculation API
      const calcRes = await fetch('/api/calculate-complete-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleSolarData: {
            maxArrayPanelsCount: quote.panelCount,
            maxArrayAreaMeters2: data.roofAnalysisData.maxArrayAreaMeters2,
            maxSunshineHoursPerYear: data.roofAnalysisData.maxSunshineHoursPerYear,
            panelCapacityWatts: data.roofAnalysisData.panelCapacityWatts,
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
          batterySizeKwh: selectedBatterySize,
          panelBrandId: selectedPanelBrandId,
          batteryBrandId: selectedBatteryBrandId || null,
          inverterBrandId: selectedInverterBrandId || null,
        }),
      });

      const calcData = await calcRes.json();
      
      if (!calcData.success) {
        alert('Calculation failed. Please try again.');
        return;
      }

      const calculatedQuote = calcData.quote;

      // Save updated quote
      const saveRes = await fetch('/api/quote/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: quote.sessionId,
          leadId: data.leadId || null,
          
          systemSizeKw: quote.systemSizeKw,
          panelCount: quote.panelCount,
          batterySizeKwh: selectedBatterySize,
          
          panelBrandId: calculatedQuote.panelBrand.id,
          panelBrandName: calculatedQuote.panelBrand.name,
          panelBrandWattage: calculatedQuote.panelBrand.wattage,
          panelBrandTier: calculatedQuote.panelBrand.tier,
          
          batteryBrandId: calculatedQuote.batteryBrand?.id || null,
          batteryBrandName: calculatedQuote.batteryBrand?.name || null,
          batteryBrandCapacity: calculatedQuote.batteryBrand?.capacityKwh || null,
          batteryBrandTier: calculatedQuote.batteryBrand?.tier || null,
          
          inverterBrandId: calculatedQuote.inverterBrand.id,
          inverterBrandName: calculatedQuote.inverterBrand.name,
          inverterBrandCapacity: calculatedQuote.inverterBrand.capacityKw,
          inverterBrandTier: calculatedQuote.inverterBrand.tier,
          
          panelSystemCost: calculatedQuote.costs.panelSystem,
          batteryCost: calculatedQuote.costs.battery,
          inverterCost: calculatedQuote.costs.inverter,
          installationCost: calculatedQuote.costs.installation,
          totalCostBeforeRebates: calculatedQuote.costs.totalBeforeRebates,
          
          federalSolarRebate: calculatedQuote.rebates.federalSolar,
          federalBatteryRebate: calculatedQuote.rebates.federalBattery,
          stateBatteryRebate: calculatedQuote.rebates.stateBattery,
          totalRebates: calculatedQuote.rebates.total,
          
          totalCostAfterRebates: calculatedQuote.totalCostAfterRebates,
          upfrontPayment: calculatedQuote.totalCostAfterRebates,
          depositAmount: calculatedQuote.payment.depositAmount,
          depositPercentage: calculatedQuote.payment.depositPercentage,
          installmentMonths: calculatedQuote.payment.installmentMonths,
          monthlyPayment: calculatedQuote.payment.monthlyPayment,
          
          annualSavings: calculatedQuote.savings.total,
          year10Savings: calculatedQuote.savings.year10,
          year25Savings: calculatedQuote.savings.year25,
          paybackYears: calculatedQuote.roi.paybackYears,
          roi: calculatedQuote.roi.percentageReturn,
          
          co2SavedPerYear: calculatedQuote.environmental.co2SavedPerYear,
          equivalentTrees: calculatedQuote.environmental.equivalentTrees,
          equivalentCars: calculatedQuote.environmental.equivalentCars,
          
          quarterlyBill: calculatedQuote.usage.quarterlyBill,
          dailyUsage: calculatedQuote.usage.dailyUsageKwh,
          annualConsumption: calculatedQuote.usage.dailyUsageKwh * 365,
          usageSource: calculatedQuote.usage.source,
          
          householdSize: data.householdSize || 4,
          bedrooms: data.bedrooms || null,
          usagePattern: data.usagePattern || null,
          hasElectricHotWater: data.hasElectricHotWater || false,
          hasPool: data.hasPool || false,
          poolHeated: data.poolHeated || false,
          homeOffices: data.homeOffices || 0,
          hvacUsage: data.hvacUsage || 'moderate',
          
          hasEv: data.hasEv || false,
          planningEv: data.planningEv || false,
          evCount: data.evCount || 0,
          evChargingTime: data.evChargingTime || null,
          evUsageTier: data.evUsageTier || null,
        }),
      });

      const saveData = await saveRes.json();
      
      if (saveData.success) {
        // Reload quote to show updated values
        await loadQuoteAndBrands();
      } else {
        alert('Failed to save changes. Please try again.');
      }
      
    } catch (error) {
      console.error('Error recalculating:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  }

  function handleContinue() {
    if (!quote) {
      alert('Please wait for data to load.');
      return;
    }
    nextStep();
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">Failed to load quote. Please go back and try again.</p>
          <Button onClick={prevStep} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-3 flex items-center">
          <Sparkles className="h-8 w-8 mr-3 text-coral" />
          Customize Your System
        </h2>
        <p className="text-gray-600 text-lg">
          Fine-tune your solar system with premium brand options and battery sizing.
        </p>
      </div>

      {/* System Summary */}
      <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl p-6 mb-8 border-2 border-primary-200">
        <div className="flex items-center gap-2 mb-4">
          <Check className="h-5 w-5 text-emerald" />
          <h3 className="font-bold text-primary text-lg">Your Selected System: Usage Matched</h3>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <Sun className="h-6 w-6 text-gold mb-2" />
            <p className="text-xs text-gray-600 mb-1">Solar Panels</p>
            <p className="text-xl font-bold text-primary">{quote.panelCount} panels</p>
            <p className="text-xs text-gray-500">{quote.systemSizeKw}kW system</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <Battery className="h-6 w-6 text-emerald mb-2" />
            <p className="text-xs text-gray-600 mb-1">Battery Storage</p>
            <p className="text-xl font-bold text-primary">{quote.batterySizeKwh}kWh</p>
            <p className="text-xs text-gray-500">With backup power</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <Zap className="h-6 w-6 text-coral mb-2" />
            <p className="text-xs text-gray-600 mb-1">Annual Production</p>
            <p className="text-xl font-bold text-primary">{Math.round(quote.systemSizeKw * 1450).toLocaleString()}</p>
            <p className="text-xs text-gray-500">kWh per year</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <DollarSign className="h-6 w-6 text-gold mb-2" />
            <p className="text-xs text-gray-600 mb-1">Annual Savings</p>
            <p className="text-xl font-bold text-emerald">{formatCurrency(quote.annualSavings)}</p>
            <p className="text-xs text-gray-500">per year</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-navy to-navy-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">System Investment</p>
          <p className="text-3xl font-bold">{formatCurrency(quote.totalCostAfterRebates)}</p>
          <p className="text-sm opacity-75 mt-1">After rebates</p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald to-emerald-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Payback Period</p>
          <p className="text-3xl font-bold">{quote.paybackYears.toFixed(1)} years</p>
          <p className="text-sm opacity-75 mt-1">Return on investment</p>
        </div>
        
        <div className="bg-gradient-to-br from-gold to-gold-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">25-Year Savings</p>
          <p className="text-3xl font-bold">{formatCurrency(quote.year25Savings || quote.annualSavings * 25)}</p>
          <p className="text-sm opacity-75 mt-1">After rebates value</p>
        </div>
      </div>

      {/* Brand Selection Sections */}
      <div className="space-y-4 mb-8">
        {/* Solar Panels */}
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'panels' ? null : 'panels')}
            className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sun className="h-6 w-6 text-gold" />
              <div className="text-left">
                <p className="font-bold text-primary">Solar Panels</p>
                <p className="text-sm text-gray-600">{quote.panelBrandName}</p>
              </div>
            </div>
            <span className="text-gray-400">
              {expandedSection === 'panels' ? '▲' : '▼'}
            </span>
          </button>
          
          {expandedSection === 'panels' && brands && (
            <div className="p-4 bg-white space-y-2">
              {brands.panelBrands.map((brand) => (
                <label
                  key={brand.id}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPanelBrandId === brand.id
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="panel-brand"
                    value={brand.id}
                    checked={selectedPanelBrandId === brand.id}
                    onChange={(e) => setSelectedPanelBrandId(e.target.value)}
                    className="text-primary"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{brand.name}</p>
                    <p className="text-sm text-gray-600">
                      {brand.wattage}W · {brand.tier} · {brand.warrantyYears} year warranty
                    </p>
                  </div>
                </label>
              ))}
              <Button 
                onClick={handleRecalculate} 
                disabled={updating || selectedPanelBrandId === quote.panelBrandId}
                className="w-full mt-4"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Selection
              </Button>
            </div>
          )}
        </div>

        {/* Battery Storage */}
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'battery' ? null : 'battery')}
            className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Battery className="h-6 w-6 text-emerald" />
              <div className="text-left">
                <p className="font-bold text-primary">Battery Storage</p>
                <p className="text-sm text-gray-600">
                  {quote.batterySizeKwh}kWh - {quote.batteryBrandName || 'No brand selected'}
                </p>
              </div>
            </div>
            <span className="text-gray-400">
              {expandedSection === 'battery' ? '▲' : '▼'}
            </span>
          </button>
          
          {expandedSection === 'battery' && brands && (
            <div className="p-4 bg-white space-y-4">
              {/* Battery Size Slider */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Battery Size: {selectedBatterySize}kWh
                </label>
                <Slider
                  value={[selectedBatterySize]}
                  onValueChange={(values) => setSelectedBatterySize(values[0])}
                  min={0}
                  max={50}
                  step={1}
                  className="mb-4"
                />
                <p className="text-xs text-gray-500">
                  Adjust battery capacity to match your backup power needs
                </p>
              </div>

              {/* Battery Brand Selection */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Select Brand:</p>
                {brands.batteryBrands
                  .filter(b => !b.capacityKwh || b.capacityKwh <= selectedBatterySize + 5)
                  .map((brand) => (
                    <label
                      key={brand.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedBatteryBrandId === brand.id
                          ? 'border-primary bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="battery-brand"
                        value={brand.id}
                        checked={selectedBatteryBrandId === brand.id}
                        onChange={(e) => setSelectedBatteryBrandId(e.target.value)}
                        className="text-primary"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{brand.name}</p>
                        <p className="text-sm text-gray-600">
                          {brand.capacityKwh}kWh · {brand.tier} · {brand.warrantyYears} year warranty
                        </p>
                      </div>
                    </label>
                  ))}
              </div>

              <Button 
                onClick={handleRecalculate} 
                disabled={updating || (selectedBatterySize === quote.batterySizeKwh && selectedBatteryBrandId === quote.batteryBrandId)}
                className="w-full mt-4"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Battery
              </Button>
            </div>
          )}
        </div>

        {/* Inverter */}
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'inverter' ? null : 'inverter')}
            className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-coral" />
              <div className="text-left">
                <p className="font-bold text-primary">Inverter</p>
                <p className="text-sm text-gray-600">{quote.inverterBrandName}</p>
              </div>
            </div>
            <span className="text-gray-400">
              {expandedSection === 'inverter' ? '▲' : '▼'}
            </span>
          </button>
          
          {expandedSection === 'inverter' && brands && (
            <div className="p-4 bg-white space-y-2">
              {brands.inverterBrands.map((brand) => (
                <label
                  key={brand.id}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedInverterBrandId === brand.id
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="inverter-brand"
                    value={brand.id}
                    checked={selectedInverterBrandId === brand.id}
                    onChange={(e) => setSelectedInverterBrandId(e.target.value)}
                    className="text-primary"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{brand.name}</p>
                    <p className="text-sm text-gray-600">
                      {brand.capacityKw}kW · {brand.tier} · {brand.warrantyYears} year warranty
                    </p>
                  </div>
                </label>
              ))}
              <Button 
                onClick={handleRecalculate} 
                disabled={updating || selectedInverterBrandId === quote.inverterBrandId}
                className="w-full mt-4"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Selection
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Complete Cost Breakdown */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h3 className="font-bold text-primary text-lg mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Complete Cost Breakdown
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">
              {quote.panelBrandName} ({quote.systemSizeKw}kW)
            </span>
            <span className="font-semibold">{formatCurrency(quote.panelSystemCost)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700">
              {quote.batteryBrandName} {quote.batterySizeKwh}kWh ({quote.batterySizeKwh}kWh)
            </span>
            <span className="font-semibold">{formatCurrency(quote.batteryCost)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700">{quote.inverterBrandName}</span>
            <span className="font-semibold">{formatCurrency(quote.inverterCost)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Professional Installation</span>
            <span className="font-semibold">{formatCurrency(quote.installationCost)}</span>
          </div>
          
          <div className="border-t-2 border-gray-300 pt-3 mt-3">
            <div className="flex justify-between items-center font-bold">
              <span>Total Before Rebates</span>
              <span>{formatCurrency(quote.totalCostBeforeRebates)}</span>
            </div>
          </div>
          
          {/* Rebates Section */}
          <div className="bg-emerald-50 rounded-lg p-4 mt-4">
            <p className="font-semibold text-emerald-800 mb-2 flex items-center">
              <Check className="h-4 w-4 mr-2" />
              Available Rebates & Incentives
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700">Federal SRES (Small-scale Renewable Energy Scheme)</span>
                <span className="font-semibold text-emerald-800">-{formatCurrency(quote.federalSolarRebate)}</span>
              </div>
              
              {quote.federalBatteryRebate > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-700">Federal Battery Incentive (30%)</span>
                  <span className="font-semibold text-emerald-800">-{formatCurrency(quote.federalBatteryRebate)}</span>
                </div>
              )}
              
              {quote.stateBatteryRebate > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-700">State Battery Rebate</span>
                  <span className="font-semibold text-emerald-800">-{formatCurrency(quote.stateBatteryRebate)}</span>
                </div>
              )}
            </div>
            
            <div className="border-t border-emerald-200 mt-3 pt-3">
              <div className="flex justify-between items-center font-bold text-emerald-900">
                <span>Total Rebates</span>
                <span>-{formatCurrency(quote.totalRebates)}</span>
              </div>
            </div>
          </div>
          
          {/* Final Investment */}
          <div className="bg-gradient-to-r from-navy to-navy-600 rounded-lg p-6 mt-4">
            <div className="flex justify-between items-center text-white">
              <div>
                <p className="text-sm opacity-90 mb-1">Your Investment</p>
                <p className="text-3xl font-bold">{formatCurrency(quote.totalCostAfterRebates)}</p>
                <p className="text-sm opacity-75 mt-1">
                  With {formatCurrency(quote.annualSavings)} annual savings
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90 mb-1">Payback Period</p>
                <p className="text-3xl font-bold">{quote.paybackYears.toFixed(1)}</p>
                <p className="text-sm opacity-75 mt-1">years</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-6 mb-8 border-2 border-emerald-200">
        <h3 className="font-bold text-emerald-800 text-lg mb-4">Environmental Impact</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">{quote.co2SavedPerYear.toFixed(1)}t</p>
            <p className="text-sm text-gray-600">CO₂ saved per year</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">{Math.round(quote.equivalentTrees)}</p>
            <p className="text-sm text-gray-600">Equivalent trees planted</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">{quote.equivalentCars.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Cars off the road</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={prevStep}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <Button
          onClick={handleContinue}
          disabled={updating}
          className="flex items-center gap-2 bg-primary hover:bg-primary-600"
        >
          Continue to Summary
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
