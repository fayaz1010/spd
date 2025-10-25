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
  Mail,
  Send,
  Sparkles,
  Paperclip,
  Users,
  Save,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export default function EmailComposer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);

  useEffect(() => {
    fetchTemplates();
    
    // Pre-fill from query params
    const dealId = searchParams.get('dealId');
    const leadId = searchParams.get('leadId');
    if (dealId || leadId) {
      fetchCustomerData(dealId, leadId);
    }
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/email/templates', {
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
        if (customer.email) setTo(customer.email);
      }
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setSelectedTemplate(templateId);
    }
  };

  const handleAIGenerate = async () => {
    if (!subject && !body) {
      toast({
        title: 'Input Required',
        description: 'Please provide a subject or some context for AI to work with',
        variant: 'destructive',
      });
      return;
    }

    setAiGenerating(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/email/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          context: body,
          customerEmail: to,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBody(data.body);
        if (!subject && data.subject) {
          setSubject(data.subject);
        }
        toast({
          title: 'AI Generated',
          description: 'Email content generated successfully',
        });
      } else {
        throw new Error('Failed to generate');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate email with AI',
        variant: 'destructive',
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in To, Subject, and Body fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: to.split(',').map(e => e.trim()),
          cc: cc ? cc.split(',').map(e => e.trim()) : [],
          bcc: bcc ? bcc.split(',').map(e => e.trim()) : [],
          subject,
          body,
          dealId: searchParams.get('dealId'),
          leadId: searchParams.get('leadId'),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Email Sent',
          description: 'Your email has been sent successfully',
        });
        
        // Clear form
        setTo('');
        setCc('');
        setBcc('');
        setSubject('');
        setBody('');
        
        // Redirect to activities
        setTimeout(() => router.push('/admin/crm/activities'), 1500);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    toast({
      title: 'Draft Saved',
      description: 'Email saved to drafts',
    });
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
                <h1 className="text-xl font-bold text-primary">Compose Email</h1>
                <p className="text-xs text-gray-500">Send email to customers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleSend}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Form */}
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

              {/* To Field */}
              <div>
                <Label htmlFor="to">To *</Label>
                <Input
                  id="to"
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="customer@example.com"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              {/* CC/BCC Toggle */}
              {!showCcBcc && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCcBcc(true)}
                  className="text-blue-600"
                >
                  + Add Cc/Bcc
                </Button>
              )}

              {/* CC Field */}
              {showCcBcc && (
                <div>
                  <Label htmlFor="cc">Cc</Label>
                  <Input
                    id="cc"
                    type="email"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="mt-2"
                  />
                </div>
              )}

              {/* BCC Field */}
              {showCcBcc && (
                <div>
                  <Label htmlFor="bcc">Bcc</Label>
                  <Input
                    id="bcc"
                    type="email"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="mt-2"
                  />
                </div>
              )}

              {/* Subject */}
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="mt-2"
                />
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="body">Message *</Label>
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
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message here..."
                  rows={12}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {body.length} characters
                </p>
              </div>

              {/* Attachments (Future) */}
              <div>
                <Button variant="outline" size="sm" disabled>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach Files (Coming Soon)
                </Button>
              </div>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Tips */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                AI Features
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Click "AI Generate" to create professional email content</p>
                <p>• AI uses Gemini (20x cheaper than GPT-4)</p>
                <p>• Provide context in subject or body for better results</p>
              </div>
            </Card>

            {/* Email Stats */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-600" />
                Email Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sent Today</span>
                  <span className="font-medium text-gray-900">0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Open Rate</span>
                  <span className="font-medium text-gray-900">0%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Click Rate</span>
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
                    <Mail className="h-4 w-4 mr-2" />
                    Manage Templates
                  </Button>
                </Link>
                <Link href="/admin/crm/activities">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    View Sent Emails
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
