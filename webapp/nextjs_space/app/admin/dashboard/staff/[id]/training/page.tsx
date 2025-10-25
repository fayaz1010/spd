'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface TrainingRecord {
  id: string;
  trainingName: string;
  trainingType: string;
  provider: string | null;
  startDate: string;
  completionDate: string | null;
  status: string;
  passed: boolean | null;
  score: number | null;
  certificateUrl: string | null;
  cost: number | null;
  isMandatory: boolean;
  expiryDate: string | null;
  notes: string | null;
}

export default function StaffTrainingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [training, setTraining] = useState<TrainingRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    trainingName: '',
    trainingType: 'TECHNICAL',
    provider: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'SCHEDULED',
    isMandatory: false,
    cost: '',
    notes: ''
  });

  useEffect(() => {
    fetchTrainingRecords();
  }, [params.id]);

  async function fetchTrainingRecords() {
    try {
      const [staffRes, trainingRes] = await Promise.all([
        fetch(`/api/admin/staff/${params.id}`),
        fetch(`/api/admin/staff/${params.id}/training`)
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.staff);
      }

      if (trainingRes.ok) {
        const trainingData = await trainingRes.json();
        setTraining(trainingData.training || []);
      }
    } catch (error) {
      console.error('Error fetching training:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTraining() {
    try {
      const response = await fetch(`/api/admin/staff/${params.id}/training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cost: formData.cost ? parseFloat(formData.cost) : null
        })
      });

      if (response.ok) {
        alert('✓ Training record added successfully!');
        setShowAddModal(false);
        fetchTrainingRecords();
        setFormData({
          trainingName: '',
          trainingType: 'TECHNICAL',
          provider: '',
          startDate: format(new Date(), 'yyyy-MM-dd'),
          status: 'SCHEDULED',
          isMandatory: false,
          cost: '',
          notes: ''
        });
      } else {
        alert('Failed to add training record');
      }
    } catch (error) {
      console.error('Error adding training:', error);
      alert('Failed to add training record');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      INDUCTION: 'bg-purple-100 text-purple-800',
      SAFETY: 'bg-red-100 text-red-800',
      TECHNICAL: 'bg-blue-100 text-blue-800',
      COMPLIANCE: 'bg-green-100 text-green-800',
      SOFT_SKILLS: 'bg-pink-100 text-pink-800',
      LEADERSHIP: 'bg-indigo-100 text-indigo-800',
      PRODUCT_TRAINING: 'bg-orange-100 text-orange-800',
      CERTIFICATION_RENEWAL: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-800">Training Records</h1>
        {staff && (
          <p className="text-gray-600">{staff.name} - {staff.role}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Training</div>
          <div className="text-3xl font-bold text-blue-600">{training.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-600">
            {training.filter(t => t.status === 'COMPLETED').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">In Progress</div>
          <div className="text-3xl font-bold text-yellow-600">
            {training.filter(t => t.status === 'IN_PROGRESS' || t.status === 'SCHEDULED').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Cost</div>
          <div className="text-3xl font-bold text-orange-600">
            ${training.reduce((sum, t) => sum + (t.cost || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Add Training Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Training Record
        </button>
      </div>

      {/* Training List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Training History</h3>
        </div>

        {training.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">No training records</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Add first training record →
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {training.map((record) => (
              <div key={record.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(record.trainingType)}`}>
                        {record.trainingType.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                      {record.isMandatory && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                          MANDATORY
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-gray-800 mb-1">
                      {record.trainingName}
                    </div>
                    {record.provider && (
                      <div className="text-sm text-gray-600">
                        Provider: {record.provider}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <div className="text-gray-600">Start Date</div>
                    <div className="font-semibold">{format(new Date(record.startDate), 'dd MMM yyyy')}</div>
                  </div>
                  {record.completionDate && (
                    <div>
                      <div className="text-gray-600">Completed</div>
                      <div className="font-semibold">{format(new Date(record.completionDate), 'dd MMM yyyy')}</div>
                    </div>
                  )}
                  {record.score !== null && (
                    <div>
                      <div className="text-gray-600">Score</div>
                      <div className="font-semibold">{record.score}%</div>
                    </div>
                  )}
                  {record.cost && (
                    <div>
                      <div className="text-gray-600">Cost</div>
                      <div className="font-semibold">${record.cost.toLocaleString()}</div>
                    </div>
                  )}
                </div>

                {record.expiryDate && (
                  <div className={`text-sm mb-2 ${
                    new Date(record.expiryDate) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-600'
                  }`}>
                    <strong>Expires:</strong> {format(new Date(record.expiryDate), 'dd MMM yyyy')}
                  </div>
                )}

                {record.certificateUrl && (
                  <div className="mb-2">
                    <a
                      href={record.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Certificate
                    </a>
                  </div>
                )}

                {record.notes && (
                  <div className="text-sm text-gray-600 pt-2 border-t">
                    {record.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Training Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Add Training Record</h3>
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
                  Training Name
                </label>
                <input
                  type="text"
                  value={formData.trainingName}
                  onChange={(e) => setFormData({ ...formData, trainingName: e.target.value })}
                  placeholder="e.g., Solar Panel Installation Course"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Training Type
                  </label>
                  <select
                    value={formData.trainingType}
                    onChange={(e) => setFormData({ ...formData, trainingType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="INDUCTION">Induction</option>
                    <option value="SAFETY">Safety</option>
                    <option value="TECHNICAL">Technical</option>
                    <option value="COMPLIANCE">Compliance</option>
                    <option value="SOFT_SKILLS">Soft Skills</option>
                    <option value="LEADERSHIP">Leadership</option>
                    <option value="PRODUCT_TRAINING">Product Training</option>
                    <option value="CERTIFICATION_RENEWAL">Certification Renewal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider (Optional)
                </label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., Clean Energy Council"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isMandatory}
                    onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Mandatory Training</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional information..."
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
                onClick={handleAddTraining}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Add Training
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
