'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  MapPin,
  Zap,
  Battery,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Save,
  Package,
  Users,
  Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/blog/utils';
import { useToast } from '@/hooks/use-toast';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [params.id]);

  const fetchJob = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/team/jobs/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job');
      }

      const data = await response.json();
      setJob(data.job);
      setNotes(data.job.notes || '');
      setNewStatus(data.job.status);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/team/jobs/${params.id}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const data = await response.json();
      setJob(data.job);
      setShowStatusDialog(false);
      
      toast({
        title: 'Success',
        description: 'Job status updated successfully',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Job not found</p>
          <Link href="/team/jobs">
            <Button>Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/team/jobs">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Jobs
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-primary">{job.jobNumber}</h1>
                <Badge className={getStatusColor(job.status)}>
                  {getStatusLabel(job.status)}
                </Badge>
              </div>
            </div>
            <Button onClick={() => setShowStatusDialog(true)}>
              <Save className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{job.lead.name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a href={`tel:${job.lead.phone}`} className="font-medium text-coral hover:underline">
                      {job.lead.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a href={`mailto:${job.lead.email}`} className="font-medium text-coral hover:underline">
                      {job.lead.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{job.lead.address}, {job.lead.suburb}</p>
                    {job.lead.latitude && job.lead.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${job.lead.latitude},${job.lead.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-coral hover:underline"
                      >
                        Open in Google Maps →
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Details */}
            <Card>
              <CardHeader>
                <CardTitle>System Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <Zap className="h-5 w-5 mr-2 text-gray-400" />
                      <p className="text-sm text-gray-500">System Size</p>
                    </div>
                    <p className="text-2xl font-bold">{job.lead.systemSizeKw}kW</p>
                    <p className="text-sm text-gray-500">{job.lead.numPanels} panels</p>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <Battery className="h-5 w-5 mr-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Battery</p>
                    </div>
                    <p className="text-2xl font-bold">
                      {job.lead.batterySizeKwh > 0 ? `${job.lead.batterySizeKwh}kWh` : 'None'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Property Type</p>
                  <p className="font-medium">{job.lead.propertyType || 'Not specified'}</p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Roof Type</p>
                  <p className="font-medium">{job.lead.roofType || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Job Notes</CardTitle>
                <CardDescription>Add notes about this installation</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about the installation..."
                  rows={6}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Scheduled Date</p>
                  <p className="font-medium">
                    {job.scheduledDate ? formatDate(new Date(job.scheduledDate)) : 'Not scheduled'}
                  </p>
                </div>
                {job.actualStartDate && (
                  <div>
                    <p className="text-sm text-gray-500">Started</p>
                    <p className="font-medium">{formatDate(new Date(job.actualStartDate))}</p>
                  </div>
                )}
                {job.actualEndDate && (
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="font-medium">{formatDate(new Date(job.actualEndDate))}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team */}
            {job.team && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium mb-3">{job.team.name}</p>
                  <div className="space-y-2">
                    {job.team.members.map((member: any) => (
                      <div key={member.id} className="text-sm">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-gray-500">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Materials */}
            {job.MaterialOrder && job.MaterialOrder.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {job.MaterialOrder.map((order: any) => (
                    <div key={order.id} className="mb-3">
                      <p className="font-medium">{order.poNumber}</p>
                      <p className="text-sm text-gray-500">{order.supplier.name}</p>
                      <Badge className="mt-1">{order.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Job Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change the status of this installation job
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusUpdate} disabled={updating}>
              {updating ? 'Updating...' : 'Update Status'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
