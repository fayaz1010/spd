
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  XCircle,
  BriefcaseIcon,
} from 'lucide-react';
import Link from 'next/link';

interface Subcontractor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceSuburbs: string[];
  dayRate: number | null;
  hourlyRate: number | null;
  costPerJob: number | null;
  perWattRate: number | null;
  batteryBaseRate: number | null;
  batteryPerKwhRate: number | null;
  isActive: boolean;
  _count?: {
    jobs: number;
  };
}

export default function SubcontractorsPage() {
  const router = useRouter();
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchSubcontractors();
  }, []);

  const fetchSubcontractors = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch('/api/admin/subcontractors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subcontractors');
      }

      const data = await response.json();
      setSubcontractors(data.subcontractors || []);
    } catch (err: any) {
      console.error('[Subcontractors] Fetch error:', err);
      setError(err.message || 'Failed to load subcontractors');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subcontractorId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/subcontractors/${subcontractorId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete subcontractor');
      }

      fetchSubcontractors();
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading subcontractors...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-primary mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-primary">
                    Subcontractor Management
                  </h1>
                  <p className="text-xs text-gray-500">
                    Manage external installation contractors
                  </p>
                </div>
              </div>
            </div>
            <Link href="/admin/dashboard/subcontractors/new">
              <Button className="bg-coral hover:bg-coral-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Subcontractor
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {subcontractors.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No subcontractors yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first subcontractor to expand installation capacity.
            </p>
            <Link href="/admin/dashboard/subcontractors/new">
              <Button className="bg-coral hover:bg-coral-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add First Subcontractor
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subcontractors.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-coral hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {sub.companyName}
                      </h3>
                      <p className="text-sm text-gray-600">{sub.contactName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{sub.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{sub.phone}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <BriefcaseIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <p className="text-2xl font-bold text-coral">
                        {sub._count?.jobs || 0}
                      </p>
                      <p className="text-xs text-gray-500">Jobs</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </div>
                      <p className="text-2xl font-bold text-emerald">
                        {sub.serviceSuburbs.length}
                      </p>
                      <p className="text-xs text-gray-500">Areas</p>
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Rates:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {/* Solar Installation Rate */}
                      {sub.perWattRate !== null && sub.perWattRate !== undefined && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-sm">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span className="font-semibold text-green-900">
                            ${sub.perWattRate.toFixed(2)}
                          </span>
                          <span className="text-green-600 text-xs">/W</span>
                        </div>
                      )}
                      {/* Battery Rates */}
                      {sub.batteryBaseRate !== null && sub.batteryBaseRate !== undefined && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-sm">
                          <DollarSign className="h-3 w-3 text-blue-600" />
                          <span className="font-semibold text-blue-900">
                            ${sub.batteryBaseRate}
                          </span>
                          <span className="text-blue-600 text-xs">base</span>
                        </div>
                      )}
                      {sub.batteryPerKwhRate !== null && sub.batteryPerKwhRate !== undefined && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-sm">
                          <DollarSign className="h-3 w-3 text-blue-600" />
                          <span className="font-semibold text-blue-900">
                            ${sub.batteryPerKwhRate}
                          </span>
                          <span className="text-blue-600 text-xs">/kWh</span>
                        </div>
                      )}
                      {/* Legacy Rates */}
                      {sub.dayRate && (
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3 w-3 text-gray-500" />
                          <span className="font-semibold text-gray-700">
                            ${sub.dayRate}
                          </span>
                          <span className="text-gray-500 text-xs">/day</span>
                        </div>
                      )}
                      {sub.hourlyRate && (
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3 w-3 text-gray-500" />
                          <span className="font-semibold text-gray-700">
                            ${sub.hourlyRate}
                          </span>
                          <span className="text-gray-500 text-xs">/hr</span>
                        </div>
                      )}
                      {sub.costPerJob && (
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3 w-3 text-gray-500" />
                          <span className="font-semibold text-gray-700">
                            ${sub.costPerJob}
                          </span>
                          <span className="text-gray-500 text-xs">/job</span>
                        </div>
                      )}
                      {!sub.perWattRate && !sub.batteryBaseRate && !sub.dayRate && !sub.hourlyRate && !sub.costPerJob && (
                        <span className="text-sm text-gray-500">
                          No rates set
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Service Areas */}
                  {sub.serviceSuburbs.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Service Areas:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {sub.serviceSuburbs.slice(0, 3).map((suburb) => (
                          <span
                            key={suburb}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700"
                          >
                            {suburb}
                          </span>
                        ))}
                        {sub.serviceSuburbs.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700">
                            +{sub.serviceSuburbs.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/dashboard/subcontractors/${sub.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full text-primary border-primary hover:bg-primary hover:text-white"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    {deleteConfirm === sub.id ? (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(sub.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(sub.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
