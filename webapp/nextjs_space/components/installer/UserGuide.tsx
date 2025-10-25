'use client';

import { useState } from 'react';
import { 
  X, 
  Package, 
  MapPin, 
  Wrench, 
  Zap, 
  FileCheck, 
  HandHeart, 
  Trophy,
  Camera,
  Scan,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UserGuideProps {
  onClose: () => void;
}

export function UserGuide({ onClose }: UserGuideProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const stages = [
    {
      number: 1,
      title: 'Pre-Installation Check',
      icon: Package,
      color: 'bg-blue-500',
      tasks: [
        '✅ Check "Materials Delivered"',
        '📱 Scan ALL panel serial numbers',
        '📱 Scan inverter serial number',
        '📱 Scan battery serial (if applicable)',
        '📸 Take 2-5 photos of materials',
        '✅ Check "Safety Equipment"',
      ],
      tips: [
        'Use QR scanner for fast entry',
        'Can type manually if needed',
        'Take clear photos of all equipment',
      ],
    },
    {
      number: 2,
      title: 'On-Site Arrival',
      icon: MapPin,
      color: 'bg-green-500',
      tasks: [
        '🕐 Tap "Clock In" button',
        '📸 Take 1-3 site photos BEFORE work',
        '✅ Check "Safety Briefing Complete"',
        '📞 Use Call button if needed',
      ],
      tips: [
        'Clock in captures GPS location',
        'Site photos show before condition',
        'Safety briefing is mandatory',
      ],
    },
    {
      number: 3,
      title: 'Installation Progress',
      icon: Wrench,
      color: 'bg-purple-500',
      tasks: [
        '🔢 Update Panels Installed counter',
        '✅ Check "Inverter Installed"',
        '✅ Check "Battery Installed" (if applicable)',
        '✅ Check "Electrical Work Complete"',
        '📸 Take 5-20 installation photos',
      ],
      tips: [
        'Progress bar shows completion',
        'Take photos at each major step',
        'Breaks are tracked automatically',
      ],
    },
    {
      number: 4,
      title: 'Testing & Commissioning',
      icon: Zap,
      color: 'bg-yellow-500',
      tasks: [
        '⚡ Enter Voltage Test (e.g., 240.0V)',
        '⚡ Enter Current Test (e.g., 8.5A)',
        '✅ Check "Inverter Online"',
        '✅ Check "Battery Charging" (if applicable)',
        '✅ Check "Grid Export Test"',
        '📸 Take 2-5 system display photos',
      ],
      tips: [
        'Use multimeter for accurate readings',
        'Photo inverter display online status',
        'Photo meter showing export',
      ],
    },
    {
      number: 5,
      title: 'Compliance Documentation',
      icon: FileCheck,
      color: 'bg-indigo-500',
      tasks: [
        '📸 Take 3-10 compliance label photos',
        '📸 Take 4-10 system overview photos',
        '✅ System auto-generates SLD',
        '✅ System auto-generates test results',
      ],
      tips: [
        'Photo EVERY compliance label clearly',
        'Get wide shots of entire system',
        'Include switchboard, inverter, battery, panels',
      ],
    },
    {
      number: 6,
      title: 'Customer Handover',
      icon: HandHeart,
      color: 'bg-pink-500',
      tasks: [
        '✅ Complete system demo',
        '✅ Help set up monitoring app',
        '✅ Verify monitoring is active',
        '✅ Provide warranty documents',
        '⭐ Get customer rating (1-5 stars)',
      ],
      tips: [
        'Show customer monitoring app',
        'Explain warranty coverage',
        'Get honest feedback',
      ],
    },
    {
      number: 7,
      title: 'Job Complete',
      icon: Trophy,
      color: 'bg-orange-500',
      tasks: [
        '📊 Review job summary',
        '📝 Add final notes',
        '🕐 Tap "Clock Out & Complete"',
        '🏠 Auto-redirect to dashboard',
      ],
      tips: [
        'Total hours calculated automatically',
        'Notes help future reference',
        'Job marked COMPLETED in system',
      ],
    },
  ];

  const quickTips = [
    {
      icon: Camera,
      title: 'Photo Tips',
      items: [
        'Good lighting & clear focus',
        'Close-ups of serials/labels',
        'Wide shots of complete system',
        'Minimum 17, recommended 30-50',
      ],
    },
    {
      icon: Scan,
      title: 'Scanner Tips',
      items: [
        'Point camera at QR/barcode',
        'Auto-captures and validates',
        'Manual entry if scanner fails',
        'Scan all equipment serials',
      ],
    },
    {
      icon: CheckCircle,
      title: 'Before Leaving',
      items: [
        'All panels installed & photographed',
        'System commissioned & online',
        'All tests passed',
        'Customer demo complete',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Installer Guide</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-blue-100">7-stage wizard workflow guide</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 7 Stages */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              7-Stage Workflow
            </h3>
            
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isExpanded = expandedSection === index;
              
              return (
                <Card key={index} className="overflow-hidden">
                  <button
                    onClick={() => toggleSection(index)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-10 h-10 ${stage.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">
                        Stage {stage.number}: {stage.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stage.tasks.length} tasks
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t">
                      {/* Tasks */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2 mt-3">
                          What to do:
                        </p>
                        <ul className="space-y-1.5">
                          {stage.tasks.map((task, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-gray-400 mt-0.5">•</span>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tips */}
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          💡 Tips:
                        </p>
                        <ul className="space-y-1">
                          {stage.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-blue-700">
                              • {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Quick Tips */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900">Quick Tips</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {quickTips.map((tip, index) => {
                const Icon = tip.icon;
                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-sm">{tip.title}</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {tip.items.map((item, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-blue-500 mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Final Checklist */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Before Leaving Site
            </h3>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              {[
                'All panels installed',
                'Inverter commissioned',
                'Battery charging (if applicable)',
                'All tests passed',
                'Compliance labels photographed',
                'System photos taken',
                'Customer demo complete',
                'Monitoring app set up',
                'Customer rated experience',
                'Clocked out',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Photo Requirements */}
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photo Requirements
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-purple-800">Pre-Check:</span>
                <span className="font-semibold text-purple-900">2-5 photos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-800">Arrival:</span>
                <span className="font-semibold text-purple-900">1-3 photos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-800">Installation:</span>
                <span className="font-semibold text-purple-900">5-20 photos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-800">Testing:</span>
                <span className="font-semibold text-purple-900">2-5 photos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-800">Compliance:</span>
                <span className="font-semibold text-purple-900">7-20 photos</span>
              </div>
              <div className="border-t border-purple-200 pt-2 mt-2 flex justify-between items-center">
                <span className="font-semibold text-purple-900">Total Minimum:</span>
                <span className="font-bold text-purple-900 text-lg">17 photos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-purple-900">Recommended:</span>
                <span className="font-bold text-purple-900 text-lg">30-50 photos</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <Button onClick={onClose} className="w-full" size="lg">
            Got It! Let's Start
          </Button>
        </div>
      </div>
    </div>
  );
}
