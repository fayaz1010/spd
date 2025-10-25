'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  MapPin, 
  Phone,
  Mail,
  Navigation,
  Camera,
  CheckCircle2,
  Clock,
  Zap,
  Battery,
  User,
  FileText,
  AlertCircle,
  Upload,
  Edit
} from 'lucide-react';

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string;
  notes?: string;
  lead: {
    name: string;
    email: string;
    phone: string;
    address: string;
    suburb: string;
    postcode: string;
    systemSizeKw: number;
    batterySizeKwh?: number;
  };
  Team?: {
    name: string;
  };
}

export default function MobileJobDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchJob();
  }, [params.id]);

  const fetchJob = async () => {
    try {
      const token = localStorage.getItem('team_token');
      const response = await fetch(`/api/team/jobs/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setJob(data.job);
        setSelectedStatus(data.job.status);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    try {
      const token = localStorage.getItem('team_token');
      const response = await fetch(`/api/team/jobs/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: selectedStatus })
      });

      if (response.ok) {
        setJob(prev => prev ? { ...prev, status: selectedStatus } : null);
        setShowStatusModal(false);
        alert('✓ Status updated successfully!');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800';
      case 'ON_SITE': return 'bg-purple-100 text-purple-800';
      case 'EN_ROUTE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Job not found</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="text-sm opacity-90">{job.jobNumber}</div>
              <h1 className="text-xl font-bold">{job.lead.name}</h1>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(job.status)} bg-white/20 text-white`}>
            <Clock className="w-4 h-4" />
            {job.status.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setShowStatusModal(true)}
            className="bg-white rounded-xl p-4 border border-gray-200 text-center shadow-sm active:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-xs font-medium text-gray-900">Update Status</div>
          </button>

          <Link href={`/mobile/installer/jobs/${params.id}/checklist`}>
            <div className="bg-white rounded-xl p-4 border border-gray-200 text-center shadow-sm active:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-xs font-medium text-gray-900">Checklist</div>
            </div>
          </Link>

          <Link href={`/mobile/installer/jobs/${params.id}/photos`}>
            <div className="bg-white rounded-xl p-4 border border-gray-200 text-center shadow-sm active:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-xs font-medium text-gray-900">Photos</div>
            </div>
          </Link>
        </div>

        {/* System Details */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            System Details
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Solar System</span>
              <span className="text-sm font-semibold text-gray-900">{job.lead.systemSizeKw}kW</span>
            </div>
            {job.lead.batterySizeKwh && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Battery Storage</span>
                <span className="text-sm font-semibold text-gray-900">{job.lead.batterySizeKwh}kWh</span>
              </div>
            )}
            {job.scheduledDate && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Scheduled</span>
                <span className="text-sm font-semibold text-gray-900">
                  {new Date(job.scheduledDate).toLocaleDateString('en-AU', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Customer Information
          </h2>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Name</div>
              <div className="text-sm font-medium text-gray-900">{job.lead.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Address</div>
              <div className="text-sm text-gray-900">
                {job.lead.address}<br />
                {job.lead.suburb} {job.lead.postcode}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <a
                href={`tel:${job.lead.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
              <a
                href={`mailto:${job.lead.email}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(job.lead.address + ', ' + job.lead.suburb)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-green-50 text-green-600 rounded-lg text-sm font-medium"
              >
                <Navigation className="w-4 h-4" />
                Navigate
              </a>
            </div>
          </div>
        </div>

        {/* Team Info */}
        {job.Team && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Team
            </h2>
            <div className="text-sm text-gray-900">{job.Team.name}</div>
          </div>
        )}

        {/* Notes */}
        {job.notes && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Notes
            </h2>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{job.notes}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href={`/mobile/installer/jobs/${params.id}/checklist`}>
            <button className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium shadow-md active:shadow-lg transition-shadow flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Start Installation Checklist
            </button>
          </Link>

          <Link href={`/mobile/installer/jobs/${params.id}/photos`}>
            <button className="w-full py-3 px-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl font-medium shadow-sm active:shadow-md transition-shadow flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" />
              Upload Photos
            </button>
          </Link>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Update Job Status</h3>
            <div className="space-y-2 mb-6">
              {['SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`w-full py-3 px-4 rounded-xl text-left font-medium transition-colors ${
                    selectedStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-900 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={updateStatus}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link href="/mobile/installer" className="flex flex-col items-center py-2 text-gray-600">
            <MapPin className="w-6 h-6 mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/mobile/installer/jobs" className="flex flex-col items-center py-2 text-blue-600">
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Jobs</span>
          </Link>
          <Link href="/mobile/clock" className="flex flex-col items-center py-2 text-gray-600">
            <Clock className="w-6 h-6 mb-1" />
            <span className="text-xs">Clock</span>
          </Link>
          <Link href="/mobile/schedule" className="flex flex-col items-center py-2 text-gray-600">
            <MapPin className="w-6 h-6 mb-1" />
            <span className="text-xs">Schedule</span>
          </Link>
          <Link href="/mobile/timesheets" className="flex flex-col items-center py-2 text-gray-600">
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs">More</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
