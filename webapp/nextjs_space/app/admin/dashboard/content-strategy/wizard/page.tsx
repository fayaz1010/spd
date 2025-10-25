'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Wizard steps
import { Step1TopicSelection } from '@/components/content-strategy/Step1TopicSelection';
import { Step2PillarPlanning } from '@/components/content-strategy/Step2PillarPlanning';
import { Step3ClusterPlanning } from '@/components/content-strategy/Step3ClusterPlanning';
import { Step4FunnelIntegration } from '@/components/content-strategy/Step4FunnelIntegration';
import { Step5ReviewPublish } from '@/components/content-strategy/Step5ReviewPublish';

export default function ContentStrategyWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [strategyData, setStrategyData] = useState<any>({
    name: '',
    targetAudience: '',
    businessGoals: '',
    mainTopic: '',
    pillars: [],
    clusters: [],
    funnelConfig: {
      calculatorPlacements: [],
      packageLinks: [],
      productLinks: [],
    },
  });

  const steps = [
    { number: 1, title: 'Topic Selection', component: Step1TopicSelection },
    { number: 2, title: 'Pillar Planning', component: Step2PillarPlanning },
    { number: 3, title: 'Cluster Planning', component: Step3ClusterPlanning },
    { number: 4, title: 'Funnel Integration', component: Step4FunnelIntegration },
    { number: 5, title: 'Review & Publish', component: Step5ReviewPublish },
  ];

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepData: any) => {
    setStrategyData({ ...strategyData, ...stepData });
    handleNext();
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard/content-strategy">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Strategies
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-coral" />
                Content Strategy Wizard
              </h1>
              <p className="text-gray-600">Create a complete SEO domination strategy in 5 steps</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-center gap-2 ${
                step.number === currentStep
                  ? 'text-coral font-semibold'
                  : step.number < currentStep
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step.number === currentStep
                    ? 'border-coral bg-coral text-white'
                    : step.number < currentStep
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {step.number < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span className="hidden md:block text-sm">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <CurrentStepComponent
              data={strategyData}
              onComplete={handleStepComplete}
              onBack={handleBack}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
