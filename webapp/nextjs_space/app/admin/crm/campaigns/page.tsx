'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Mail,
  MessageSquare,
  Clock,
  Users,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface CampaignStep {
  id: string;
  order: number;
  delay: number; // hours
  action: 'EMAIL' | 'SMS';
  templateId: string;
  templateName?: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: string;
  steps: CampaignStep[];
  enrolledCount: number;
  completedCount: number;
  createdAt: string;
}

export default function DripCampaigns() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTrigger, setFormTrigger] = useState('LEAD_CREATED');
  const [formSteps, setFormSteps] = useState<CampaignStep[]>([]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCampaign(null);
    setFormName('');
    setFormDescription('');
    setFormTrigger('LEAD_CREATED');
    setFormSteps([]);
    setShowCreateModal(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormName(campaign.name);
    setFormDescription(campaign.description);
    setFormTrigger(campaign.trigger);
    setFormSteps(campaign.steps);
    setShowCreateModal(true);
  };

  const handleAddStep = () => {
    const newStep: CampaignStep = {
      id: `temp-${Date.now()}`,
      order: formSteps.length + 1,
      delay: 24,
      action: 'EMAIL',
      templateId: '',
    };
    setFormSteps([...formSteps, newStep]);
  };

  const handleUpdateStep = (index: number, field: string, value: any) => {
    const updated = [...formSteps];
    updated[index] = { ...updated[index], [field]: value };
    setFormSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    setFormSteps(formSteps.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formName || formSteps.length === 0) {
      toast({
        title: 'Missing Fields',
        description: 'Please provide name and at least one step',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const url = editingCampaign
        ? `/api/crm/campaigns/${editingCampaign.id}`
        : '/api/crm/campaigns';
      
      const response = await fetch(url, {
        method: editingCampaign ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          trigger: formTrigger,
          steps: formSteps,
        }),
      });

      if (response.ok) {
        toast({
          title: editingCampaign ? 'Campaign Updated' : 'Campaign Created',
          description: 'Drip campaign saved successfully',
        });
        setShowCreateModal(false);
        fetchCampaigns();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save campaign',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/crm/campaigns/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setCampaigns(campaigns.map(c => c.id === id ? { ...c, enabled } : c));
        toast({
          title: enabled ? 'Campaign Activated' : 'Campaign Paused',
          description: `Campaign has been ${enabled ? 'activated' : 'paused'}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/crm/campaigns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({
          title: 'Campaign Deleted',
          description: 'Campaign removed successfully',
        });
        fetchCampaigns();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };

  const formatDelay = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading campaigns...</p>
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
              <Link href="/admin/crm/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Drip Campaigns</h1>
                <p className="text-xs text-gray-500">{campaigns.length} campaigns</p>
              </div>
            </div>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {campaigns.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No Drip Campaigns</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create automated email sequences to nurture leads
            </p>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create First Campaign
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        campaign.enabled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.enabled ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {campaign.enrolledCount || 0} enrolled
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {campaign.completedCount || 0} completed
                      </span>
                      <span>{campaign.steps.length} steps</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={campaign.enabled}
                      onCheckedChange={(checked) => handleToggle(campaign.id, checked)}
                    />
                    <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(campaign.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Campaign Steps Visualization */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <div className="flex-shrink-0 px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                    Trigger: {campaign.trigger.replace(/_/g, ' ')}
                  </div>
                  {campaign.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-md">
                        <div className="flex items-center gap-2 text-sm">
                          {step.action === 'EMAIL' ? (
                            <Mail className="h-4 w-4 text-blue-600" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                          )}
                          <span className="font-medium">{step.action}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3" />
                          Wait {formatDelay(step.delay)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCampaign ? 'Edit Campaign' : 'Create Drip Campaign'}
            </h2>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="New Lead Nurture"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="trigger">Trigger *</Label>
                  <select
                    id="trigger"
                    value={formTrigger}
                    onChange={(e) => setFormTrigger(e.target.value)}
                    className="w-full mt-2 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="LEAD_CREATED">New Lead Created</option>
                    <option value="QUOTE_SENT">Quote Sent</option>
                    <option value="NO_RESPONSE">No Response After Quote</option>
                    <option value="DEAL_WON">Deal Won</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Automated follow-up sequence for new leads"
                  className="mt-2"
                />
              </div>

              {/* Campaign Steps */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Campaign Steps ({formSteps.length})</Label>
                  <Button onClick={handleAddStep} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>

                <div className="space-y-3">
                  {formSteps.map((step, index) => (
                    <div key={step.id} className="p-4 border border-gray-300 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">Step {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStep(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label>Action</Label>
                          <select
                            value={step.action}
                            onChange={(e) => handleUpdateStep(index, 'action', e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="EMAIL">Send Email</option>
                            <option value="SMS">Send SMS</option>
                          </select>
                        </div>
                        <div>
                          <Label>Delay (hours)</Label>
                          <Input
                            type="number"
                            value={step.delay}
                            onChange={(e) => handleUpdateStep(index, 'delay', parseInt(e.target.value))}
                            min="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Template</Label>
                          <select
                            value={step.templateId}
                            onChange={(e) => handleUpdateStep(index, 'templateId', e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Select template...</option>
                            {/* Templates will be loaded dynamically */}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  {formSteps.length === 0 && (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-sm">No steps added yet</p>
                      <p className="text-xs mt-1">Click "Add Step" to create your sequence</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
