'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Navigation,
  Filter
} from 'lucide-react';

interface ServiceJob {
  id: string;
  serviceNumber: string;
  serviceType: string;
  priority: string;
  status: string;
  scheduledDate: string;
  description: string;
  customer: {
    name: string;
    address: string;
    suburb: string;
    phone: string;
  };
}

export default function ServiceJobsList() {
  const router = useRouter();
  const [serviceJobs, setServiceJobs] = useState<ServiceJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<ServiceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchServiceJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [serviceJobs, statusFilter]);

  const fetchServiceJobs = async () => {
    try {
      // Mock data - in production, fetch from API
      const mockJobs: ServiceJob[] = [
        {
          id: '1',
          serviceNumber: 'SVC-2025-001',
          serviceType: 'MAINTENANCE',
          priority: 'MEDIUM',
          status: 'SCHEDULED',
          scheduledDate: new Date().toISOString(),
          description: 'Annual maintenance check',
          customer: {
            name: 'John Smith',
            address: '123 Main St',
            suburb: 'Perth',
            phone: '0412345678'
          }
        },
        {
          id: '2',
          serviceNumber: 'SVC-2025-002',
          serviceType: 'REPAIR',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          scheduledDate: new Date().toISOString(),
          description: 'Inverter error code',
          customer: {
            name: 'Jane Doe',
            address: '456 Oak Ave',
            suburb: 'Fremantle',
            phone: '0423456789'
          }
        }
      ];
      setServiceJobs(mockJobs);
    } catch (error) {
      console.error('Error fetching service jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    if (statusFilter === 'ALL') {
      setFilteredJobs(serviceJobs);
    } else {
      setFilteredJobs(serviceJobs.filter(job => job.status === statusFilter));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'MAINTENANCE': return '🔧';
      case 'REPAIR': return '⚠️';
      case 'INSPECTION': return '🔍';
      case 'UPGRADE': return '⬆️';
      case 'WARRANTY': return '📋';
      case 'EMERGENCY': return '🚨';
      default: return '🔧';
    }
  };

  const statusCounts = {
    ALL: serviceJobs.length,
    SCHEDULED: serviceJobs.filter(j => j.status === 'SCHEDULED').length,
    IN_PROGRESS: serviceJobs.filter(j => j.status === 'IN_PROGRESS').length,
    COMPLETED: serviceJobs.filter(j => j.status === 'COMPLETED').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Service Jobs</h1>
                <p className="text-sm opacity-90">{filteredJobs.length} jobs</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/mobile/installer/service/create')}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white border-b sticky top-[88px] z-10">
        <div className="flex overflow-x-auto no-scrollbar">
          {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-1 min-w-[100px] py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === status
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              <div>{status.replace('_', ' ')}</div>
              <div className="text-xs mt-1">{statusCounts[status as keyof typeof statusCounts]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Service Jobs List */}
      <div className="p-4 space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">No service jobs found</p>
            <p className="text-sm text-gray-500 mb-4">Create a new service job to get started</p>
            <button
              onClick={() => router.push('/mobile/installer/service/create')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium"
            >
              Create Service Job
            </button>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Link 
              key={job.id} 
              href={`/mobile/installer/service/${job.id}`}
              className="block"
            >
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm active:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{getServiceTypeIcon(job.serviceType)}</span>
                      <div>
                        <div className="text-xs text-orange-600 font-semibold">
                          {job.serviceNumber}
                        </div>
                        <div className="text-xs text-gray-600">{job.serviceType}</div>
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">{job.customer.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.customer.suburb}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`}>
                      {job.priority}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="text-sm text-gray-700 mb-3 p-2 bg-gray-50 rounded-lg">
                  {job.description}
                </div>

                {/* Schedule Info */}
                {job.scheduledDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
                    <Clock className="w-4 h-4" />
                    <span>
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

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `tel:${job.customer.phone}`;
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `https://maps.google.com/?q=${encodeURIComponent(job.customer.address + ', ' + job.customer.suburb)}`;
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-green-50 text-green-600 rounded-lg text-sm font-medium"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigate
                  </button>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link href="/mobile/installer" className="flex flex-col items-center py-2 text-gray-600">
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/mobile/installer/jobs" className="flex flex-col items-center py-2 text-gray-600">
            <Filter className="w-6 h-6 mb-1" />
            <span className="text-xs">Jobs</span>
          </Link>
          <Link href="/mobile/installer/service" className="flex flex-col items-center py-2 text-orange-600">
            <Wrench className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Service</span>
          </Link>
          <Link href="/mobile/clock" className="flex flex-col items-center py-2 text-gray-600">
            <Clock className="w-6 h-6 mb-1" />
            <span className="text-xs">Clock</span>
          </Link>
          <Link href="/mobile/schedule" className="flex flex-col items-center py-2 text-gray-600">
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-xs">More</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
