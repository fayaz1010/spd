'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Save,
  Mail,
  Bell,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactFormSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Settings
  const [enabled, setEnabled] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [subjectPrefix, setSubjectPrefix] = useState('[Website Contact]');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplySubject, setAutoReplySubject] = useState('');
  const [autoReplyMessage, setAutoReplyMessage] = useState('');
  
  // Spam Protection
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState('');
  const [recaptchaSecretKey, setRecaptchaSecretKey] = useState('');
  const [honeypotEnabled, setHoneypotEnabled] = useState(true);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [rateLimitPerHour, setRateLimitPerHour] = useState('5');
  
  // Required Fields
  const [requireName, setRequireName] = useState(true);
  const [requireEmail, setRequireEmail] = useState(true);
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireSubject, setRequireSubject] = useState(true);
  const [requireMessage, setRequireMessage] = useState(true);
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [smsNumber, setSmsNumber] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/website/contact-form-settings');
      const data = await res.json();

      if (data) {
        setEnabled(data.enabled !== undefined ? data.enabled : true);
        setRecipientEmail(data.recipientEmail || '');
        setCcEmails(data.ccEmails || '');
        setSubjectPrefix(data.subjectPrefix || '[Website Contact]');
        setAutoReplyEnabled(data.autoReplyEnabled !== undefined ? data.autoReplyEnabled : true);
        setAutoReplySubject(data.autoReplySubject || 'Thank you for contacting us');
        setAutoReplyMessage(data.autoReplyMessage || 'We have received your message and will get back to you soon.');
        setRecaptchaEnabled(data.recaptchaEnabled || false);
        setRecaptchaSiteKey(data.recaptchaSiteKey || '');
        setRecaptchaSecretKey(data.recaptchaSecretKey || '');
        setHoneypotEnabled(data.honeypotEnabled !== undefined ? data.honeypotEnabled : true);
        setRateLimitEnabled(data.rateLimitEnabled !== undefined ? data.rateLimitEnabled : true);
        setRateLimitPerHour(data.rateLimitPerHour?.toString() || '5');
        setRequireName(data.requireName !== undefined ? data.requireName : true);
        setRequireEmail(data.requireEmail !== undefined ? data.requireEmail : true);
        setRequirePhone(data.requirePhone || false);
        setRequireSubject(data.requireSubject !== undefined ? data.requireSubject : true);
        setRequireMessage(data.requireMessage !== undefined ? data.requireMessage : true);
        setEmailNotifications(data.emailNotifications !== undefined ? data.emailNotifications : true);
        setSlackNotifications(data.slackNotifications || false);
        setSlackWebhookUrl(data.slackWebhookUrl || '');
        setSmsNotifications(data.smsNotifications || false);
        setSmsNumber(data.smsNumber || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/website/contact-form-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          recipientEmail,
          ccEmails,
          subjectPrefix,
          autoReplyEnabled,
          autoReplySubject,
          autoReplyMessage,
          recaptchaEnabled,
          recaptchaSiteKey,
          recaptchaSecretKey,
          honeypotEnabled,
          rateLimitEnabled,
          rateLimitPerHour: parseInt(rateLimitPerHour),
          requireName,
          requireEmail,
          requirePhone,
          requireSubject,
          requireMessage,
          emailNotifications,
          slackNotifications,
          slackWebhookUrl,
          smsNotifications,
          smsNumber,
        }),
      });

      if (res.ok) {
        toast.success('Contact form settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/website">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Website
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Contact Form Settings</h1>
            <p className="text-gray-600">Configure contact form and notifications</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Enable/Disable */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact Form Status</CardTitle>
              <CardDescription>Enable or disable the contact form</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              {enabled ? (
                <span className="text-green-600 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Enabled
                </span>
              ) : (
                <span className="text-gray-600 font-medium">Disabled</span>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Settings
          </CardTitle>
          <CardDescription>Configure where form submissions are sent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Recipient Email *</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="contact@sundirectpower.com.au"
            />
            <p className="text-xs text-gray-600 mt-1">Primary email to receive form submissions</p>
          </div>

          <div>
            <Label>CC Emails (Optional)</Label>
            <Input
              value={ccEmails}
              onChange={(e) => setCcEmails(e.target.value)}
              placeholder="sales@example.com, support@example.com"
            />
            <p className="text-xs text-gray-600 mt-1">Comma-separated list of additional recipients</p>
          </div>

          <div>
            <Label>Subject Prefix</Label>
            <Input
              value={subjectPrefix}
              onChange={(e) => setSubjectPrefix(e.target.value)}
              placeholder="[Website Contact]"
            />
            <p className="text-xs text-gray-600 mt-1">Prefix added to email subjects for easy filtering</p>
          </div>
        </CardContent>
      </Card>

      {/* Auto Reply */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Auto Reply</CardTitle>
              <CardDescription>Automatically respond to form submissions</CardDescription>
            </div>
            <Switch
              checked={autoReplyEnabled}
              onCheckedChange={setAutoReplyEnabled}
            />
          </div>
        </CardHeader>
        {autoReplyEnabled && (
          <CardContent className="space-y-4">
            <div>
              <Label>Auto Reply Subject</Label>
              <Input
                value={autoReplySubject}
                onChange={(e) => setAutoReplySubject(e.target.value)}
                placeholder="Thank you for contacting us"
              />
            </div>
            <div>
              <Label>Auto Reply Message</Label>
              <Textarea
                value={autoReplyMessage}
                onChange={(e) => setAutoReplyMessage(e.target.value)}
                rows={4}
                placeholder="We have received your message and will get back to you soon."
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Required Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Required Fields</CardTitle>
          <CardDescription>Select which fields are mandatory</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Name</Label>
            <Switch checked={requireName} onCheckedChange={setRequireName} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Email</Label>
            <Switch checked={requireEmail} onCheckedChange={setRequireEmail} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Phone</Label>
            <Switch checked={requirePhone} onCheckedChange={setRequirePhone} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Subject</Label>
            <Switch checked={requireSubject} onCheckedChange={setRequireSubject} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Message</Label>
            <Switch checked={requireMessage} onCheckedChange={setRequireMessage} />
          </div>
        </CardContent>
      </Card>

      {/* Spam Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Spam Protection
          </CardTitle>
          <CardDescription>Protect your form from spam and abuse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Honeypot Field</Label>
              <p className="text-sm text-gray-600">Hidden field to catch bots</p>
            </div>
            <Switch checked={honeypotEnabled} onCheckedChange={setHoneypotEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Rate Limiting</Label>
              <p className="text-sm text-gray-600">Limit submissions per IP</p>
            </div>
            <Switch checked={rateLimitEnabled} onCheckedChange={setRateLimitEnabled} />
          </div>

          {rateLimitEnabled && (
            <div>
              <Label>Max Submissions Per Hour</Label>
              <Input
                type="number"
                value={rateLimitPerHour}
                onChange={(e) => setRateLimitPerHour(e.target.value)}
                min="1"
                max="100"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Google reCAPTCHA</Label>
              <p className="text-sm text-gray-600">Add reCAPTCHA verification</p>
            </div>
            <Switch checked={recaptchaEnabled} onCheckedChange={setRecaptchaEnabled} />
          </div>

          {recaptchaEnabled && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <Label>reCAPTCHA Site Key</Label>
                <Input
                  value={recaptchaSiteKey}
                  onChange={(e) => setRecaptchaSiteKey(e.target.value)}
                  placeholder="6Lc..."
                />
              </div>
              <div>
                <Label>reCAPTCHA Secret Key</Label>
                <Input
                  type="password"
                  value={recaptchaSecretKey}
                  onChange={(e) => setRecaptchaSecretKey(e.target.value)}
                  placeholder="6Lc..."
                />
              </div>
              <p className="text-xs text-blue-800">
                Get your keys from <a href="https://www.google.com/recaptcha/admin" target="_blank" className="underline">Google reCAPTCHA</a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>Get notified of new form submissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-600">Send email for each submission</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Slack Notifications</Label>
              <p className="text-sm text-gray-600">Post to Slack channel</p>
            </div>
            <Switch checked={slackNotifications} onCheckedChange={setSlackNotifications} />
          </div>

          {slackNotifications && (
            <div>
              <Label>Slack Webhook URL</Label>
              <Input
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>SMS Notifications</Label>
              <p className="text-sm text-gray-600">Send SMS for urgent inquiries</p>
            </div>
            <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
          </div>

          {smsNotifications && (
            <div>
              <Label>SMS Number</Label>
              <Input
                value={smsNumber}
                onChange={(e) => setSmsNumber(e.target.value)}
                placeholder="+61 4XX XXX XXX"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Contact Form Best Practices</h3>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Enable spam protection to reduce unwanted submissions</li>
                <li>• Set up auto-reply to acknowledge receipt immediately</li>
                <li>• Use rate limiting to prevent abuse</li>
                <li>• Configure notifications to respond quickly</li>
                <li>• Keep required fields minimal for better conversion</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
