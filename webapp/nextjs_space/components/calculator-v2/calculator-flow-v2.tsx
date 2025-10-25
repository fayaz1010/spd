'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalculatorLayout } from './CalculatorLayout';
import { Step1Address } from './step1-address';
import { Step2Energy } from './step2-energy';
import { Step3RoofAnalysis } from './step3-roof-analysis';
import { Step4ChooseSystem } from './step4-choose-system';
import { Step5CustomizeV2 } from './step5-customize-v2';
import { Step6Contact } from './step6-contact';
import { Step7Payment } from './step7-payment';

// Calculator data interface
export interface CalculatorData {
  // Session tracking
  sessionId: string;
  
  // Step 1: Address
  address: string;
  propertyType: string;
  roofType: string;
  latitude?: number;
  longitude?: number;
  suburb?: string;
  
  // Step 2: Energy Profile
  bimonthlyBill: number;  // User input (every 2 months)
  quarterlyBill: number;  // Calculated (bimonthly × 1.5)
  householdSize: number;
  hasEv: boolean;
  planningEv: boolean;
  evCount: number;
  evChargingTime?: string;
  evChargingMethod?: string;  // level1_standard_socket, level2_ac_wallbox_1phase, level2_ac_wallbox_3phase_11kw, etc.
  evBatterySize?: number;      // 50, 75, 100 kWh
  evChargingHours?: number;    // Average hours per day charging (1-24)
  hasPool: boolean;
  poolHeated: boolean;
  homeOfficeCount: number;
  acUsage?: string;  // minimal, moderate, heavy, none
  hasElectricHotWater?: boolean;
  dailyConsumption?: number;
  energyAnalysis?: any;  // Full energy analysis from API
  
  // Step 3: Roof Analysis
  roofAnalysisData?: any;
  quoteOptions?: {
    small: any;
    medium: any;
    large: any;
  };
  
  // Step 4: Selected System
  selectedQuote?: any;
  selectedSize?: 'small' | 'medium' | 'large';
  
  // Step 5: Review & Customize
  quoteId?: string;
  selectedAddonIds?: string[];
  addonTotal?: number;
  finalCalculation?: any;
  selectedProducts?: {
    panelId: string;
    panelCount: number;
    batteryId: string | null;
    inverterId: string;
  };
  selectedPackage?: any;
  customizationNotes?: string;
  
  // Step 6: Contact
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  preferredContactTime?: string;
  leadId?: string;
  quoteReference?: string;
  
  // Step 7: Payment
  paymentChoice?: 'deposit' | 'full' | 'loan' | 'later';
  
  // WA Interest-Free Loan (collected only if loan option selected)
  loanRequested?: boolean;
  loanAmount?: number;
  loanTerm?: number; // years
  loanMonthlyPayment?: number;
  householdIncome?: number;
  numberOfDependents?: number;
  employmentStatus?: string;
  pensionCardHolder?: boolean;
  healthCareCardHolder?: boolean;
}

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  'Your Address',
  'Energy Usage',
  'Roof Analysis',
  'Choose System',
  'Review & Customize',
  'Your Details',
  'Payment Options',
];

export function CalculatorFlowV2() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [calculatorData, setCalculatorData] = useState<Partial<CalculatorData>>(() => {
    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      sessionId,
      householdSize: 4,
      quarterlyBill: 500,
      hasEv: false,
      planningEv: false,
      evCount: 0,
      hasPool: false,
      poolHeated: false,
      homeOfficeCount: 0,
    };
  });

  // Handle package pre-fill from URL params
  useEffect(() => {
    const packageId = searchParams?.get('packageId');
    const systemSize = searchParams?.get('systemSize');
    const batterySize = searchParams?.get('batterySize');

    if (packageId && systemSize) {
      // Fetch package details and pre-fill
      fetch(`/api/packages/active`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const pkg = data.packages.find((p: any) => p.id === packageId);
            if (pkg) {
              updateData({
                selectedPackage: pkg,
                // Pre-fill system preferences
                selectedSize: systemSize === '6.6' ? 'medium' : systemSize === '10' ? 'large' : 'small',
              });
            }
          }
        })
        .catch(err => console.error('Error fetching package:', err));
    }
  }, [searchParams]);

  const updateData = (data: Partial<CalculatorData>) => {
    setCalculatorData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || step === currentStep + 1) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <CalculatorLayout>
      <div className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
              Solar & Battery Calculator
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get an instant quote for your solar and battery system. 
              Tailored to your energy needs, powered by Australian sunshine.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <button
                    onClick={() => goToStep(step)}
                    disabled={step > currentStep + 1}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                      transition-all relative
                      ${
                        step === currentStep
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white scale-110 shadow-lg ring-4 ring-blue-200'
                          : step < currentStep
                          ? 'bg-gradient-to-br from-green-600 to-green-700 text-white hover:scale-105 cursor-pointer shadow-md'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {step < currentStep ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step
                    )}
                  </button>
                  {step < TOTAL_STEPS && (
                    <div
                      className={`
                        flex-1 h-1 mx-2 transition-all rounded-full
                        ${step < currentStep ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gray-200'}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Step {currentStep} of {TOTAL_STEPS}: <span className="text-blue-600">{STEP_TITLES[currentStep - 1]}</span>
              </p>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100">
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
            <Step4ChooseSystem
              data={calculatorData}
              updateData={updateData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )}

          {currentStep === 5 && (
            <Step5CustomizeV2
              data={calculatorData}
              updateData={updateData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )}

          {currentStep === 6 && (
            <Step6Contact
              data={calculatorData}
              updateData={updateData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )}

          {currentStep === 7 && (
            <Step7Payment
              data={calculatorData}
              updateData={updateData}
            />
          )}
        </div>
      </div>
    </div>
    </CalculatorLayout>
  );
}
