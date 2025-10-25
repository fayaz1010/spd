'use client';

import { CheckCircle, Circle } from 'lucide-react';

interface Stage {
  number: number;
  name: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface WizardProgressProps {
  stages: Stage[];
  currentStage: number;
}

export function WizardProgress({ stages, currentStage }: WizardProgressProps) {
  return (
    <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
      <div className="px-4 py-3">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-2">
          {stages.map((stage, index) => (
            <div key={stage.number} className="flex items-center flex-1">
              {/* Stage Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    stage.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : stage.status === 'current'
                      ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {stage.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    stage.number
                  )}
                </div>
                <div
                  className={`text-[10px] mt-1 font-medium text-center max-w-[60px] ${
                    stage.status === 'current' ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {stage.name}
                </div>
              </div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 ${
                    stage.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current Stage Name */}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">
            {stages.find((s) => s.status === 'current')?.name || 'Complete'}
          </p>
          <p className="text-xs text-gray-500">
            Step {currentStage} of {stages.length}
          </p>
        </div>
      </div>
    </div>
  );
}
