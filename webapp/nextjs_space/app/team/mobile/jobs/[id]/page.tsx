'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileNav } from '@/components/mobile/MobileNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Phone,
  Navigation,
  Camera,
  CheckSquare,
  FileText,
  DollarSign,
  MapPin,
  Calendar,
  Clock,
  Zap,
  Battery,
  Sun,
  User,
  Mail,
  Home,
} from 'lucide-react';
import Link from 'next/link';

export default function MobileJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/team/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data.job);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (job?.lead?.phone) {
      window.location.href = `tel:${job.lead.phone}`;
    }
  };

  const handleEmail = () => {
    if (job?.lead?.email) {
      window.location.href = `mailto:${job.lead.email}`;
    }
  };

  const handleNavigate = () => {
    if (job?.siteLatitude && job?.siteLongitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${job.siteLatitude},${job.siteLongitude}`, '_blank');
    } else if (job?.lead?.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.lead.address)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileNav />
        <div className="p-4 text-center">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileNav />
        <div className="p-4 text-center">
          <p className="text-gray-500">Job not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MobileNav />

      {/* Header */}
      <div className="bg-gradient-primary text-white p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-white hover:bg-white/20 mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">{job.lead?.name}</h1>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <MapPin className="h-4 w-4" />
              <span>{job.lead?.address}</span>
            </div>
          </div>
          <Badge className="bg-white text-primary">
            {job.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Button
            onClick={handleCall}
            variant="secondary"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            <Phone className="h-5 w-5" />
            <span className="text-xs">Call</span>
          </Button>
          <Button
            onClick={handleNavigate}
            variant="secondary"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            <Navigation className="h-5 w-5" />
            <span className="text-xs">Navigate</span>
          </Button>
          <Link href={`/team/mobile/jobs/${jobId}/photos`}>
            <Button
              variant="secondary"
              size="sm"
              className="w-full flex flex-col items-center gap-1 h-auto py-3"
            >
              <Camera className="h-5 w-5" />
              <span className="text-xs">Photos</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="details" className="p-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-4">
          {/* Schedule Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-AU') : 'Not scheduled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{job.scheduledStartTime || 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{job.estimatedDuration || 4} hours</span>
              </div>
            </div>
          </Card>

          {/* Customer Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span>{job.lead?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${job.lead?.phone}`} className="text-blue-600">
                  {job.lead?.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${job.lead?.email}`} className="text-blue-600">
                  {job.lead?.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-400" />
                <span>{job.lead?.address}</span>
              </div>
            </div>
          </Card>

          {/* Installation Notes */}
          {job.installationNotes && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Installation Notes
              </h3>
              <p className="text-sm text-gray-700">{job.installationNotes}</p>
            </Card>
          )}
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4 mt-4">
          {/* System Overview */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sun className="h-5 w-5 text-primary" />
              Solar System
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{job.systemSize}kW</div>
                <div className="text-xs text-gray-600">System Size</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{job.panelCount}</div>
                <div className="text-xs text-gray-600">Panels</div>
              </div>
            </div>
          </Card>

          {/* Inverter */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Inverter
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Model:</span>
                <span className="font-medium">{job.inverterModel}</span>
              </div>
            </div>
          </Card>

          {/* Battery */}
          {job.batteryCapacity > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Battery className="h-5 w-5 text-primary" />
                Battery Storage
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{job.batteryCapacity}kWh</span>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Compliance Status
            </h3>
            
            <div className="text-center py-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {job.complianceScore || 0}%
              </div>
              <p className="text-sm text-gray-600">Compliance Score</p>
            </div>

            <Link href={`/team/mobile/jobs/${jobId}/compliance`}>
              <Button className="w-full bg-gradient-primary">
                View Compliance Checklist
              </Button>
            </Link>
          </Card>

          <Link href={`/team/mobile/jobs/${jobId}/rebates`}>
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold">Rebate Submissions</h3>
                    <p className="text-sm text-gray-600">Manage STCs & rebates</p>
                  </div>
                </div>
                <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
              </div>
            </Card>
          </Link>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Job Notes</h3>
            <p className="text-sm text-gray-500">
              Notes feature coming soon...
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
