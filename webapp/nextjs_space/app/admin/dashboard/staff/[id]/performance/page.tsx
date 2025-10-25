'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface PerformanceReview {
  id: string;
  reviewType: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  reviewedBy: string;
  reviewDate: string;
  technicalSkills: number | null;
  safetyCompliance: number | null;
  qualityOfWork: number | null;
  productivity: number | null;
  customerService: number | null;
  teamwork: number | null;
  communication: number | null;
  reliability: number | null;
  overallRating: number | null;
  jobsCompleted: number | null;
  averageJobTime: number | null;
  customerRating: number | null;
  safetyIncidents: number | null;
  complianceScore: number | null;
  strengths: string | null;
  areasForImprovement: string | null;
  goals: string | null;
  trainingNeeds: string | null;
  salaryIncrease: number | null;
  newSalary: number | null;
  status: string;
}

export default function StaffPerformancePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    reviewType: 'QUARTERLY',
    reviewPeriodStart: format(new Date(), 'yyyy-MM-dd'),
    reviewPeriodEnd: format(new Date(), 'yyyy-MM-dd'),
    reviewedBy: '',
    technicalSkills: 3,
    safetyCompliance: 3,
    qualityOfWork: 3,
    productivity: 3,
    customerService: 3,
    teamwork: 3,
    communication: 3,
    reliability: 3,
    strengths: '',
    areasForImprovement: '',
    goals: '',
    trainingNeeds: ''
  });

  useEffect(() => {
    fetchPerformanceReviews();
  }, [params.id]);

  async function fetchPerformanceReviews() {
    try {
      const [staffRes, reviewsRes] = await Promise.all([
        fetch(`/api/admin/staff/${params.id}`),
        fetch(`/api/admin/staff/${params.id}/performance`)
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.staff);
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddReview() {
    try {
      const overallRating = (
        formData.technicalSkills +
        formData.safetyCompliance +
        formData.qualityOfWork +
        formData.productivity +
        formData.customerService +
        formData.teamwork +
        formData.communication +
        formData.reliability
      ) / 8;

      const response = await fetch(`/api/admin/staff/${params.id}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          overallRating,
          reviewDate: new Date().toISOString(),
          status: 'COMPLETED'
        })
      });

      if (response.ok) {
        alert('✓ Performance review added successfully!');
        setShowAddModal(false);
        fetchPerformanceReviews();
      } else {
        alert('Failed to add review');
      }
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Failed to add review');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PENDING_STAFF_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ARCHIVED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
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
        <h1 className="text-3xl font-bold text-gray-800">Performance Reviews</h1>
        {staff && (
          <p className="text-gray-600">{staff.name} - {staff.role}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Reviews</div>
          <div className="text-3xl font-bold text-blue-600">{reviews.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Latest Rating</div>
          <div className={`text-3xl font-bold ${reviews.length > 0 ? getRatingColor(reviews[0]?.overallRating || 0) : 'text-gray-400'}`}>
            {reviews.length > 0 ? (reviews[0]?.overallRating?.toFixed(1) || 'N/A') : 'N/A'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Average Rating</div>
          <div className={`text-3xl font-bold ${reviews.length > 0 ? getRatingColor(reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length) : 'text-gray-400'}`}>
            {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length).toFixed(1) : 'N/A'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Last Review</div>
          <div className="text-lg font-bold text-gray-800">
            {reviews.length > 0 ? format(new Date(reviews[0].reviewDate), 'MMM yyyy') : 'Never'}
          </div>
        </div>
      </div>

      {/* Add Review Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Performance Review
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">No performance reviews</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Add first review →
            </button>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded text-sm font-semibold bg-blue-100 text-blue-800">
                      {review.reviewType.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(review.status)}`}>
                      {review.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {format(new Date(review.reviewPeriodStart), 'MMM yyyy')} - {format(new Date(review.reviewPeriodEnd), 'MMM yyyy')}
                  </div>
                  <div className="text-sm text-gray-600">
                    Reviewed by {review.reviewedBy} on {format(new Date(review.reviewDate), 'dd MMM yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${getRatingColor(review.overallRating || 0)}`}>
                    {review.overallRating?.toFixed(1)}
                  </div>
                  {renderStars(Math.round(review.overallRating || 0))}
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                {review.technicalSkills && (
                  <div className="text-sm">
                    <div className="text-gray-600">Technical Skills</div>
                    <div className="font-semibold">{review.technicalSkills}/5</div>
                  </div>
                )}
                {review.safetyCompliance && (
                  <div className="text-sm">
                    <div className="text-gray-600">Safety</div>
                    <div className="font-semibold">{review.safetyCompliance}/5</div>
                  </div>
                )}
                {review.qualityOfWork && (
                  <div className="text-sm">
                    <div className="text-gray-600">Quality</div>
                    <div className="font-semibold">{review.qualityOfWork}/5</div>
                  </div>
                )}
                {review.productivity && (
                  <div className="text-sm">
                    <div className="text-gray-600">Productivity</div>
                    <div className="font-semibold">{review.productivity}/5</div>
                  </div>
                )}
                {review.customerService && (
                  <div className="text-sm">
                    <div className="text-gray-600">Customer Service</div>
                    <div className="font-semibold">{review.customerService}/5</div>
                  </div>
                )}
                {review.teamwork && (
                  <div className="text-sm">
                    <div className="text-gray-600">Teamwork</div>
                    <div className="font-semibold">{review.teamwork}/5</div>
                  </div>
                )}
                {review.communication && (
                  <div className="text-sm">
                    <div className="text-gray-600">Communication</div>
                    <div className="font-semibold">{review.communication}/5</div>
                  </div>
                )}
                {review.reliability && (
                  <div className="text-sm">
                    <div className="text-gray-600">Reliability</div>
                    <div className="font-semibold">{review.reliability}/5</div>
                  </div>
                )}
              </div>

              {/* KPIs */}
              {(review.jobsCompleted || review.customerRating || review.safetyIncidents !== null) && (
                <div className="grid grid-cols-4 gap-4 mb-4 pt-4 border-t">
                  {review.jobsCompleted && (
                    <div className="text-sm">
                      <div className="text-gray-600">Jobs Completed</div>
                      <div className="font-semibold">{review.jobsCompleted}</div>
                    </div>
                  )}
                  {review.customerRating && (
                    <div className="text-sm">
                      <div className="text-gray-600">Customer Rating</div>
                      <div className="font-semibold">{review.customerRating.toFixed(1)}/5</div>
                    </div>
                  )}
                  {review.safetyIncidents !== null && (
                    <div className="text-sm">
                      <div className="text-gray-600">Safety Incidents</div>
                      <div className={`font-semibold ${review.safetyIncidents === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {review.safetyIncidents}
                      </div>
                    </div>
                  )}
                  {review.complianceScore && (
                    <div className="text-sm">
                      <div className="text-gray-600">Compliance Score</div>
                      <div className="font-semibold">{review.complianceScore.toFixed(0)}%</div>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback */}
              <div className="space-y-3 pt-4 border-t">
                {review.strengths && (
                  <div>
                    <div className="text-sm font-semibold text-green-800 mb-1">Strengths:</div>
                    <div className="text-sm text-gray-700">{review.strengths}</div>
                  </div>
                )}
                {review.areasForImprovement && (
                  <div>
                    <div className="text-sm font-semibold text-orange-800 mb-1">Areas for Improvement:</div>
                    <div className="text-sm text-gray-700">{review.areasForImprovement}</div>
                  </div>
                )}
                {review.goals && (
                  <div>
                    <div className="text-sm font-semibold text-blue-800 mb-1">Goals:</div>
                    <div className="text-sm text-gray-700">{review.goals}</div>
                  </div>
                )}
                {review.trainingNeeds && (
                  <div>
                    <div className="text-sm font-semibold text-purple-800 mb-1">Training Needs:</div>
                    <div className="text-sm text-gray-700">{review.trainingNeeds}</div>
                  </div>
                )}
              </div>

              {/* Salary Review */}
              {review.salaryIncrease && (
                <div className="mt-4 pt-4 border-t bg-green-50 -mx-6 -mb-6 p-4 rounded-b-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">
                      Salary Increase: ${review.salaryIncrease.toLocaleString()} → New Salary: ${review.newSalary?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Add Performance Review</h3>
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

            <div className="p-6 space-y-6">
              {/* Review Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Type
                  </label>
                  <select
                    value={formData.reviewType}
                    onChange={(e) => setFormData({ ...formData, reviewType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="PROBATION">Probation</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="AD_HOC">Ad Hoc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reviewed By
                  </label>
                  <input
                    type="text"
                    value={formData.reviewedBy}
                    onChange={(e) => setFormData({ ...formData, reviewedBy: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period Start
                  </label>
                  <input
                    type="date"
                    value={formData.reviewPeriodStart}
                    onChange={(e) => setFormData({ ...formData, reviewPeriodStart: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period End
                  </label>
                  <input
                    type="date"
                    value={formData.reviewPeriodEnd}
                    onChange={(e) => setFormData({ ...formData, reviewPeriodEnd: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Ratings */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Performance Ratings (1-5)</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'technicalSkills', label: 'Technical Skills' },
                    { key: 'safetyCompliance', label: 'Safety Compliance' },
                    { key: 'qualityOfWork', label: 'Quality of Work' },
                    { key: 'productivity', label: 'Productivity' },
                    { key: 'customerService', label: 'Customer Service' },
                    { key: 'teamwork', label: 'Teamwork' },
                    { key: 'communication', label: 'Communication' },
                    { key: 'reliability', label: 'Reliability' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={formData[key as keyof typeof formData] as number}
                        onChange={(e) => setFormData({ ...formData, [key]: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strengths
                  </label>
                  <textarea
                    value={formData.strengths}
                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                    rows={3}
                    placeholder="What are this person's key strengths?"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas for Improvement
                  </label>
                  <textarea
                    value={formData.areasForImprovement}
                    onChange={(e) => setFormData({ ...formData, areasForImprovement: e.target.value })}
                    rows={3}
                    placeholder="What areas need improvement?"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goals for Next Period
                  </label>
                  <textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    rows={3}
                    placeholder="What goals should be set?"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Training Needs
                  </label>
                  <textarea
                    value={formData.trainingNeeds}
                    onChange={(e) => setFormData({ ...formData, trainingNeeds: e.target.value })}
                    rows={3}
                    placeholder="What training is recommended?"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
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
                onClick={handleAddReview}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Add Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
