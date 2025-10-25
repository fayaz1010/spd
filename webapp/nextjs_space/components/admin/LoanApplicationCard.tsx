'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalPortalModal } from '@/components/admin/ExternalPortalModal';
import { 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check,
  DollarSign,
  Loader2,
  FileText,
  AlertCircle,
  Paperclip,
  Download,
  Trash2,
  Upload
} from 'lucide-react';

interface LoanApplicationCardProps {
  leadId: string;
  lead: any;
  loanApplication?: any;
  onUpdate?: () => void;
}

export function LoanApplicationCard({ 
  leadId, 
  lead, 
  loanApplication,
  onUpdate 
}: LoanApplicationCardProps) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Use lead.loanApplication if loanApplication prop is not provided
  const savedLoanApp = loanApplication || lead?.loanApplication;
  
  // Loan fields
  const [applicationReferenceNumber, setApplicationReferenceNumber] = useState('');
  const [submittedAt, setSubmittedAt] = useState('');
  const [approved, setApproved] = useState(false);
  const [approvedAt, setApprovedAt] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  // Load data from lead when component mounts or lead changes
  useEffect(() => {
    if (savedLoanApp) {
      setApplicationReferenceNumber(savedLoanApp.applicationReferenceNumber || '');
      setSubmittedAt(
        savedLoanApp.submittedAt 
          ? new Date(savedLoanApp.submittedAt).toISOString().split('T')[0]
          : ''
      );
      setApproved(savedLoanApp.approved || false);
      setApprovedAt(
        savedLoanApp.approvedAt 
          ? new Date(savedLoanApp.approvedAt).toISOString().split('T')[0]
          : ''
      );
      setReceiptUrl(savedLoanApp.receiptUrl || '');
    }
  }, [lead, loanApplication]);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('leadId', leadId);
      formData.append('type', 'loan');

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setReceiptUrl(data.url);
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/loan-application/${leadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          applicationReferenceNumber,
          submittedAt: submittedAt || null,
          approved,
          approvedAt: approvedAt || null,
          receiptUrl
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      // Trigger readiness check
      await fetch(`/api/admin/leads/${leadId}/check-readiness`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (onUpdate) onUpdate();
      alert('Loan application updated successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save loan application');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkApproved = () => {
    setApproved(true);
    setApprovedAt(new Date().toISOString().split('T')[0]);
    
    // Auto-save after marking as approved
    setTimeout(() => handleSave(), 100);
  };

  // Check if loan was requested
  if (!lead.loanRequested) {
    return (
      <Card className="border-2 border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No loan requested for this customer</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for Plenti portal
  const loanData = {
    // Customer Information
    'Customer Full Name': lead.name || `${lead.firstName} ${lead.lastName}`,
    'Email Address': lead.email,
    'Phone Number': lead.phone,
    'Residential Address': lead.address,
    'Suburb': lead.suburb,
    'State': 'WA',
    'Postcode': lead.postcode,
    
    // Financial Information
    'Household Gross Annual Income': lead.householdIncome ? `$${lead.householdIncome.toLocaleString()}` : 'TBD',
    'Number of Dependents': lead.numberOfDependents || '0',
    'Employment Status': lead.employmentStatus || 'TBD',
    'Pension Card Holder': lead.pensionCardHolder ? 'Yes' : 'No',
    'Healthcare Card Holder': lead.healthCareCardHolder ? 'Yes' : 'No',
    
    // Loan Details
    'Loan Amount Requested': lead.loanAmount ? `$${lead.loanAmount.toLocaleString()}` : 'TBD',
    'Loan Term': lead.loanTerm ? `${lead.loanTerm} years` : 'TBD',
    'Monthly Payment': lead.loanMonthlyPayment ? `$${lead.loanMonthlyPayment.toLocaleString()}` : 'TBD',
    
    // System Information
    'System Size (kW)': lead.systemSizeKw,
    'Battery Size (kWh)': lead.batterySizeKwh || 'No battery',
    'Total System Cost': lead.CustomerQuote?.totalCostAfterRebates 
      ? `$${lead.CustomerQuote.totalCostAfterRebates.toLocaleString()}` 
      : 'TBD',
    
    // Vendor Information
    'Vendor Name': 'Sun Direct Power',
    'Vendor ABN': 'TBD', // Should come from settings
    'Installation Address': lead.address
  };

  const isEligible = lead.householdIncome && lead.householdIncome < 210000;

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="bg-purple-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            WA Interest-Free Loan Application
          </span>
          <div className="flex gap-2">
            {approved ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            ) : (
              <Badge variant="destructive">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Eligibility Check */}
        {!isEligible && lead.householdIncome && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Not Eligible</p>
                <p className="text-xs text-red-700">
                  Household income (${lead.householdIncome.toLocaleString()}) exceeds the $210,000 limit
                </p>
              </div>
            </div>
          </div>
        )}

        {isEligible && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Eligible for Loan</p>
                <p className="text-xs text-green-700">
                  Household income under $210,000 - Can proceed with application
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Portal Link */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Plenti Vendor Portal
              </p>
              <p className="text-xs text-blue-700">
                Submit WA Interest-Free Loan application on behalf of customer
              </p>
            </div>
            <ExternalPortalModal
              portalName="Plenti Vendor Portal - WA Interest-Free Loan"
              portalUrl="https://portal.plenti.com.au/"
              copyData={Object.entries(loanData).map(([key, value]) => ({
                label: key,
                value: String(value)
              }))}
              trigger={
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Portal
                </Button>
              }
            />
          </div>
        </div>

        {/* Application Data for Copy */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Application Data (Copy to Plenti Portal)</Label>
          <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg text-sm max-h-96 overflow-y-auto">
            {Object.entries(loanData).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-600 block">{key}:</span>
                  <p className="font-medium truncate">{value}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(String(value), `loan-${key}`)}
                  className="ml-2 flex-shrink-0"
                >
                  {copied === `loan-${key}` ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Application Tracking */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="loanRef">Application Reference Number</Label>
            <Input
              id="loanRef"
              value={applicationReferenceNumber}
              onChange={(e) => setApplicationReferenceNumber(e.target.value)}
              placeholder="LOAN-2025-XXXXX"
            />
          </div>
          <div>
            <Label htmlFor="loanSubmitted">Submitted Date</Label>
            <Input
              id="loanSubmitted"
              type="date"
              value={submittedAt}
              onChange={(e) => setSubmittedAt(e.target.value)}
            />
          </div>
        </div>

        {/* Upload Submission Receipt */}
        <div className="space-y-2">
          <Label>Submission Receipt (PDF/Image)</Label>
          {receiptUrl ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Paperclip className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 flex-1">Receipt uploaded</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(receiptUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReceiptUrl('')}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                disabled={uploading}
                className="flex-1"
              />
              {uploading && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Upload the submission receipt/confirmation from Plenti portal
          </p>
        </div>

        {!approved && (
          <Button
            onClick={handleMarkApproved}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={!isEligible}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Approved
          </Button>
        )}

        {approved && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">
                Approved on {approvedAt}
              </span>
            </div>
          </div>
        )}

        <Separator />

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Save Loan Application
            </>
          )}
        </Button>

        {/* Loan Summary */}
        {lead.loanAmount && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <h4 className="text-sm font-semibold mb-3 text-purple-900">Loan Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Loan Amount:</span>
                <span className="font-semibold">${lead.loanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Term:</span>
                <span className="font-semibold">{lead.loanTerm} years</span>
              </div>
              <div className="flex justify-between">
                <span>Interest Rate:</span>
                <span className="font-semibold text-green-600">0% (Interest-Free!)</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-purple-900 pt-2 border-t">
                <span>Monthly Payment:</span>
                <span>${lead.loanMonthlyPayment?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Important:</strong> The installer (Sun Direct Power) submits the loan application on behalf of the customer via Plenti portal. Loan funds are paid directly to the installer after installation. Customer repays Plenti monthly.
          </p>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Loan approval is required before installation can be scheduled if customer selected the loan option. Use the copy buttons to quickly fill in the Plenti portal form.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
