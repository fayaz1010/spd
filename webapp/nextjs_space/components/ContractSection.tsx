'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Upload, CheckCircle } from 'lucide-react';

interface ContractSectionProps {
  applicationId: string;
  application: {
    contractUrl?: string | null;
    contractSignedDate?: string | null;
    offerLetterUrl?: string | null;
  };
  onUpdate: () => void;
}

export function ContractSection({ applicationId, application, onUpdate }: ContractSectionProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signedDate, setSignedDate] = useState(
    application.contractSignedDate 
      ? new Date(application.contractSignedDate).toISOString().split('T')[0]
      : ''
  );

  const handleGenerateContract = async () => {
    if (!application.offerLetterUrl) {
      toast({
        title: 'Offer Required',
        description: 'Please generate an offer letter first',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/applications/${applicationId}/generate-contract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Employment contract generated successfully',
        });
        onUpdate();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to generate contract',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate contract',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleUploadSigned = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid File',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signedDate', signedDate);

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/applications/${applicationId}/upload-contract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Signed contract uploaded successfully',
        });
        onUpdate();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to upload contract',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload contract',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Employment Contract
        </CardTitle>
        <CardDescription>
          {application.contractSignedDate 
            ? 'Contract has been signed' 
            : 'Generate and manage employment contract'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {application.contractSignedDate && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Contract Signed</p>
              <p className="text-sm text-green-700">
                Signed on {new Date(application.contractSignedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {!application.contractUrl ? (
          <Button 
            onClick={handleGenerateContract} 
            disabled={generating || !application.offerLetterUrl}
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : 'Generate Employment Contract'}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => window.open(application.contractUrl!, '_blank')}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Contract
            </Button>

            {!application.contractSignedDate && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Upload Signed Contract</Label>
                <div>
                  <Label htmlFor="signedDate" className="text-sm">Signing Date</Label>
                  <Input
                    id="signedDate"
                    type="date"
                    value={signedDate}
                    onChange={(e) => setSignedDate(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="signed-contract"
                    type="file"
                    accept=".pdf"
                    onChange={handleUploadSigned}
                    disabled={uploading || !signedDate}
                    className="flex-1"
                  />
                  <Button
                    variant="default"
                    disabled={uploading || !signedDate}
                    onClick={() => document.getElementById('signed-contract')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
