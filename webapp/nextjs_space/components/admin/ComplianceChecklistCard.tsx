'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ClipboardCheck,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

interface ComplianceChecklistCardProps {
  jobId: string;
  onUpdate?: () => void;
}

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
}

interface ChecklistSection {
  type: string;
  name: string;
  items: ChecklistItem[];
}

export function ComplianceChecklistCard({ jobId, onUpdate }: ComplianceChecklistCardProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['pre_install']);
  const [sections, setSections] = useState<ChecklistSection[]>([
    {
      type: 'pre_install',
      name: 'Pre-Installation',
      items: [
        { id: 'site_photos', name: 'Site photos (4 angles)', description: 'Front, roof, switchboard, battery location', isRequired: true, isCompleted: false },
        { id: 'roof_condition', name: 'Roof condition assessment', description: 'Photo of roof surface and structure', isRequired: true, isCompleted: false },
        { id: 'shading_analysis', name: 'Shading analysis', description: 'Photos showing potential shading sources', isRequired: true, isCompleted: false },
        { id: 'electrical_infra', name: 'Electrical infrastructure', description: 'Switchboard and meter box photos', isRequired: true, isCompleted: false },
        { id: 'customer_id', name: 'Customer ID verification', description: 'Driver license or passport', isRequired: true, isCompleted: false },
        { id: 'property_ownership', name: 'Property ownership verification', description: 'Rates notice or landlord permission', isRequired: true, isCompleted: false },
        { id: 'electricity_account', name: 'Electricity account verification', description: 'Recent bill with account number', isRequired: true, isCompleted: false },
        { id: 'safety_setup', name: 'Safety equipment setup', description: 'Harness, signage, fire extinguisher', isRequired: true, isCompleted: false },
        { id: 'equipment_verified', name: 'Equipment delivered and verified', description: 'All materials on site and checked', isRequired: true, isCompleted: false },
        { id: 'customer_briefing', name: 'Customer briefing completed', description: 'Explained process and timeline', isRequired: false, isCompleted: false }
      ]
    },
    {
      type: 'during_install',
      name: 'During Installation',
      items: [
        { id: 'panel_serials', name: 'All panel serial numbers photographed', description: 'Clear photo of each panel serial', isRequired: true, isCompleted: false },
        { id: 'inverter_serial', name: 'Inverter serial number photographed', description: 'Clear photo with datasheet', isRequired: true, isCompleted: false },
        { id: 'battery_serial', name: 'Battery serial number photographed', description: 'Clear photo with datasheet (if applicable)', isRequired: false, isCompleted: false },
        { id: 'cec_verification', name: 'Equipment CEC verification', description: 'All equipment on CEC approved list', isRequired: true, isCompleted: false },
        { id: 'mounting_installed', name: 'Mounting rails installed', description: 'Photos of rail installation', isRequired: true, isCompleted: false },
        { id: 'panels_installed', name: 'Panels installed', description: 'Photos of panel array', isRequired: true, isCompleted: false },
        { id: 'inverter_mounted', name: 'Inverter mounted', description: 'Photo of inverter location', isRequired: true, isCompleted: false },
        { id: 'battery_installed', name: 'Battery installed', description: 'Photos of battery installation (if applicable)', isRequired: false, isCompleted: false },
        { id: 'isolators_installed', name: 'AC/DC isolators installed', description: 'Photos of all isolators', isRequired: true, isCompleted: false },
        { id: 'cable_management', name: 'Cable management completed', description: 'Photos of conduit and cable runs', isRequired: true, isCompleted: false },
        { id: 'earthing_bonding', name: 'Earthing and bonding completed', description: 'Photos of earth connections', isRequired: true, isCompleted: false },
        { id: 'roof_penetrations', name: 'Roof penetrations sealed', description: 'All penetrations waterproofed', isRequired: true, isCompleted: false },
        { id: 'installer_selfie', name: 'Installer selfie with ID badge', description: 'Photo showing installer and ID', isRequired: true, isCompleted: false },
        { id: 'cec_card_photo', name: 'CEC accreditation card photographed', description: 'Clear photo of CEC card', isRequired: true, isCompleted: false },
        { id: 'license_photo', name: 'Electrical license photographed', description: 'Clear photo of license', isRequired: true, isCompleted: false },
        { id: 'safety_photos', name: 'Safety equipment photos', description: 'Harness in use, signage installed', isRequired: true, isCompleted: false },
        { id: 'warning_labels', name: 'Warning labels installed', description: 'Photos of all labels', isRequired: true, isCompleted: false },
        { id: 'system_label', name: 'System information label', description: 'Photo of system specs label', isRequired: true, isCompleted: false },
        { id: 'emergency_shutdown', name: 'Emergency shutdown instructions', description: 'Photo of shutdown label', isRequired: true, isCompleted: false },
        { id: 'vpp_enrollment', name: 'VPP enrollment confirmed', description: 'Battery VPP connection (if applicable)', isRequired: false, isCompleted: false }
      ]
    },
    {
      type: 'post_install',
      name: 'Post-Installation',
      items: [
        { id: 'insulation_test', name: 'Insulation resistance test', description: 'Test results recorded and photographed', isRequired: true, isCompleted: false },
        { id: 'earth_continuity', name: 'Earth continuity test', description: 'Test results recorded and photographed', isRequired: true, isCompleted: false },
        { id: 'polarity_test', name: 'Polarity test', description: 'Test results recorded and photographed', isRequired: true, isCompleted: false },
        { id: 'voltage_readings', name: 'Open circuit voltage readings', description: 'Readings recorded', isRequired: true, isCompleted: false },
        { id: 'current_readings', name: 'Short circuit current readings', description: 'Readings recorded', isRequired: true, isCompleted: false },
        { id: 'system_commissioned', name: 'System commissioned', description: 'Inverter showing generation', isRequired: true, isCompleted: false },
        { id: 'monitoring_active', name: 'Monitoring system active', description: 'App connected and working', isRequired: true, isCompleted: false },
        { id: 'battery_charging', name: 'Battery charging verified', description: 'Battery system operational (if applicable)', isRequired: false, isCompleted: false },
        { id: 'final_system_photos', name: 'Final system photos', description: 'Completed installation from all angles', isRequired: true, isCompleted: false },
        { id: 'site_cleaned', name: 'Site cleaned', description: 'No debris, tools removed', isRequired: true, isCompleted: false },
        { id: 'customer_shown', name: 'Customer shown system operation', description: 'Demonstrated inverter and monitoring', isRequired: true, isCompleted: false },
        { id: 'monitoring_demo', name: 'Monitoring app demonstrated', description: 'Customer can access app', isRequired: true, isCompleted: false },
        { id: 'emergency_explained', name: 'Emergency procedures explained', description: 'Customer knows shutdown process', isRequired: true, isCompleted: false },
        { id: 'handover_photo', name: 'Customer handover photo', description: 'Photo with customer at completion', isRequired: true, isCompleted: false },
        { id: 'customer_signature', name: 'Customer signature obtained', description: 'Handover form signed', isRequired: true, isCompleted: false }
      ]
    }
  ]);

  useEffect(() => {
    fetchChecklist();
  }, [jobId]);

  const fetchChecklist = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/jobs/${jobId}/checklist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          // Update sections with saved data
          setSections(prev => prev.map(section => ({
            ...section,
            items: section.items.map(item => {
              const saved = data.items.find((s: any) => s.itemName === item.id);
              return saved ? { ...item, isCompleted: saved.isCompleted } : item;
            })
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (sectionType: string, itemId: string) => {
    // Optimistically update UI
    setSections(prev => prev.map(section => {
      if (section.type === sectionType) {
        return {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
          )
        };
      }
      return section;
    }));

    // Save to backend
    try {
      const token = localStorage.getItem('admin_token');
      const item = sections.find(s => s.type === sectionType)?.items.find(i => i.id === itemId);
      
      await fetch(`/api/admin/jobs/${jobId}/checklist/${itemId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          checklistType: sectionType,
          itemName: itemId,
          itemDescription: item?.description,
          isRequired: item?.isRequired,
          isCompleted: !item?.isCompleted
        })
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast.error('Failed to update checklist');
      // Revert on error
      fetchChecklist();
    }
  };

  const toggleSection = (sectionType: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionType)
        ? prev.filter(s => s !== sectionType)
        : [...prev, sectionType]
    );
  };

  const getSectionProgress = (section: ChecklistSection) => {
    const required = section.items.filter(i => i.isRequired);
    const completed = required.filter(i => i.isCompleted);
    return {
      completed: completed.length,
      total: required.length,
      percentage: Math.round((completed.length / required.length) * 100)
    };
  };

  const getOverallProgress = () => {
    const allRequired = sections.flatMap(s => s.items.filter(i => i.isRequired));
    const allCompleted = allRequired.filter(i => i.isCompleted);
    return {
      completed: allCompleted.length,
      total: allRequired.length,
      percentage: Math.round((allCompleted.length / allRequired.length) * 100)
    };
  };

  const overall = getOverallProgress();
  const isComplete = overall.completed === overall.total;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-green-200">
      <CardHeader className="bg-green-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
            Installation Checklist
          </span>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge className="bg-orange-500">
                {overall.completed}/{overall.total} Items
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="text-gray-600">{overall.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                isComplete ? 'bg-green-600' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(overall.percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {overall.total} required items • {overall.total - overall.completed} remaining
          </p>
        </div>

        <Separator />

        {/* Checklist Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const progress = getSectionProgress(section);
            const isExpanded = expandedSections.includes(section.type);
            const sectionComplete = progress.completed === progress.total;

            return (
              <div key={section.type} className="border rounded-lg">
                <button
                  onClick={() => toggleSection(section.type)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {sectionComplete ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <div className="text-left">
                      <div className="font-semibold">{section.name}</div>
                      <div className="text-xs text-gray-500">
                        {progress.completed}/{progress.total} completed ({progress.percentage}%)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sectionComplete ? "default" : "secondary"} className={sectionComplete ? "bg-green-600" : ""}>
                      {progress.completed}/{progress.total}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 space-y-2">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded"
                      >
                        <Checkbox
                          checked={item.isCompleted}
                          onCheckedChange={() => handleToggleItem(section.type, item.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${item.isCompleted ? 'line-through text-gray-500' : 'font-medium'}`}>
                              {item.name}
                            </span>
                            {item.isRequired && !item.isCompleted && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Messages */}
        {!isComplete && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-sm text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <strong>Action Required:</strong> Complete all {overall.total - overall.completed} remaining items before submission.
            </p>
          </div>
        )}

        {isComplete && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <strong>Complete:</strong> All required checklist items completed. Ready for compliance submission.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
