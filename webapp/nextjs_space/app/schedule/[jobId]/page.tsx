
'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  CheckCircle, 
  Calendar as CalendarIcon, 
  Clock, 
  Zap,
  AlertCircle,
  Loader2,
  Home,
  Sun,
  Moon
} from 'lucide-react';
import { format, parse } from 'date-fns';

interface JobInfo {
  jobNumber: string;
  systemSize: number;
  estimatedDuration: number;
}

export default function CustomerSchedulingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = params.jobId as string;
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon'>('morning');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAvailableDates();
    } else {
      setError('Invalid or missing token');
      setLoading(false);
    }
  }, [token]);

  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/schedule/${jobId}/available-dates?token=${token}`
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load available dates');
        return;
      }

      setJob(data.job);
      setAvailableDates(data.availableDates);
    } catch (err) {
      console.error('Error fetching available dates:', err);
      setError('Failed to load available dates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !timeSlot) {
      alert('Please select a date and time slot');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/schedule/${jobId}/confirm?token=${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
            timeSlot,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to schedule installation');
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error confirming schedule:', err);
      alert('Failed to schedule installation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateStr);
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
              <CardTitle className="text-red-700">Error</CardTitle>
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
              <CardTitle className="text-green-700">Installation Scheduled!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Your solar installation has been successfully scheduled.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-700">
                <strong>Job Number:</strong> {job?.jobNumber}
              </p>
              {selectedDate && (
                <>
                  <p className="text-sm text-gray-700">
                    <strong>Date:</strong>{' '}
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Time:</strong>{' '}
                    {timeSlot === 'morning' ? '9:00 AM - 12:00 PM' : '1:00 PM - 4:00 PM'}
                  </p>
                </>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>What's Next:</strong>
              </p>
              <ul className="text-sm text-gray-700 mt-2 space-y-1 list-disc list-inside">
                <li>You'll receive a confirmation email shortly</li>
                <li>Our team will contact you 48 hours before installation</li>
                <li>Please ensure clear access to your roof and electrical panel</li>
              </ul>
            </div>

            <p className="text-xs text-gray-600 text-center">
              Need to reschedule? Contact us at{' '}
              <a href="mailto:info@sundirectpower.com.au" className="text-blue-600 underline">
                info@sundirectpower.com.au
              </a>
            </p>
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
          <p className="text-gray-600">Schedule Your Solar Installation</p>
        </div>

        {/* Job Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Job #{job.jobNumber}</span>
              <Badge className="bg-blue-600">
                <Zap className="h-3 w-3 mr-1" />
                {job.systemSize} kW System
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">
              <strong>Estimated Duration:</strong> {job.estimatedDuration} hours
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Our professional installation team will arrive at the scheduled time to complete your
              solar system installation.
            </p>
          </CardContent>
        </Card>

        {/* Scheduling Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Installation Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calendar */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => !isDateAvailable(date) || date < new Date()}
                className="rounded-md border"
              />
            </div>

            {availableDates.length === 0 && (
              <div className="text-center text-gray-600 py-4">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p>No available dates at the moment.</p>
                <p className="text-sm">Please contact us to schedule your installation.</p>
              </div>
            )}

            {/* Time Slot Selection */}
            {selectedDate && (
              <div className="space-y-3">
                <Label>Select Time Slot</Label>
                <RadioGroup value={timeSlot} onValueChange={(v) => setTimeSlot(v as any)}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-blue-50 cursor-pointer">
                    <RadioGroupItem value="morning" id="morning" />
                    <Label htmlFor="morning" className="flex-1 cursor-pointer flex items-center gap-3">
                      <Sun className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-semibold">Morning</p>
                        <p className="text-sm text-gray-600">9:00 AM - 12:00 PM</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-blue-50 cursor-pointer">
                    <RadioGroupItem value="afternoon" id="afternoon" />
                    <Label htmlFor="afternoon" className="flex-1 cursor-pointer flex items-center gap-3">
                      <Moon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold">Afternoon</p>
                        <p className="text-sm text-gray-600">1:00 PM - 4:00 PM</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Confirm Button */}
            {selectedDate && (
              <div className="pt-4 border-t">
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    You've selected:
                  </p>
                  <p className="text-sm text-gray-700">
                    📅 {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-700">
                    🕐 {timeSlot === 'morning' ? '9:00 AM - 12:00 PM' : '1:00 PM - 4:00 PM'}
                  </p>
                </div>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
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
                      Confirm Installation Date
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Need help or have questions?{' '}
          <a href="mailto:info@sundirectpower.com.au" className="text-blue-600 underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
