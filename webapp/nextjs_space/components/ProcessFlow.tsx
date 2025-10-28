'use client';

import { useState } from 'react';
import { 
  Phone, 
  FileText, 
  CheckCircle, 
  Home, 
  FileCheck, 
  Zap, 
  Battery, 
  DollarSign,
  Calendar,
  Wrench,
  Send,
  Star,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  color: string;
  substeps?: Array<{
    title: string;
    description: string;
    icon: any;
  }>;
}

export function ProcessFlow() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps: ProcessStep[] = [
    {
      id: 1,
      title: 'Inquiry',
      description: 'Contact all leads, clarify & understand their requirements and suggest best solution',
      icon: Phone,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 2,
      title: 'Proposal',
      description: 'Send proposals and follow up, refer customer and provide clarifications. Refer financing customer to finance provider',
      icon: FileText,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 3,
      title: 'Confirmed Customer',
      description: 'Arrange site visit',
      icon: CheckCircle,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 4,
      title: 'Site Visit',
      description: 'Complete site visit checklist',
      icon: Home,
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 5,
      title: 'Approvals & Documentation',
      description: 'Process all required approvals and applications',
      icon: FileCheck,
      color: 'from-indigo-500 to-indigo-600',
      substeps: [
        {
          title: 'Generate Invoice',
          description: 'Send deposit payment invoice to the customer',
          icon: DollarSign,
        },
        {
          title: 'Synergy & WP Approval',
          description: 'Lodge Synergy and Western Power online',
          icon: Zap,
        },
        {
          title: 'Issue PO',
          description: 'Fill in the manual form and send to supplier',
          icon: Send,
        },
        {
          title: 'Lodge STC Application',
          description: 'Lodge STC application in Greendeal online portal',
          icon: FileCheck,
        },
        {
          title: 'WA State Rebate',
          description: 'Submit rebate/loan application with Plenti',
          icon: Battery,
        },
      ],
    },
    {
      id: 6,
      title: 'Schedule Installation',
      description: 'Schedule installation in Fieldpulse online portal. Contact installer and confirm installation date',
      icon: Calendar,
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      id: 7,
      title: 'Job Completion',
      description: 'Contact customer upon job completion',
      icon: Wrench,
      color: 'from-teal-500 to-teal-600',
    },
    {
      id: 8,
      title: 'Send Final Invoice',
      description: 'Send final invoice to customer',
      icon: DollarSign,
      color: 'from-amber-500 to-amber-600',
    },
    {
      id: 9,
      title: 'Customer Survey Form',
      description: 'Email customer satisfaction survey form',
      icon: Star,
      color: 'from-pink-500 to-pink-600',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-blue-100 rounded-full px-6 py-2 mb-4">
            <p className="text-sm font-semibold text-blue-600">Our Process</p>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Your Solar Journey in 9 Simple Steps
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From initial contact to final installation, we guide you through every step with transparency and expertise
          </p>
        </div>

        {/* Desktop View - Vertical Flow */}
        <div className="hidden lg:block relative">
          {/* Connecting Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200 transform -translate-x-1/2" />

          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLeft = index % 2 === 0;
              const isActive = activeStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`relative flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
                  onMouseEnter={() => setActiveStep(step.id)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  {/* Card */}
                  <div className={`w-5/12 ${isLeft ? 'pr-12' : 'pl-12'}`}>
                    <Card 
                      className={`
                        cursor-pointer transition-all duration-300 hover:shadow-2xl
                        ${isActive ? 'scale-105 shadow-2xl ring-2 ring-coral' : 'hover:scale-102'}
                      `}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`bg-gradient-to-br ${step.color} rounded-xl p-3 flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-gray-900 text-white">Step {step.id}</Badge>
                              <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed">{step.description}</p>
                            
                            {/* Substeps */}
                            {step.substeps && isActive && (
                              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                {step.substeps.map((substep, idx) => {
                                  const SubIcon = substep.icon;
                                  return (
                                    <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                      <SubIcon className="w-4 h-4 text-coral flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-sm font-semibold text-gray-900">{substep.title}</p>
                                        <p className="text-xs text-gray-600">{substep.description}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Center Circle */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                    <div 
                      className={`
                        w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                        ${isActive 
                          ? 'bg-gradient-to-br from-coral to-orange-600 scale-125 shadow-lg' 
                          : 'bg-white border-4 border-blue-200'
                        }
                      `}
                    >
                      <span className={`text-lg font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                        {step.id}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-1/2 -bottom-4 transform -translate-x-1/2 z-0">
                      <ChevronRight className="w-6 h-6 text-blue-300 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile View - Vertical Cards */}
        <div className="lg:hidden space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;

            return (
              <Card 
                key={step.id}
                className="cursor-pointer transition-all duration-300 hover:shadow-xl"
                onClick={() => setActiveStep(isActive ? null : step.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`bg-gradient-to-br ${step.color} rounded-xl p-3 flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-gray-900 text-white">Step {step.id}</Badge>
                        <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                      
                      {/* Substeps */}
                      {step.substeps && isActive && (
                        <div className="mt-4 space-y-2">
                          {step.substeps.map((substep, idx) => {
                            const SubIcon = substep.icon;
                            return (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                <SubIcon className="w-4 h-4 text-coral flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{substep.title}</p>
                                  <p className="text-xs text-gray-600">{substep.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {step.substeps && (
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600 mb-6">
            Ready to start your solar journey?
          </p>
          <a href="/calculator-v2">
            <button className="bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2">
              Get Your Free Quote
              <ArrowRight className="w-5 h-5" />
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}
