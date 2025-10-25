'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Calendar,
  Search,
  Filter,
  Plus,
  User,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Activity {
  id: string;
  type: string;
  description: string;
  performedBy: string;
  performedByName: string;
  createdAt: string;
  deal?: {
    id: string;
    customerName: string;
  };
  lead?: {
    id: string;
    name: string;
  };
}

export default function ActivitiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, filterType]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/activities', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.deal?.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.lead?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL_MADE':
      case 'CALL_RECEIVED':
        return <Phone className="h-4 w-4" />;
      case 'EMAIL_SENT':
      case 'EMAIL_RECEIVED':
        return <Mail className="h-4 w-4" />;
      case 'SMS_SENT':
      case 'SMS_RECEIVED':
        return <MessageSquare className="h-4 w-4" />;
      case 'NOTE_ADDED':
        return <FileText className="h-4 w-4" />;
      case 'MEETING_SCHEDULED':
      case 'MEETING_COMPLETED':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'CALL_MADE':
      case 'CALL_RECEIVED':
        return 'bg-blue-100 text-blue-600';
      case 'EMAIL_SENT':
      case 'EMAIL_RECEIVED':
        return 'bg-green-100 text-green-600';
      case 'SMS_SENT':
      case 'SMS_RECEIVED':
        return 'bg-purple-100 text-purple-600';
      case 'NOTE_ADDED':
        return 'bg-gray-100 text-gray-600';
      case 'MEETING_SCHEDULED':
      case 'MEETING_COMPLETED':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Activity Timeline</h1>
                <p className="text-xs text-gray-500">All customer communications and interactions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/crm/calls">
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Log Call
                </Button>
              </Link>
              <Link href="/admin/crm/email">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="sm:w-64">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Activities</option>
                <option value="CALL_MADE">Calls Made</option>
                <option value="CALL_RECEIVED">Calls Received</option>
                <option value="EMAIL_SENT">Emails Sent</option>
                <option value="EMAIL_RECEIVED">Emails Received</option>
                <option value="SMS_SENT">SMS Sent</option>
                <option value="SMS_RECEIVED">SMS Received</option>
                <option value="NOTE_ADDED">Notes</option>
                <option value="MEETING_SCHEDULED">Meetings</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>Showing {filteredActivities.length} of {activities.length} activities</span>
          </div>
        </Card>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-gray-100 rounded-full p-6">
                  <Clock className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">No Activities Found</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {searchTerm || filterType !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Start logging customer interactions'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Link href="/admin/crm/calls">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Log Call
                      </Button>
                    </Link>
                    <Link href="/admin/crm/email">
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            filteredActivities.map((activity) => (
              <Card key={activity.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`rounded-full p-3 ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {formatActivityType(activity.type)}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{activity.performedByName}</span>
                          </div>
                          {activity.deal && (
                            <Link
                              href={`/admin/crm/deals/${activity.deal.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              Deal: {activity.deal.customerName}
                            </Link>
                          )}
                          {activity.lead && (
                            <Link
                              href={`/admin/dashboard/leads/${activity.lead.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              Lead: {activity.lead.name}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredActivities.length > 0 && filteredActivities.length >= 50 && (
          <div className="text-center mt-6">
            <Button variant="outline">Load More Activities</Button>
          </div>
        )}
      </main>
    </div>
  );
}
