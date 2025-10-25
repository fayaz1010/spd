'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Mail, Phone, Star, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { OfferSection } from '@/components/OfferSection';
import { ContractSection } from '@/components/ContractSection';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';
import { ConvertToStaffSection } from '@/components/ConvertToStaffSection';

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  screeningAnswers: any;
  status: string;
  rating: number | null;
  notes: string | null;
  interviewDate: string | null;
  interviewType: string | null;
  interviewers: string[];
  interviewScore: number | null;
  interviewNotes: string | null;
  rejectionReason: string | null;
  // Offer fields
  offerDate?: string | null;
  offerSalary?: number | null;
  offerStartDate?: string | null;
  offerProbationPeriod?: number | null;
  offerSpecialConditions?: string | null;
  offerLetterUrl?: string | null;
  offerAcceptedDate?: string | null;
  // Contract fields
  contractUrl?: string | null;
  contractSignedDate?: string | null;
  // Onboarding fields
  taxFileNumber?: string | null;
  bankAccountNumber?: string | null;
  onboardingChecklist?: any;
  // Conversion
  convertedToStaffId?: string | null;
  convertedDate?: string | null;
  createdAt: string;
  vacancy: {
    id: string;
    vacancyCode: string;
    customTitle: string | null;
    screeningQuestions: any[];
    position: {
      title: string;
      department: string;
      level: string;
      annualSalaryMin?: number | null;
      annualSalaryMax?: number | null;
    };
  };
}

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    status: 'NEW',
    rating: '',
    notes: '',
    interviewDate: '',
    interviewType: '',
    interviewers: [] as string[],
    interviewScore: '',
    interviewNotes: '',
    rejectionReason: '',
  });

  const [admins, setAdmins] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchApplication();
    fetchAdmins();
  }, [params.id]);

  const fetchApplication = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/applications/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const app = data.application;
        setApplication(app);
        setFormData({
          status: app.status,
          rating: app.rating?.toString() || '',
          notes: app.notes || '',
          interviewDate: app.interviewDate ? app.interviewDate.split('T')[0] : '',
          interviewType: app.interviewType || '',
          interviewers: app.interviewers || [],
          interviewScore: app.interviewScore?.toString() || '',
          interviewNotes: app.interviewNotes || '',
          rejectionReason: app.rejectionReason || '',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Application not found',
          variant: 'destructive',
        });
        router.push('/admin/dashboard/applications');
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      toast({
        title: 'Error',
        description: 'Failed to load application',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/applications/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          rating: formData.rating ? parseInt(formData.rating) : null,
          interviewScore: formData.interviewScore ? parseInt(formData.interviewScore) : null,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Application updated successfully',
        });
        fetchApplication();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to update application',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update application',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800',
      REVIEWING: 'bg-yellow-100 text-yellow-800',
      SHORTLISTED: 'bg-purple-100 text-purple-800',
      INTERVIEWING: 'bg-orange-100 text-orange-800',
      OFFER_MADE: 'bg-green-100 text-green-800',
      OFFER_ACCEPTED: 'bg-green-200 text-green-900',
      ONBOARDING: 'bg-blue-200 text-blue-900',
      CONVERTED: 'bg-emerald-100 text-emerald-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      WITHDRAWN: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/dashboard/applications')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {application.firstName} {application.lastName}
              </h1>
              {getStatusBadge(application.status)}
            </div>
            <p className="text-gray-600">
              Applied for: {application.vacancy.customTitle || application.vacancy.position.title}
            </p>
          </div>
        </div>
        {application.resumeUrl && (
          <Button
            variant="outline"
            onClick={() => window.open(application.resumeUrl, '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Resume
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Applicant Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${application.email}`} className="text-blue-600 hover:underline">
                  {application.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${application.phone}`} className="text-blue-600 hover:underline">
                  {application.phone}
                </a>
              </div>
              {application.linkedinUrl && (
                <div>
                  <Label className="text-xs text-gray-500">LinkedIn</Label>
                  <a
                    href={application.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm block"
                  >
                    View Profile
                  </a>
                </div>
              )}
              {application.portfolioUrl && (
                <div>
                  <Label className="text-xs text-gray-500">Portfolio</Label>
                  <a
                    href={application.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm block"
                  >
                    View Portfolio
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="text-xs text-gray-500">Position</Label>
                <p className="font-medium">{application.vacancy.position.title}</p>
                <p className="text-xs text-gray-500">
                  {application.vacancy.vacancyCode} • {application.vacancy.position.department}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Applied</Label>
                <p>{format(new Date(application.createdAt), 'MMM dd, yyyy')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Letter */}
          {application.coverLetter && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Cover Letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-gray-700">{application.coverLetter}</p>
              </CardContent>
            </Card>
          )}

          {/* Screening Questions */}
          {application.screeningAnswers && application.vacancy.screeningQuestions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Screening Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.vacancy.screeningQuestions.map((q: any, idx: number) => (
                  <div key={idx}>
                    <Label className="font-medium">{q.question}</Label>
                    <p className="text-gray-700 mt-1">
                      {application.screeningAnswers[idx] || 'No answer provided'}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Review Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Review & Status</CardTitle>
                <CardDescription>Update application status and add notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="REVIEWING">Reviewing</SelectItem>
                        <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                        <SelectItem value="INTERVIEWING">Interviewing</SelectItem>
                        <SelectItem value="OFFER_MADE">Offer Made</SelectItem>
                        <SelectItem value="OFFER_ACCEPTED">Offer Accepted</SelectItem>
                        <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                        <SelectItem value="CONVERTED">Converted to Staff</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Select
                      value={formData.rating}
                      onValueChange={(value) => setFormData({ ...formData, rating: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">⭐ 1 - Poor</SelectItem>
                        <SelectItem value="2">⭐⭐ 2 - Below Average</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ 3 - Average</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ 4 - Good</SelectItem>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder="Add notes about this candidate..."
                  />
                </div>

                {formData.status === 'INTERVIEWING' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="interviewDate">Interview Date</Label>
                        <Input
                          id="interviewDate"
                          type="datetime-local"
                          value={formData.interviewDate}
                          onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="interviewType">Interview Type</Label>
                        <Select
                          value={formData.interviewType}
                          onValueChange={(value) => setFormData({ ...formData, interviewType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PHONE">Phone</SelectItem>
                            <SelectItem value="VIDEO">Video Call</SelectItem>
                            <SelectItem value="IN_PERSON">In Person</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="interviewScore">Interview Score (1-10)</Label>
                      <Select
                        value={formData.interviewScore}
                        onValueChange={(value) => setFormData({ ...formData, interviewScore: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No score yet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Poor</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5 - Average</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="7">7</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                          <SelectItem value="9">9</SelectItem>
                          <SelectItem value="10">10 - Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="interviewNotes">Interview Notes</Label>
                      <Textarea
                        id="interviewNotes"
                        value={formData.interviewNotes}
                        onChange={(e) => setFormData({ ...formData, interviewNotes: e.target.value })}
                        rows={4}
                        placeholder="Notes from the interview..."
                      />
                    </div>
                  </>
                )}

                {formData.status === 'REJECTED' && (
                  <div>
                    <Label htmlFor="rejectionReason">Rejection Reason</Label>
                    <Textarea
                      id="rejectionReason"
                      value={formData.rejectionReason}
                      onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                      rows={3}
                      placeholder="Reason for rejection (optional)..."
                    />
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/dashboard/applications')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Offer Section - Show when INTERVIEWING or later */}
          {['INTERVIEWING', 'OFFER_MADE', 'OFFER_ACCEPTED', 'ONBOARDING', 'CONVERTED'].includes(application.status) && (
            <OfferSection
              applicationId={params.id}
              application={application}
              position={{
                title: application.vacancy.position.title,
                annualSalaryMin: application.vacancy.position.annualSalaryMin,
                annualSalaryMax: application.vacancy.position.annualSalaryMax,
              }}
              onUpdate={fetchApplication}
            />
          )}

          {/* Contract Section - Show when OFFER_MADE or later */}
          {['OFFER_MADE', 'OFFER_ACCEPTED', 'ONBOARDING', 'CONVERTED'].includes(application.status) && (
            <ContractSection
              applicationId={params.id}
              application={application}
              onUpdate={fetchApplication}
            />
          )}

          {/* Onboarding Checklist - Show when OFFER_ACCEPTED or later */}
          {['OFFER_ACCEPTED', 'ONBOARDING', 'CONVERTED'].includes(application.status) && (
            <OnboardingChecklist
              applicationId={params.id}
              application={application}
              onUpdate={fetchApplication}
            />
          )}

          {/* Convert to Staff - Show when ONBOARDING or CONVERTED */}
          {['ONBOARDING', 'CONVERTED'].includes(application.status) && (
            <ConvertToStaffSection
              applicationId={params.id}
              application={application}
              vacancy={application.vacancy}
            />
          )}
        </div>
      </div>
    </div>
  );
}
