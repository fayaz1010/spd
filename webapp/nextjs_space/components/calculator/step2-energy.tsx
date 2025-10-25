
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowRight, ArrowLeft, Zap, Users, Sun, Moon, Clock, Car, Home, Waves, Laptop, Wind, ChevronDown, ChevronUp, TrendingUp, FileText, Battery } from 'lucide-react';
import { CalculatorData } from './calculator-flow';
import { BillInputModal } from './bill-input-modal';

interface Step2Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function Step2Energy({ data, updateData, nextStep, prevStep }: Step2Props) {
  const [quarterlyBill, setQuarterlyBill] = useState(data?.quarterlyBill ?? 0);
  const [householdSize, setHouseholdSize] = useState(data?.householdSize ?? 4);
  const [usagePattern, setUsagePattern] = useState(data?.usagePattern ?? 'balanced');
  const [hasEv, setHasEv] = useState(data?.hasEv ?? false);
  const [planningEv, setPlanningEv] = useState(data?.planningEv ?? false);
  const [evCount, setEvCount] = useState(data?.evCount ?? 0);
  const [hasElectricHotWater, setHasElectricHotWater] = useState(data?.hasElectricHotWater ?? false);
  const [hasElectricCooking, setHasElectricCooking] = useState(data?.hasElectricCooking ?? false);
  
  // NEW: EV Enhanced Fields
  const [evChargingTime, setEvChargingTime] = useState<string>(data?.evChargingTime ?? 'evening');
  const [evUsageTier, setEvUsageTier] = useState<string>(data?.evUsageTier ?? 'average');
  
  // Bill Data
  const [showBillModal, setShowBillModal] = useState(false);
  const [billData, setBillData] = useState<any[]>(data?.billData || []);
  const [seasonalPattern, setSeasonalPattern] = useState<any>(data?.seasonalPattern || null);
  
  // Advanced profile state (optional)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bedrooms, setBedrooms] = useState(data?.bedrooms ?? 4);
  const [hasPool, setHasPool] = useState(data?.hasPool ?? false);
  const [poolHeated, setPoolHeated] = useState(data?.poolHeated ?? false);
  const [homeOffices, setHomeOffices] = useState(data?.homeOffices ?? 0);
  const [hvacUsage, setHvacUsage] = useState(data?.hvacUsage ?? 'moderate');
  const [dailyConsumption, setDailyConsumption] = useState(data?.dailyConsumption ?? 0);

  const handleSaveBills = (bills: any[], seasonal: any) => {
    setBillData(bills);
    setSeasonalPattern(seasonal);
    // Auto-update bi-monthly bill if not set
    if (bills.length > 0 && (!quarterlyBill || quarterlyBill === 0)) {
      const avgDays = bills.reduce((sum, b) => sum + b.days, 0) / bills.length;
      const avgCost = bills.reduce((sum, b) => sum + b.cost, 0) / bills.length;
      // Normalize to bi-monthly (60 days)
      const biMonthlyEstimate = (avgCost / avgDays) * 60;
      // Round to nearest $10 to match input step validation
      setQuarterlyBill(Math.round(biMonthlyEstimate / 10) * 10);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quarterlyBill || quarterlyBill <= 0) {
      alert('Please enter your bi-monthly electricity bill');
      return;
    }
    
    // Validate EV charging time if they have EV
    if ((hasEv || planningEv) && !evChargingTime) {
      alert('Please select when you typically charge your EV');
      return;
    }
    
    const energyData = { 
      quarterlyBill, 
      householdSize, 
      usagePattern, 
      hasEv, 
      planningEv,
      evCount,
      evChargingTime: (hasEv || planningEv) ? evChargingTime : undefined,
      evUsageTier: (hasEv || planningEv) ? evUsageTier : undefined,
      hasElectricHotWater,
      hasElectricCooking,
      // Bill Data
      billData: billData.length > 0 ? billData : undefined,
      seasonalPattern: seasonalPattern ? seasonalPattern : undefined,
      // Advanced profile (optional)
      bedrooms: showAdvanced ? bedrooms : undefined,
      hasPool: showAdvanced ? hasPool : undefined,
      poolHeated: showAdvanced && hasPool ? poolHeated : undefined,
      homeOffices: showAdvanced ? homeOffices : undefined,
      hvacUsage: showAdvanced ? hvacUsage : undefined,
      dailyConsumption: showAdvanced && dailyConsumption > 0 ? dailyConsumption : undefined,
    };
    
    // Save energy data to database (progressive quote saving)
    try {
      const response = await fetch('/api/quotes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data?.sessionId,
          quoteId: data?.quoteId,
          leadId: data?.leadId,
          ...energyData,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        updateData({ 
          ...energyData,
          quoteId: result.quoteId,
        });
        nextStep();
      } else {
        console.error('Failed to save quote:', result.error);
        // Continue anyway - don't block user
        updateData(energyData);
        nextStep();
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      // Continue anyway - don't block user
      updateData(energyData);
      nextStep();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-3">
          Tell Us About Your Energy Usage
        </h2>
        <p className="text-gray-600">
          This helps us design the perfect solar system to maximize your savings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bi-Monthly Bill */}
        <div>
          <Label htmlFor="bill" className="text-lg font-semibold text-primary mb-3 block">
            <Zap className="inline h-5 w-5 mr-2" />
            Current Bi-Monthly Electricity Bill
          </Label>
          <p className="text-sm text-gray-600 mb-2">
            In Australia, electricity bills are received every 2 months (60 days)
          </p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-500">$</span>
            <Input
              id="bill"
              type="number"
              value={quarterlyBill || ''}
              onChange={(e) => setQuarterlyBill(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 600"
              className="text-2xl py-6 pl-12"
              min="0"
              step="10"
            />
          </div>
          {quarterlyBill > 0 && (
            <p className="text-sm text-emerald mt-2 font-semibold">
              That's ${Math.round(quarterlyBill * 6)} per year - we can help you save 70-95% of that with solar{hasEv || planningEv ? ' and battery storage for EV charging' : ''}!
            </p>
          )}
          {billData.length > 0 && seasonalPattern && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>📊 Seasonal Data Loaded:</strong> {billData.length} bill period{billData.length > 1 ? 's' : ''} analyzed. 
                {seasonalPattern.summer?.avgDaily && seasonalPattern.winter?.avgDaily && (
                  <span> Summer: {seasonalPattern.summer.avgDaily.toFixed(1)} kWh/day, Winter: {seasonalPattern.winter.avgDaily.toFixed(1)} kWh/day.</span>
                )}
              </p>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowBillModal(true)}
            className="mt-3 w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            {billData.length > 0 ? 'Edit Bill Data' : 'Add Actual Bill Data for More Accuracy'}
          </Button>
        </div>

        {/* Household Size */}
        <div>
          <Label className="text-lg font-semibold text-primary mb-3 block">
            <Users className="inline h-5 w-5 mr-2" />
            Number of People in Household
          </Label>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setHouseholdSize(num)}
                className={`
                  py-4 rounded-xl font-semibold transition-all
                  ${householdSize === num 
                    ? 'bg-coral text-white shadow-lg scale-105' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                `}
              >
                {num === 8 ? '8+' : num}
              </button>
            ))}
          </div>
        </div>

        {/* Usage Pattern */}
        <div>
          <Label className="text-lg font-semibold text-primary mb-3 block">
            <Clock className="inline h-5 w-5 mr-2" />
            When Do You Use Most Electricity?
          </Label>
          <RadioGroup value={usagePattern} onValueChange={setUsagePattern}>
            <div className="grid grid-cols-3 gap-4">
              <div className={`
                relative border-2 rounded-xl p-5 cursor-pointer transition-all
                ${usagePattern === 'day' ? 'border-coral bg-coral-50' : 'border-gray-200 hover:border-gray-300'}
              `}>
                <RadioGroupItem value="day" id="day" className="sr-only" />
                <label htmlFor="day" className="cursor-pointer block text-center">
                  <Sun className={`h-10 w-10 mx-auto mb-2 ${usagePattern === 'day' ? 'text-coral' : 'text-gray-400'}`} />
                  <p className="font-semibold text-primary mb-1">Mostly Day</p>
                  <p className="text-xs text-gray-500">Working from home</p>
                </label>
              </div>

              <div className={`
                relative border-2 rounded-xl p-5 cursor-pointer transition-all
                ${usagePattern === 'night' ? 'border-coral bg-coral-50' : 'border-gray-200 hover:border-gray-300'}
              `}>
                <RadioGroupItem value="night" id="night" className="sr-only" />
                <label htmlFor="night" className="cursor-pointer block text-center">
                  <Moon className={`h-10 w-10 mx-auto mb-2 ${usagePattern === 'night' ? 'text-coral' : 'text-gray-400'}`} />
                  <p className="font-semibold text-primary mb-1">Mostly Night</p>
                  <p className="text-xs text-gray-500">Home after work</p>
                </label>
              </div>

              <div className={`
                relative border-2 rounded-xl p-5 cursor-pointer transition-all
                ${usagePattern === 'balanced' ? 'border-coral bg-coral-50' : 'border-gray-200 hover:border-gray-300'}
              `}>
                <RadioGroupItem value="balanced" id="balanced" className="sr-only" />
                <label htmlFor="balanced" className="cursor-pointer block text-center">
                  <Clock className={`h-10 w-10 mx-auto mb-2 ${usagePattern === 'balanced' ? 'text-coral' : 'text-gray-400'}`} />
                  <p className="font-semibold text-primary mb-1">Balanced</p>
                  <p className="text-xs text-gray-500">Throughout day</p>
                </label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* EV Questions */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-primary mb-3 block">
            <Car className="inline h-5 w-5 mr-2" />
            Electric Vehicle
          </Label>
          
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setHasEv(!hasEv)}
              className={`
                w-full text-left border-2 rounded-xl p-4 transition-all flex items-center justify-between
                ${hasEv ? 'border-emerald bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <span className="font-medium text-primary">I currently own an electric vehicle</span>
              <div className={`
                h-6 w-6 rounded border-2 flex items-center justify-center
                ${hasEv ? 'border-emerald bg-emerald' : 'border-gray-300'}
              `}>
                {hasEv && <span className="text-white text-sm">✓</span>}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPlanningEv(!planningEv)}
              className={`
                w-full text-left border-2 rounded-xl p-4 transition-all flex items-center justify-between
                ${planningEv ? 'border-emerald bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <span className="font-medium text-primary">I'm planning to get an EV in the next 2 years</span>
              <div className={`
                h-6 w-6 rounded border-2 flex items-center justify-center
                ${planningEv ? 'border-emerald bg-emerald' : 'border-gray-300'}
              `}>
                {planningEv && <span className="text-white text-sm">✓</span>}
              </div>
            </button>
          </div>

          {(hasEv || planningEv) && (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-emerald-800">
                  <strong>Great choice!</strong> We'll include EV charging in your savings calculation. You could save an additional $2,500/year on fuel costs!
                </p>
              </div>

              {/* EV Count */}
              <div className="mt-4">
                <Label className="text-base font-semibold text-primary mb-2 block">
                  How many EVs? (current + planned)
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEvCount(num)}
                      className={`
                        py-4 rounded-xl font-semibold transition-all
                        ${evCount === num 
                          ? 'bg-emerald text-white shadow-lg scale-105' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                      `}
                    >
                      {num === 4 ? '4+' : num}
                    </button>
                  ))}
                </div>
              </div>

              {/* NEW: EV Charging Time */}
              <div className="mt-4">
                <Label className="text-base font-semibold text-primary mb-3 block flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  When do you typically charge your EV?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'morning', label: 'Morning', icon: '🌅', desc: '6am-10am', battery: 'Medium battery' },
                    { value: 'midday', label: 'Midday', icon: '☀️', desc: '10am-3pm', battery: 'Smaller battery OK' },
                    { value: 'evening', label: 'Evening', icon: '🌆', desc: '5pm-9pm', battery: 'Larger battery' },
                    { value: 'night', label: 'Night', icon: '🌙', desc: '9pm-6am', battery: 'Larger battery' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEvChargingTime(option.value)}
                      className={`
                        relative border-2 rounded-xl p-4 transition-all text-left
                        ${evChargingTime === option.value 
                          ? 'border-coral bg-coral-50 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <p className="font-semibold text-primary mb-1">{option.label}</p>
                      <p className="text-xs text-gray-500 mb-2">{option.desc}</p>
                      <p className="text-xs font-semibold text-coral">{option.battery}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Pro Tip:</strong> {
                      evChargingTime === 'midday' 
                        ? 'Perfect! Midday charging lets you use solar directly - smaller battery needed!' 
                        : 'Evening/night charging needs battery storage to use your solar power.'
                    }
                  </p>
                </div>
              </div>

              {/* NEW: EV Usage Tier */}
              <div className="mt-4">
                <Label className="text-base font-semibold text-primary mb-3 block flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  How much do you drive daily?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'light', label: 'Light', desc: '~25 km/day', kwh: '~5 kWh/day' },
                    { value: 'average', label: 'Average', desc: '~40 km/day', kwh: '~8 kWh/day' },
                    { value: 'heavy', label: 'Heavy', desc: '~75 km/day', kwh: '~15 kWh/day' },
                    { value: 'very_heavy', label: 'Very Heavy', desc: '100+ km/day', kwh: '~20 kWh/day' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEvUsageTier(option.value)}
                      className={`
                        relative border-2 rounded-xl p-4 transition-all text-left
                        ${evUsageTier === option.value 
                          ? 'border-coral bg-coral-50 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <p className="font-semibold text-primary mb-1">{option.label}</p>
                      <p className="text-xs text-gray-500 mb-1">{option.desc}</p>
                      <p className="text-xs font-semibold text-emerald">{option.kwh}</p>
                    </button>
                  ))}
                </div>
                {evUsageTier === 'heavy' || evUsageTier === 'very_heavy' ? (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      <Battery className="inline h-4 w-4 mr-1" />
                      <strong>High usage detected!</strong> We'll recommend a 25-30 kWh battery for {evChargingTime} charging to meet your needs.
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* Electric Hot Water */}
        <div>
          <Label className="text-lg font-semibold text-primary mb-3 block">
            <Zap className="inline h-5 w-5 mr-2" />
            Hot Water System
          </Label>
          <button
            type="button"
            onClick={() => setHasElectricHotWater(!hasElectricHotWater)}
            className={`
              w-full text-left border-2 rounded-xl p-4 transition-all flex items-center justify-between
              ${hasElectricHotWater ? 'border-emerald bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <span className="font-medium text-primary">I have an electric hot water system</span>
            <div className={`
              h-6 w-6 rounded border-2 flex items-center justify-center
              ${hasElectricHotWater ? 'border-emerald bg-emerald' : 'border-gray-300'}
            `}>
              {hasElectricHotWater && <span className="text-white text-sm">✓</span>}
            </div>
          </button>
          {hasElectricHotWater && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>💧 Hot water tip:</strong> Electric hot water systems use 20-30% of home energy. Solar can heat water for free during the day, saving you $400-600/year!
              </p>
            </div>
          )}
        </div>

        {/* Electric Cooking */}
        <div>
          <Label className="text-lg font-semibold text-primary mb-3 block">
            <Zap className="inline h-5 w-5 mr-2" />
            Cooking
          </Label>
          <button
            type="button"
            onClick={() => setHasElectricCooking(!hasElectricCooking)}
            className={`
              w-full text-left border-2 rounded-xl p-4 transition-all flex items-center justify-between
              ${hasElectricCooking ? 'border-emerald bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <span className="font-medium text-primary">I have electric cooking (oven/cooktop)</span>
            <div className={`
              h-6 w-6 rounded border-2 flex items-center justify-center
              ${hasElectricCooking ? 'border-emerald bg-emerald' : 'border-gray-300'}
            `}>
              {hasElectricCooking && <span className="text-white text-sm">✓</span>}
            </div>
          </button>
          {hasElectricCooking && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>🍳 Cooking tip:</strong> Electric ovens and cooktops typically use 4-5 kWh per day. Solar can power your cooking during the day for free!
              </p>
            </div>
          )}
        </div>

        {/* Advanced Profile (Optional) */}
        <div className="border-t-2 border-dashed border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-left p-4 rounded-xl bg-gradient-to-r from-gold-50 to-coral-50 hover:from-gold-100 hover:to-coral-100 transition-all border-2 border-gold-200"
          >
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-coral mr-3" />
              <div>
                <p className="font-bold text-primary text-lg">Get More Accurate Battery Sizing</p>
                <p className="text-sm text-gray-600">Optional: Tell us more about your home for precise recommendations</p>
              </div>
            </div>
            {showAdvanced ? (
              <ChevronUp className="h-6 w-6 text-coral" />
            ) : (
              <ChevronDown className="h-6 w-6 text-coral" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-6 space-y-6 animate-fade-in">
              {/* Bedrooms */}
              <div>
                <Label className="text-lg font-semibold text-primary mb-3 block">
                  <Home className="inline h-5 w-5 mr-2" />
                  Number of Bedrooms
                </Label>
                <div className="grid grid-cols-5 gap-3">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBedrooms(num)}
                      className={`
                        py-4 rounded-xl font-semibold transition-all
                        ${bedrooms === num 
                          ? 'bg-coral text-white shadow-lg scale-105' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                      `}
                    >
                      {num === 6 ? '6+' : num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pool */}
              <div>
                <Label className="text-lg font-semibold text-primary mb-3 block">
                  <Waves className="inline h-5 w-5 mr-2" />
                  Swimming Pool
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setHasPool(false);
                      setPoolHeated(false);
                    }}
                    className={`
                      p-5 rounded-xl font-semibold transition-all border-2
                      ${!hasPool 
                        ? 'border-coral bg-coral text-white shadow-lg' 
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    No Pool
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasPool(true)}
                    className={`
                      p-5 rounded-xl font-semibold transition-all border-2
                      ${hasPool 
                        ? 'border-coral bg-coral text-white shadow-lg' 
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    Have Pool
                  </button>
                </div>

                {hasPool && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setPoolHeated(!poolHeated)}
                      className={`
                        w-full text-left border-2 rounded-xl p-4 transition-all flex items-center justify-between
                        ${poolHeated ? 'border-coral bg-coral-50' : 'border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <span className="font-medium text-primary">Pool has heating system</span>
                      <div className={`
                        h-6 w-6 rounded border-2 flex items-center justify-center
                        ${poolHeated ? 'border-coral bg-coral' : 'border-gray-300'}
                      `}>
                        {poolHeated && <span className="text-white text-sm">✓</span>}
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Home Offices */}
              <div>
                <Label className="text-lg font-semibold text-primary mb-3 block">
                  <Laptop className="inline h-5 w-5 mr-2" />
                  Home Offices / Workspaces
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setHomeOffices(num)}
                      className={`
                        py-4 rounded-xl font-semibold transition-all
                        ${homeOffices === num 
                          ? 'bg-coral text-white shadow-lg scale-105' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                      `}
                    >
                      {num === 3 ? '3+' : num}
                    </button>
                  ))}
                </div>
              </div>

              {/* HVAC Usage */}
              <div>
                <Label className="text-lg font-semibold text-primary mb-3 block">
                  <Wind className="inline h-5 w-5 mr-2" />
                  Heating & Cooling Usage
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setHvacUsage('minimal')}
                    className={`
                      p-5 rounded-xl font-semibold transition-all border-2
                      ${hvacUsage === 'minimal' 
                        ? 'border-coral bg-coral text-white shadow-lg' 
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    <div className="text-center">
                      <p className="mb-1">Minimal</p>
                      <p className="text-xs opacity-80">1-2 months/year</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHvacUsage('moderate')}
                    className={`
                      p-5 rounded-xl font-semibold transition-all border-2
                      ${hvacUsage === 'moderate' 
                        ? 'border-coral bg-coral text-white shadow-lg' 
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    <div className="text-center">
                      <p className="mb-1">Moderate</p>
                      <p className="text-xs opacity-80">4-6 months/year</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHvacUsage('heavy')}
                    className={`
                      p-5 rounded-xl font-semibold transition-all border-2
                      ${hvacUsage === 'heavy' 
                        ? 'border-coral bg-coral text-white shadow-lg' 
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    <div className="text-center">
                      <p className="mb-1">Heavy</p>
                      <p className="text-xs opacity-80">8+ months/year</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Daily Consumption (Optional) */}
              <div>
                <Label htmlFor="dailyConsumption" className="text-lg font-semibold text-primary mb-3 block">
                  <Zap className="inline h-5 w-5 mr-2" />
                  Daily Consumption (Optional)
                </Label>
                <div className="relative">
                  <Input
                    id="dailyConsumption"
                    type="number"
                    value={dailyConsumption || ''}
                    onChange={(e) => setDailyConsumption(parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 40"
                    className="text-xl py-6 pr-20"
                    min="0"
                    step="1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-500 font-semibold">kWh/day</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  If you know your daily consumption, enter it here. Otherwise, we'll calculate it from your quarterly bill.
                </p>
              </div>

              <div className="bg-gold-50 border border-gold-200 rounded-xl p-4">
                <p className="text-sm text-gold-900">
                  <strong>💡 Why these questions?</strong> Larger homes with pools, home offices, and heavy HVAC usage typically need bigger battery systems (25-50 kWh) for full energy independence. This helps us recommend the right size for your needs.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
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
            type="submit" 
            size="lg"
            className="bg-coral hover:bg-coral-600 text-white px-8"
          >
            Analyze My Roof
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </form>

      {/* Bill Input Modal */}
      <BillInputModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        onSave={handleSaveBills}
        initialBills={billData}
      />
    </div>
  );
}
