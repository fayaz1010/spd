'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Zap,
  Plus,
  Edit,
  Trash2,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  delay: number;
  enabled: boolean;
  conditions: any;
  createdAt: string;
}

export default function AutomationRules() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    executedToday: 0,
  });

  useEffect(() => {
    fetchRules();
    fetchStats();
  }, []);

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/automation/rules', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/automation/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/crm/automation/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setRules(rules.map(r => r.id === ruleId ? { ...r, enabled } : r));
        toast({
          title: enabled ? 'Rule Enabled' : 'Rule Disabled',
          description: `Automation rule has been ${enabled ? 'enabled' : 'disabled'}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update rule',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/crm/automation/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setRules(rules.filter(r => r.id !== ruleId));
        toast({
          title: 'Rule Deleted',
          description: 'Automation rule has been deleted',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete rule',
        variant: 'destructive',
      });
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'LEAD_CREATED':
        return <Plus className="h-4 w-4" />;
      case 'NO_CONTACT_24H':
      case 'NO_CONTACT_3D':
      case 'NO_CONTACT_7D':
        return <Clock className="h-4 w-4" />;
      case 'QUOTE_SENT':
        return <Mail className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'SEND_EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'SEND_SMS':
        return <MessageSquare className="h-4 w-4" />;
      case 'CREATE_TASK':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const formatTrigger = (trigger: string) => {
    return trigger.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading automation rules...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Automation Rules</h1>
                <p className="text-xs text-gray-500">Automate follow-ups and workflows</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-500 rounded-full p-3">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Rules</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRules}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-500 rounded-full p-3">
                <Play className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Active Rules</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activeRules}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-purple-500 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Executed Today</p>
            <p className="text-3xl font-bold text-gray-900">{stats.executedToday}</p>
          </Card>
        </div>

        {/* Rules List */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Automation Rules</h2>
          
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No Automation Rules</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create your first automation rule to streamline your workflow
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`rounded-full p-3 ${
                      rule.enabled ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {getTriggerIcon(rule.trigger)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{rule.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          {getTriggerIcon(rule.trigger)}
                          {formatTrigger(rule.trigger)}
                        </span>
                        <span>→</span>
                        {rule.delay > 0 && (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>Wait {rule.delay}h</span>
                            <span>→</span>
                          </>
                        )}
                        <span className="flex items-center gap-1">
                          {getActionIcon(rule.action)}
                          {formatAction(rule.action)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    />
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pre-built Templates */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Welcome Email</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Send welcome email immediately when new lead is created
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange-600 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">24h Follow-up</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Send follow-up email if no contact made within 24 hours
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Quote Reminder</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Send SMS reminder 3 days after quote sent
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Task Assignment</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Create follow-up task 7 days after last contact
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
