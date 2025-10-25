'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, TrendingUp, DollarSign, Battery, Leaf, Car as CarIcon, Package, Zap, Info, Loader2, CheckCircle } from 'lucide-react';
import { CalculatorData } from './calculator-flow';
import { formatCurrency, formatNumber } from '@/lib/calculations';

interface Step6Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function Step6Financial({ data, updateData, nextStep, prevStep }: Step6Props) {
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [savedQuote, setSavedQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  
  // Handle continue - save payment preference and move to next step
  const handleContinue = async () => {
    // Save payment preference if selected
    if (data?.paymentPreference) {
      try {
        await fetch('/api/quote/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data?.sessionId,
            quoteId: data?.quoteId,
            paymentPreference: data.paymentPreference,
            financeMonths: data.financeMonths || 24,
          }),
        });
      } catch (error) {
        console.error('Error saving payment preference:', error);
      }
    }
    nextStep();
  };

  // Fetch saved quote on mount
  useEffect(() => {
    fetchSavedQuote();
    fetchPaymentSettings();
  }, []);
  
  const fetchSavedQuote = async () => {
    // CRITICAL FIX: ALWAYS fetch from database, NEVER use passed computed values
    // This ensures single source of truth from the database
    
    if (!data?.quoteId && !data?.sessionId) {
      console.error('No quote ID or session ID available');
      setLoadingQuote(false);
      return;
    }
    
    try {
      const params = new URLSearchParams();
      if (data.quoteId) params.append('quoteId', data.quoteId);
      else if (data.sessionId) params.append('sessionId', data.sessionId);
      
      const response = await fetch(`/api/quote/get?${params}`);
      const result = await response.json();
      
      if (result.success && result.quote) {
        setSavedQuote(result.quote);
      } else {
        console.error('Failed to fetch quote:', result.error);
      }
    } catch (error) {
      console.error('Error fetching saved quote:', error);
    } finally {
      setLoadingQuote(false);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/payment-settings');
      const data = await response.json();
      setPaymentSettings(data);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      // Set defaults if fetch fails
      setPaymentSettings({
        depositPercentage: 10,
        installmentMonths: 24,
      });
    }
  };

  // PHASE 4: Display environmental impact from saved quote (no calculations)
  // All environmental impact values are pre-calculated in the centralized API
  const co2SavedPerYear = savedQuote?.co2SavedPerYear ? Number(savedQuote.co2SavedPerYear).toFixed(1) : '0.0';
  const equivalentTrees = savedQuote?.equivalentTrees ? Number(savedQuote.equivalentTrees) : 0;
  const equivalentCars = savedQuote?.equivalentCars ? Number(savedQuote.equivalentCars) : 0;

  // Show loading state
  if (loadingQuote) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-gray-600">Loading your quote...</p>
        </div>
      </div>
    );
  }

  // Show error if no quote available
  if (!savedQuote) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-500 mb-4">
            <Info className="h-12 w-12" />
          </div>
          <p className="text-gray-600 mb-4">Unable to load quote. Please go back and try again.</p>
          <Button onClick={prevStep} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in max-w-6xl mx-auto">
      {/* HUGE REBATES BANNER */}
      {savedQuote.totalRebates > 15000 && (
        <div className="mb-8 bg-gradient-to-r from-gold via-gold-400 to-gold rounded-2xl p-8 shadow-2xl border-4 border-gold-300 animate-fade-in">
          <div className="text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
              <p className="text-white font-bold text-sm tracking-wide">🎉 AMAZING NEWS!</p>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-3 drop-shadow-lg">
              ${Math.round(savedQuote.totalRebates).toLocaleString()}+
            </h2>
            <p className="text-2xl md:text-3xl font-bold text-white/95 mb-4">
              in Government Rebates Available!
            </p>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              You qualify for significant Federal and State rebates that will dramatically reduce your investment cost.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm text-white/80">Federal SRES</p>
                <p className="text-xl font-bold text-white">{formatCurrency(savedQuote.federalSolarRebate)}</p>
              </div>
              {savedQuote.federalBatteryRebate > 0 && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-sm text-white/80">Federal Battery (30%)</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(savedQuote.federalBatteryRebate)}</p>
                </div>
              )}
              {savedQuote.stateBatteryRebate > 0 && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-sm text-white/80">WA Battery Scheme</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(savedQuote.stateBatteryRebate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-3">
          Your Complete Savings Report
        </h2>
        <p className="text-gray-600">
          Review your personalized solar system and savings projections.
        </p>
      </div>

      {/* Package Details - What's Included */}
      <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl p-6 mb-8 border-2 border-primary-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-primary text-xl flex items-center">
            <Package className="h-6 w-6 mr-2" />
            Your Solar Package
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            className="text-primary border-primary hover:bg-primary hover:text-white"
          >
            ← Change Configuration
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - System Components */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-primary-100">
              <div className="flex items-start">
                <div className="bg-primary rounded-lg p-2 mr-3">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary mb-1">Solar Panels</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {savedQuote.panelCount} × {savedQuote.panelBrandWattage}W {savedQuote.panelBrandName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total System: {Number(savedQuote.systemSizeKw).toFixed(2)}kW
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-primary-100">
              <div className="flex items-start">
                <div className="bg-coral rounded-lg p-2 mr-3">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary mb-1">Inverter</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {savedQuote.inverterBrandName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {savedQuote.inverterBrandCapacity}kW
                  </p>
                </div>
              </div>
            </div>

            {savedQuote.batterySizeKwh > 0 && (
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="flex items-start">
                  <div className="bg-emerald rounded-lg p-2 mr-3">
                    <Battery className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-primary mb-1">Battery Storage</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {savedQuote.batteryBrandName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {savedQuote.batterySizeKwh}kWh capacity
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Installation */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-primary-100">
              <h4 className="font-semibold text-primary mb-3">Installation Includes:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-emerald mr-2">✓</span>
                  <span>Professional roof installation by CEC-accredited installers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald mr-2">✓</span>
                  <span>All mounting hardware & electrical connections</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald mr-2">✓</span>
                  <span>Grid connection & meter upgrade (if required)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald mr-2">✓</span>
                  <span>Smart monitoring system with mobile app</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald mr-2">✓</span>
                  <span>Complete system testing & commissioning</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald mr-2">✓</span>
                  <span>5-year workmanship warranty</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Investment */}
        <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-xl border-2 border-primary-100">
          <h3 className="font-bold text-primary mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Your Investment
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Solar System ({Number(savedQuote.systemSizeKw).toFixed(2)}kW)</span>
              <span className="font-semibold">{formatCurrency(savedQuote.panelSystemCost)}</span>
            </div>
            {savedQuote.batteryCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Battery Storage ({savedQuote.batterySizeKwh}kWh)</span>
                <span className="font-semibold">{formatCurrency(savedQuote.batteryCost)}</span>
              </div>
            )}
            {savedQuote.inverterCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Inverter ({Number(savedQuote.systemSizeKw).toFixed(2)}kW)</span>
                <span className="font-semibold">{formatCurrency(savedQuote.inverterCost)}</span>
              </div>
            )}
            {savedQuote.installationCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Installation</span>
                <span className="font-semibold">{formatCurrency(savedQuote.installationCost)}</span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between font-semibold">
                <span>Total System Cost</span>
                <span>{formatCurrency(savedQuote.totalCostBeforeRebates)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rebates */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-xl border-2 border-emerald-100">
          <h3 className="font-bold text-primary mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Government Rebates
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Federal SRES</span>
              <span className="font-semibold text-emerald">
                -{formatCurrency(savedQuote.federalSolarRebate)}
              </span>
            </div>
            {savedQuote.federalBatteryRebate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Federal Battery (30%)</span>
                <span className="font-semibold text-emerald">
                  -{formatCurrency(savedQuote.federalBatteryRebate)}
                </span>
              </div>
            )}
            {savedQuote.stateBatteryRebate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">WA Battery Scheme</span>
                <span className="font-semibold text-emerald">
                  -{formatCurrency(savedQuote.stateBatteryRebate)}
                </span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Rebates</span>
                <span className="text-emerald">
                  -{formatCurrency(savedQuote.totalRebates)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Numbers */}
      <div className="bg-gradient-primary rounded-xl p-8 text-white mb-8">
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <p className="text-white/70 text-sm mb-2">Total Investment</p>
            <p className="text-3xl font-bold text-gold">
              {formatCurrency(savedQuote.totalCostAfterRebates)}
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm mb-2">Annual Savings</p>
            <p className="text-3xl font-bold text-emerald-300">
              {formatCurrency(savedQuote.annualSavings)}
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm mb-2">Payback Period</p>
            <p className="text-3xl font-bold">
              {savedQuote.paybackYears ? savedQuote.paybackYears.toFixed(1) : '0.0'} years
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm mb-2">25-Year Savings</p>
            <p className="text-3xl font-bold text-gold">
              {formatCurrency(savedQuote.year25Savings)}
            </p>
          </div>
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-8 mb-8 border-2 border-emerald-100">
        <h3 className="font-bold text-primary mb-6 text-xl flex items-center">
          <Leaf className="h-6 w-6 mr-2 text-emerald" />
          Environmental Impact
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-emerald rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <Leaf className="h-10 w-10 text-white" />
            </div>
            <p className="text-4xl font-bold text-emerald mb-2">
              {co2SavedPerYear}
            </p>
            <p className="text-gray-600 text-sm">Tonnes CO₂ saved per year</p>
          </div>
          <div className="text-center">
            <div className="bg-emerald rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🌳</span>
            </div>
            <p className="text-4xl font-bold text-emerald mb-2">
              {formatNumber(equivalentTrees)}
            </p>
            <p className="text-gray-600 text-sm">Equivalent trees planted</p>
          </div>
          <div className="text-center">
            <div className="bg-emerald rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <CarIcon className="h-10 w-10 text-white" />
            </div>
            <p className="text-4xl font-bold text-emerald mb-2">
              {equivalentCars}
            </p>
            <p className="text-gray-600 text-sm">Cars off the road</p>
          </div>
        </div>
      </div>

      {/* Lock In Rebates CTA */}
      <div className="bg-gradient-to-r from-coral to-gold rounded-xl p-8 text-white mb-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-3">🔒 Lock in These Rebates Today</h3>
          <p className="text-white/90 mb-4 max-w-2xl mx-auto">
            Government rebate programs are limited and change frequently. A {paymentSettings?.depositPercentage ?? 10}% deposit secures your eligibility and gives you priority scheduling.
          </p>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-white/80 mb-1">Total Rebates Available</p>
              <p className="text-3xl font-bold">{formatCurrency(savedQuote.totalRebates)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-white/80 mb-1">Your Investment</p>
              <p className="text-3xl font-bold">{formatCurrency(savedQuote.totalCostAfterRebates)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-white/80 mb-1">25-Year Savings</p>
              <p className="text-3xl font-bold">{formatCurrency(savedQuote.year25Savings)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Options */}
      <div className="bg-gradient-to-br from-gold-50 to-white rounded-xl p-8 mb-8 border-2 border-gold-200">
        <h3 className="font-bold text-primary mb-6 text-xl flex items-center">
          <DollarSign className="h-6 w-6 mr-2 text-gold" />
          Payment Options
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Option 1: Full Payment */}
          <button
            onClick={() => updateData({ paymentPreference: 'full' })}
            className={`text-left p-6 rounded-xl border-2 transition-all ${
              data?.paymentPreference === 'full'
                ? 'border-gold bg-gold-50 shadow-lg'
                : 'border-gray-200 hover:border-gold-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-primary">Full Payment</h4>
              {data?.paymentPreference === 'full' && (
                <span className="text-gold text-xl">✓</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Pay in full after installation completion
            </p>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(savedQuote.totalCostAfterRebates)}
              </p>
            </div>
            <div className="mt-3 text-xs text-emerald">
              ✓ Best value - no fees
            </div>
          </button>

          {/* Option 2: Deposit Only */}
          <button
            onClick={() => updateData({ paymentPreference: 'deposit' })}
            className={`text-left p-6 rounded-xl border-2 transition-all ${
              data?.paymentPreference === 'deposit'
                ? 'border-coral bg-coral-50 shadow-lg'
                : 'border-gray-200 hover:border-coral-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-primary">Deposit</h4>
              {data?.paymentPreference === 'deposit' && (
                <span className="text-coral text-xl">✓</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Secure your system with a deposit, pay balance after installation
            </p>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Deposit Amount ({paymentSettings?.depositPercentage ?? 10}%)</p>
              <p className="text-2xl font-bold text-coral">
                {paymentSettings ? formatCurrency((savedQuote.totalCostAfterRebates * paymentSettings.depositPercentage) / 100) : formatCurrency(savedQuote.totalCostAfterRebates * 0.1)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Balance: {paymentSettings ? formatCurrency(savedQuote.totalCostAfterRebates - (savedQuote.totalCostAfterRebates * paymentSettings.depositPercentage / 100)) : formatCurrency(savedQuote.totalCostAfterRebates * 0.9)}
              </p>
            </div>
            <div className="mt-3 text-xs text-emerald">
              ✓ Most popular option
            </div>
          </button>

          {/* Option 3: Finance/Payment Plan */}
          <button
            onClick={() => updateData({ paymentPreference: 'finance' })}
            className={`text-left p-6 rounded-xl border-2 transition-all ${
              data?.paymentPreference === 'finance'
                ? 'border-primary bg-primary-50 shadow-lg'
                : 'border-gray-200 hover:border-primary-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-primary">Finance Option</h4>
              {data?.paymentPreference === 'finance' && (
                <span className="text-primary text-xl">✓</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Apply for financing with our partners
            </p>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">From (estimated)</p>
              <p className="text-2xl font-bold text-primary">
                {paymentSettings ? formatCurrency(Math.round(savedQuote.totalCostAfterRebates / paymentSettings.installmentMonths)) : formatCurrency(Math.round(savedQuote.totalCostAfterRebates / 24))}
              </p>
              <p className="text-xs text-gray-500 mt-1">/month over {paymentSettings?.installmentMonths ?? 24} months</p>
            </div>
            <div className="mt-3 text-xs text-gold">
              ⚠️ Subject to credit approval
            </div>
          </button>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> All pricing includes installation, equipment, and workmanship warranty. 
            Government rebates are applied automatically. Payment is due after installation completion and inspection.
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
          className="bg-coral hover:bg-coral-600 text-white px-8 text-lg shadow-xl"
        >
          See My Full Quote
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
