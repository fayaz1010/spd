'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  CheckCircle2,
  Circle,
  Camera,
  FileText,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  requiresPhoto: boolean;
  photoCount: number;
  notes?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  steps: ChecklistStep[];
  expanded: boolean;
}

export default function InstallationChecklist({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [jobNumber, setJobNumber] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadChecklist();
  }, [params.id]);

  useEffect(() => {
    calculateProgress();
  }, [sections]);

  const loadChecklist = async () => {
    // Mock data - in production, load from API
    setJobNumber('JOB-2025-001');
    setSections([
      {
        id: 'pre-install',
        title: '1. Pre-Installation',
        expanded: true,
        steps: [
          {
            id: 'tools-check',
            title: 'Tools & Equipment Check',
            description: 'Verify all required tools and equipment are available',
            completed: false,
            requiresPhoto: false,
            photoCount: 0
          },
          {
            id: 'safety-gear',
            title: 'Safety Equipment',
            description: 'Harness, helmet, safety glasses, gloves',
            completed: false,
            requiresPhoto: false,
            photoCount: 0
          },
          {
            id: 'site-inspection',
            title: 'Site Inspection',
            description: 'Check roof condition, access, and safety',
            completed: false,
            requiresPhoto: true,
            photoCount: 0
          },
          {
            id: 'before-photos',
            title: 'Before Photos',
            description: 'Take photos of roof, electrical panel, and site',
            completed: false,
            requiresPhoto: true,
            photoCount: 0
          }
        ]
      },
      {
        id: 'installation',
        title: '2. Installation',
        expanded: false,
        steps: [
          {
            id: 'racking',
            title: 'Install Racking System',
            description: 'Mount rails and ensure proper spacing',
            completed: false,
            requiresPhoto: true,
            photoCount: 0
          },
          {
            id: 'panels',
            title: 'Mount Solar Panels',
            description: 'Install panels and record serial numbers',
            completed: false,
            requiresPhoto: true,
            photoCount: 0
          },
          {
            id: 'inverter',
            title: 'Install Inverter',
            description: 'Mount inverter and record serial number',
            completed: false,
            requiresPhoto: true,
            photoCount: 0
          },
          {
            id: 'battery',
            title: 'Install Battery (if applicable)',
            description: 'Mount battery system and connect',
            completed: false,
            requiresPhoto: true,
            photoCount: 0
          },
          {
            id: 'wiring',
            title: 'Electrical Wiring',
            description: 'Complete all electrical connections',
            completed: false,
            requiresPhoto: true,
            photoCount: 0
          }
        ]
      },
      {
        id: 'testing',
        title: '3. Testing & Commissioning',
        expanded: false,
        steps: [
          {
            id: 'power-up',
            title: 'System Power-Up',
            description: 'Turn on system and check for errors',
            completed: false,
            requiresPhoto: false,
            photoCount: 0
          },
          {
            id: 'voltage-check',
            title: 'Voltage Checks',
            description: 'Verify all voltage readings are correct',
            completed: false,
            requiresPhoto: false,
            photoCount: 0
          },
          {
            id: 'inverter-config',
            title: 'Inverter Configuration',
            description: 'Configure inverter settings',
            completed: false,
            requiresPhoto: false,
            photoCount: 0
          },
          {
            id: 'monitoring',
            title: 'Monitoring Setup',
            description: 'Set up monitoring system and test',
            completed: false,
            requiresPhoto: false,
            photoCount: 0
          }
        ]
      },
      {
        id: 'completion',
        title: '4. Completion',
        expanded: false,
        steps: [
          {
            id: 'after-photos',
            title: 'After Photos',
            description: 'Take completion photos of entire system',
            completed: false,
            requiresPhoto: true,
            photoCount: 0
          },
          {
            id: 'cleanup',
            title: 'Site Cleanup',
            description: 'Remove all debris and packaging',
            completed: false,
            requiresPhoto: false,
            photoCount: 0
          },
          {
            id: 'walkthrough',
            title: 'Customer Walkthrough',
            description: 'Explain system operation to customer',
            completed: false,
            requiresPhoto: false,
            photoCount: 0
          },
          {
            id: 'signature',
            title: 'Customer Signature',
            description: 'Get customer sign-off on completion',
            completed: false,
            requiresPhoto: false,
            photoCount: 0
          }
        ]
      }
    ]);
    setLoading(false);
  };

  const calculateProgress = () => {
    const totalSteps = sections.reduce((acc, section) => acc + section.steps.length, 0);
    const completedSteps = sections.reduce(
      (acc, section) => acc + section.steps.filter(step => step.completed).length,
      0
    );
    setProgress(totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0);
  };

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, expanded: !section.expanded } : section
    ));
  };

  const toggleStep = (sectionId: string, stepId: string) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            steps: section.steps.map(step =>
              step.id === stepId ? { ...step, completed: !step.completed } : step
            )
          }
        : section
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-sm opacity-90">{jobNumber}</div>
              <h1 className="text-xl font-bold">Installation Checklist</h1>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-lg font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div 
                className="bg-white rounded-full h-3 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="p-4 space-y-3">
        {sections.map((section) => {
          const completedCount = section.steps.filter(s => s.completed).length;
          const totalCount = section.steps.length;
          
          return (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    completedCount === totalCount ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {completedCount === totalCount ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{section.title}</div>
                    <div className="text-sm text-gray-600">{completedCount}/{totalCount} completed</div>
                  </div>
                </div>
                {section.expanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Section Steps */}
              {section.expanded && (
                <div className="border-t border-gray-100">
                  {section.steps.map((step, index) => (
                    <div 
                      key={step.id}
                      className={`p-4 ${index !== section.steps.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStep(section.id, step.id)}
                          className="mt-1"
                        >
                          {step.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-300" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className={`font-medium mb-1 ${step.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {step.title}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{step.description}</div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {step.requiresPhoto && (
                              <Link href={`/mobile/installer/jobs/${params.id}/photos?step=${step.id}`}>
                                <button className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium">
                                  <Camera className="w-3 h-3" />
                                  {step.photoCount > 0 ? `${step.photoCount} Photos` : 'Add Photo'}
                                </button>
                              </Link>
                            )}
                            <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium">
                              <FileText className="w-3 h-3" />
                              {step.notes ? 'Edit Note' : 'Add Note'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complete Button */}
      {progress === 100 && (
        <div className="fixed bottom-20 left-0 right-0 p-4">
          <button className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg active:shadow-xl transition-shadow">
            Complete Installation ✓
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link href="/mobile/installer" className="flex flex-col items-center py-2 text-gray-600">
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/mobile/installer/jobs" className="flex flex-col items-center py-2 text-gray-600">
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs">Jobs</span>
          </Link>
          <Link href={`/mobile/installer/jobs/${params.id}/checklist`} className="flex flex-col items-center py-2 text-blue-600">
            <CheckCircle2 className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Checklist</span>
          </Link>
          <Link href="/mobile/clock" className="flex flex-col items-center py-2 text-gray-600">
            <Clock className="w-6 h-6 mb-1" />
            <span className="text-xs">Clock</span>
          </Link>
          <Link href="/mobile/schedule" className="flex flex-col items-center py-2 text-gray-600">
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs">More</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
