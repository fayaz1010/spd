'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar, Clock, Plus, Trash2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ScheduledMessage {
  id: string;
  type: string;
  to: string;
  subject?: string;
  body: string;
  scheduledFor: string;
  status: string;
  deal?: {
    title: string;
    lead: {
      name: string;
    };
  };
  template?: {
    name: string;
  };
  campaignName?: string;
}

export function MessageScheduler({ dealId }: { dealId?: string }) {
  const [scheduled, setScheduled] = useState<ScheduledMessage[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    dealId: dealId || '',
    type: 'EMAIL',
    templateId: '',
    to: '',
    subject: '',
    body: '',
    scheduledFor: '',
    scheduledTime: '',
    isRecurring: false,
    recurringRule: '',
    campaignName: '',
  });

  useEffect(() => {
    fetchScheduled();
    fetchTemplates();
  }, [dealId]);

  const fetchScheduled = async () => {
    try {
      const params = new URLSearchParams();
      if (dealId) params.append('dealId', dealId);

      const response = await fetch(`/api/communications/scheduled?${params}`);
      if (response.ok) {
        const data = await response.json();
        setScheduled(data.scheduled || []);
      }
    } catch (error) {
      console.error('Failed to fetch scheduled messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/communications/templates?activeOnly=true');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        templateId,
        type: template.type,
        subject: template.subject || '',
        body: template.body,
      });
    }
  };

  const handleSchedule = async () => {
    try {
      if (!formData.to || !formData.body || !formData.scheduledFor || !formData.scheduledTime) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      const scheduledFor = new Date(`${formData.scheduledFor}T${formData.scheduledTime}`);

      const response = await fetch('/api/communications/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduledFor: scheduledFor.toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Message scheduled successfully',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchScheduled();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule message',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled message?')) return;

    try {
      const response = await fetch(`/api/communications/scheduled/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Scheduled message cancelled',
        });
        fetchScheduled();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel message',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      dealId: dealId || '',
      type: 'EMAIL',
      templateId: '',
      to: '',
      subject: '',
      body: '',
      scheduledFor: '',
      scheduledTime: '',
      isRecurring: false,
      recurringRule: '',
      campaignName: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SENT':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading scheduled messages...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Messages</h2>
          <p className="text-gray-600">Schedule emails and SMS for later delivery</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Message
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule Message</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Template Selection */}
              <div>
                <Label htmlFor="template">Use Template (Optional)</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type & To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    placeholder={formData.type === 'EMAIL' ? 'email@example.com' : '+61412345678'}
                  />
                </div>
              </div>

              {/* Subject (Email only) */}
              {formData.type === 'EMAIL' && (
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Email subject"
                  />
                </div>
              )}

              {/* Body */}
              <div>
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={8}
                  placeholder="Your message..."
                />
              </div>

              {/* Schedule Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledFor">Date</Label>
                  <Input
                    id="scheduledFor"
                    type="date"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="scheduledTime">Time</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  />
                </div>
              </div>

              {/* Campaign Name (Optional) */}
              <div>
                <Label htmlFor="campaignName">Campaign Name (Optional)</Label>
                <Input
                  id="campaignName"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  placeholder="e.g., Q4 Follow-up Campaign"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSchedule}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scheduled Messages List */}
      <div className="space-y-4">
        {scheduled.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No scheduled messages</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              Schedule Your First Message
            </Button>
          </Card>
        ) : (
          scheduled.map((message) => (
            <Card key={message.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(message.status)}>
                      {message.status}
                    </Badge>
                    <Badge variant="outline">{message.type}</Badge>
                    {message.campaignName && (
                      <Badge variant="secondary">{message.campaignName}</Badge>
                    )}
                  </div>

                  {message.deal && (
                    <p className="font-semibold mb-1">
                      {message.deal.lead.name} - {message.deal.title}
                    </p>
                  )}

                  {message.subject && (
                    <p className="font-medium text-gray-700 mb-1">{message.subject}</p>
                  )}

                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {message.body}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(message.scheduledFor), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(message.scheduledFor), 'h:mm a')}</span>
                    </div>
                    <span>To: {message.to}</span>
                  </div>
                </div>

                {message.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(message.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
