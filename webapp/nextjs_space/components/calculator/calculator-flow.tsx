
'use client';

import { useState } from 'react';
import { Step1Address } from './step1-address';
import { Step2Energy } from './step2-energy';
import { Step3RoofAnalysis } from './step3-roof-analysis';
import { Step4SystemDesign } from './step4-system-design';
import { Step5Customization } from './step5-customization';
import { Step6Financial } from './step6-financial';
import { Step7LeadCapture } from './step7-lead-capture';
import { ProgressIndicator } from './progress-indicator';

export interface CalculatorData {
  // Step 1
  address: string;
  propertyType: string;
  roofType: string;
  
  // Step 2 - Basic
  quarterlyBill: number;
  householdSize: number;
  usagePattern: string;
  hasEv: boolean;
  planningEv: boolean;
  evCount: number;
  hasElectricHotWater: boolean;
  hasElectricCooking: boolean;
  
  // Step 2 - EV Enhanced
  evChargingTime?: string; // morning, midday, evening, night
  evUsageTier?: string; // light, average, heavy, very_heavy
  
  // Step 2 - Bill Data
  billData?: any[]; // Array of bill periods
  seasonalPattern?: any; // Seasonal usage patterns
  
  // Step 2 - Advanced Profile (Optional)
  bedrooms?: number;
  hasPool?: boolean;
  poolHeated?: boolean;
  homeOffices?: number;
  hvacUsage?: string; // 'minimal', 'moderate', 'heavy'
  dailyConsumption?: number; // kWh/day if known
  overnightUsage?: number; // kWh/night (for battery sizing)
  
  // Lead tracking
  leadId?: string;
  
  // Step 3
  roofArea?: number;
  solarIrradiance?: number;
  shadingAnalysis?: string;
  financialAnalyses?: any[]; // Google Solar API financial data
  roofAnalysisData?: any; // Complete Google Solar API analysis data
  configurations?: any[]; // Generated system configurations for Step 4
  roofSegments?: any[]; // Analyzed roof segments
  
  // Step 4
  systemSizeKw: number;
  numPanels: number;
  panelWattage?: number; // Wattage of individual panels (e.g., 440W)
  batterySizeKwh: number;
  
  // Initial recommendations (persisted from step 3)
  recommendedSystemSizeKw?: number;
  recommendedNumPanels?: number;
  recommendedPanelWattage?: number;
  recommendedBatterySizeKwh?: number;
  recommendedInverterSizeKw?: number;
  
  // Brand selections (IDs from Step 5)
  selectedPanelBrand?: string;
  selectedBatteryBrand?: string;
  selectedInverterBrand?: string;
  
  // Brand names for display
  selectedPanelBrandName?: string;
  selectedBatteryBrandName?: string;
  selectedInverterBrandName?: string;
  
  // Costs from Step 5 (for consistency between steps)
  step5Costs?: {
    panelsCost: number;
    batteryCost: number;
    inverterCost: number;
    installationCost: number;
    totalBeforeRebates: number;
    federalSRES: number;
    federalBattery: number;
    waBatteryScheme: number;
    totalRebates: number;
    finalInvestment: number;
    annualSavings: number;
  };
  
  // Step 5
  selectedAddons: string[];
  
  // Payment preferences
  paymentPreference?: 'full' | 'deposit' | 'finance';
  financeMonths?: number;
  
  // Quote tracking (Single Source of Truth)
  sessionId?: string;
  quoteId?: string;
  savedQuote?: any; // The complete saved quote from the database
}

const TOTAL_STEPS = 7;

export function CalculatorFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [calculatorData, setCalculatorData] = useState<Partial<CalculatorData>>(() => {
    // Generate a unique session ID for this calculator session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      selectedAddons: [],
      batterySizeKwh: 0,
      sessionId, // Track this session for quote persistence
    };
  });

  const updateData = (data: Partial<CalculatorData>) => {
    setCalculatorData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ProgressIndicator 
        currentStep={currentStep} 
        totalSteps={TOTAL_STEPS} 
        onStepClick={goToStep}
      />
      
      <div className="mt-8">
        {currentStep === 1 && (
          <Step1Address 
            data={calculatorData}
            updateData={updateData}
            nextStep={nextStep}
          />
        )}
        
        {currentStep === 2 && (
          <Step2Energy 
            data={calculatorData}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        
        {currentStep === 3 && (
          <Step3RoofAnalysis 
            data={calculatorData}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        
        {currentStep === 4 && (
          <Step4SystemDesign 
            data={calculatorData}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        
        {currentStep === 5 && (
          <Step5Customization 
            data={calculatorData}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        
        {currentStep === 6 && (
          <Step6Financial 
            data={calculatorData}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        
        {currentStep === 7 && (
          <Step7LeadCapture 
            data={calculatorData}
            prevStep={prevStep}
          />
        )}
      </div>
    </div>
  );
}
