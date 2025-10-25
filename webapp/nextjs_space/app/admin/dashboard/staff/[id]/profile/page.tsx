'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface StaffProfile {
  staff: any;
  certifications: any;
  complianceScore: any;
  skills: any[];
  recentPerformance: any;
  kpis: any[];
  leaveBalance: any;
}

export default function StaffProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCompleteProfile();
  }, [params.id]);

  async function fetchCompleteProfile() {
    try {
      // Fetch all data in parallel
      const [certRes, skillsRes, perfRes, leaveRes] = await Promise.all([
        fetch(`/api/admin/staff/${params.id}/certifications`),
        fetch(`/api/admin/staff/${params.id}/skills`),
        fetch(`/api/admin/staff/${params.id}/performance`),
        fetch(`/api/staff/leave/balance?staffId=${params.id}`)
      ]);

      const certData = await certRes.json();
      const skillsData = await skillsRes.json();
      const perfData = await perfRes.json();
      const leaveData = await leaveRes.json();

      setProfile({
        staff: certData.certifications?.staff || {},
        certifications: certData.certifications,
        complianceScore: certData.complianceScore,
        skills: skillsData.skills || [],
        recentPerformance: perfData.currentKPI,
        kpis: perfData.kpis || [],
        leaveBalance: leaveData.balance
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6">Staff member not found</div>;
  }

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-2"
        >
          ← Back
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{profile.staff.name}</h1>
            <p className="text-gray-600">{profile.staff.role} • {profile.staff.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/admin/dashboard/staff/${params.id}/certifications`)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Edit Certifications
            </button>
            <button
              onClick={() => router.push(`/admin/dashboard/staff/${params.id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Compliance Score</div>
          <div className={`text-3xl font-bold ${getComplianceColor(profile.complianceScore?.overall || 0)}`}>
            {profile.complianceScore?.overall || 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {profile.complianceScore?.status?.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Skills</div>
          <div className="text-3xl font-bold text-blue-600">
            {profile.skills.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {profile.skills.filter(s => s.proficiencyLevel === 'EXPERT' || s.proficiencyLevel === 'TRAINER').length} expert level
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">This Month</div>
          <div className="text-3xl font-bold text-green-600">
            {profile.recentPerformance?.hoursWorked?.toFixed(1) || 0}h
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {profile.recentPerformance?.daysWorked || 0} days worked
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Annual Leave</div>
          <div className="text-3xl font-bold text-purple-600">
            {profile.leaveBalance?.annualLeaveBalance?.toFixed(1) || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">days available</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b">
          <div className="flex">
            {['overview', 'skills', 'performance', 'certifications'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Compliance Issues */}
              {profile.complianceScore?.issues && profile.complianceScore.issues.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Compliance Issues</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {profile.complianceScore.issues.map((issue: string, i: number) => (
                      <li key={i} className="text-red-700 text-sm">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Performance */}
              {profile.recentPerformance && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Current Month Performance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-600">Days Worked</div>
                      <div className="text-2xl font-bold">{profile.recentPerformance.daysWorked}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-600">Hours Worked</div>
                      <div className="text-2xl font-bold">{profile.recentPerformance.hoursWorked?.toFixed(1)}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-600">Compliance</div>
                      <div className="text-2xl font-bold">{profile.recentPerformance.complianceScore}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* KPI Trend */}
              {profile.kpis && profile.kpis.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Performance Trend (Last 6 Months)</h3>
                  <div className="space-y-2">
                    {profile.kpis.slice(0, 6).map((kpi: any) => (
                      <div key={kpi.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="font-medium">
                          {format(new Date(kpi.month), 'MMMM yyyy')}
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span>{kpi.hoursWorked.toFixed(1)}h</span>
                          <span>{kpi.daysWorked} days</span>
                          <span className={getComplianceColor(kpi.complianceScore)}>
                            {kpi.complianceScore}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Skills & Competencies</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  + Add Skill
                </button>
              </div>

              {profile.skills.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No skills recorded yet
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    profile.skills.reduce((acc: any, skill: any) => {
                      if (!acc[skill.skillCategory]) acc[skill.skillCategory] = [];
                      acc[skill.skillCategory].push(skill);
                      return acc;
                    }, {})
                  ).map(([category, skills]: [string, any]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">{category.replace(/_/g, ' ')}</h4>
                      <div className="space-y-2">
                        {skills.map((skill: any) => (
                          <div key={skill.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium">{skill.skillName}</div>
                              {skill.linkedCertification && (
                                <div className="text-xs text-gray-600">
                                  Certified: {skill.linkedCertification}
                                </div>
                              )}
                            </div>
                            <div className={`px-3 py-1 rounded text-sm font-medium ${
                              skill.proficiencyLevel === 'EXPERT' || skill.proficiencyLevel === 'TRAINER'
                                ? 'bg-green-100 text-green-800'
                                : skill.proficiencyLevel === 'ADVANCED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {skill.proficiencyLevel}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Performance History</h3>
              <div className="text-center py-8 text-gray-500">
                Performance reviews will be displayed here
              </div>
            </div>
          )}

          {activeTab === 'certifications' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Certifications</h3>
                <button
                  onClick={() => router.push(`/admin/dashboard/staff/${params.id}/certifications`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Manage Certifications
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* CEC */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">CEC Accreditation</h4>
                  {profile.certifications?.cecAccreditationNumber ? (
                    <div>
                      <div className="text-sm text-gray-600">
                        {profile.certifications.cecAccreditationNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        Expires: {format(new Date(profile.certifications.cecExpiryDate), 'dd MMM yyyy')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Not recorded</div>
                  )}
                </div>

                {/* License */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Electrical License</h4>
                  {profile.certifications?.electricalLicenseNumber ? (
                    <div>
                      <div className="text-sm text-gray-600">
                        {profile.certifications.electricalLicenseNumber} ({profile.certifications.electricalLicenseState})
                      </div>
                      <div className="text-sm text-gray-600">
                        Expires: {format(new Date(profile.certifications.licenseExpiryDate), 'dd MMM yyyy')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Not recorded</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
