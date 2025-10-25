'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Send, CheckCircle } from 'lucide-react';

interface OfferSectionProps {
  applicationId: string;
  application: {
    offerDate?: string | null;
    offerSalary?: number | null;
    offerStartDate?: string | null;
    offerProbationPeriod?: number | null;
    offerSpecialConditions?: string | null;
    offerLetterUrl?: string | null;
    offerAcceptedDate?: string | null;
  };
  position: {
    title: string;
    annualSalaryMin?: number | null;
    annualSalaryMax?: number | null;
  };
  onUpdate: () => void;
}

export function OfferSection({ applicationId, application, position, onUpdate }: OfferSectionProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  
  // Prefill salary with position minimum if available
  const defaultSalary = application.offerSalary?.toString() || 
    (position.annualSalaryMin ? position.annualSalaryMin.toString() : '');
  
  const [formData, setFormData] = useState({
    salary: defaultSalary,
    startDate: application.offerStartDate 
      ? new Date(application.offerStartDate).toISOString().split('T')[0] 
      : '',
    probationPeriod: application.offerProbationPeriod?.toString() || '3',
    specialConditions: application.offerSpecialConditions || '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleGenerateOffer = async () => {
    if (!formData.salary || !formData.startDate || !formData.probationPeriod) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/applications/${applicationId}/generate-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: 'Offer letter generated successfully',
        });
        onUpdate();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to generate offer letter',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate offer letter',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Job Offer
        </CardTitle>
        <CardDescription>
          {application.offerLetterUrl 
            ? 'Offer letter has been generated' 
            : 'Create and send job offer to candidate'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {application.offerAcceptedDate && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Offer Accepted</p>
              <p className="text-sm text-green-700">
                Accepted on {new Date(application.offerAcceptedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="salary">Annual Salary (AUD) *</Label>
              {position.annualSalaryMin && position.annualSalaryMax ? (
                <span className="text-xs font-medium text-blue-600">
                  Range: {formatCurrency(position.annualSalaryMin)} - {formatCurrency(position.annualSalaryMax)}
                </span>
              ) : (
                <span className="text-xs text-gray-400">No range set for {position.title}</span>
              )}
            </div>
            <Input
              id="salary"
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              placeholder={position.annualSalaryMin ? position.annualSalaryMin.toString() : "e.g., 75000"}
              disabled={!!application.offerLetterUrl}
            />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              disabled={!!application.offerLetterUrl}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="probationPeriod">Probation Period (months) *</Label>
          <Input
            id="probationPeriod"
            type="number"
            value={formData.probationPeriod}
            onChange={(e) => setFormData({ ...formData, probationPeriod: e.target.value })}
            placeholder="e.g., 3"
            disabled={!!application.offerLetterUrl}
          />
        </div>

        <div>
          <Label htmlFor="specialConditions">Special Conditions (Optional)</Label>
          <Textarea
            id="specialConditions"
            value={formData.specialConditions}
            onChange={(e) => setFormData({ ...formData, specialConditions: e.target.value })}
            rows={3}
            placeholder="Any special terms or conditions..."
            disabled={!!application.offerLetterUrl}
          />
        </div>

        <div className="flex gap-3">
          {!application.offerLetterUrl ? (
            <Button 
              onClick={handleGenerateOffer} 
              disabled={generating}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Generate Offer Letter'}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => window.open(application.offerLetterUrl!, '_blank')}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Offer Letter
              </Button>
              <Button
                variant="default"
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Candidate
              </Button>
            </>
          )}
        </div>

        {application.offerDate && (
          <p className="text-sm text-gray-500">
            Offer generated on {new Date(application.offerDate).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
