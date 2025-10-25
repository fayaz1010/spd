'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Skill {
  id: string;
  skillCategory: string;
  skillName: string;
  proficiencyLevel: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  lastTrainingDate: string | null;
  nextTrainingDate: string | null;
  notes: string | null;
}

export default function StaffSkillsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    skillCategory: 'SOLAR_INSTALLATION',
    skillName: '',
    proficiencyLevel: 'BEGINNER',
    notes: ''
  });

  useEffect(() => {
    fetchStaffSkills();
  }, [params.id]);

  async function fetchStaffSkills() {
    try {
      const [staffRes, skillsRes] = await Promise.all([
        fetch(`/api/admin/staff/${params.id}`),
        fetch(`/api/admin/staff/${params.id}/skills`)
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.staff);
      }

      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setSkills(skillsData.skills || []);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSkill() {
    try {
      const response = await fetch(`/api/admin/staff/${params.id}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('✓ Skill added successfully!');
        setShowAddModal(false);
        fetchStaffSkills();
        setFormData({
          skillCategory: 'SOLAR_INSTALLATION',
          skillName: '',
          proficiencyLevel: 'BEGINNER',
          notes: ''
        });
      } else {
        alert('Failed to add skill');
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Failed to add skill');
    }
  }

  async function handleDeleteSkill(skillId: string) {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      const response = await fetch(`/api/admin/staff/${params.id}/skills/${skillId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('✓ Skill deleted successfully!');
        fetchStaffSkills();
      } else {
        alert('Failed to delete skill');
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Failed to delete skill');
    }
  }

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-gray-100 text-gray-800';
      case 'INTERMEDIATE': return 'bg-blue-100 text-blue-800';
      case 'ADVANCED': return 'bg-green-100 text-green-800';
      case 'EXPERT': return 'bg-purple-100 text-purple-800';
      case 'TRAINER': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ELECTRICAL_WORK: 'bg-yellow-100 text-yellow-800',
      SOLAR_INSTALLATION: 'bg-orange-100 text-orange-800',
      BATTERY_INSTALLATION: 'bg-green-100 text-green-800',
      ROOF_WORK: 'bg-red-100 text-red-800',
      CUSTOMER_SERVICE: 'bg-blue-100 text-blue-800',
      SAFETY: 'bg-red-100 text-red-800',
      TECHNICAL: 'bg-purple-100 text-purple-800',
      MANAGEMENT: 'bg-indigo-100 text-indigo-800',
      DESIGN: 'bg-pink-100 text-pink-800',
      COMMISSIONING: 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

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
        <button
          onClick={() => router.push(`/admin/dashboard/staff/${params.id}`)}
          className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
        >
          ← Back to Profile
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Skills Management</h1>
        {staff && (
          <p className="text-gray-600">{staff.name} - {staff.role}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Skills</div>
          <div className="text-3xl font-bold text-blue-600">{skills.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Expert Level</div>
          <div className="text-3xl font-bold text-purple-600">
            {skills.filter(s => s.proficiencyLevel === 'EXPERT' || s.proficiencyLevel === 'TRAINER').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Verified</div>
          <div className="text-3xl font-bold text-green-600">
            {skills.filter(s => s.verifiedBy).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Training Due</div>
          <div className="text-3xl font-bold text-orange-600">
            {skills.filter(s => s.nextTrainingDate && new Date(s.nextTrainingDate) < new Date()).length}
          </div>
        </div>
      </div>

      {/* Add Skill Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Skill
        </button>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-2 gap-4">
        {skills.length === 0 ? (
          <div className="col-span-2 bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">No skills recorded</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Add first skill →
            </button>
          </div>
        ) : (
          skills.map((skill) => (
            <div key={skill.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(skill.skillCategory)}`}>
                      {skill.skillCategory.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getProficiencyColor(skill.proficiencyLevel)}`}>
                      {skill.proficiencyLevel}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-800 mb-1">
                    {skill.skillName}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {skill.verifiedBy && (
                <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verified by {skill.verifiedBy}
                </div>
              )}

              {skill.lastTrainingDate && (
                <div className="text-sm text-gray-600 mb-1">
                  <strong>Last Training:</strong> {new Date(skill.lastTrainingDate).toLocaleDateString()}
                </div>
              )}

              {skill.nextTrainingDate && (
                <div className={`text-sm mb-1 ${
                  new Date(skill.nextTrainingDate) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-600'
                }`}>
                  <strong>Next Training:</strong> {new Date(skill.nextTrainingDate).toLocaleDateString()}
                </div>
              )}

              {skill.notes && (
                <div className="text-sm text-gray-600 mt-2 pt-2 border-t">
                  {skill.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Add New Skill</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Category
                </label>
                <select
                  value={formData.skillCategory}
                  onChange={(e) => setFormData({ ...formData, skillCategory: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="ELECTRICAL_WORK">Electrical Work</option>
                  <option value="SOLAR_INSTALLATION">Solar Installation</option>
                  <option value="BATTERY_INSTALLATION">Battery Installation</option>
                  <option value="ROOF_WORK">Roof Work</option>
                  <option value="CUSTOMER_SERVICE">Customer Service</option>
                  <option value="SAFETY">Safety</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="MANAGEMENT">Management</option>
                  <option value="DESIGN">Design</option>
                  <option value="COMMISSIONING">Commissioning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={formData.skillName}
                  onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
                  placeholder="e.g., Panel Installation, Inverter Configuration"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proficiency Level
                </label>
                <select
                  value={formData.proficiencyLevel}
                  onChange={(e) => setFormData({ ...formData, proficiencyLevel: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                  <option value="TRAINER">Trainer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional information about this skill..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSkill}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Add Skill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
