
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface JobDetails {
  id: string;
  jobNumber: string;
  scheduledDate: string;
  lead: {
    name: string;
    address: string;
  };
  systemSize: number;
}

export default function ReschedulePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = params.jobId as string;
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<JobDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid access link. Please use the link from your email.");
      setLoading(false);
      return;
    }

    fetchJobDetails();
  }, [jobId, token]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/schedule/${jobId}?token=${token}`);

      if (!response.ok) {
        throw new Error("Failed to fetch job details");
      }

      const data = await response.json();
      setJob(data.job);
    } catch (err) {
      setError("Failed to load job details. Please check your link and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate) {
      setError("Please select a new date");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/reschedule/${jobId}?token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestedDate: selectedDate.toISOString(),
          reason: reason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit reschedule request");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle>Request Submitted</CardTitle>
                <CardDescription className="mt-1">
                  Your reschedule request has been received
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Thank you for submitting your reschedule request. Our team will review it
              and get back to you within 1 business day.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">What happens next?</p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• Our team will review your request</li>
                <li>• We'll check availability for your requested date</li>
                <li>• You'll receive an email with the outcome</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Reschedule Installation</CardTitle>
          <CardDescription>
            Request a new date for your solar installation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {job && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Job Number:</span>
                <span className="ml-2 font-medium">{job.jobNumber}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Customer:</span>
                <span className="ml-2 font-medium">{job.lead.name}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Address:</span>
                <span className="ml-2">{job.lead.address}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">System Size:</span>
                <span className="ml-2">{job.systemSize} kW</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Current Date:</span>
                <span className="ml-2 font-medium">
                  {format(new Date(job.scheduledDate), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Select New Date *</Label>
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    // Disable past dates and today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md"
                />
              </div>
              {selectedDate && (
                <p className="text-sm text-center text-blue-600 font-medium">
                  New date: {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rescheduling (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please let us know why you need to reschedule..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Providing a reason helps us process your request more efficiently
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!selectedDate || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Submit Reschedule Request
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your request will be reviewed by our team and you'll receive an email
              confirmation once approved.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
