'use client';

import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, Clock, XCircle, AlertTriangle, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RebateSubmissionManagerProps {
  jobId: string;
  systemSize: number;
  installationDate: string;
  postcode: string;
  state: string;
}

type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';

export function RebateSubmissionManager({
  jobId,
  systemSize,
  installationDate,
  postcode,
  state,
}: RebateSubmissionManagerProps) {
  const [step, setStep] = useState<'calculate' | 'validate' | 'submit' | 'track'>('calculate');
  const [stcResult, setStcResult] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Calculate STCs
  const handleCalculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rebate/submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          action: 'calculate',
          systemSize,
          installationDate,
          postcode,
          state,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to calculate STCs');
      }

      setStcResult(data.stcResult);
      setStep('validate');
    } catch (error: any) {
      alert(error.message || 'Failed to calculate STCs');
    } finally {
      setLoading(false);
    }
  };

  // Validate eligibility
  const handleValidate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rebate/submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          action: 'validate',
          systemSize,
          panelsValidated: true, // TODO: Get from actual job data
          inverterValidated: true,
          electricalCertificate: true,
          complianceStatement: true,
          customerDeclaration: true,
          installationPhotos: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to validate eligibility');
      }

      setEligibility(data.eligibility);
      
      if (data.eligibility.eligible) {
        setStep('submit');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to validate eligibility');
    } finally {
      setLoading(false);
    }
  };

  // Submit for rebate
  const handleSubmit = async () => {
    if (!stcResult) {
      alert('Please calculate STCs first');
      return;
    }

    if (!confirm(`Submit rebate claim for ${stcResult.stcCount} STCs worth $${stcResult.stcValue.toFixed(2)}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/rebate/submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          action: 'submit',
          stcCount: stcResult.stcCount,
          stcValue: stcResult.stcValue,
          systemSize,
          installationDate,
          postcode,
          state,
          zone: stcResult.zone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit rebate');
      }

      setSubmission(data.submission);
      setStep('track');
      alert('Rebate submission created successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to submit rebate');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'APPROVED':
        return <CheckCircle2 className="h-6 w-6 text-blue-600" />;
      case 'REJECTED':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'SUBMITTED':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'APPROVED':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'REJECTED':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'SUBMITTED':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Step 1: Calculate STCs
  if (step === 'calculate') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">Step 1: Calculate STCs</h3>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Small-scale Technology Certificates (STCs)</strong> are created based on your system size, 
              location, and installation date. They represent the renewable energy your system will generate.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">System Size</p>
              <p className="font-medium text-lg">{systemSize} kW</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Installation Date</p>
              <p className="font-medium text-lg">{new Date(installationDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium text-lg">{state} {postcode}</p>
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {loading ? 'Calculating...' : 'Calculate STCs'}
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Validate Eligibility
  if (step === 'validate' && stcResult) {
    return (
      <div className="space-y-6">
        {/* STC Calculation Result */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-2xl font-bold text-green-800">{stcResult.stcCount} STCs</h3>
              <p className="text-lg text-green-700">
                Estimated Value: ${stcResult.stcValue.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
            <p><strong>Zone {stcResult.zone}:</strong> {stcResult.zoneRating} kWh/kW/day</p>
            <p><strong>Deeming Period:</strong> {stcResult.deemingPeriod} years</p>
            <p><strong>Calculation:</strong></p>
            <ul className="ml-4 space-y-1 text-gray-700">
              <li>• {stcResult.calculation.step1}</li>
              <li>• {stcResult.calculation.step2}</li>
              <li>• {stcResult.calculation.step3}</li>
              <li>• {stcResult.calculation.step4}</li>
            </ul>
          </div>
        </div>

        {/* Validation */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Step 2: Validate Eligibility</h3>

          {!eligibility ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Before submitting, we need to verify that all required documents and validations are complete.
              </p>
              <Button
                onClick={handleValidate}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? 'Validating...' : 'Check Eligibility'}
              </Button>
            </>
          ) : (
            <>
              {eligibility.eligible ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Eligible for STC Rebate!</p>
                      <p className="text-sm text-green-700">All requirements met. Ready to submit.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800 mb-2">Missing Requirements:</p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {eligibility.missingRequirements.map((req: string, i: number) => (
                          <li key={i}>• {req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {eligibility.warnings && eligibility.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-800 mb-2">Warnings:</p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {eligibility.warnings.map((warning: string, i: number) => (
                          <li key={i}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep('calculate')}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                {eligibility.eligible && (
                  <Button
                    onClick={() => setStep('submit')}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Continue to Submit
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Submit
  if (step === 'submit' && stcResult && eligibility?.eligible) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Step 3: Submit Rebate Claim</h3>

          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200 p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">You are claiming</p>
              <p className="text-4xl font-bold text-green-800 mb-2">{stcResult.stcCount} STCs</p>
              <p className="text-2xl font-semibold text-green-700">
                ${stcResult.stcValue.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>What happens next:</strong>
            </p>
            <ol className="text-sm text-blue-800 mt-2 ml-4 space-y-1">
              <li>1. Your claim will be submitted to the Clean Energy Regulator</li>
              <li>2. CER will review your documentation (typically 5-10 business days)</li>
              <li>3. Once approved, STCs will be created in the REC Registry</li>
              <li>4. Payment will be processed (typically 2-5 business days after approval)</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setStep('validate')}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Submitting...' : 'Submit Rebate Claim'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Track Submission
  if (step === 'track' && submission) {
    return (
      <div className="space-y-6">
        <div className={`p-6 rounded-lg border-2 flex items-center gap-3 ${getStatusColor(submission.status)}`}>
          {getStatusIcon(submission.status)}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Rebate Submission: {submission.status}</h3>
            <p className="text-sm mt-1">
              Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">Submission Details</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">STCs Claimed</p>
              <p className="font-medium text-lg">{submission.stcCount} STCs</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Claim Value</p>
              <p className="font-medium text-lg">${submission.stcValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">System Size</p>
              <p className="font-medium">{submission.systemSize} kW</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Zone</p>
              <p className="font-medium">Zone {submission.zone}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
