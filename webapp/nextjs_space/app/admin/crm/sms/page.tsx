'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Sparkles,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface SMSTemplate {
  id: string;
  name: string;
  message: string;
}

export default function SMSComposer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [segmentCount, setSegmentCount] = useState(1);

  useEffect(() => {
    fetchTemplates();
    
    // Pre-fill from query params
    const dealId = searchParams.get('dealId');
    const leadId = searchParams.get('leadId');
    if (dealId || leadId) {
      fetchCustomerData(dealId, leadId);
    }
  }, []);

  useEffect(() => {
    // Calculate character count and SMS segments
    const length = message.length;
    setCharCount(length);
    
    // SMS segments: 160 chars for single, 153 chars per segment for multi
    if (length === 0) {
      setSegmentCount(0);
    } else if (length <= 160) {
      setSegmentCount(1);
    } else {
      setSegmentCount(Math.ceil(length / 153));
    }
  }, [message]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/sms/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchCustomerData = async (dealId: string | null, leadId: string | null) => {
    try {
      const token = localStorage.getItem('admin_token');
      const endpoint = dealId 
        ? `/api/crm/deals/${dealId}`
        : `/api/admin/leads/${leadId}`;
      
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const customer = data.deal || data.lead;
        if (customer.phone) setTo(customer.phone);
      }
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.message);
      setSelectedTemplate(templateId);
    }
  };

  const handleAIGenerate = async () => {
    if (!message) {
      toast({
        title: 'Input Required',
        description: 'Please provide some context for AI to work with',
        variant: 'destructive',
      });
      return;
    }

    setAiGenerating(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/sms/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          context: message,
          customerPhone: to,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        toast({
          title: 'AI Generated',
          description: 'SMS message generated successfully',
        });
      } else {
        throw new Error('Failed to generate');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate SMS with AI',
        variant: 'destructive',
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!to || !message) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in phone number and message',
        variant: 'destructive',
      });
      return;
    }

    // Validate Australian phone number
    const phoneRegex = /^(\+61|0)[2-478](?:[ -]?[0-9]){8}$/;
    if (!phoneRegex.test(to.replace(/\s/g, ''))) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid Australian phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to,
          message,
          dealId: searchParams.get('dealId'),
          leadId: searchParams.get('leadId'),
        }),
      });

      if (response.ok) {
        toast({
          title: 'SMS Sent',
          description: 'Your message has been sent successfully',
        });
        
        // Clear form
        setTo('');
        setMessage('');
        
        // Redirect to activities
        setTimeout(() => router.push('/admin/crm/activities'), 1500);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send SMS',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/crm/activities">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Send SMS</h1>
                <p className="text-xs text-gray-500">Send text message to customers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSend}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send SMS'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SMS Form */}
          <Card className="p-6 lg:col-span-2">
            <div className="space-y-4">
              {/* Template Selector */}
              {templates.length > 0 && (
                <div>
                  <Label htmlFor="template">Use Template (Optional)</Label>
                  <select
                    id="template"
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full mt-2 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Phone Number */}
              <div>
                <Label htmlFor="to">Phone Number *</Label>
                <Input
                  id="to"
                  type="tel"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="+61 4XX XXX XXX or 04XX XXX XXX"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Australian mobile number
                </p>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="message">Message *</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIGenerate}
                    disabled={aiGenerating}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {aiGenerating ? 'Generating...' : 'AI Generate'}
                  </Button>
                </div>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  rows={8}
                  className="mt-2"
                />
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className={charCount > 160 ? 'text-orange-600' : 'text-gray-500'}>
                    {charCount} characters
                  </span>
                  <span className={segmentCount > 1 ? 'text-orange-600' : 'text-gray-500'}>
                    {segmentCount} SMS {segmentCount !== 1 ? 'segments' : 'segment'}
                    {segmentCount > 1 && ` (~$${(segmentCount * 0.08).toFixed(2)} cost)`}
                  </span>
                </div>
              </div>

              {/* Warning for long messages */}
              {segmentCount > 2 && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">Long message detected</p>
                    <p>This will be sent as {segmentCount} SMS segments. Consider shortening for better deliverability.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SMS Guidelines */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                SMS Guidelines
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Keep messages under 160 characters</p>
                <p>• Include your name/company</p>
                <p>• Be clear and concise</p>
                <p>• Include opt-out option</p>
                <p>• Avoid spam trigger words</p>
              </div>
            </Card>

            {/* SMS Stats */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                SMS Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sent Today</span>
                  <span className="font-medium text-gray-900">0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Delivery Rate</span>
                  <span className="font-medium text-gray-900">0%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium text-gray-900">0%</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/admin/crm/templates">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Manage Templates
                  </Button>
                </Link>
                <Link href="/admin/crm/activities">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Sent SMS
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Cost Info */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">SMS Pricing</h3>
              <p className="text-sm text-blue-800">
                ~$0.08 per SMS segment to Australian mobiles via Twilio
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
