'use client';

import { CheckCircle, Clock, Wrench, Zap } from 'lucide-react';

export default function InstallationProcess() {
  const phases = [
    {
      number: 1,
      title: 'Deposit & Approval',
      duration: '1-2 weeks',
      icon: CheckCircle,
      color: 'blue',
      steps: [
        'Pay deposit to commence',
        'Site verification completed',
        'Network approval lodged',
        'Equipment ordered',
      ],
    },
    {
      number: 2,
      title: 'Preparation',
      duration: '2-3 weeks',
      icon: Clock,
      color: 'green',
      steps: [
        'Equipment arrives',
        'Installation scheduled',
        'Pre-installation call',
        'Final site check',
      ],
    },
    {
      number: 3,
      title: 'Installation Day',
      duration: '1 day',
      icon: Wrench,
      color: 'orange',
      steps: [
        'Professional team arrives',
        'System installed',
        'Testing & commissioning',
        'Site cleaned up',
      ],
    },
    {
      number: 4,
      title: 'Activation',
      duration: '1 week',
      icon: Zap,
      color: 'purple',
      steps: [
        'Final inspections',
        'Meter connection',
        'System activated',
        'You start saving!',
      ],
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      light: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-500',
      light: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
    },
    orange: {
      bg: 'bg-orange-500',
      light: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-600',
    },
    purple: {
      bg: 'bg-purple-500',
      light: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
    },
  };

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Installation Journey
          </h2>
          <p className="text-xl text-gray-600">
            From deposit to activation in 4-6 weeks
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gray-200" style={{ zIndex: 0 }} />

          {/* Phases */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative" style={{ zIndex: 1 }}>
            {phases.map((phase) => {
              const Icon = phase.icon;
              const colors = colorClasses[phase.color as keyof typeof colorClasses];

              return (
                <div key={phase.number} className="relative">
                  {/* Phase Card */}
                  <div className={`${colors.light} border-2 ${colors.border} rounded-2xl p-6 hover:shadow-lg transition-shadow`}>
                    {/* Icon */}
                    <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 relative`}>
                      <Icon className="w-8 h-8 text-white" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-gray-200">
                        <span className="text-sm font-bold text-gray-900">{phase.number}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                      {phase.title}
                    </h3>

                    {/* Duration */}
                    <p className={`text-sm ${colors.text} font-semibold text-center mb-4`}>
                      {phase.duration}
                    </p>

                    {/* Steps */}
                    <ul className="space-y-2">
                      {phase.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                          <span className="text-sm text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Timeline */}
        <div className="mt-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-2xl p-8 text-white text-center">
          <h3 className="text-3xl font-bold mb-2">Total Timeline: 4-6 Weeks</h3>
          <p className="text-blue-100">
            From deposit to generating your own clean energy
          </p>
        </div>

        {/* What to Expect */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">What to Expect</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">On Installation Day:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Professional team arrives on time</li>
                <li>• Installation typically takes 6-8 hours</li>
                <li>• Minimal disruption to your day</li>
                <li>• Site left clean and tidy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">After Installation:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• System tested and commissioned</li>
                <li>• Monitoring app set up</li>
                <li>• Full handover and training</li>
                <li>• 24/7 support available</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
