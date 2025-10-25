
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  Phone,
  Zap,
  Battery,
  AlertCircle,
  Loader2,
  Home
} from 'lucide-react';
import { format } from 'date-fns';

interface JobDetails {
  id: string;
  jobNumber: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  systemSize: number;
  panelCount: number;
  batteryCapacity: number;
  inverterModel: string;
  scheduledDate: string | null;
  scheduledStartTime: string;
  estimatedDuration: number;
  installationNotes: string | null;
  suburb: string | null;
  subcontractor: {
    companyName: string;
  };
}

export default function SubcontractorConfirmationPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'confirm' | 'reject'>('view');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Confirm form
  const [confirmedBy, setConfirmedBy] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Reject form
  const [rejectReason, setRejectReason] = useState('');
  const [alternativeDates, setAlternativeDates] = useState('');

  useEffect(() => {
    fetchJobDetails();
  }, [token]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/subcontractor/confirm/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load job details');
        return;
      }

      setJob(data.job);
    } catch (err) {
      console.error('Error fetching job:', err);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmedBy.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/subcontractor/confirm/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmedBy: confirmedBy.trim(),
          message: confirmMessage.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to confirm job');
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error confirming job:', err);
      alert('Failed to confirm job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (rejectReason.trim().length < 10) {
      alert('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/subcontractor/reject/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason.trim(),
          alternativeDates: alternativeDates.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to process rejection');
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error rejecting job:', err);
      alert('Failed to process rejection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <CardTitle className="text-red-700">Invalid Link</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{error}</p>
            <p className="text-sm text-gray-600 mt-4">
              If you believe this is an error, please contact Sun Direct Power.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle className="text-green-700">
                {mode === 'confirm' ? 'Job Confirmed!' : 'Response Recorded'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              {mode === 'confirm'
                ? 'Thank you for confirming this installation job. The customer has been notified and will be expecting you on the scheduled date.'
                : 'Your response has been recorded. The Sun Direct Power team will be in touch with you shortly.'}
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Job Number:</strong> {job?.jobNumber}
              </p>
              {mode === 'confirm' && job?.scheduledDate && (
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Scheduled:</strong>{' '}
                  {format(new Date(job.scheduledDate), 'EEEE, MMMM d, yyyy')} at{' '}
                  {job.scheduledStartTime}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Home className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Sun Direct Power</h1>
          </div>
          <p className="text-gray-600">Installation Job Confirmation</p>
        </div>

        {/* Job Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Job #{job.jobNumber}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Assigned to: {job.subcontractor.companyName}
                </p>
              </div>
              <Badge className="bg-blue-600">Installation Job</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {job.customerName}</p>
                  <p><strong>Phone:</strong> {job.customerPhone}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Installation Address
                </h3>
                <p className="text-sm">{job.customerAddress}</p>
                {job.suburb && (
                  <Badge variant="outline" className="mt-2">{job.suburb}</Badge>
                )}
              </div>
            </div>

            {/* Schedule Info */}
            {job.scheduledDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Proposed Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Date</p>
                    <p className="font-semibold">
                      {format(new Date(job.scheduledDate), 'EEEE, MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Start Time</p>
                    <p className="font-semibold">{job.scheduledStartTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Estimated Duration</p>
                    <p className="font-semibold">{job.estimatedDuration} hours</p>
                  </div>
                </div>
              </div>
            )}

            {/* System Details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                System Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">System Size</p>
                  <p className="text-lg font-bold text-gray-900">{job.systemSize} kW</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Panel Count</p>
                  <p className="text-lg font-bold text-gray-900">{job.panelCount} panels</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Battery</p>
                  <p className="text-lg font-bold text-gray-900">
                    {job.batteryCapacity > 0 ? `${job.batteryCapacity} kWh` : 'None'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Inverter</p>
                  <p className="text-sm font-semibold text-gray-900">{job.inverterModel}</p>
                </div>
              </div>
            </div>

            {/* Installation Notes */}
            {job.installationNotes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Installation Notes
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {job.installationNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Section */}
        {mode === 'view' && (
          <Card>
            <CardContent className="py-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Can you complete this installation?
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setMode('confirm')}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Yes, I Can Do This Job
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => setMode('reject')}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  No, I Cannot Do This Job
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm Form */}
        {mode === 'confirm' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Confirm Installation Job
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="confirmedBy">Your Name *</Label>
                <Input
                  id="confirmedBy"
                  placeholder="Enter your full name"
                  value={confirmedBy}
                  onChange={(e) => setConfirmedBy(e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-gray-600 mt-1">
                  This will be recorded for documentation purposes
                </p>
              </div>

              <div>
                <Label htmlFor="confirmMessage">Additional Notes (Optional)</Label>
                <Textarea
                  id="confirmMessage"
                  placeholder="Any special requirements or notes for this installation..."
                  rows={4}
                  value={confirmMessage}
                  onChange={(e) => setConfirmMessage(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Job
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMode('view')}
                  disabled={submitting}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reject Form */}
        {mode === 'reject' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-600" />
                Cannot Complete This Job
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rejectReason">Reason *</Label>
                <Textarea
                  id="rejectReason"
                  placeholder="Please provide a detailed reason why you cannot complete this job (minimum 10 characters)..."
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-gray-600 mt-1">
                  {rejectReason.length}/10 characters minimum
                </p>
              </div>

              <div>
                <Label htmlFor="alternativeDates">Alternative Dates (Optional)</Label>
                <Textarea
                  id="alternativeDates"
                  placeholder="If you can do this job on different dates, please suggest alternatives..."
                  rows={3}
                  value={alternativeDates}
                  onChange={(e) => setAlternativeDates(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleReject}
                  disabled={submitting || rejectReason.trim().length < 10}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Submit Response
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMode('view')}
                  disabled={submitting}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
