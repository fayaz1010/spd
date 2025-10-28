'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Shield,
  Megaphone,
  HelpCircle,
  Tag,
  ExternalLink,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface EmailGroup {
  category: string;
  total: number;
  unread: number;
  pendingApprovals: number;
  subCategories: { name: string; count: number }[];
  approvalBreakdown: { status: string; count: number }[];
  recentEmails: any[];
}

interface ExternalSystem {
  system: string;
  total: number;
  emails: any[];
}

export default function EmailGroupsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<EmailGroup[]>([]);
  const [externalSystems, setExternalSystems] = useState<ExternalSystem[]>([]);
  const [approvalSummary, setApprovalSummary] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/communications/email/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.categoryStats || []);
        setExternalSystems(data.externalSystemStats || []);
        setApprovalSummary(data.approvalSummary || []);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch email groups',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (emailId: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/communications/email/${emailId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Email ${action}d successfully`
        });
        fetchGroups();
      }
    } catch (error) {
      console.error('Failed to update approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to update approval status',
        variant: 'destructive'
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rebate': return FileText;
      case 'approval': return Shield;
      case 'marketing': return Megaphone;
      case 'support': return HelpCircle;
      case 'quote': return TrendingUp;
      case 'lead': return Tag;
      default: return Mail;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'rebate': return 'blue';
      case 'approval': return 'orange';
      case 'marketing': return 'purple';
      case 'support': return 'green';
      case 'quote': return 'indigo';
      case 'lead': return 'pink';
      default: return 'gray';
    }
  };

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading email groups...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard/communications/email">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Inbox
                </Button>
              </Link>
              <div className="flex items-center">
                <Tag className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Email Groups & Categories</h1>
                  <p className="text-xs text-gray-500">Organized by category with approval tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Approval Summary */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Approval Summary</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {approvalSummary.map((item, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{item.status || 'Unknown'}</p>
                    <p className="text-2xl font-bold">{item.count}</p>
                  </div>
                  {item.status === 'approved' && <CheckCircle className="h-8 w-8 text-green-500" />}
                  {item.status === 'rejected' && <XCircle className="h-8 w-8 text-red-500" />}
                  {item.status === 'pending' && <Clock className="h-8 w-8 text-orange-500" />}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Category Groups */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Email Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => {
              const Icon = getCategoryIcon(group.category);
              const color = getCategoryColor(group.category);
              
              return (
                <Card key={group.category} className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`bg-${color}-500 rounded-lg h-12 w-12 flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">{group.category}</h3>
                        <p className="text-sm text-gray-600">{group.total} emails</p>
                      </div>
                    </div>
                    {group.unread > 0 && (
                      <Badge variant="destructive">{group.unread} unread</Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    {group.pendingApprovals > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pending Approvals:</span>
                        <Badge variant="secondary">{group.pendingApprovals}</Badge>
                      </div>
                    )}
                  </div>

                  {/* SubCategories */}
                  {group.subCategories.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Sub-categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {group.subCategories.slice(0, 3).map((sub, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {sub.name} ({sub.count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Emails */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Recent:</p>
                    <div className="space-y-2">
                      {group.recentEmails.slice(0, 3).map((email) => (
                        <div key={email.id} className="text-xs p-2 bg-gray-50 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium truncate flex-1">{email.subject}</span>
                            {email.requiresApproval && getApprovalStatusBadge(email.approvalStatus)}
                          </div>
                          <p className="text-gray-500 truncate">{email.from}</p>
                          {email.requiresApproval && email.approvalStatus === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={() => handleApproval(email.id, 'approve')}
                              >
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={() => handleApproval(email.id, 'reject')}
                              >
                                <ThumbsDown className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => router.push(`/admin/dashboard/communications/email?category=${group.category}`)}
                  >
                    View All
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* External Systems */}
        {externalSystems.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">External Systems</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {externalSystems.map((system) => (
                <Card key={system.system} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">{system.system}</h3>
                        <p className="text-sm text-gray-600">{system.total} emails</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {system.emails.slice(0, 5).map((email) => (
                      <div key={email.id} className="text-sm p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate flex-1">{email.subject}</span>
                          {email.externalId && (
                            <Badge variant="outline" className="text-xs">
                              ID: {email.externalId}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs truncate">{email.from}</p>
                        <div className="flex gap-2 mt-1">
                          {email.category && (
                            <Badge variant="secondary" className="text-xs">{email.category}</Badge>
                          )}
                          {email.requiresApproval && getApprovalStatusBadge(email.approvalStatus)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => router.push(`/admin/dashboard/communications/email?system=${system.system}`)}
                  >
                    View All {system.system} Emails
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
