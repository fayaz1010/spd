'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Send, Link as LinkIcon } from 'lucide-react';

interface OnboardingChecklistProps {
  applicationId: string;
  application: {
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    onboardingChecklist?: any;
    contractSignedDate?: string | null;
  };
  onUpdate: () => void;
}

export function OnboardingChecklist({ applicationId, application, onUpdate }: OnboardingChecklistProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const checklist = application.onboardingChecklist || {
    contractSigned: false,
    taxFormComplete: false,
    bankDetailsProvided: false,
    emergencyContactAdded: false,
    driverLicenseUploaded: false,
    electricalLicenseUploaded: false,
    cecAccreditationUploaded: false,
    equipmentOrdered: false,
    systemAccessCreated: false,
    inductionScheduled: false,
  };

  const checklistItems = [
    { key: 'contractSigned', label: 'Contract Signed', auto: true },
    { key: 'taxFormComplete', label: 'Tax Form Complete', auto: true },
    { key: 'bankDetailsProvided', label: 'Bank Details Provided', auto: true },
    { key: 'emergencyContactAdded', label: 'Emergency Contact Added', auto: true },
    { key: 'driverLicenseUploaded', label: 'Driver License Uploaded', auto: true },
    { key: 'electricalLicenseUploaded', label: 'Electrical License Verified', auto: false },
    { key: 'cecAccreditationUploaded', label: 'CEC Accreditation Verified', auto: false },
    { key: 'equipmentOrdered', label: 'Equipment Ordered', auto: false },
    { key: 'systemAccessCreated', label: 'System Access Created', auto: false },
    { key: 'inductionScheduled', label: 'Induction Scheduled', auto: false },
  ];

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = checklistItems.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const handleSendOnboardingLink = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/applications/${applicationId}/send-onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Onboarding link sent to candidate',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to send onboarding link',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send onboarding link',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/onboarding/${applicationId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied',
      description: 'Onboarding link copied to clipboard',
    });
  };

  const handleToggleItem = async (key: string, currentValue: boolean) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('admin_token');
      const updatedChecklist = { ...checklist, [key]: !currentValue };
      
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          onboardingChecklist: updatedChecklist,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Updated',
          description: 'Checklist updated',
        });
        onUpdate();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update checklist',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update checklist',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Onboarding Checklist
        </CardTitle>
        <CardDescription>
          Track onboarding progress - {completedCount} of {totalCount} completed ({progress}%)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all" 
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Send Onboarding Link */}
        {application.status === 'OFFER_ACCEPTED' && !checklist.taxFormComplete && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-blue-900">
              Send onboarding link to {application.firstName} {application.lastName} to collect their information.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleSendOnboardingLink}
                disabled={sending}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Email'}
              </Button>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        )}

        {/* Checklist Items */}
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <Checkbox
                id={item.key}
                checked={checklist[item.key]}
                onCheckedChange={() => handleToggleItem(item.key, checklist[item.key])}
                disabled={updating || item.auto}
              />
              <label
                htmlFor={item.key}
                className={`text-sm cursor-pointer flex-1 ${
                  checklist[item.key] ? 'line-through text-gray-500' : ''
                }`}
              >
                {item.label}
                {item.auto && <span className="text-xs text-gray-400 ml-2">(auto)</span>}
              </label>
            </div>
          ))}
        </div>

        {progress === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900 font-medium">
              ✓ All onboarding tasks complete! Ready to convert to staff member.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
