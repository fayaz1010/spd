'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ComplianceStats {
  totalStaff: number;
  cecValid: number;
  cecExpiringSoon: number;
  cecExpired: number;
  cecMissing: number;
  licenseValid: number;
  licenseExpiringSoon: number;
  licenseExpired: number;
  licenseMissing: number;
  whiteCardCompliant: number;
  workingAtHeightsCompliant: number;
  firstAidCompliant: number;
  fullyCompliant: number;
  atRisk: number;
  nonCompliant: number;
}

interface StaffDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  team: {
    name: string;
    color: string;
  };
  complianceScore: {
    overall: number;
    status: 'compliant' | 'at_risk' | 'non_compliant';
    issues: string[];
  };
}

export default function ComplianceDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [staffDetails, setStaffDetails] = useState<StaffDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'compliant' | 'at_risk' | 'non_compliant'>('all');

  useEffect(() => {
    fetchComplianceData();
  }, []);

  async function fetchComplianceData() {
    try {
      const res = await fetch('/api/admin/compliance/dashboard');
      const data = await res.json();
      
      if (data.success) {
        setStats(data.stats);
        setStaffDetails(data.staffDetails);
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredStaff = staffDetails.filter(staff => {
    if (filter === 'all') return true;
    return staff.complianceScore.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-600';
      case 'at_risk': return 'bg-yellow-600';
      case 'non_compliant': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'at_risk': return 'text-yellow-600';
      case 'non_compliant': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="p-6">Error loading compliance data</div>;
  }

  const overallComplianceRate = stats.totalStaff > 0 
    ? Math.round((stats.fullyCompliant / stats.totalStaff) * 100)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Compliance Dashboard</h1>
        <p className="text-gray-600">Real-time monitoring of staff certifications and compliance</p>
      </div>

      {/* Overall Compliance Score */}
      <div className="mb-6 p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Overall Compliance Rate</h2>
            <div className="text-5xl font-bold text-blue-600">{overallComplianceRate}%</div>
            <p className="text-gray-600 mt-2">{stats.fullyCompliant} of {stats.totalStaff} staff fully compliant</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.fullyCompliant}</div>
              <div className="text-sm text-gray-600">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.atRisk}</div>
              <div className="text-sm text-gray-600">At Risk</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.nonCompliant}</div>
              <div className="text-sm text-gray-600">Non-Compliant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* CEC Accreditation */}
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="font-semibold mb-3">CEC Accreditation</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Valid</span>
              <span className="font-semibold text-green-600">{stats.cecValid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expiring Soon</span>
              <span className="font-semibold text-yellow-600">{stats.cecExpiringSoon}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expired</span>
              <span className="font-semibold text-red-600">{stats.cecExpired}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Missing</span>
              <span className="font-semibold text-gray-600">{stats.cecMissing}</span>
            </div>
          </div>
        </div>

        {/* Electrical License */}
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Electrical License</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Valid</span>
              <span className="font-semibold text-green-600">{stats.licenseValid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expiring Soon</span>
              <span className="font-semibold text-yellow-600">{stats.licenseExpiringSoon}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expired</span>
              <span className="font-semibold text-red-600">{stats.licenseExpired}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Missing</span>
              <span className="font-semibold text-gray-600">{stats.licenseMissing}</span>
            </div>
          </div>
        </div>

        {/* Safety Certifications */}
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Safety Certifications</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">White Card</span>
              <span className="font-semibold">{stats.whiteCardCompliant}/{stats.totalStaff}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Working at Heights</span>
              <span className="font-semibold">{stats.workingAtHeightsCompliant}/{stats.totalStaff}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">First Aid</span>
              <span className="font-semibold">{stats.firstAidCompliant}/{stats.totalStaff}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/admin/dashboard/staff')}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Manage Staff
            </button>
            <button
              onClick={() => setFilter('non_compliant')}
              className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              View Non-Compliant
            </button>
            <button
              onClick={() => setFilter('at_risk')}
              className="w-full px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              View At Risk
            </button>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="border rounded-lg bg-white shadow-sm">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Staff Compliance Details</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                All ({staffDetails.length})
              </button>
              <button
                onClick={() => setFilter('compliant')}
                className={`px-3 py-1 rounded ${filter === 'compliant' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
              >
                Compliant ({stats.fullyCompliant})
              </button>
              <button
                onClick={() => setFilter('at_risk')}
                className={`px-3 py-1 rounded ${filter === 'at_risk' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
              >
                At Risk ({stats.atRisk})
              </button>
              <button
                onClick={() => setFilter('non_compliant')}
                className={`px-3 py-1 rounded ${filter === 'non_compliant' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
              >
                Non-Compliant ({stats.nonCompliant})
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {filteredStaff.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No staff members found for this filter
            </div>
          ) : (
            filteredStaff.map(staff => (
              <div key={staff.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{staff.name}</h3>
                      <span
                        className="px-2 py-1 text-xs rounded text-white"
                        style={{ backgroundColor: staff.team.color }}
                      >
                        {staff.team.name}
                      </span>
                      <span className="text-sm text-gray-600">{staff.role}</span>
                    </div>
                    <p className="text-sm text-gray-600">{staff.email}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getStatusTextColor(staff.complianceScore.status)}`}>
                        {staff.complianceScore.overall}%
                      </div>
                      <div className={`text-xs px-2 py-1 rounded text-white ${getStatusColor(staff.complianceScore.status)}`}>
                        {staff.complianceScore.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/admin/dashboard/staff/${staff.id}/certifications`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                
                {staff.complianceScore.issues.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="text-sm font-semibold text-red-800 mb-1">Issues:</div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {staff.complianceScore.issues.slice(0, 3).map((issue, i) => (
                        <li key={i}>• {issue}</li>
                      ))}
                      {staff.complianceScore.issues.length > 3 && (
                        <li className="text-red-600">+ {staff.complianceScore.issues.length - 3} more issues</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
