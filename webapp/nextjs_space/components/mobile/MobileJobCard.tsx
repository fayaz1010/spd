'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Phone,
  Navigation,
  Camera,
  CheckCircle2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface MobileJobCardProps {
  job: {
    id: string;
    customerName: string;
    address: string;
    suburb?: string;
    scheduledDate?: Date | string;
    scheduledStartTime?: string;
    estimatedDuration?: number;
    status: string;
    systemSize: number;
    panelCount: number;
    customerPhone?: string;
    siteLatitude?: number;
    siteLongitude?: number;
    complianceScore?: number;
  };
  onNavigate?: () => void;
  onCall?: () => void;
  onStartJob?: () => void;
}

export function MobileJobCard({ job, onNavigate, onCall, onStartJob }: MobileJobCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING_SCHEDULE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not scheduled';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-AU', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getComplianceColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 100) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="bg-gradient-primary p-4 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{job.customerName}</h3>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{job.address}</span>
            </div>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {getStatusLabel(job.status)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Schedule Info */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{formatDate(job.scheduledDate)}</span>
          </div>
          {job.scheduledStartTime && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{job.scheduledStartTime}</span>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="flex items-center gap-4 text-sm bg-gray-50 p-3 rounded-lg">
          <div className="flex-1">
            <p className="text-gray-600 text-xs">System Size</p>
            <p className="font-bold text-lg">{job.systemSize}kW</p>
          </div>
          <div className="flex-1">
            <p className="text-gray-600 text-xs">Panels</p>
            <p className="font-bold text-lg">{job.panelCount}</p>
          </div>
          {job.complianceScore !== undefined && (
            <div className="flex-1">
              <p className="text-gray-600 text-xs">Compliance</p>
              <p className={`font-bold text-lg ${getComplianceColor(job.complianceScore)}`}>
                {job.complianceScore}%
              </p>
            </div>
          )}
        </div>

        {/* Compliance Alert */}
        {job.complianceScore !== undefined && job.complianceScore < 100 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Compliance Incomplete
              </p>
              <p className="text-xs text-yellow-700">
                Complete checklist before finishing job
              </p>
            </div>
          </div>
        )}

        {job.complianceScore === 100 && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Fully Compliant
              </p>
              <p className="text-xs text-green-700">
                Ready to complete job
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCall}
            className="flex items-center gap-2"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Call</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigate}
            className="flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">Navigate</span>
          </Button>
          
          <Link href={`/team/mobile/jobs/${job.id}/photos`}>
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Photos</span>
            </Button>
          </Link>
        </div>

        {/* View Details Button */}
        <Link href={`/team/mobile/jobs/${job.id}`}>
          <Button className="w-full bg-gradient-primary hover:opacity-90">
            View Job Details
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>

        {/* Start Job Button (if scheduled) */}
        {job.status === 'SCHEDULED' && onStartJob && (
          <Button 
            onClick={onStartJob}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Start Job
          </Button>
        )}
      </div>
    </Card>
  );
}
