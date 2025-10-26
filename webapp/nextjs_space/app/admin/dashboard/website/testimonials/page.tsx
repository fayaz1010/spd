'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/StarRating';
import { AIGenerateButton } from '@/components/admin/AIGenerateButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Star,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  MessageSquare,
  Plus,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import { BulkAIGenerateButton } from '@/components/admin/BulkAIGenerateButton';
import { toast } from 'sonner';

interface Testimonial {
  id: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  review: string;
  location?: string;
  systemSize?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  featured: boolean;
  showOnWebsite: boolean;
  moderatorNotes?: string;
  createdAt: string;
  job?: {
    jobNumber: string;
    lead: {
      customerName: string;
      suburb: string;
    };
  };
}

export default function TestimonialsManagementPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [statusCounts, setStatusCounts] = useState<any>([]);
  const [newTestimonial, setNewTestimonial] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    review: '',
    location: '',
    systemSize: 0,
    status: 'APPROVED' as const,
    featured: false,
    showOnWebsite: true,
  });

  useEffect(() => {
    fetchTestimonials();
  }, [filterStatus]);

  const fetchTestimonials = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`/api/admin/testimonials?${params}`);
      const data = await response.json();

      if (data.success) {
        setTestimonials(data.testimonials);
        setStatusCounts(data.statusCounts);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          moderatorNotes,
          moderatedBy: 'admin', // TODO: Get from auth
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Testimonial ${action}d successfully`);
        setSelectedTestimonial(null);
        setModeratorNotes('');
        fetchTestimonials();
      } else {
        toast.error(data.error || `Failed to ${action} testimonial`);
      }
    } catch (error) {
      console.error(`Error ${action}ing testimonial:`, error);
      toast.error(`Error ${action}ing testimonial`);
    }
  };

  const handleToggle = async (id: string, field: 'featured' | 'showOnWebsite', value: boolean) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Updated successfully`);
        fetchTestimonials();
      } else {
        toast.error('Failed to update');
      }
    } catch (error) {
      console.error('Error updating testimonial:', error);
      toast.error('Error updating testimonial');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Testimonial deleted');
        fetchTestimonials();
      } else {
        toast.error('Failed to delete testimonial');
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Error deleting testimonial');
    }
  };

  const handleCreateTestimonial = async () => {
    if (!newTestimonial.customerName.trim() || !newTestimonial.review.trim()) {
      toast.error('Customer name and review are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTestimonial,
          source: 'manual',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Testimonial created successfully');
        setIsAddDialogOpen(false);
        fetchTestimonials();
      } else {
        toast.error(data.error || 'Failed to create testimonial');
      }
    } catch (error) {
      console.error('Error creating testimonial:', error);
      toast.error('Error creating testimonial');
    }
  };

  const handleBulkGenerated = async (generatedTestimonials: any[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const testimonial of generatedTestimonials) {
        try {
          const response = await fetch('/api/admin/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: testimonial.customerName,
              customerEmail: testimonial.customerEmail || '',
              rating: testimonial.rating || 5,
              title: testimonial.title || '',
              review: testimonial.review,
              location: testimonial.location || '',
              systemSize: testimonial.systemSize || null,
              status: 'APPROVED',
              featured: false,
              showOnWebsite: true,
              source: 'ai_generated',
            }),
          });

          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Created ${successCount} testimonials successfully!`);
        fetchTestimonials();
      }
      if (errorCount > 0) {
        toast.error(`Failed to create ${errorCount} testimonials`);
      }
    } catch (error) {
      console.error('Error saving bulk testimonials:', error);
      toast.error('Error saving testimonials');
    }
  };

  const pendingCount = statusCounts.find((s: any) => s.status === 'PENDING')?._count || 0;

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/dashboard/website">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website Management
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Testimonials Management</h1>
            <p className="text-gray-600">Review and moderate customer testimonials</p>
          </div>
          <div className="flex gap-2">
            <BulkAIGenerateButton
              type="testimonial"
              onGenerated={handleBulkGenerated}
              buttonText="Bulk Generate Testimonials"
              buttonVariant="secondary"
            />
            <Button 
              onClick={() => {
                setNewTestimonial({
                  customerName: '',
                  customerEmail: '',
                  rating: 5,
                  title: '',
                  review: '',
                  location: '',
                  systemSize: 0,
                  status: 'APPROVED',
                  featured: false,
                  showOnWebsite: true,
                });
                setIsAddDialogOpen(true);
              }}
              className="bg-coral hover:bg-coral/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Testimonial
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">
                  {statusCounts.find((s: any) => s.status === 'APPROVED')?._count || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">
                  {statusCounts.find((s: any) => s.status === 'REJECTED')?._count || 0}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold">
                  {testimonials.filter(t => t.featured).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-4 items-center">
        <Label>Filter by Status:</Label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Testimonials</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="FLAGGED">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Testimonials List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Loading testimonials...</p>
          </CardContent>
        </Card>
      ) : testimonials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No testimonials found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className={`${
                testimonial.status === 'PENDING'
                  ? 'border-orange-300 bg-orange-50/50'
                  : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{testimonial.customerName}</CardTitle>
                      <Badge
                        variant={
                          testimonial.status === 'APPROVED'
                            ? 'default'
                            : testimonial.status === 'PENDING'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {testimonial.status}
                      </Badge>
                      {testimonial.featured && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <StarRating rating={testimonial.rating} readonly size="sm" />
                      {testimonial.location && <span>📍 {testimonial.location}</span>}
                      {testimonial.systemSize && <span>⚡ {testimonial.systemSize}kW</span>}
                      <span>{new Date(testimonial.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {testimonial.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTestimonial(testimonial);
                            setModeratorNotes('');
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedTestimonial(testimonial);
                            setModeratorNotes('');
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(testimonial.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {testimonial.title && (
                  <p className="font-semibold mb-2">{testimonial.title}</p>
                )}
                <p className="text-gray-700 mb-4">{testimonial.review}</p>

                {testimonial.status === 'APPROVED' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(testimonial.id, 'featured', !testimonial.featured)}
                    >
                      <Star className="w-4 h-4 mr-1" />
                      {testimonial.featured ? 'Unfeature' : 'Feature'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(testimonial.id, 'showOnWebsite', !testimonial.showOnWebsite)}
                    >
                      {testimonial.showOnWebsite ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hide from Website
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Show on Website
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Moderation Dialog */}
      <Dialog open={!!selectedTestimonial} onOpenChange={() => setSelectedTestimonial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Moderate Testimonial</DialogTitle>
            <DialogDescription>
              Review and moderate this customer testimonial
            </DialogDescription>
          </DialogHeader>

          {selectedTestimonial && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">{selectedTestimonial.customerName}</p>
                <StarRating rating={selectedTestimonial.rating} readonly size="md" />
              </div>

              {selectedTestimonial.title && (
                <div>
                  <Label>Title</Label>
                  <p className="text-sm">{selectedTestimonial.title}</p>
                </div>
              )}

              <div>
                <Label>Review</Label>
                <p className="text-sm text-gray-700 mt-1">{selectedTestimonial.review}</p>
              </div>

              <div>
                <Label htmlFor="moderatorNotes">Moderator Notes (Internal)</Label>
                <Textarea
                  id="moderatorNotes"
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  placeholder="Add notes about this moderation decision..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTestimonial(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleModerate(selectedTestimonial.id, 'reject')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleModerate(selectedTestimonial.id, 'approve')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Testimonial Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Testimonial</DialogTitle>
            <DialogDescription>
              Manually add a customer testimonial
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <input
                  id="customerName"
                  type="text"
                  value={newTestimonial.customerName}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, customerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <input
                  id="location"
                  type="text"
                  value={newTestimonial.location}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Perth, WA"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerEmail">Customer Email</Label>
              <input
                id="customerEmail"
                type="email"
                value={newTestimonial.customerEmail}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, customerEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label>Rating *</Label>
              <StarRating
                rating={newTestimonial.rating}
                onRatingChange={(rating) => setNewTestimonial({ ...newTestimonial, rating })}
                size="lg"
              />
            </div>

            <div>
              <Label htmlFor="title">Title (Optional)</Label>
              <input
                id="title"
                type="text"
                value={newTestimonial.title}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Great service and savings!"
              />
            </div>

            <div>
              <Label htmlFor="review">Review *</Label>
              <Textarea
                id="review"
                value={newTestimonial.review}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, review: e.target.value })}
                placeholder="Write the customer's review..."
                rows={6}
              />
              <div className="mt-2">
                <AIGenerateButton
                  type="testimonial"
                  onGenerated={(data) => {
                    setNewTestimonial({
                      ...newTestimonial,
                      title: data.title,
                      review: data.review,
                    });
                    toast.success('Testimonial enhanced! Review and adjust as needed.');
                  }}
                  buttonText="Enhance with AI"
                  buttonVariant="outline"
                  size="sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="systemSize">System Size (kW)</Label>
              <input
                id="systemSize"
                type="number"
                step="0.1"
                value={newTestimonial.systemSize}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, systemSize: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="6.6"
              />
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showOnWebsite"
                  checked={newTestimonial.showOnWebsite}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, showOnWebsite: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="showOnWebsite" className="font-normal cursor-pointer">
                  Show on website
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={newTestimonial.featured}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, featured: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="featured" className="font-normal cursor-pointer">
                  Featured testimonial
                </Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTestimonial}
                className="bg-coral hover:bg-coral/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Testimonial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
