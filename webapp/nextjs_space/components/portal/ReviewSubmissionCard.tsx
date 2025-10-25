'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/StarRating';
import { Badge } from '@/components/ui/badge';
import { Star, Send, CheckCircle, Clock, X } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewSubmissionCardProps {
  jobId?: string;
  customerName: string;
  customerEmail: string;
  existingReview?: any;
}

export function ReviewSubmissionCard({
  jobId,
  customerName,
  customerEmail,
  existingReview,
}: ReviewSubmissionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    review: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!formData.review.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/portal/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          jobId,
          rating: formData.rating,
          title: formData.title,
          review: formData.review,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Thank you for your review! It will be published after moderation.');
        setIsOpen(false);
        setFormData({ rating: 5, title: '', review: '' });
        // Refresh page to show submitted review
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  // Show existing review status
  if (existingReview) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Your Review</CardTitle>
            </div>
            <Badge
              variant={
                existingReview.status === 'APPROVED'
                  ? 'default'
                  : existingReview.status === 'PENDING'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {existingReview.status}
            </Badge>
          </div>
          <CardDescription>
            {existingReview.status === 'APPROVED' && 'Your review is live on our website!'}
            {existingReview.status === 'PENDING' && 'Your review is being reviewed by our team'}
            {existingReview.status === 'REJECTED' && 'Your review was not approved'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <StarRating rating={existingReview.rating} readonly size="md" />
            {existingReview.title && (
              <p className="font-semibold">{existingReview.title}</p>
            )}
            <p className="text-sm text-gray-600">{existingReview.review}</p>
            <p className="text-xs text-gray-400">
              Submitted {new Date(existingReview.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show review form
  if (!isOpen) {
    return (
      <Card className="border-coral/20 hover:border-coral/40 transition-colors cursor-pointer" onClick={() => setIsOpen(true)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-coral/10 rounded-full">
              <Star className="w-6 h-6 text-coral" />
            </div>
            <div>
              <CardTitle className="text-lg">Leave a Review</CardTitle>
              <CardDescription>
                Share your experience with us
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-coral/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-coral" />
            <CardTitle className="text-lg">Leave a Review</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          Your feedback helps us improve and helps others make informed decisions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <Label>Your Rating *</Label>
            <div className="mt-2">
              <StarRating
                rating={formData.rating}
                onRatingChange={(rating) => setFormData({ ...formData, rating })}
                size="lg"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Review Title (Optional)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Sum up your experience in one line"
              maxLength={100}
            />
          </div>

          {/* Review */}
          <div>
            <Label htmlFor="review">Your Review *</Label>
            <Textarea
              id="review"
              value={formData.review}
              onChange={(e) => setFormData({ ...formData, review: e.target.value })}
              placeholder="Tell us about your experience with our service, installation quality, team professionalism, etc."
              rows={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.review.length} characters
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-coral hover:bg-coral/90"
            >
              {submitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Your review will be moderated before being published on our website.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
