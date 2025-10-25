'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, Clock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateComplianceScore, getComplianceStatus, type ComplianceChecklistData } from '@/lib/compliance-scoring';

interface ComplianceChecklistProps {
  jobId: string;
  onScoreUpdate?: (score: number) => void;
}

interface ChecklistSection {
  title: string;
  icon: React.ReactNode;
  maxPoints: number;
  items: {
    key: keyof ComplianceChecklistData;
    label: string;
    points: number;
    isCritical?: boolean;
  }[];
}

export function ComplianceChecklist({ jobId, onScoreUpdate }: ComplianceChecklistProps) {
  const [checklist, setChecklist] = useState<ComplianceChecklistData>({
    cecAccreditationVerified: false,
    electricalLicenseVerified: false,
    councilPermitObtained: false,
    networkApprovalObtained: false,
    panelsValidated: false,
    inverterValidated: false,
    batteryValidated: false,
    isolatorsInstalled: false,
    labelsAffixed: false,
    earthingCompleted: false,
    insulationTested: false,
    earthContinuityTested: false,
    voltageRiseCalculated: false,
    systemCommissioned: false,
    sldCompleted: false,
    complianceCertIssued: false,
    customerHandoverComplete: false,
    photosUploaded: false,
    stcDocumentationComplete: false,
    customerDeclarationSigned: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const sections: ChecklistSection[] = [
    {
      title: 'Pre-Installation',
      icon: <Clock className="h-5 w-5" />,
      maxPoints: 20,
      items: [
        { key: 'cecAccreditationVerified', label: 'CEC Accreditation Verified', points: 5, isCritical: true },
        { key: 'electricalLicenseVerified', label: 'Electrical License Verified', points: 5, isCritical: true },
        { key: 'councilPermitObtained', label: 'Council Permit Obtained (if required)', points: 5 },
        { key: 'networkApprovalObtained', label: 'Network Approval Obtained', points: 5 },
      ],
    },
    {
      title: 'Installation',
      icon: <Shield className="h-5 w-5" />,
      maxPoints: 40,
      items: [
        { key: 'panelsValidated', label: 'All Panels Validated', points: 15, isCritical: true },
        { key: 'inverterValidated', label: 'Inverter Validated', points: 10, isCritical: true },
        { key: 'batteryValidated', label: 'Battery Validated (if applicable)', points: 5 },
        { key: 'isolatorsInstalled', label: 'DC & AC Isolators Installed', points: 3 },
        { key: 'labelsAffixed', label: 'Warning Labels Affixed', points: 3 },
        { key: 'earthingCompleted', label: 'Earthing Completed', points: 4 },
      ],
    },
    {
      title: 'Testing & Commissioning',
      icon: <CheckCircle2 className="h-5 w-5" />,
      maxPoints: 20,
      items: [
        { key: 'insulationTested', label: 'Insulation Resistance Test Passed', points: 7, isCritical: true },
        { key: 'earthContinuityTested', label: 'Earth Continuity Test Passed', points: 7, isCritical: true },
        { key: 'voltageRiseCalculated', label: 'Voltage Rise Calculated', points: 6 },
        { key: 'systemCommissioned', label: 'System Commissioned', points: 0 },
      ],
    },
    {
      title: 'Documentation',
      icon: <AlertCircle className="h-5 w-5" />,
      maxPoints: 20,
      items: [
        { key: 'sldCompleted', label: 'Single Line Diagram Completed', points: 5 },
        { key: 'complianceCertIssued', label: 'Compliance Certificate Issued', points: 5, isCritical: true },
        { key: 'customerHandoverComplete', label: 'Customer Handover Complete', points: 5 },
        { key: 'photosUploaded', label: 'Installation Photos Uploaded', points: 5 },
      ],
    },
  ];

  useEffect(() => {
    fetchChecklist();
  }, [jobId]);

  useEffect(() => {
    const score = calculateComplianceScore(checklist);
    onScoreUpdate?.(score.totalScore);
  }, [checklist]);

  const fetchChecklist = async () => {
    try {
      const response = await fetch(`/api/compliance/checklist/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setChecklist(data);
      }
    } catch (error) {
      console.error('Failed to fetch checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof ComplianceChecklistData) => {
    const newChecklist = { ...checklist, [key]: !checklist[key] };
    setChecklist(newChecklist);

    // Auto-save
    setSaving(true);
    try {
      await fetch(`/api/compliance/checklist/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChecklist),
      });
    } catch (error) {
      console.error('Failed to save checklist:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save checklist changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const score = calculateComplianceScore(checklist);
  const status = getComplianceStatus(score.totalScore);

  if (loading) {
    return <div className="p-6 text-center">Loading checklist...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Compliance Score Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Compliance Score</h2>
            <p className="text-sm text-gray-600">{status.message}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold" style={{ color: status.color }}>
              {score.totalScore}
            </div>
            <div className="text-sm text-gray-600">out of 100</div>
          </div>
        </div>

        <Progress value={score.totalScore} className="h-3" />

        {/* Section Scores */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {score.preInstallationScore}
            </div>
            <div className="text-xs text-gray-600">Pre-Install</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {score.installationScore}
            </div>
            <div className="text-xs text-gray-600">Installation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {score.testingScore}
            </div>
            <div className="text-xs text-gray-600">Testing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {score.documentationScore}
            </div>
            <div className="text-xs text-gray-600">Documentation</div>
          </div>
        </div>

        {/* Critical Issues */}
        {score.criticalIssues.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold text-red-800 mb-2">
              ⚠ Critical Issues ({score.criticalIssues.length})
            </p>
            <ul className="text-sm text-red-700 space-y-1">
              {score.criticalIssues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Checklist Sections */}
      {sections.map((section) => (
        <Card key={section.title} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {section.icon}
              <div>
                <h3 className="font-semibold">{section.title}</h3>
                <p className="text-sm text-gray-600">
                  {section.items.filter(item => checklist[item.key]).length} of {section.items.length} complete
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">
                {section.items.reduce((sum, item) => sum + (checklist[item.key] ? item.points : 0), 0)}
              </div>
              <div className="text-xs text-gray-600">of {section.maxPoints} pts</div>
            </div>
          </div>

          <div className="space-y-3">
            {section.items.map((item) => (
              <div
                key={item.key}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  checklist[item.key]
                    ? 'bg-green-50 border-green-200'
                    : item.isCritical
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={checklist[item.key]}
                    onCheckedChange={() => handleToggle(item.key)}
                  />
                  <div>
                    <p className="font-medium">
                      {item.label}
                      {item.isCritical && (
                        <span className="ml-2 text-xs text-red-600 font-semibold">
                          CRITICAL
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600">{item.points} points</p>
                  </div>
                </div>
                {checklist[item.key] && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Completion Status */}
      {score.isFullyCompliant ? (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">
                ✓ Fully Compliant - Ready to Complete Job
              </p>
              <p className="text-sm text-green-700">
                All compliance requirements met. Job can be marked as complete.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">
                Compliance Incomplete
              </p>
              <p className="text-sm text-yellow-700">
                {score.missingItems.length} items remaining. Complete all items before finishing job.
              </p>
            </div>
          </div>
        </Card>
      )}

      {saving && (
        <div className="text-sm text-gray-600 text-center">
          Saving changes...
        </div>
      )}
    </div>
  );
}
