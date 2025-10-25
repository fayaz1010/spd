'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConvertToStaffSectionProps {
  applicationId: string;
  application: {
    firstName: string;
    lastName: string;
    status: string;
    convertedToStaffId?: string | null;
    convertedDate?: string | null;
    taxFileNumber?: string | null;
    bankAccountNumber?: string | null;
    contractSignedDate?: string | null;
    onboardingChecklist?: any;
  };
  vacancy: {
    position: {
      title: string;
    };
  };
}

export function ConvertToStaffSection({ applicationId, application, vacancy }: ConvertToStaffSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [converting, setConverting] = useState(false);

  const isReadyToConvert = 
    application.status === 'ONBOARDING' &&
    application.taxFileNumber &&
    application.bankAccountNumber &&
    application.contractSignedDate;

  const handleConvert = async () => {
    setConverting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/applications/${applicationId}/convert-to-staff`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: `${application.firstName} ${application.lastName} has been converted to a staff member`,
        });
        
        // Redirect to staff member page
        setTimeout(() => {
          router.push(`/admin/dashboard/staff/${data.staffId}`);
        }, 1500);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to convert to staff',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to convert to staff',
        variant: 'destructive',
      });
    } finally {
      setConverting(false);
    }
  };

  if (application.convertedToStaffId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <UserPlus className="h-5 w-5" />
            Converted to Staff
          </CardTitle>
          <CardDescription>
            This candidate has been successfully converted to a staff member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              Converted on {new Date(application.convertedDate!).toLocaleDateString()}
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => router.push(`/admin/dashboard/staff/${application.convertedToStaffId}`)}
            >
              View Staff Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Convert to Staff Member
        </CardTitle>
        <CardDescription>
          Final step: Create staff member record for {application.firstName} {application.lastName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isReadyToConvert && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium mb-2">Cannot convert yet. Missing:</p>
              <ul className="list-disc list-inside space-y-1">
                {!application.taxFileNumber && <li>Tax file number</li>}
                {!application.bankAccountNumber && <li>Bank account details</li>}
                {!application.contractSignedDate && <li>Signed contract</li>}
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <p className="font-medium">This will:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Create a new staff member record</li>
            <li>Assign to position: {vacancy.position.title}</li>
            <li>Transfer all collected information</li>
            <li>Create user account for system access</li>
            <li>Send welcome email with login details</li>
          </ul>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              disabled={!isReadyToConvert || converting}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {converting ? 'Converting...' : 'Convert to Staff Member'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Conversion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to convert {application.firstName} {application.lastName} to 
                a staff member? This action will create their employee record and grant system access.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConvert}>
                Confirm Conversion
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
