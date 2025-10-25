'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface Vacancy {
  id: string;
  customTitle: string | null;
  requireCoverLetter: boolean;
  requireResume: boolean;
  screeningQuestions: any[];
  position: {
    title: string;
    department: string;
  };
}

export default function ApplyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: '',
    linkedinUrl: '',
    portfolioUrl: '',
    agreeToTerms: false,
  });

  const [screeningAnswers, setScreeningAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchVacancy();
  }, [params.id]);

  const fetchVacancy = async () => {
    try {
      const response = await fetch(`/api/careers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setVacancy(data.vacancy);
      } else {
        router.push('/careers');
      }
    } catch (error) {
      console.error('Error fetching vacancy:', error);
      router.push('/careers');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF or Word document',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }

      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      toast({
        title: 'Terms required',
        description: 'Please agree to the terms and conditions',
        variant: 'destructive',
      });
      return;
    }

    if (vacancy?.requireResume && !resumeFile) {
      toast({
        title: 'Resume required',
        description: 'Please upload your resume',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('coverLetter', formData.coverLetter);
      submitData.append('linkedinUrl', formData.linkedinUrl);
      submitData.append('portfolioUrl', formData.portfolioUrl);
      
      if (resumeFile) {
        submitData.append('resume', resumeFile);
      }

      if (Object.keys(screeningAnswers).length > 0) {
        submitData.append('screeningAnswers', JSON.stringify(screeningAnswers));
      }

      const response = await fetch(`/api/careers/${params.id}/apply`, {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit application',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-2xl w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl">Application Submitted!</CardTitle>
            <CardDescription className="text-lg">
              Thank you for applying to {vacancy.customTitle || vacancy.position.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">
              We've received your application and will review it shortly. You should receive a confirmation email at <strong>{formData.email}</strong>.
            </p>
            <p className="text-gray-600">
              Our hiring team will be in touch if your qualifications match our requirements.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/careers">
                <Button variant="outline">View Other Positions</Button>
              </Link>
              <Link href="/">
                <Button>Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href={`/careers/${params.id}`}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Details
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Apply for Position</h1>
          <p className="text-xl text-gray-600">{vacancy.customTitle || vacancy.position.title}</p>
          <p className="text-sm text-gray-500">{vacancy.position.department}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Resume/CV {vacancy.requireResume && '*'}</CardTitle>
              <CardDescription>Upload your resume (PDF or Word, max 5MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <Label htmlFor="resume" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Click to upload
                  </span>
                  {' '}or drag and drop
                </Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  required={vacancy.requireResume}
                />
                {resumeFile && (
                  <p className="mt-2 text-sm text-green-600 flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {resumeFile.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          {vacancy.requireCoverLetter && (
            <Card>
              <CardHeader>
                <CardTitle>Cover Letter *</CardTitle>
                <CardDescription>Tell us why you're a great fit</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  rows={8}
                  required={vacancy.requireCoverLetter}
                  placeholder="Explain why you're interested in this position and what makes you a strong candidate..."
                />
              </CardContent>
            </Card>
          )}

          {/* Additional Links */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="portfolioUrl">Portfolio/Website</Label>
                <Input
                  id="portfolioUrl"
                  type="url"
                  placeholder="https://yourportfolio.com"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Screening Questions */}
          {vacancy.screeningQuestions && vacancy.screeningQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Screening Questions</CardTitle>
                <CardDescription>Please answer the following questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {vacancy.screeningQuestions.map((q: any, idx: number) => (
                  <div key={idx}>
                    <Label htmlFor={`question-${idx}`}>
                      {q.question} {q.required && '*'}
                    </Label>
                    <Textarea
                      id={`question-${idx}`}
                      value={screeningAnswers[idx] || ''}
                      onChange={(e) => setScreeningAnswers({ ...screeningAnswers, [idx]: e.target.value })}
                      required={q.required}
                      rows={3}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Terms & Submit */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, agreeToTerms: checked as boolean })
                  }
                  required
                />
                <Label htmlFor="terms" className="font-normal cursor-pointer text-sm">
                  I agree to the terms and conditions and consent to the processing of my personal data for recruitment purposes. *
                </Label>
              </div>

              <div className="flex gap-4">
                <Link href={`/careers/${params.id}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
