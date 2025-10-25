'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface PerformanceReview {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  overallRating: number;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  nextReviewDate: string | null;
}

export default function PerformanceDashboardPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceReviews();
  }, []);

  async function fetchPerformanceReviews() {
    try {
      const response = await fetch('/api/admin/performance/reviews');
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Satisfactory';
    if (rating >= 1.5) return 'Needs Improvement';
    return 'Poor';
  };

  const filteredReviews = reviews.filter(review => {
    if (filterStatus !== 'all' && review.status !== filterStatus) return false;
    if (filterRating !== 'all') {
      const ratingRange = filterRating.split('-');
      const min = parseFloat(ratingRange[0]);
      const max = parseFloat(ratingRange[1]);
      if (review.overallRating < min || review.overallRating > max) return false;
    }
    return true;
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
    : 0;

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
            <h1 className="text-3xl font-bold text-gray-800">Performance Dashboard</h1>
            <p className="text-gray-600">Overview of staff performance reviews and ratings</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/dashboard/staff')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Review
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Reviews</div>
          <div className="text-3xl font-bold text-blue-600">{reviews.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-600">
            {reviews.filter(r => r.status === 'COMPLETED').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-600">
            {reviews.filter(r => r.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Average Rating</div>
          <div className={`text-3xl font-bold ${getRatingColor(averageRating)}`}>
            {averageRating.toFixed(1)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Top Performers</div>
          <div className="text-3xl font-bold text-purple-600">
            {reviews.filter(r => r.overallRating >= 4.5).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="OVERDUE">Overdue</option>
        </select>

        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Ratings</option>
          <option value="4.5-5">Excellent (4.5-5.0)</option>
          <option value="3.5-4.5">Good (3.5-4.5)</option>
          <option value="2.5-3.5">Satisfactory (2.5-3.5)</option>
          <option value="0-2.5">Needs Improvement (&lt;2.5)</option>
        </select>

        <div className="text-sm text-gray-600">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </div>
      </div>

      {/* Performance Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff Member</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Review Period</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Rating</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reviewed By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Next Review</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No performance reviews found
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">{review.staffName}</div>
                      <div className="text-sm text-gray-600">{review.role}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        {format(new Date(review.reviewPeriodStart), 'dd MMM yyyy')} - {format(new Date(review.reviewPeriodEnd), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className={`text-2xl font-bold ${getRatingColor(review.overallRating)}`}>
                        {review.overallRating.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {getRatingLabel(review.overallRating)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(review.status)}`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">
                        {review.reviewedBy || '-'}
                      </div>
                      {review.reviewedAt && (
                        <div className="text-xs text-gray-500">
                          {format(new Date(review.reviewedAt), 'dd MMM yyyy')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">
                        {review.nextReviewDate ? format(new Date(review.nextReviewDate), 'dd MMM yyyy') : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => router.push(`/admin/dashboard/staff/${review.staffId}/performance`)}
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

      {/* Performance Trends */}
      <div className="grid grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[
              { label: 'Excellent (4.5-5.0)', min: 4.5, max: 5, color: 'bg-green-500' },
              { label: 'Good (3.5-4.5)', min: 3.5, max: 4.5, color: 'bg-blue-500' },
              { label: 'Satisfactory (2.5-3.5)', min: 2.5, max: 3.5, color: 'bg-yellow-500' },
              { label: 'Needs Improvement (<2.5)', min: 0, max: 2.5, color: 'bg-red-500' }
            ].map(range => {
              const count = reviews.filter(r => r.overallRating >= range.min && r.overallRating < range.max).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

              return (
                <div key={range.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{range.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${range.color} h-2 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Performers</h3>
          <div className="space-y-3">
            {reviews
              .filter(r => r.status === 'COMPLETED')
              .sort((a, b) => b.overallRating - a.overallRating)
              .slice(0, 5)
              .map((review, idx) => (
                <div key={review.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">#{idx + 1}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{review.staffName}</div>
                      <div className="text-xs text-gray-600">{review.role}</div>
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${getRatingColor(review.overallRating)}`}>
                    {review.overallRating.toFixed(1)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
