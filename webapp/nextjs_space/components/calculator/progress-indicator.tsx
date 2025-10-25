
'use client';

import { CheckCircle } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

const STEP_LABELS = [
  'Property Details',
  'Energy Usage',
  'Requirement Analysis',
  'System Design',
  'Add-ons',
  'Savings Report',
  'Your Quote'
];

export function ProgressIndicator({ currentStep, totalSteps, onStepClick }: ProgressIndicatorProps) {
  const handleStepClick = (stepNum: number) => {
    // Only allow navigation to previous steps (completed steps)
    if (stepNum < currentStep && onStepClick) {
      onStepClick(stepNum);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-primary">
          Step {currentStep} of {totalSteps}
        </h2>
        <div className="text-sm text-gray-500">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </div>
      </div>
      
      <div className="relative">
        <div className="overflow-hidden h-2 mb-6 text-xs flex rounded-full bg-gray-200">
          <div
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-coral to-gold transition-all duration-500"
          />
        </div>

        <div className="hidden md:flex justify-between">
          {STEP_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isComplete = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            const isClickable = isComplete;
            
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center" 
                style={{ width: `${100 / totalSteps}%` }}
              >
                <button
                  onClick={() => handleStepClick(stepNum)}
                  disabled={!isClickable}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all
                    ${isComplete ? 'bg-emerald text-white hover:bg-emerald-dark hover:scale-110 cursor-pointer' : 
                      isCurrent ? 'bg-coral text-white' : 
                      'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    ${isClickable ? 'shadow-md hover:shadow-lg' : ''}
                  `}
                  title={isClickable ? `Go back to ${label}` : label}
                >
                  {isComplete ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <span className="font-semibold">{stepNum}</span>
                  )}
                </button>
                <span className={`text-xs text-center ${isCurrent ? 'text-coral font-semibold' : isComplete ? 'text-emerald font-medium' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
