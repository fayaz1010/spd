'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, ArrowLeft, Zap, Users, Car, Waves, Briefcase, Info, Wind, Droplet, Sun, Moon, TrendingUp, Battery } from 'lucide-react';
import { CalculatorData } from './calculator-flow-v2';
import { calculateEnergyAnalysis, getBatterySizeRecommendation } from '@/lib/energy-calculations';

interface Step2Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];
const EV_CHARGING_TIMES = [
  { value: 'morning', label: 'Morning (6am-12pm)', icon: '🌅' },
  { value: 'midday', label: 'Midday (12pm-3pm)', icon: '☀️' },
  { value: 'evening', label: 'Evening (3pm-9pm)', icon: '🌆' },
  { value: 'night', label: 'Night (9pm-6am)', icon: '🌙' },
];
const EV_CHARGING_METHODS = [
  { value: 'level1_standard_socket', label: 'Level 1: Standard Socket', power: '2.4 kW', description: 'Overnight top-ups', icon: '🔌' },
  { value: 'level2_ac_wallbox_1phase', label: 'Level 2: AC Wallbox (1-Phase)', power: '7.4 kW', description: 'Standard daily charging', icon: '🏠' },
  { value: 'level2_ac_wallbox_3phase_11kw', label: 'Level 2: AC Wallbox (3-Phase 11kW)', power: '11 kW', description: 'Fast home charging', icon: '⚡' },
  { value: 'level2_ac_wallbox_3phase_22kw', label: 'Level 2: AC Wallbox (3-Phase 22kW)', power: '22 kW', description: 'Very fast home charging', icon: '⚡⚡' },
];
const EV_BATTERY_SIZES = [
  { value: 50, label: '50 kWh', description: 'Small EV (e.g., MG ZS EV)' },
  { value: 75, label: '75 kWh', description: 'Medium EV (e.g., Tesla Model 3)' },
  { value: 100, label: '100 kWh', description: 'Large EV (e.g., Tesla Model X)' },
];

export function Step2Energy({ data, updateData, nextStep, prevStep }: Step2Props) {
  // Initialize from saved bimonthlyBill (not quarterlyBill!)
  const [bimonthlyBill, setBimonthlyBill] = useState(data.bimonthlyBill || 300);
  const [householdSize, setHouseholdSize] = useState(data.householdSize || 4);
  const [hasEv, setHasEv] = useState(data.hasEv || false);
  const [planningEv, setPlanningEv] = useState(data.planningEv || false);
  const [evCount, setEvCount] = useState(data.evCount || 1);
  const [evChargingTime, setEvChargingTime] = useState(data.evChargingTime || 'night');
  const [evChargingMethod, setEvChargingMethod] = useState(data.evChargingMethod || 'level1_standard_socket');
  const [evBatterySize, setEvBatterySize] = useState(data.evBatterySize || 50);
  const [evChargingHours, setEvChargingHours] = useState(data.evChargingHours || 3);
  const [hasPool, setHasPool] = useState(data.hasPool || false);
  const [poolHeated, setPoolHeated] = useState(data.poolHeated || false);
  const [homeOfficeCount, setHomeOfficeCount] = useState(data.homeOfficeCount || 0);
  const [acUsage, setAcUsage] = useState(data.acUsage || 'moderate');
  const [hasElectricHotWater, setHasElectricHotWater] = useState(data.hasElectricHotWater !== undefined ? data.hasElectricHotWater : true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const handleContinue = async () => {
    const newErrors: { [key: string]: string } = {};

    if (bimonthlyBill < 100) {
      newErrors.bimonthlyBill = 'Please enter a valid bill amount';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Convert bimonthly to quarterly for calculations (bimonthly × 1.5 = quarterly)
    const quarterlyBill = bimonthlyBill * 1.5;

    try {
      // Calculate comprehensive energy analysis using database values
      const response = await fetch('/api/energy-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data.sessionId, // Pass sessionId to save analysis
          householdSize,
          hasEv,
          planningEv,
          evCount: (hasEv || planningEv) ? evCount : 0,
          evChargingMethod: (hasEv || planningEv) ? evChargingMethod : undefined,
          evBatterySize: (hasEv || planningEv) ? evBatterySize : undefined,
          evChargingHours: (hasEv || planningEv) ? evChargingHours : undefined,
          hasPool,
          poolHeated: hasPool ? poolHeated : false,
          homeOfficeCount,
          acUsage,
          hasElectricHotWater,
          bimonthlyBill,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate energy analysis');
      }

      const { data: energyAnalysis } = await response.json();

      console.log('Step 2 - Received energy analysis from API:', energyAnalysis);
      console.log('Step 2 - componentBreakdown:', energyAnalysis.componentBreakdown);
      console.log('Step 2 - breakdown:', energyAnalysis.breakdown);
      console.log('Step 2 - EV in componentBreakdown:', energyAnalysis.componentBreakdown?.ev);
      console.log('Step 2 - EV in breakdown:', energyAnalysis.breakdown?.ev);

      // Save BOTH bimonthly (user input) and quarterly (calculated)
      const energyData = {
        bimonthlyBill,      // Save the actual user input
        quarterlyBill,      // Save the calculated quarterly value
        householdSize,
        hasEv,
        planningEv,
        evCount: (hasEv || planningEv) ? evCount : 0,
        evChargingTime: (hasEv || planningEv) ? evChargingTime : undefined,
        evChargingMethod: (hasEv || planningEv) ? evChargingMethod : undefined,
        evBatterySize: (hasEv || planningEv) ? evBatterySize : undefined,
        evChargingHours: (hasEv || planningEv) ? evChargingHours : undefined,
        hasPool,
        poolHeated: hasPool ? poolHeated : false,
        homeOfficeCount,
        acUsage,
        hasElectricHotWater,
        dailyConsumption: energyAnalysis.dailyConsumption,
        energyAnalysis: energyAnalysis,  // Save the FULL analysis object
      };
      
      updateData(energyData);

      // Save energy data to database using the existing /api/quotes/save endpoint
      try {
        const saveResponse = await fetch('/api/quotes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data.sessionId,
            quoteId: data.quoteId,
            // Property data from Step 1
            address: data.address,
            propertyType: data.propertyType,
            roofType: data.roofType,
            // Energy data from Step 2
            bimonthlyBill: energyData.bimonthlyBill,
            quarterlyBill: energyData.quarterlyBill,
            dailyConsumption: energyData.dailyConsumption,
            householdSize: energyData.householdSize,
            hasEv: energyData.hasEv,
            planningEv: energyData.planningEv,
            evCount: energyData.evCount,
            evChargingTime: energyData.evChargingTime,
            hasPool: energyData.hasPool,
            poolHeated: energyData.poolHeated,
            homeOffices: energyData.homeOfficeCount,
            hasElectricHotWater: energyData.hasElectricHotWater,
            // Consumption breakdown
            annualConsumption: energyAnalysis.annualConsumption,
            consumptionBreakdown: energyAnalysis.componentBreakdown || energyAnalysis.breakdown,
            // Full energy profile JSON
            energyProfile: energyAnalysis,
          }),
        });

        if (saveResponse.ok) {
          const result = await saveResponse.json();
          console.log(`✅ Saved energy data to database`);
        } else {
          console.error('Failed to save energy data to database');
        }
      } catch (saveError) {
        console.error('Error saving energy data:', saveError);
        // Continue anyway - data is in state
      }

      // Show results page instead of immediately going to next step
      setAnalysisResults(energyAnalysis);
      setShowResults(true);
    } catch (error) {
      console.error('Energy analysis error:', error);
      setErrors({ general: 'Failed to calculate energy requirements. Please try again.' });
    }
  };

  // Australian bills are bimonthly (every 2 months), so 6 bills per year
  const estimatedAnnualCost = bimonthlyBill * 6;
  const estimatedDailyUsage = Math.round((estimatedAnnualCost / 0.3237) / 365);

  // Show results page if analysis is complete
  if (showResults && analysisResults) {
    const breakdown = analysisResults.componentBreakdown || analysisResults.breakdown || {};
    const timeOfUse = analysisResults.timeOfUse || {};
    // Use the battery recommendation directly from API (already calculated correctly)
    const batteryRecommendedKwh = analysisResults.battery?.recommendedKwh || 0;
    const dailyConsumption = analysisResults.dailyConsumption;
    const annualConsumption = analysisResults.annualConsumption;
    const recommendedSystemKw = analysisResults.solar?.recommendedKw || analysisResults.recommendedSystemKw;
    const solarGeneration = analysisResults.solar?.estimatedDailyGeneration || analysisResults.estimatedDailyGeneration || (recommendedSystemKw * 4.4);
    const selfSufficiency = analysisResults.daytimeSelfSufficiency || ((solarGeneration / dailyConsumption) * 100);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-3">
            <Zap className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Your Energy Requirements Analysis
          </h2>
          <p className="text-lg text-gray-600">
            Based on your usage profile, here's what you need
          </p>
        </div>

        {/* Energy Requirement Analysis Card */}
        <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-blue-600" />
              <span>Your Complete Energy Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {dailyConsumption.toFixed(1)} kWh
                </div>
                <div className="text-sm text-gray-600 font-medium">Daily Usage</div>
                <div className="text-xs text-gray-500 mt-1">
                  {annualConsumption.toLocaleString()} kWh/year
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {recommendedSystemKw} kW
                </div>
                <div className="text-sm text-gray-600 font-medium">Solar System</div>
                <div className="text-xs text-gray-500 mt-1">
                  ~{solarGeneration.toFixed(1)} kWh/day
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {batteryRecommendedKwh} kWh
                </div>
                <div className="text-sm text-gray-600 font-medium">Battery Storage</div>
                <div className="text-xs text-gray-500 mt-1">
                  For nighttime power
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  ${(bimonthlyBill * 6).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 font-medium">Annual Bill</div>
                <div className="text-xs text-gray-500 mt-1">
                  ${bimonthlyBill}/bimonthly
                </div>
              </div>
            </div>

            {/* Consumption Breakdown */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-blue-600" />
                Daily Consumption Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Load:</span>
                  <span className="font-semibold">{(breakdown.baseAppliances || breakdown.baseLoad || 0).toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">HVAC/Aircon:</span>
                  <span className="font-semibold">{(breakdown.hvac || 0).toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hot Water:</span>
                  <span className="font-semibold">{(breakdown.hotWater || 0).toFixed(1)} kWh</span>
                </div>
                {(breakdown.pool || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pool:</span>
                    <span className="font-semibold">{breakdown.pool.toFixed(1)} kWh</span>
                  </div>
                )}
                {(breakdown.ev || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">EV Charging:</span>
                    <span className="font-semibold">{breakdown.ev.toFixed(1)} kWh</span>
                  </div>
                )}
                {(breakdown.office || breakdown.homeOffice || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Home Office:</span>
                    <span className="font-semibold">{(breakdown.office || breakdown.homeOffice).toFixed(1)} kWh</span>
                  </div>
                )}
              </div>
            </div>

            {/* Time of Use */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Sun className="w-4 h-4 mr-2 text-orange-600" />
                Time-of-Use Pattern
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Daytime (6am-6pm)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${((timeOfUse.daytime || 0) / dailyConsumption) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-16 text-right">
                      {(timeOfUse.daytime || 0).toFixed(1)} kWh
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-600">Evening (6pm-10pm)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${((timeOfUse.evening || timeOfUse.eveningPeak || 0) / dailyConsumption) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-16 text-right">
                      {(timeOfUse.evening || timeOfUse.eveningPeak || 0).toFixed(1)} kWh
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm text-gray-600">Night (10pm-6am)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full" 
                        style={{ width: `${((timeOfUse.night || 0) / dailyConsumption) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-16 text-right">
                      {(timeOfUse.night || 0).toFixed(1)} kWh
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* System Strategy */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 mb-2">24/7 Energy Independence Strategy</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>• <strong>{recommendedSystemKw}kW solar system</strong> generates ~{solarGeneration.toFixed(1)} kWh/day</li>
                    <li>• Powers your home during the day ({(timeOfUse.daytime || 0).toFixed(1)} kWh)</li>
                    <li>• Charges <strong>{batteryRecommendedKwh}kWh battery</strong> for evening & night ({((timeOfUse.evening || 0) + (timeOfUse.night || 0)).toFixed(1)} kWh needed)</li>
                    {(breakdown.ev || 0) > 0 && evChargingTime === 'night' && (
                      <li>• Includes nighttime EV charging ({breakdown.ev.toFixed(1)} kWh)</li>
                    )}
                    <li>• Achieves ~{Math.round(selfSufficiency)}% energy self-sufficiency</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button onClick={() => setShowResults(false)} variant="outline" size="lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Edit
          </Button>
          <Button onClick={nextStep} size="lg" className="min-w-[200px]">
            Continue to Roof Analysis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 mb-3">
          <Zap className="w-7 h-7 text-orange-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          Tell Us About Your Energy Usage
        </h2>
        <p className="text-lg text-gray-600">
          This helps us recommend the perfect solar system for your needs
        </p>
      </div>

      {/* Bimonthly Bill */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-orange-600" />
            <span>Electricity Bill</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="bimonthlyBill" className="text-base font-semibold">
              What is your average electricity bill? (Every 2 months)
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Australian electricity bills are typically sent every 2 months (bimonthly)
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
              <Input
                id="bimonthlyBill"
                type="number"
                value={bimonthlyBill}
                onChange={(e) => setBimonthlyBill(Number(e.target.value))}
                className="pl-8 text-lg h-12"
                placeholder="300"
              />
            </div>
            {errors.bimonthlyBill && (
              <p className="text-sm text-red-600">{errors.bimonthlyBill}</p>
            )}
            <Slider
              min={100}
              max={2000}
              step={50}
              value={[bimonthlyBill]}
              onValueChange={(value) => {
                setBimonthlyBill(value[0]);
                if (errors.bimonthlyBill) {
                  setErrors({ ...errors, bimonthlyBill: '' });
                }
              }}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>$100</span>
              <span>$2,000</span>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg space-y-1">
              <p className="text-sm text-gray-500">
                Estimated annual cost: <strong>${estimatedAnnualCost.toLocaleString()}</strong> (${bimonthlyBill} × 6 bills/year)
              </p>
              <p className="text-sm text-gray-500">
                Estimated daily usage: <strong>{estimatedDailyUsage} kWh</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Household Size */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Household Size</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {HOUSEHOLD_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setHouseholdSize(size)}
                className={`
                  p-3 rounded-lg border-2 transition-all font-semibold
                  ${
                    householdSize === size
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                {size}+
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Electric Vehicle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-green-600" />
            <span>Electric Vehicle</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setHasEv(false);
                setPlanningEv(false);
              }}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  !hasEv && !planningEv
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="font-semibold">No EV</div>
              <div className="text-sm text-gray-500">No electric vehicle</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setHasEv(true);
                setPlanningEv(false);
              }}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  hasEv
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="font-semibold">Have EV</div>
              <div className="text-sm text-gray-500">Currently own one</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setHasEv(false);
                setPlanningEv(true);
              }}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  planningEv
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="font-semibold">Planning EV</div>
              <div className="text-sm text-gray-500">Getting one soon</div>
            </button>
          </div>

          {/* EV Details */}
          {(hasEv || planningEv) && (
            <div className="space-y-4 pt-2 border-t">
              <div className="space-y-2">
                <Label className="text-sm">Number of EVs</Label>
                <div className="flex space-x-2">
                  {[1, 2, 3].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setEvCount(count)}
                      className={`
                        px-4 py-2 rounded-lg border-2 transition-all font-semibold
                        ${
                          evCount === count
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">When do you typically charge?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {EV_CHARGING_TIMES.map((time) => (
                    <button
                      key={time.value}
                      type="button"
                      onClick={() => setEvChargingTime(time.value)}
                      className={`
                        p-3 rounded-lg border-2 transition-all text-left
                        ${
                          evChargingTime === time.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{time.icon}</span>
                        <span className="text-sm font-medium">{time.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 flex items-start space-x-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>
                    Charging during the day maximizes solar usage. Night charging may require a larger battery.
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">EV Battery Size</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {EV_BATTERY_SIZES.map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setEvBatterySize(size.value)}
                      className={`
                        p-3 rounded-lg border-2 transition-all text-left
                        ${
                          evBatterySize === size.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="font-semibold text-sm">{size.label}</div>
                      <div className="text-xs text-gray-500">{size.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Charging Method</Label>
                <div className="grid grid-cols-1 gap-2">
                  {EV_CHARGING_METHODS.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setEvChargingMethod(method.value)}
                      className={`
                        p-3 rounded-lg border-2 transition-all text-left
                        ${
                          evChargingMethod === method.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{method.icon}</span>
                          <div>
                            <div className="font-semibold text-sm">{method.label}</div>
                            <div className="text-xs text-gray-500">{method.power} • {method.description}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Average Charging Hours per Day</Label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="0.5"
                    value={evChargingHours}
                    onChange={(e) => setEvChargingHours(Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 text-center">
                    <span className="text-2xl font-bold text-blue-600">{evChargingHours}</span>
                    <span className="text-sm text-gray-500 ml-1">hrs</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 hour</span>
                  <span>12 hours</span>
                </div>
                <p className="text-xs text-gray-500 flex items-start space-x-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>
                    How many hours per day do you typically charge? This affects your daily energy consumption and battery sizing.
                  </span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Waves className="w-5 h-5 text-cyan-600" />
            <span>Swimming Pool</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setHasPool(false);
                setPoolHeated(false);
              }}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  !hasPool
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="font-semibold">No Pool</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setHasPool(true);
                setPoolHeated(false);
              }}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  hasPool && !poolHeated
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="font-semibold">Unheated Pool</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setHasPool(true);
                setPoolHeated(true);
              }}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  hasPool && poolHeated
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="font-semibold">Heated Pool</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Air Conditioning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wind className="w-5 h-5 text-cyan-600" />
            <span>Air Conditioning Usage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label className="text-sm">How much do you use air conditioning?</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { value: 'none', label: 'None', description: 'No AC or rarely used', icon: '🚫' },
                { value: 'minimal', label: 'Minimal', description: '2-3 hours/day', icon: '❄️' },
                { value: 'moderate', label: 'Moderate', description: '4-6 hours/day', icon: '❄️❄️' },
                { value: 'heavy', label: 'Heavy', description: 'Ducted or 8+ hours/day', icon: '❄️❄️❄️' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAcUsage(option.value)}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${
                      acUsage === option.value
                        ? 'border-cyan-600 bg-cyan-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hot Water */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Droplet className="w-5 h-5 text-orange-600" />
            <span>Hot Water System</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label className="text-sm">Do you have electric hot water?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasElectricHotWater(true)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${
                    hasElectricHotWater
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-semibold text-sm">Electric</div>
                  <div className="text-xs text-gray-500">Uses electricity</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setHasElectricHotWater(false)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${
                    !hasElectricHotWater
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="font-semibold text-sm">Gas</div>
                  <div className="text-xs text-gray-500">Uses gas</div>
                </div>
              </button>
            </div>
            <p className="text-xs text-gray-500 flex items-start space-x-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                Electric hot water adds to your electricity consumption. Gas hot water doesn't affect solar sizing.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Home Office */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <span>Home Office</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-sm">How many people work from home?</Label>
            <div className="flex space-x-2">
              {[0, 1, 2, 3].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setHomeOfficeCount(count)}
                  className={`
                    px-4 py-2 rounded-lg border-2 transition-all font-semibold flex-1
                    ${
                      homeOfficeCount === count
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  {count === 0 ? 'None' : count}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Working from home increases daytime electricity usage
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Electrical Phase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span>Electrical Phase</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label className="text-sm">What type of electrical connection do you have?</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateData({ threePhase: false })}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  ${
                    data.threePhase === false
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-semibold text-gray-900 mb-1">Single Phase</div>
                <div className="text-sm text-gray-500">
                  Standard residential connection (most common)
                </div>
                {data.threePhase === false && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => updateData({ threePhase: true })}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  ${
                    data.threePhase === true
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-semibold text-gray-900 mb-1">Three Phase</div>
                <div className="text-sm text-gray-500">
                  Higher capacity connection (+$2,000 upgrade cost)
                </div>
                {data.threePhase === true && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 flex items-start space-x-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                Not sure? Check your switchboard or electricity bill. Most homes have single phase.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
        <Button
          onClick={prevStep}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full sm:w-auto sm:min-w-[250px]"
        >
          <span className="hidden sm:inline">Calculate Energy Requirements</span>
          <span className="sm:hidden">Calculate Energy</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
