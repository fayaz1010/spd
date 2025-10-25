'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle,
  Circle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ListChecks,
  Shield,
  Wrench,
  ClipboardCheck
} from 'lucide-react';
import Link from 'next/link';

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
  description?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  icon: any;
  items: ChecklistItem[];
}

export default function InstallerChecklistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistSection[]>([]);

  useEffect(() => {
    if (!jobId) {
      router.push('/installer/jobs');
      return;
    }
    fetchJobAndChecklist();
  }, [jobId]);

  const fetchJobAndChecklist = async () => {
    try {
      const token = localStorage.getItem('installer_token');
      
      // Fetch job details
      const jobResponse = await fetch(`/api/installer/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData.job);
      }

      // Fetch checklist
      const checklistResponse = await fetch(`/api/installer/checklist/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (checklistResponse.ok) {
        const checklistData = await checklistResponse.json();
        if (checklistData.checklist) {
          setChecklist(checklistData.checklist);
        } else {
          // Initialize default checklist
          setChecklist(getDefaultChecklist());
        }
      } else {
        setChecklist(getDefaultChecklist());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setChecklist(getDefaultChecklist());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultChecklist = (): ChecklistSection[] => {
    return [
      {
        id: 'pre_installation',
        title: 'Pre-Installation',
        icon: ClipboardCheck,
        items: [
          { id: 'site_photos', label: 'Site photos taken (4+ angles)', required: true, checked: false },
          { id: 'roof_assessment', label: 'Roof condition assessed', required: true, checked: false },
          { id: 'customer_id', label: 'Customer ID verified', required: true, checked: false },
          { id: 'property_ownership', label: 'Property ownership confirmed', required: true, checked: false },
          { id: 'electricity_account', label: 'Electricity account verified', required: true, checked: false },
          { id: 'shading_analysis', label: 'Shading analysis completed', required: false, checked: false },
          { id: 'meter_box_photo', label: 'Meter box photographed', required: true, checked: false },
          { id: 'switchboard_photo', label: 'Switchboard photographed', required: true, checked: false },
          { id: 'safety_setup', label: 'Safety equipment set up', required: true, checked: false },
          { id: 'tools_ready', label: 'All tools and materials ready', required: true, checked: false },
        ]
      },
      {
        id: 'equipment_verification',
        title: 'Equipment Verification',
        icon: Shield,
        items: [
          { id: 'panels_scanned', label: 'All panel serial numbers scanned', required: true, checked: false },
          { id: 'inverter_scanned', label: 'Inverter serial number scanned', required: true, checked: false },
          { id: 'battery_scanned', label: 'Battery serial number scanned (if applicable)', required: false, checked: false },
          { id: 'cec_verified', label: 'All equipment CEC approved', required: true, checked: false },
          { id: 'equipment_photos', label: 'Equipment datasheets photographed', required: true, checked: false },
          { id: 'qr_codes', label: 'QR codes scanned where available', required: false, checked: false },
        ]
      },
      {
        id: 'installation_work',
        title: 'Installation Work',
        icon: Wrench,
        items: [
          { id: 'roof_before', label: 'Roof "before" photos taken', required: true, checked: false },
          { id: 'mounting_installed', label: 'Mounting rails installed correctly', required: true, checked: false },
          { id: 'panels_installed', label: 'All panels installed', required: true, checked: false },
          { id: 'panels_secured', label: 'Panels properly secured', required: true, checked: false },
          { id: 'roof_sealed', label: 'Roof penetrations sealed', required: true, checked: false },
          { id: 'cable_management', label: 'Cable management completed', required: true, checked: false },
          { id: 'inverter_mounted', label: 'Inverter mounted securely', required: true, checked: false },
          { id: 'battery_installed', label: 'Battery installed (if applicable)', required: false, checked: false },
          { id: 'switchboard_work', label: 'Switchboard modifications completed', required: true, checked: false },
          { id: 'earthing', label: 'Earthing and bonding completed', required: true, checked: false },
          { id: 'isolators', label: 'AC/DC isolators installed', required: true, checked: false },
          { id: 'progress_photos', label: 'Installation progress photos taken', required: true, checked: false },
        ]
      },
      {
        id: 'safety_compliance',
        title: 'Safety & Compliance',
        icon: Shield,
        items: [
          { id: 'installer_selfie', label: 'Installer selfie with ID badge', required: true, checked: false },
          { id: 'cec_card', label: 'CEC accreditation card photographed', required: true, checked: false },
          { id: 'electrical_license', label: 'Electrical license photographed', required: true, checked: false },
          { id: 'warning_labels', label: 'All warning labels installed', required: true, checked: false },
          { id: 'system_labels', label: 'System information labels installed', required: true, checked: false },
          { id: 'emergency_labels', label: 'Emergency shutdown labels installed', required: true, checked: false },
          { id: 'safety_photos', label: 'Safety equipment photos taken', required: false, checked: false },
        ]
      },
      {
        id: 'testing',
        title: 'Testing & Commissioning',
        icon: CheckCircle,
        items: [
          { id: 'insulation_test', label: 'Insulation resistance test completed', required: true, checked: false },
          { id: 'earth_test', label: 'Earth continuity test completed', required: true, checked: false },
          { id: 'polarity_test', label: 'Polarity test completed', required: true, checked: false },
          { id: 'voltage_readings', label: 'Open circuit voltage recorded', required: true, checked: false },
          { id: 'current_readings', label: 'Short circuit current recorded', required: true, checked: false },
          { id: 'test_photos', label: 'Test equipment readings photographed', required: true, checked: false },
          { id: 'system_producing', label: 'System producing power', required: true, checked: false },
          { id: 'monitoring_active', label: 'Monitoring system active', required: true, checked: false },
          { id: 'vpp_connected', label: 'VPP connected (if battery)', required: false, checked: false },
        ]
      },
      {
        id: 'final_documentation',
        title: 'Final Documentation',
        icon: ClipboardCheck,
        items: [
          { id: 'system_photos', label: 'Completed system photos taken', required: true, checked: false },
          { id: 'site_cleaned', label: 'Site cleaned and debris removed', required: true, checked: false },
          { id: 'customer_handover', label: 'Customer handover photo taken', required: true, checked: false },
          { id: 'system_demo', label: 'System operation demonstrated to customer', required: true, checked: false },
          { id: 'monitoring_demo', label: 'Monitoring app demonstrated', required: true, checked: false },
          { id: 'emergency_explained', label: 'Emergency procedures explained', required: true, checked: false },
          { id: 'coes_completed', label: 'COES completed and signed', required: true, checked: false },
          { id: 'compliance_cert', label: 'Certificate of Compliance completed', required: true, checked: false },
          { id: 'commissioning_report', label: 'Commissioning report completed', required: true, checked: false },
          { id: 'customer_signature', label: 'Customer signature obtained', required: true, checked: false },
        ]
      }
    ];
  };

  const handleToggle = (sectionId: string, itemId: string) => {
    setChecklist(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => {
            if (item.id === itemId) {
              return { ...item, checked: !item.checked };
            }
            return item;
          })
        };
      }
      return section;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('installer_token');
      const response = await fetch(`/api/installer/checklist/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ checklist })
      });

      if (response.ok) {
        alert('Checklist saved successfully!');
      } else {
        alert('Failed to save checklist');
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      alert('Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  const getSectionProgress = (section: ChecklistSection) => {
    const requiredItems = section.items.filter(item => item.required);
    const checkedRequired = requiredItems.filter(item => item.checked);
    return {
      checked: checkedRequired.length,
      total: requiredItems.length,
      percentage: (checkedRequired.length / requiredItems.length) * 100
    };
  };

  const getOverallProgress = () => {
    const allRequired = checklist.flatMap(section => 
      section.items.filter(item => item.required)
    );
    const checkedRequired = allRequired.filter(item => item.checked);
    return {
      checked: checkedRequired.length,
      total: allRequired.length,
      percentage: (checkedRequired.length / allRequired.length) * 100
    };
  };

  const allRequiredComplete = () => {
    return checklist.every(section => {
      const requiredItems = section.items.filter(item => item.required);
      return requiredItems.every(item => item.checked);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading checklist...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Job not found</p>
          <Link href="/installer/jobs">
            <Button className="mt-4">Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const overallProgress = getOverallProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href={`/installer/jobs?jobId=${jobId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Compliance Checklist</h1>
                <p className="text-xs text-gray-500">{job.jobNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{job.lead.fullName}</p>
              <p className="text-xs text-gray-500">
                {overallProgress.checked}/{overallProgress.total} complete
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Progress */}
        <Card className="mb-6 border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-blue-600" />
                Overall Progress
              </span>
              {allRequiredComplete() ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="destructive">
                  {overallProgress.checked}/{overallProgress.total} items
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Required Items Completed</span>
                  <span className="text-gray-600">
                    {overallProgress.checked} / {overallProgress.total}
                  </span>
                </div>
                <Progress value={overallProgress.percentage} className="h-3" />
              </div>

              {allRequiredComplete() ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">All required items complete!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    You can now proceed to time & attendance.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">
                      {overallProgress.total - overallProgress.checked} required items remaining
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Complete all required items before finishing installation.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Checklist Sections */}
        <div className="space-y-6">
          {checklist.map((section) => {
            const progress = getSectionProgress(section);
            const Icon = section.icon;
            const isComplete = progress.checked === progress.total;

            return (
              <Card key={section.id} className={`border-2 ${isComplete ? 'border-green-200' : 'border-gray-200'}`}>
                <CardHeader className={isComplete ? 'bg-green-50' : 'bg-gray-50'}>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-5 w-5" />
                        {section.title}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={progress.percentage} className="h-2 w-48" />
                        <span className="text-sm text-gray-600">
                          {progress.checked}/{progress.total}
                        </span>
                      </div>
                    </div>
                    {isComplete && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 ${
                          item.checked 
                            ? 'bg-green-50 border-green-200' 
                            : item.required 
                            ? 'bg-white border-gray-200' 
                            : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => handleToggle(section.id, item.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium cursor-pointer">
                              {item.label}
                            </label>
                            {item.required ? (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Optional</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        {item.checked && (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="outline"
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Progress'
            )}
          </Button>
          {allRequiredComplete() && (
            <Link href={`/installer/attendance?jobId=${jobId}`} className="flex-1">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceed to Time & Attendance
              </Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
