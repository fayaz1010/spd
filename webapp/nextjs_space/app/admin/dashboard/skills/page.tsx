'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StaffSkill {
  staffId: string;
  staffName: string;
  role: string;
  skills: {
    skillName: string;
    skillCategory: string;
    proficiencyLevel: string;
    verifiedAt: string | null;
  }[];
}

export default function SkillsMatrixPage() {
  const router = useRouter();
  const [staffSkills, setStaffSkills] = useState<StaffSkill[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkillsMatrix();
  }, []);

  async function fetchSkillsMatrix() {
    try {
      const response = await fetch('/api/admin/skills/matrix');
      
      if (response.ok) {
        const data = await response.json();
        setStaffSkills(data.staffSkills || []);
      }
    } catch (error) {
      console.error('Error fetching skills matrix:', error);
    } finally {
      setLoading(false);
    }
  }

  const skillCategories = [
    'SOLAR_INSTALLATION',
    'ELECTRICAL',
    'ROOFING',
    'SAFETY',
    'CUSTOMER_SERVICE',
    'TECHNICAL',
    'MANAGEMENT'
  ];

  const proficiencyLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-gray-100 text-gray-800';
      case 'INTERMEDIATE': return 'bg-blue-100 text-blue-800';
      case 'ADVANCED': return 'bg-green-100 text-green-800';
      case 'EXPERT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStaff = staffSkills.filter(staff => {
    if (filterCategory !== 'all') {
      const hasCategory = staff.skills.some(s => s.skillCategory === filterCategory);
      if (!hasCategory) return false;
    }
    if (filterLevel !== 'all') {
      const hasLevel = staff.skills.some(s => s.proficiencyLevel === filterLevel);
      if (!hasLevel) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Skills Matrix</h1>
            <p className="text-gray-600">Overview of all staff skills and proficiency levels</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Staff</div>
          <div className="text-3xl font-bold text-blue-600">{staffSkills.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Skills</div>
          <div className="text-3xl font-bold text-green-600">
            {staffSkills.reduce((sum, s) => sum + s.skills.length, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Experts</div>
          <div className="text-3xl font-bold text-purple-600">
            {staffSkills.reduce((sum, s) => sum + s.skills.filter(sk => sk.proficiencyLevel === 'EXPERT').length, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Verified Skills</div>
          <div className="text-3xl font-bold text-orange-600">
            {staffSkills.reduce((sum, s) => sum + s.skills.filter(sk => sk.verifiedAt).length, 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Categories</option>
          {skillCategories.map(cat => (
            <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Levels</option>
          {proficiencyLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>

        <div className="text-sm text-gray-600">
          Showing {filteredStaff.length} of {staffSkills.length} staff
        </div>
      </div>

      {/* Skills Matrix */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff Member</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Total Skills</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Skills</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No staff found with selected filters
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.staffId} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">{staff.staffName}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">{staff.role}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                        {staff.skills.length}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {staff.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded text-xs font-semibold ${getProficiencyColor(skill.proficiencyLevel)}`}
                            title={`${skill.skillName} - ${skill.proficiencyLevel}`}
                          >
                            {skill.skillName}
                            {skill.verifiedAt && ' ✓'}
                          </span>
                        ))}
                        {staff.skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{staff.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => router.push(`/admin/dashboard/staff/${staff.staffId}/skills`)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Skills Gap Analysis */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Skills Gap Analysis</h3>
        <div className="grid grid-cols-3 gap-4">
          {skillCategories.map(category => {
            const categorySkills = staffSkills.flatMap(s => s.skills.filter(sk => sk.skillCategory === category));
            const expertCount = categorySkills.filter(s => s.proficiencyLevel === 'EXPERT').length;
            const totalCount = categorySkills.length;
            const percentage = totalCount > 0 ? (expertCount / totalCount) * 100 : 0;

            return (
              <div key={category} className="border rounded-lg p-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  {category.replace(/_/g, ' ')}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600">{percentage.toFixed(0)}%</div>
                </div>
                <div className="text-xs text-gray-600">
                  {expertCount} experts / {totalCount} total
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
