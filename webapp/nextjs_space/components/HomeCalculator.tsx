'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Battery, DollarSign, TrendingUp, Calendar, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/lib/format-helpers';

export function HomeCalculator() {
  // Slider states
  const [bimonthlyBill, setBimonthlyBill] = useState(400);
  const [systemSize, setSystemSize] = useState(6.6);
  const [batterySize, setBatterySize] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // Slider ranges - updated for larger systems with rebates
  const minSystemSize = 3.3;
  const maxSystemSize = 20; // Up to 20kW for large residential/small commercial
  const systemSizeStep = 0.33;
  
  const minBatterySize = 0;
  const maxBatterySize = 40; // Up to 40kWh for large systems
  const batterySizeStep = 2.5;

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate scenario with immediate feedback
  useEffect(() => {
    // Only run on client side to prevent hydration errors
    if (typeof window === 'undefined') return;
    
    const calculateScenario = async () => {
      setCalculating(true);
      try {
        // Estimate daily consumption from bi-monthly bill
        // Average WA electricity rate: ~$0.30/kWh
        const dailyConsumption = (bimonthlyBill / 60) / 0.30;
        
        const response = await fetch('/api/calculate-unified-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemSizeKw: systemSize,
            batterySizeKwh: batterySize,
            postcode: '6000', // Default Perth
            region: 'WA',
            includeInstallation: true,
            dailyConsumptionKwh: dailyConsumption,
            quarterlyBill: bimonthlyBill * 1.5,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('API Response:', data); // Debug log
          if (data.success && data.quote) {
            setResults(data.quote);
          } else {
            console.error('API returned no quote:', data);
          }
        } else {
          console.error('API request failed:', response.status);
        }
      } catch (error) {
        console.error('Error calculating:', error);
      } finally {
        setCalculating(false);
      }
    };

    // Immediate calculation on mount
    if (!results) {
      calculateScenario();
    } else {
      // Debounce subsequent calculations
      const timer = setTimeout(calculateScenario, 300);
      return () => clearTimeout(timer);
    }
  }, [bimonthlyBill, systemSize, batterySize]);

  // Calculate display values from API results (database-driven)
  // API returns: { success: true, quote: { ... } }
  const monthlyBill = results?.savings?.monthlySavings ? (bimonthlyBill / 2) - results.savings.monthlySavings : 0;
  const annualSavings = results?.savings?.annualSavings || 0;
  const totalCost = results?.finalPrice || results?.totalAfterRebates || 0;
  const paybackYears = results?.savings?.paybackYears || 0;
  const totalRebates = results?.rebates?.total || 0;
  const lifetimeSavings = results?.savings?.year25Savings || (annualSavings * 25);
  const co2Offset = results?.annualProductionKwh ? (results.annualProductionKwh * 0.7 / 1000) : 0; // From database production estimate

  // Prevent hydration errors by not rendering until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-coral" />
            <p className="text-gray-600 mt-4">Loading calculator...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-coral to-orange-500 text-white px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Interactive Solar Calculator</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Estimate Your Solar Savings
          </h2>
          <p className="text-xl text-gray-600">
            Adjust the sliders to see how much you can save with solar
          </p>
        </div>

        {/* Sliders */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Bi-Monthly Bill Slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Current Bi-Monthly Bill</h3>
                  <p className="text-sm text-gray-600">Your average power bill every 2 months</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  ${formatNumber(bimonthlyBill, 0)}
                </p>
                <p className="text-sm text-gray-600">
                  ${formatNumber(bimonthlyBill / 2, 0)}/month
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min={100}
                max={1000}
                step={10}
                value={bimonthlyBill}
                onChange={(e) => setBimonthlyBill(parseFloat(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-blue-200 to-blue-400 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((bimonthlyBill - 100) / (1000 - 100)) * 100}%, #e5e7eb ${((bimonthlyBill - 100) / (1000 - 100)) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>$100</span>
              <span>$1,000</span>
            </div>
          </div>

          {/* System Size Slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Solar System Size</h3>
                  <p className="text-sm text-gray-600">Panel capacity in kilowatts</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(systemSize, 1)} kW
                </p>
                <p className="text-sm text-gray-600">
                  ~{Math.round(systemSize / 0.4)} panels
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min={minSystemSize}
                max={maxSystemSize}
                step={systemSizeStep}
                value={systemSize}
                onChange={(e) => setSystemSize(parseFloat(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-yellow-200 to-orange-300 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((systemSize - minSystemSize) / (maxSystemSize - minSystemSize)) * 100}%, #e5e7eb ${((systemSize - minSystemSize) / (maxSystemSize - minSystemSize)) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{minSystemSize} kW</span>
              <span>{maxSystemSize} kW</span>
            </div>
          </div>

          {/* Battery Size Slider */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Battery className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Battery Storage</h3>
                  <p className="text-sm text-gray-600">Store excess solar energy</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(batterySize, 1)} kWh
                </p>
                <p className="text-sm text-gray-600">
                  {batterySize === 0 ? 'No battery' : 'With storage'}
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min={minBatterySize}
                max={maxBatterySize}
                step={batterySizeStep}
                value={batterySize}
                onChange={(e) => setBatterySize(parseFloat(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-green-200 to-emerald-300 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${(batterySize / maxBatterySize) * 100}%, #e5e7eb ${(batterySize / maxBatterySize) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{minBatterySize} kWh</span>
              <span>{maxBatterySize} kWh</span>
            </div>
            {calculating && (
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Calculating...</span>
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Project Value */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white relative">
            {calculating && (
              <div className="absolute top-2 right-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5" />
              <h3 className="font-semibold">Total Project Value</h3>
            </div>
            <p className="text-4xl font-bold mb-2">
              ${formatCurrency(totalCost + totalRebates)}
            </p>
            <p className="text-sm text-blue-100">
              Before ${formatCurrency(totalRebates)} rebates
            </p>
          </div>

          {/* Total Rebates */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5" />
              <h3 className="font-semibold">Total Rebates</h3>
            </div>
            <p className="text-4xl font-bold mb-2">
              ${formatCurrency(totalRebates)}
            </p>
            <p className="text-sm text-green-100">
              Government incentives included
            </p>
          </div>

          {/* Total Investment */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5" />
              <h3 className="font-semibold">Total Investment</h3>
            </div>
            <p className="text-4xl font-bold mb-2">
              ${formatCurrency(totalCost)}
            </p>
            <p className="text-sm text-purple-100">
              After ${formatCurrency(totalRebates)} rebates
            </p>
          </div>

          {/* Payback Period */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5" />
              <h3 className="font-semibold">Payback Period</h3>
            </div>
            <p className="text-4xl font-bold mb-2">
              {formatNumber(paybackYears, 1)} years
            </p>
            <p className="text-sm text-orange-100">
              Then pure profit for 20+ years
            </p>
          </div>

          {/* 25-Year Savings */}
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-semibold">25-Year Savings</h3>
            </div>
            <p className="text-4xl font-bold mb-2">
              ${formatCurrency(lifetimeSavings)}
            </p>
            <p className="text-sm text-teal-100">
              Total lifetime value
            </p>
          </div>

          {/* New Monthly Bill */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5" />
              <h3 className="font-semibold">New Monthly Bill</h3>
            </div>
            <p className="text-4xl font-bold mb-2">
              ${formatCurrency(monthlyBill)}
            </p>
            <p className="text-sm text-emerald-100">
              Down from ${formatNumber(bimonthlyBill / 2, 0)}/month
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/calculator-v2">
            <Button size="lg" className="bg-gradient-to-r from-coral to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white text-lg px-10 py-6 shadow-xl">
              Get Your Detailed Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-gray-600 mt-4">
            Free detailed quote • No obligation • Takes 2 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
