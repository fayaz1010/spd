'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { StarRating } from '@/components/StarRating';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CustomerSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [jobData, setJobData] = useState<any>(null);

  const [formData, setFormData] = useState({
    // Installation Experience
    installationQuality: 5,
    installerProfessional: 5,
    siteCleanness: 5,
    timelyCompletion: 5,
    // Product Satisfaction
    systemPerformance: 5,
    productQuality: 5,
    valueForMoney: 5,
    // Service
    communicationQuality: 5,
    responsiveness: 5,
    overallSatisfaction: 5,
    // Open-ended
    whatWentWell: '',
    whatCouldImprove: '',
    wouldRecommend: true,
    recommendationReason: '',
    // Permissions
    allowTestimonialUse: false,
    allowContactForCase: false,
  });

  useEffect(() => {
    fetchSurvey();
  }, [jobId]);

  const fetchSurvey = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/portal/survey/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.completed) {
        setCompleted(true);
      } else {
        setJobData(data.job);
      }
    } catch (error) {
      console.error('Error fetching survey:', error);
      toast.error('Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/portal/survey/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          customerName: jobData.customerName,
          customerEmail: localStorage.getItem('user_email'),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Thank you for completing the survey!');
        setCompleted(true);
      } else {
        toast.error(data.error || 'Failed to submit survey');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Error submitting survey');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Thank You!</CardTitle>
            <CardDescription>
              Your feedback has been submitted successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              We appreciate you taking the time to share your experience with us.
            </p>
            <Link href="/portal/dashboard">
              <Button className="bg-coral hover:bg-coral/90">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/portal/dashboard" className="text-coral hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Customer Satisfaction Survey
          </h1>
          <p className="text-gray-600">
            Job #{jobData?.jobNumber} - {jobData?.customerName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Installation Experience */}
          <Card>
            <CardHeader>
              <CardTitle>Installation Experience</CardTitle>
              <CardDescription>Rate your experience with our installation team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Installation Quality</Label>
                <p className="text-sm text-gray-500 mb-2">How would you rate the quality of the installation work?</p>
                <StarRating
                  rating={formData.installationQuality}
                  onRatingChange={(rating) => setFormData({ ...formData, installationQuality: rating })}
                  size="lg"
                />
              </div>

              <div>
                <Label>Installer Professionalism</Label>
                <p className="text-sm text-gray-500 mb-2">How professional and courteous were our installers?</p>
                <StarRating
                  rating={formData.installerProfessional}
                  onRatingChange={(rating) => setFormData({ ...formData, installerProfessional: rating })}
                  size="lg"
                />
              </div>

              <div>
                <Label>Site Cleanliness</Label>
                <p className="text-sm text-gray-500 mb-2">How clean did the team leave your property?</p>
                <StarRating
                  rating={formData.siteCleanness}
                  onRatingChange={(rating) => setFormData({ ...formData, siteCleanness: rating })}
                  size="lg"
                />
              </div>

              <div>
                <Label>Timely Completion</Label>
                <p className="text-sm text-gray-500 mb-2">Was the installation completed on time?</p>
                <StarRating
                  rating={formData.timelyCompletion}
                  onRatingChange={(rating) => setFormData({ ...formData, timelyCompletion: rating })}
                  size="lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Satisfaction */}
          <Card>
            <CardHeader>
              <CardTitle>Product Satisfaction</CardTitle>
              <CardDescription>Rate your satisfaction with the solar system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>System Performance</Label>
                <p className="text-sm text-gray-500 mb-2">How well is your system performing?</p>
                <StarRating
                  rating={formData.systemPerformance}
                  onRatingChange={(rating) => setFormData({ ...formData, systemPerformance: rating })}
                  size="lg"
                />
              </div>

              <div>
                <Label>Product Quality</Label>
                <p className="text-sm text-gray-500 mb-2">How would you rate the quality of the equipment?</p>
                <StarRating
                  rating={formData.productQuality}
                  onRatingChange={(rating) => setFormData({ ...formData, productQuality: rating })}
                  size="lg"
                />
              </div>

              <div>
                <Label>Value for Money</Label>
                <p className="text-sm text-gray-500 mb-2">Do you feel you received good value for your investment?</p>
                <StarRating
                  rating={formData.valueForMoney}
                  onRatingChange={(rating) => setFormData({ ...formData, valueForMoney: rating })}
                  size="lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Quality */}
          <Card>
            <CardHeader>
              <CardTitle>Service Quality</CardTitle>
              <CardDescription>Rate our customer service and communication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Communication Quality</Label>
                <p className="text-sm text-gray-500 mb-2">How clear and helpful was our communication?</p>
                <StarRating
                  rating={formData.communicationQuality}
                  onRatingChange={(rating) => setFormData({ ...formData, communicationQuality: rating })}
                  size="lg"
                />
              </div>

              <div>
                <Label>Responsiveness</Label>
                <p className="text-sm text-gray-500 mb-2">How quickly did we respond to your questions?</p>
                <StarRating
                  rating={formData.responsiveness}
                  onRatingChange={(rating) => setFormData({ ...formData, responsiveness: rating })}
                  size="lg"
                />
              </div>

              <div>
                <Label>Overall Satisfaction</Label>
                <p className="text-sm text-gray-500 mb-2">Overall, how satisfied are you with our service?</p>
                <StarRating
                  rating={formData.overallSatisfaction}
                  onRatingChange={(rating) => setFormData({ ...formData, overallSatisfaction: rating })}
                  size="lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Your Feedback</CardTitle>
              <CardDescription>Help us understand your experience better</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="whatWentWell">What went well?</Label>
                <Textarea
                  id="whatWentWell"
                  value={formData.whatWentWell}
                  onChange={(e) => setFormData({ ...formData, whatWentWell: e.target.value })}
                  placeholder="Tell us what you loved about your experience..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="whatCouldImprove">What could we improve?</Label>
                <Textarea
                  id="whatCouldImprove"
                  value={formData.whatCouldImprove}
                  onChange={(e) => setFormData({ ...formData, whatCouldImprove: e.target.value })}
                  placeholder="Any suggestions for improvement..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Would you recommend us to friends and family?</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={formData.wouldRecommend ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, wouldRecommend: true })}
                    className={formData.wouldRecommend ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!formData.wouldRecommend ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, wouldRecommend: false })}
                    className={!formData.wouldRecommend ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    No
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="recommendationReason">Why or why not?</Label>
                <Textarea
                  id="recommendationReason"
                  value={formData.recommendationReason}
                  onChange={(e) => setFormData({ ...formData, recommendationReason: e.target.value })}
                  placeholder="Please tell us more..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Help us showcase our work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="allowTestimonialUse"
                  checked={formData.allowTestimonialUse}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, allowTestimonialUse: checked as boolean })
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="allowTestimonialUse" className="font-normal cursor-pointer">
                    I allow Sun Direct Power to use my feedback as a testimonial on their website
                  </Label>
                  <p className="text-sm text-gray-500">
                    Your name and suburb may be displayed with your review
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="allowContactForCase"
                  checked={formData.allowContactForCase}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, allowContactForCase: checked as boolean })
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="allowContactForCase" className="font-normal cursor-pointer">
                    I'm happy to be contacted for a case study or reference
                  </Label>
                  <p className="text-sm text-gray-500">
                    We may reach out to feature your installation story
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-coral hover:bg-coral/90 flex-1"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Survey'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
