
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Phone,
  Mail,
  Package,
  Clock,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string | null;
  scheduledStartTime: string | null;
  estimatedDuration: number;
  systemSize: number;
  panelCount: number;
  batteryCapacity: number | null;
  inverterModel: string;
  installationNotes: string | null;
  lead: {
    name: string;
    email: string;
    phone: string;
    address: string;
    suburb: string | null;
    postcode: string | null;
  };
  siteLatitude: number | null;
  siteLongitude: number | null;
  materialOrders?: Array<{
    id: string;
    poNumber: string;
    status: string;
    expectedDelivery: string | null;
    trackingNumber: string | null;
    deliveredAt: string | null;
    supplier: {
      name: string;
    };
  }>;
}

export default function InstallerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('today');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/installer/jobs?filter=${filter}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchJobs, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [filter]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-500',
      SUB_CONFIRMED: 'bg-green-500',
      MATERIALS_READY: 'bg-purple-500',
      IN_PROGRESS: 'bg-orange-500',
      COMPLETED: 'bg-emerald-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const openMaps = (lat: number, lng: number, address: string) => {
    const encodedAddress = encodeURIComponent(address);
    // Try to open in native maps app, fallback to Google Maps web
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">My Jobs</h1>
              <p className="text-sm text-muted-foreground">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} assigned
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchJobs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === 'today' ? 'default' : 'outline'}
              onClick={() => setFilter('today')}
              className="flex-1"
            >
              Today
            </Button>
            <Button
              size="sm"
              variant={filter === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setFilter('upcoming')}
              className="flex-1"
            >
              Upcoming
            </Button>
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="flex-1"
            >
              All
            </Button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="p-4 space-y-4">
        {loading ? (
          <Card className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Loading jobs...</p>
          </Card>
        ) : jobs.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No jobs found</p>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{job.lead.name}</h3>
                  <Badge className={`${getStatusColor(job.status)} text-white mt-1`}>
                    {job.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <Link href={`/installer/jobs/${job.id}`}>
                  <Button size="sm">View</Button>
                </Link>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Customer
                </h4>
                <p className="font-medium">{job.lead.name}</p>
                <div className="flex flex-wrap gap-2">
                  <a href={`tel:${job.lead.phone}`}>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  </a>
                  <a href={`mailto:${job.lead.email}`}>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Location
                </h4>
                <p className="text-sm">
                  {job.lead.address}
                  {job.lead.suburb && `, ${job.lead.suburb}`}
                  {job.lead.postcode && ` ${job.lead.postcode}`}
                </p>
                {job.siteLatitude && job.siteLongitude && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      openMaps(
                        job.siteLatitude!,
                        job.siteLongitude!,
                        `${job.lead.address}, ${job.lead.suburb || ''}`
                      )
                    }
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Open in Maps
                  </Button>
                )}
              </div>

              {/* Schedule */}
              {job.scheduledDate && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Scheduled
                  </h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(job.scheduledDate), 'PPP')}</span>
                  </div>
                  {job.scheduledStartTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>
                        {job.scheduledStartTime} ({job.estimatedDuration}h)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* System Details */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  System Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Size:</span>{' '}
                    <span className="font-medium">{job.systemSize} kW</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Panels:</span>{' '}
                    <span className="font-medium">{job.panelCount}</span>
                  </div>
                  {job.batteryCapacity && (
                    <div>
                      <span className="text-muted-foreground">Battery:</span>{' '}
                      <span className="font-medium">{job.batteryCapacity} kWh</span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Inverter:</span>{' '}
                    <span className="font-medium">{job.inverterModel}</span>
                  </div>
                </div>
              </div>

              {/* Materials Status */}
              {job.materialOrders && job.materialOrders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Materials Status
                  </h4>
                  <div className="space-y-2">
                    {job.materialOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">PO-{order.poNumber}</span>
                          <Badge
                            className={
                              order.status === 'DELIVERED'
                                ? 'bg-green-500 text-white'
                                : order.status === 'IN_TRANSIT'
                                ? 'bg-purple-500 text-white'
                                : order.status === 'CONFIRMED'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-500 text-white'
                            }
                          >
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Supplier: {order.supplier.name}
                        </p>
                        {order.expectedDelivery && (
                          <p className="text-xs text-muted-foreground">
                            Expected: {format(new Date(order.expectedDelivery), 'MMM d, yyyy')}
                          </p>
                        )}
                        {order.deliveredAt && (
                          <p className="text-xs text-green-600 font-medium">
                            ✓ Delivered: {format(new Date(order.deliveredAt), 'MMM d, yyyy')}
                          </p>
                        )}
                        {order.trackingNumber && (
                          <p className="text-xs text-muted-foreground">
                            Tracking: {order.trackingNumber}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {job.installationNotes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Installation Notes
                  </h4>
                  <p className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
                    {job.installationNotes}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <Link href={`/installer/jobs/${job.id}`}>
                <Button className="w-full" size="lg">
                  {job.status === 'SCHEDULED' || job.status === 'SUB_CONFIRMED' || job.status === 'MATERIALS_READY'
                    ? 'Start Installation'
                    : job.status === 'IN_PROGRESS'
                    ? 'Continue Installation'
                    : 'View Details'}
                </Button>
              </Link>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
