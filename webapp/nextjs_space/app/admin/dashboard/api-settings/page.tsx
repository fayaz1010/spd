
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff, 
  CreditCard,
  Bot,
  Mail,
  MessageSquare,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Building,
  Facebook,
  Chrome,
  Phone,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

interface ApiSettings {
  id: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeEnabled: boolean;
  openaiApiKey: string;
  openaiModel: string;
  openaiEnabled: boolean;
  abacusApiKey: string;
  abacusEnabled: boolean;
  geminiApiKey: string[];  // Array of API keys for round-robin
  geminiModel: string;
  geminiEnabled: boolean;
  googleMapsApiKey: string;
  googleMapsEnabled: boolean;
  sendgridApiKey: string;
  sendgridFromEmail: string;
  sendgridEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  smtpFromName: string;
  smtpEnabled: boolean;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  twilioEnabled: boolean;
  // NEW: Facebook Lead Ads
  facebookAppId: string;
  facebookAppSecret: string;
  facebookPageAccessToken: string;
  facebookVerifyToken: string;
  facebookEnabled: boolean;
  // NEW: Google Ads
  googleAdsWebhookSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  googleAdsCustomerId: string;
  googleAdsDeveloperToken: string;
  googleAdsEnabled: boolean;
  // NEW: WhatsApp Business
  whatsappBusinessId: string;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  whatsappWebhookSecret: string;
  whatsappEnabled: boolean;
  // Microsoft 365 OAuth
  microsoftClientId: string;
  microsoftClientSecret: string;
  microsoftTenantId: string;
  microsoftObjectId: string;
  microsoftEnabled: boolean;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessABN: string;
  businessAddress: string;
  // Deposit Settings
  depositType: string;
  depositPercentage: number;
  depositFixedAmount: number;
  // WA licenses
  waContractorName: string;
  waContractorLicense: string;
  waElectricianName: string;
  waElectricianLicense: string;
  // VIC licenses
  vicContractorName: string;
  vicContractorLicense: string;
  vicElectricianName: string;
  vicElectricianLicense: string;
  // NSW licenses
  nswContractorName: string;
  nswContractorLicense: string;
  nswElectricianName: string;
  nswElectricianLicense: string;
  // QLD licenses
  qldContractorName: string;
  qldContractorLicense: string;
  qldElectricianName: string;
  qldElectricianLicense: string;
  // SA licenses
  saContractorName: string;
  saContractorLicense: string;
  saElectricianName: string;
  saElectricianLicense: string;
  // TAS licenses
  tasContractorName: string;
  tasContractorLicense: string;
  tasElectricianName: string;
  tasElectricianLicense: string;
  // NT licenses
  ntContractorName: string;
  ntContractorLicense: string;
  ntElectricianName: string;
  ntElectricianLicense: string;
  // ACT licenses
  actContractorName: string;
  actContractorLicense: string;
  actElectricianName: string;
  actElectricianLicense: string;
  // CEC
  cecAccreditationNumber: string;
  cecAccreditationExpiry: string;
  cecDesignerNumber: string;
  cecDesignerExpiry: string;
}

export default function ApiSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  
  const [settings, setSettings] = useState<Partial<ApiSettings>>({
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    stripeEnabled: false,
    openaiApiKey: '',
    openaiModel: 'gpt-4',
    openaiEnabled: false,
    abacusApiKey: '',
    abacusEnabled: false,
    geminiApiKey: [],  // Array of API keys
    geminiModel: 'gemini-2.0-flash-exp',
    geminiEnabled: false,
    googleMapsApiKey: '',
    googleMapsEnabled: false,
    sendgridApiKey: '',
    sendgridFromEmail: '',
    sendgridEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    smtpFromName: 'Sun Direct Power',
    smtpEnabled: false,
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    twilioEnabled: false,
    // NEW: Facebook Lead Ads
    facebookAppId: '',
    facebookAppSecret: '',
    facebookPageAccessToken: '',
    facebookVerifyToken: '',
    facebookEnabled: false,
    // NEW: Google Ads
    googleAdsWebhookSecret: '',
    googleClientId: '',
    googleClientSecret: '',
    googleRefreshToken: '',
    googleAdsCustomerId: '',
    googleAdsDeveloperToken: '',
    googleAdsEnabled: false,
    // NEW: WhatsApp
    whatsappBusinessId: '',
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappWebhookSecret: '',
    whatsappEnabled: false,
    // Microsoft 365 OAuth
    microsoftClientId: '',
    microsoftClientSecret: '',
    microsoftTenantId: '',
    microsoftObjectId: '',
    microsoftEnabled: false,
    businessName: 'Sun Direct Power',
    businessEmail: '',
    businessPhone: '',
    // Deposit Settings
    depositType: 'percentage',
    depositPercentage: 10,
    depositFixedAmount: 500,
  });

  useEffect(() => {
    console.log('[API Settings] Page mounted');
    const token = localStorage.getItem('admin_token');
    console.log('[API Settings] Token check:', token ? `Present (${token.length} chars)` : 'Missing');
    
    if (!token || token === 'null') {
      console.log('[API Settings] No valid token found, redirecting to login');
      setTimeout(() => router.push('/admin'), 100);
      return;
    }
    
    console.log('[API Settings] Token found, fetching settings');
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/api-settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      setSettings(data);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/api-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      const data = await response.json();
      setSettings(data.settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleClearKeys = async (keyType: string) => {
    if (!confirm(`Are you sure you want to clear all ${keyType} keys?`)) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/api-settings?keyType=${keyType}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to clear keys');

      setMessage({ type: 'success', text: `${keyType} keys cleared successfully!` });
      fetchSettings();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading settings...</p>
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
                <h1 className="text-xl font-bold text-primary">API & Integration Settings</h1>
                <p className="text-xs text-gray-500">Configure third-party integrations</p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-coral hover:bg-coral-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Business Information */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-primary rounded-full h-10 w-10 flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Business Information</h2>
              <p className="text-sm text-gray-600">Company details for invoices and communications</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={settings.businessName || ''}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                placeholder="Sun Direct Power"
              />
            </div>
            <div>
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={settings.businessEmail || ''}
                onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                placeholder="info@sundirectpower.com"
              />
            </div>
            <div>
              <Label htmlFor="businessPhone">Business Phone</Label>
              <Input
                id="businessPhone"
                value={settings.businessPhone || ''}
                onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })}
                placeholder="+61 XXX XXX XXX"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="businessABN">Business ABN</Label>
              <Input
                id="businessABN"
                value={(settings as any).businessABN || ''}
                onChange={(e) => setSettings({ ...settings, businessABN: e.target.value } as any)}
                placeholder="12 345 678 901"
              />
            </div>
            <div>
              <Label htmlFor="businessAddress">Business Address</Label>
              <Input
                id="businessAddress"
                value={(settings as any).businessAddress || ''}
                onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value } as any)}
                placeholder="123 Solar Street, Perth WA 6000"
              />
            </div>
          </div>
        </div>

        {/* Deposit Settings */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-primary rounded-full h-10 w-10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Deposit Settings</h2>
              <p className="text-sm text-gray-600">Configure deposit amount for customer quotes</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="depositType">Deposit Type</Label>
              <select
                id="depositType"
                value={settings.depositType || 'percentage'}
                onChange={(e) => setSettings({ ...settings, depositType: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="percentage">Percentage of Total</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose how deposit is calculated for quotes
              </p>
            </div>

            {settings.depositType === 'percentage' ? (
              <div>
                <Label htmlFor="depositPercentage">Deposit Percentage</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="depositPercentage"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={settings.depositPercentage || 10}
                    onChange={(e) => setSettings({ ...settings, depositPercentage: parseFloat(e.target.value) })}
                    placeholder="10"
                    className="w-32"
                  />
                  <span className="text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Default: 10% of total system cost
                </p>
                {settings.depositPercentage && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Example:</strong> For a $15,000 system, deposit would be{' '}
                      ${((15000 * (settings.depositPercentage || 10)) / 100).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="depositFixedAmount">Fixed Deposit Amount</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">$</span>
                  <Input
                    id="depositFixedAmount"
                    type="number"
                    min="100"
                    step="50"
                    value={settings.depositFixedAmount || 500}
                    onChange={(e) => setSettings({ ...settings, depositFixedAmount: parseFloat(e.target.value) })}
                    placeholder="500"
                    className="w-32"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Fixed amount for all quotes (easier for installers)
                </p>
                {settings.depositFixedAmount && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Example:</strong> All customers pay ${settings.depositFixedAmount.toLocaleString()} deposit,
                      regardless of system size
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This setting applies to all new quotes. Existing quotes will retain their original deposit amount.
              </p>
            </div>
          </div>
        </div>

        {/* Stripe Settings */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-coral rounded-full h-10 w-10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Stripe Payment Gateway</h2>
                <p className="text-sm text-gray-600">Accept deposits and payments via Stripe</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.stripeEnabled || false}
                onCheckedChange={(checked) => setSettings({ ...settings, stripeEnabled: checked })}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearKeys('stripe')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="stripePublishableKey">Publishable Key</Label>
              <div className="flex gap-2">
                <Input
                  id="stripePublishableKey"
                  type={showKeys.stripePublishableKey ? 'text' : 'password'}
                  value={settings.stripePublishableKey || ''}
                  onChange={(e) => setSettings({ ...settings, stripePublishableKey: e.target.value })}
                  placeholder="pk_live_..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowKey('stripePublishableKey')}
                >
                  {showKeys.stripePublishableKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="stripeSecretKey">Secret Key</Label>
              <div className="flex gap-2">
                <Input
                  id="stripeSecretKey"
                  type={showKeys.stripeSecretKey ? 'text' : 'password'}
                  value={settings.stripeSecretKey || ''}
                  onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                  placeholder="sk_live_..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowKey('stripeSecretKey')}
                >
                  {showKeys.stripeSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="stripeWebhookSecret">Webhook Secret</Label>
              <div className="flex gap-2">
                <Input
                  id="stripeWebhookSecret"
                  type={showKeys.stripeWebhookSecret ? 'text' : 'password'}
                  value={settings.stripeWebhookSecret || ''}
                  onChange={(e) => setSettings({ ...settings, stripeWebhookSecret: e.target.value })}
                  placeholder="whsec_..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowKey('stripeWebhookSecret')}
                >
                  {showKeys.stripeWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How to get Stripe keys:</strong><br />
                1. Sign up at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">stripe.com</a><br />
                2. Navigate to Developers → API keys<br />
                3. Copy your publishable and secret keys<br />
                4. For webhooks, go to Developers → Webhooks and add endpoint
              </p>
            </div>
          </div>
        </div>

        {/* AI/Chatbot Settings */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-gold rounded-full h-10 w-10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">AI Chatbot Integration</h2>
                <p className="text-sm text-gray-600">Enable AI-powered customer support</p>
              </div>
            </div>
          </div>

          {/* OpenAI */}
          <div className="mb-6 pb-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">OpenAI GPT</h3>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.openaiEnabled || false}
                  onCheckedChange={(checked) => setSettings({ ...settings, openaiEnabled: checked })}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearKeys('openai')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="openaiApiKey">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="openaiApiKey"
                    type={showKeys.openaiApiKey ? 'text' : 'password'}
                    value={settings.openaiApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleShowKey('openaiApiKey')}
                  >
                    {showKeys.openaiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="openaiModel">Model</Label>
                <select
                  id="openaiModel"
                  value={settings.openaiModel || 'gpt-4'}
                  onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="gpt-4">GPT-4 (Recommended)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Abacus AI */}
          <div className="mb-6 pb-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Abacus AI (Alternative)</h3>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.abacusEnabled || false}
                  onCheckedChange={(checked) => setSettings({ ...settings, abacusEnabled: checked })}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearKeys('abacus')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="abacusApiKey">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="abacusApiKey"
                  type={showKeys.abacusApiKey ? 'text' : 'password'}
                  value={settings.abacusApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, abacusApiKey: e.target.value })}
                  placeholder="abacus_..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowKey('abacusApiKey')}
                >
                  {showKeys.abacusApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Google Gemini AI */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Google Gemini AI (Recommended - Cheaper)</h3>
                <p className="text-xs text-gray-500">Fast and cost-effective AI model</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.geminiEnabled || false}
                  onCheckedChange={(checked) => setSettings({ ...settings, geminiEnabled: checked })}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearKeys('gemini')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>API Keys (Multiple for Rate Limiting)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentKeys = Array.isArray(settings.geminiApiKey) ? settings.geminiApiKey : [];
                      setSettings({ ...settings, geminiApiKey: [...currentKeys, ''] });
                    }}
                    className="text-xs"
                  >
                    + Add Key
                  </Button>
                </div>
                
                {(!settings.geminiApiKey || (Array.isArray(settings.geminiApiKey) && settings.geminiApiKey.length === 0)) && (
                  <div className="text-sm text-gray-500 mb-2">
                    No API keys added. Click "+ Add Key" to add your first key.
                  </div>
                )}
                
                <div className="space-y-2">
                  {Array.isArray(settings.geminiApiKey) && settings.geminiApiKey.map((key, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <span className="text-sm text-gray-600 w-8">#{index + 1}</span>
                      <Input
                        type={showKeys[`geminiApiKey_${index}`] ? 'text' : 'password'}
                        value={key || ''}
                        onChange={(e) => {
                          const newKeys = [...(settings.geminiApiKey || [])];
                          newKeys[index] = e.target.value;
                          setSettings({ ...settings, geminiApiKey: newKeys });
                        }}
                        placeholder="AIza..."
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleShowKey(`geminiApiKey_${index}`)}
                      >
                        {showKeys[`geminiApiKey_${index}`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newKeys = (settings.geminiApiKey || []).filter((_, i) => i !== index);
                          setSettings({ ...settings, geminiApiKey: newKeys });
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="geminiModel">Model</Label>
                <select
                  id="geminiModel"
                  value={settings.geminiModel || 'gemini-2.0-flash-exp'}
                  onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental - Fastest)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Most Capable)</option>
                  <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>How to get Gemini API key:</strong><br />
                  1. Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a><br />
                  2. Click "Create API Key"<br />
                  3. Create a new API key (repeat 3× for best performance)<br />
                  4. Copy and paste each key here<br />
                  <strong>Cost:</strong> ~$0.075 per 1M tokens (20x cheaper than GPT-4)
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>💡 Pro Tip: Add 3 API Keys for 3× Speed!</strong><br />
                  • 1 key = 15 requests/min (slow)<br />
                  • 3 keys = 45 requests/min (3× faster!)<br />
                  • System automatically rotates through keys<br />
                  • All keys are FREE on Gemini free tier<br />
                  <strong>Recommended:</strong> Create 3 keys for optimal content generation speed
                </p>
              </div>
              
              {Array.isArray(settings.geminiApiKey) && settings.geminiApiKey.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>✅ Active Configuration:</strong><br />
                    • {settings.geminiApiKey.length} API {settings.geminiApiKey.length === 1 ? 'key' : 'keys'} configured<br />
                    • Capacity: {settings.geminiApiKey.length * 15} requests/minute<br />
                    • Speed multiplier: {settings.geminiApiKey.length}×<br />
                    • Round-robin rotation: {settings.geminiEnabled ? 'Enabled ✓' : 'Disabled ✗'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Google Maps & Solar API */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Google Maps & Solar API</h3>
                <p className="text-xs text-gray-500">For address geocoding, roof analysis, and solar potential</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.googleMapsEnabled || false}
                  onCheckedChange={(checked) => setSettings({ ...settings, googleMapsEnabled: checked })}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearKeys('googleMaps')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="googleMapsApiKey">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="googleMapsApiKey"
                    type={showKeys.googleMapsApiKey ? 'text' : 'password'}
                    value={settings.googleMapsApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, googleMapsApiKey: e.target.value })}
                    placeholder="AIza..."
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleShowKey('googleMapsApiKey')}
                  >
                    {showKeys.googleMapsApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>How to get Google Maps API key:</strong><br />
                  1. Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a><br />
                  2. Create a project or select existing<br />
                  3. Enable these APIs: Geocoding API, Solar API, Maps Static API<br />
                  4. Create credentials → API Key<br />
                  5. Copy and paste here<br />
                  <strong>Cost:</strong> Solar API is FREE, Maps ~$5/month (mostly free tier)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings (SendGrid) */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-emerald rounded-full h-10 w-10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Email Integration (SendGrid)</h2>
                <p className="text-sm text-gray-600">Send automated emails to customers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.sendgridEnabled || false}
                onCheckedChange={(checked) => setSettings({ ...settings, sendgridEnabled: checked })}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearKeys('sendgrid')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="sendgridApiKey">SendGrid API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="sendgridApiKey"
                  type={showKeys.sendgridApiKey ? 'text' : 'password'}
                  value={settings.sendgridApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, sendgridApiKey: e.target.value })}
                  placeholder="SG...."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowKey('sendgridApiKey')}
                >
                  {showKeys.sendgridApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="sendgridFromEmail">From Email Address</Label>
              <Input
                id="sendgridFromEmail"
                type="email"
                value={settings.sendgridFromEmail || ''}
                onChange={(e) => setSettings({ ...settings, sendgridFromEmail: e.target.value })}
                placeholder="noreply@sundirectpower.com"
              />
            </div>
          </div>
        </div>

        {/* SMTP Email Settings */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full h-10 w-10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">SMTP Email Server</h2>
                <p className="text-sm text-gray-600">Configure custom SMTP server for email notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.smtpEnabled || false}
                onCheckedChange={(checked) => setSettings({ ...settings, smtpEnabled: checked })}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearKeys('smtp')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={settings.smtpHost || ''}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., smtp.gmail.com, smtp.office365.com</p>
              </div>

              <div>
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={settings.smtpPort || 587}
                  onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                  placeholder="587"
                />
                <p className="text-xs text-gray-500 mt-1">Common: 587 (TLS), 465 (SSL), 25</p>
              </div>
            </div>

            <div>
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={settings.smtpUser || ''}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                placeholder="your-email@gmail.com"
              />
            </div>

            <div>
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <div className="flex gap-2">
                <Input
                  id="smtpPassword"
                  type={showKeys.smtpPassword ? 'text' : 'password'}
                  value={settings.smtpPassword || ''}
                  onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowKey('smtpPassword')}
                >
                  {showKeys.smtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">For Gmail, use App Password instead of regular password</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpFrom">From Email Address</Label>
                <Input
                  id="smtpFrom"
                  type="email"
                  value={settings.smtpFrom || ''}
                  onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
                  placeholder="noreply@sundirectpower.com.au"
                />
              </div>

              <div>
                <Label htmlFor="smtpFromName">From Name</Label>
                <Input
                  id="smtpFromName"
                  value={settings.smtpFromName || ''}
                  onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                  placeholder="Sun Direct Power"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> SMTP settings will be used for email notifications if enabled. 
                If both SMTP and SendGrid are enabled, SMTP will take priority.
              </p>
            </div>
          </div>
        </div>

        {/* Microsoft 365 OAuth Email Integration */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-full h-10 w-10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Microsoft 365 OAuth Email (Recommended)</h2>
                <p className="text-sm text-gray-600">Send emails via Microsoft 365 with OAuth authentication</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.microsoftEnabled || false}
                onCheckedChange={(checked) => setSettings({ ...settings, microsoftEnabled: checked })}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearKeys('microsoft')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="microsoftClientId">Application (Client) ID</Label>
                <Input
                  id="microsoftClientId"
                  value={settings.microsoftClientId || ''}
                  onChange={(e) => setSettings({ ...settings, microsoftClientId: e.target.value })}
                  placeholder="d5e2a837-a3c3-403f-8d00-9f13fe10d8ba"
                />
              </div>

              <div>
                <Label htmlFor="microsoftTenantId">Directory (Tenant) ID</Label>
                <Input
                  id="microsoftTenantId"
                  value={settings.microsoftTenantId || ''}
                  onChange={(e) => setSettings({ ...settings, microsoftTenantId: e.target.value })}
                  placeholder="d0887749-f767-4619-8441-b2939979c2a1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="microsoftClientSecret">Client Secret (Value)</Label>
                <div className="flex gap-2">
                  <Input
                    id="microsoftClientSecret"
                    type={showKeys.microsoftClientSecret ? 'text' : 'password'}
                    value={settings.microsoftClientSecret || ''}
                    onChange={(e) => setSettings({ ...settings, microsoftClientSecret: e.target.value })}
                    placeholder="Enter your Azure AD client secret"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleShowKey('microsoftClientSecret')}
                  >
                    {showKeys.microsoftClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Use the "Value", not the "Secret ID"</p>
              </div>

              <div>
                <Label htmlFor="microsoftObjectId">Object ID (Optional)</Label>
                <Input
                  id="microsoftObjectId"
                  value={settings.microsoftObjectId || ''}
                  onChange={(e) => setSettings({ ...settings, microsoftObjectId: e.target.value })}
                  placeholder="c0f2eafd-50ef-4cdc-a6f3-8e483681f373"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">
                <strong>How to get Microsoft 365 OAuth credentials:</strong>
              </p>
              <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                <li>Go to <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="underline">Azure Portal</a></li>
                <li>Navigate to "App registrations" → "New registration"</li>
                <li>Name: "SunDirectPowerApp", select account type</li>
                <li>Add redirect URI: <code className="bg-blue-100 px-1 rounded">https://yourdomain.com/api/auth/microsoft/callback</code></li>
                <li>Go to "Certificates & secrets" → "New client secret"</li>
                <li>Copy the <strong>Value</strong> (not Secret ID) immediately</li>
                <li>Go to "API permissions" → Add "Mail.Send" permission</li>
                <li>Grant admin consent for the permissions</li>
              </ol>
              <p className="text-sm text-blue-800 mt-3">
                <strong>Benefits:</strong> More secure than SMTP, no app passwords needed, better deliverability
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Security Note:</strong> Never commit real credentials to version control. Store them securely in environment variables or a secrets manager.
              </p>
            </div>
          </div>
        </div>

        {/* SMS Settings (Twilio) */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary rounded-full h-10 w-10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">SMS Integration (Twilio)</h2>
                <p className="text-sm text-gray-600">Send SMS notifications to customers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.twilioEnabled || false}
                onCheckedChange={(checked) => setSettings({ ...settings, twilioEnabled: checked })}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearKeys('twilio')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="twilioAccountSid">Account SID</Label>
              <Input
                id="twilioAccountSid"
                value={settings.twilioAccountSid || ''}
                onChange={(e) => setSettings({ ...settings, twilioAccountSid: e.target.value })}
                placeholder="AC..."
              />
            </div>

            <div>
              <Label htmlFor="twilioAuthToken">Auth Token</Label>
              <div className="flex gap-2">
                <Input
                  id="twilioAuthToken"
                  type={showKeys.twilioAuthToken ? 'text' : 'password'}
                  value={settings.twilioAuthToken || ''}
                  onChange={(e) => setSettings({ ...settings, twilioAuthToken: e.target.value })}
                  placeholder="••••••••"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowKey('twilioAuthToken')}
                >
                  {showKeys.twilioAuthToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="twilioPhoneNumber">Twilio Phone Number</Label>
              <Input
                id="twilioPhoneNumber"
                value={settings.twilioPhoneNumber || ''}
                onChange={(e) => setSettings({ ...settings, twilioPhoneNumber: e.target.value })}
                placeholder="+61400000000"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How to get Twilio credentials:</strong><br />
                1. Sign up at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">twilio.com</a><br />
                2. Copy Account SID and Auth Token from dashboard<br />
                3. Purchase or use trial phone number<br />
                4. Set webhook URL in phone number settings
              </p>
            </div>
          </div>
        </div>

        {/* Facebook Lead Ads Integration */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-full h-10 w-10 flex items-center justify-center">
                <Facebook className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Facebook Lead Ads Integration</h2>
                <p className="text-sm text-gray-600">Auto-capture leads from Facebook advertising</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.facebookEnabled || false}
                onCheckedChange={(checked) => setSettings({ ...settings, facebookEnabled: checked })}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearKeys('facebook')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="facebookAppId">App ID</Label>
              <Input
                id="facebookAppId"
                value={settings.facebookAppId || ''}
                onChange={(e) => setSettings({ ...settings, facebookAppId: e.target.value })}
                placeholder="123456789012345"
              />
            </div>

            <div>
              <Label htmlFor="facebookAppSecret">App Secret</Label>
              <div className="flex gap-2">
                <Input
                  id="facebookAppSecret"
                  type={showKeys.facebookAppSecret ? 'text' : 'password'}
                  value={settings.facebookAppSecret || ''}
                  onChange={(e) => setSettings({ ...settings, facebookAppSecret: e.target.value })}
                  placeholder="••••••••"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowKey('facebookAppSecret')}
                >
                  {showKeys.facebookAppSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="facebookPageAccessToken">Page Access Token (Long-lived)</Label>
              <div className="flex gap-2">
                <Input
                  id="facebookPageAccessToken"
                  type={showKeys.facebookPageAccessToken ? 'text' : 'password'}
                  value={settings.facebookPageAccessToken || ''}
                  onChange={(e) => setSettings({ ...settings, facebookPageAccessToken: e.target.value })}
                  placeholder="EAABsbCS1iHgBO..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowKey('facebookPageAccessToken')}
                >
                  {showKeys.facebookPageAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="facebookVerifyToken">Webhook Verify Token (Create your own)</Label>
              <Input
                id="facebookVerifyToken"
                value={settings.facebookVerifyToken || ''}
                onChange={(e) => setSettings({ ...settings, facebookVerifyToken: e.target.value })}
                placeholder="solar_leads_webhook_2025"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Setup Instructions:</strong><br />
                1. Create app at <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a><br />
                2. Add "Lead Ads" product to your app<br />
                3. Get Page Access Token from Graph API Explorer<br />
                4. Webhook URL: <code className="bg-white px-2 py-1 rounded">https://yourdomain.com/api/webhooks/facebook-leads</code><br />
                5. Subscribe to "leadgen" events
              </p>
            </div>
          </div>
        </div>

        {/* Google Ads Integration */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 rounded-full h-10 w-10 flex items-center justify-center">
                <Chrome className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Google Ads Lead Forms Integration</h2>
                <p className="text-sm text-gray-600">Auto-capture leads from Google advertising</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.googleAdsEnabled || false}
                onCheckedChange={(checked) => setSettings({ ...settings, googleAdsEnabled: checked })}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearKeys('google')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold mb-2">Choose Integration Method:</p>
              <div className="space-y-2 text-sm text-gray-700">
                <div>• <strong>Webhook (Simple):</strong> Only webhook secret needed</div>
                <div>• <strong>API (Advanced):</strong> Full OAuth credentials for polling</div>
              </div>
            </div>

            <div>
              <Label htmlFor="googleAdsWebhookSecret">Webhook Secret (Recommended)</Label>
              <div className="flex gap-2">
                <Input
                  id="googleAdsWebhookSecret"
                  type={showKeys.googleAdsWebhookSecret ? 'text' : 'password'}
                  value={settings.googleAdsWebhookSecret || ''}
                  onChange={(e) => setSettings({ ...settings, googleAdsWebhookSecret: e.target.value })}
                  placeholder="google_ads_secret_2025"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowKey('googleAdsWebhookSecret')}
                >
                  {showKeys.googleAdsWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-semibold mb-3 text-gray-700">API Method (Optional - Advanced)</p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="googleClientId">Client ID</Label>
                  <Input
                    id="googleClientId"
                    value={settings.googleClientId || ''}
                    onChange={(e) => setSettings({ ...settings, googleClientId: e.target.value })}
                    placeholder="123456789012-abc123.apps.googleusercontent.com"
                  />
                </div>

                <div>
                  <Label htmlFor="googleClientSecret">Client Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      id="googleClientSecret"
                      type={showKeys.googleClientSecret ? 'text' : 'password'}
                      value={settings.googleClientSecret || ''}
                      onChange={(e) => setSettings({ ...settings, googleClientSecret: e.target.value })}
                      placeholder="GOCSPX-..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowKey('googleClientSecret')}
                    >
                      {showKeys.googleClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="googleRefreshToken">Refresh Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="googleRefreshToken"
                      type={showKeys.googleRefreshToken ? 'text' : 'password'}
                      value={settings.googleRefreshToken || ''}
                      onChange={(e) => setSettings({ ...settings, googleRefreshToken: e.target.value })}
                      placeholder="1//..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowKey('googleRefreshToken')}
                    >
                      {showKeys.googleRefreshToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="googleAdsCustomerId">Customer ID</Label>
                  <Input
                    id="googleAdsCustomerId"
                    value={settings.googleAdsCustomerId || ''}
                    onChange={(e) => setSettings({ ...settings, googleAdsCustomerId: e.target.value })}
                    placeholder="123-456-7890"
                  />
                </div>

                <div>
                  <Label htmlFor="googleAdsDeveloperToken">Developer Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="googleAdsDeveloperToken"
                      type={showKeys.googleAdsDeveloperToken ? 'text' : 'password'}
                      value={settings.googleAdsDeveloperToken || ''}
                      onChange={(e) => setSettings({ ...settings, googleAdsDeveloperToken: e.target.value })}
                      placeholder="••••••••"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowKey('googleAdsDeveloperToken')}
                    >
                      {showKeys.googleAdsDeveloperToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Setup Instructions:</strong><br />
                1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">console.cloud.google.com</a><br />
                2. Create project and enable Google Ads API<br />
                3. Webhook URL: <code className="bg-white px-2 py-1 rounded">https://yourdomain.com/api/webhooks/google-ads</code><br />
                4. For API method, complete OAuth flow to get refresh token
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Business Integration */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 rounded-full h-10 w-10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">WhatsApp Business Integration</h2>
                <p className="text-sm text-gray-600">Send messages and capture leads via WhatsApp</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.whatsappEnabled || false}
                onCheckedChange={(checked) => setSettings({ ...settings, whatsappEnabled: checked })}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearKeys('whatsapp')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="whatsappBusinessId">WhatsApp Business Account ID</Label>
              <Input
                id="whatsappBusinessId"
                value={settings.whatsappBusinessId || ''}
                onChange={(e) => setSettings({ ...settings, whatsappBusinessId: e.target.value })}
                placeholder="123456789012345"
              />
            </div>

            <div>
              <Label htmlFor="whatsappPhoneNumberId">Phone Number ID</Label>
              <Input
                id="whatsappPhoneNumberId"
                value={settings.whatsappPhoneNumberId || ''}
                onChange={(e) => setSettings({ ...settings, whatsappPhoneNumberId: e.target.value })}
                placeholder="123456789012345"
              />
            </div>

            <div>
              <Label htmlFor="whatsappAccessToken">Access Token</Label>
              <div className="flex gap-2">
                <Input
                  id="whatsappAccessToken"
                  type={showKeys.whatsappAccessToken ? 'text' : 'password'}
                  value={settings.whatsappAccessToken || ''}
                  onChange={(e) => setSettings({ ...settings, whatsappAccessToken: e.target.value })}
                  placeholder="EAABsbCS1iHgBO..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowKey('whatsappAccessToken')}
                >
                  {showKeys.whatsappAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="whatsappWebhookSecret">Webhook Verify Token (Create your own)</Label>
              <Input
                id="whatsappWebhookSecret"
                value={settings.whatsappWebhookSecret || ''}
                onChange={(e) => setSettings({ ...settings, whatsappWebhookSecret: e.target.value })}
                placeholder="whatsapp_webhook_2025"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Setup Instructions:</strong><br />
                1. Create app at <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a><br />
                2. Add "WhatsApp" product to your app<br />
                3. Set up WhatsApp Business Account<br />
                4. Get Phone Number ID and Access Token<br />
                5. Webhook URL: <code className="bg-white px-2 py-1 rounded">https://yourdomain.com/api/webhooks/whatsapp</code>
              </p>
            </div>
          </div>
        </div>

        {/* Save Button (Bottom) */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-coral hover:bg-coral-600 text-white px-8 py-6 text-lg"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving Changes...' : 'Save All Settings'}
          </Button>
        </div>
      </main>
    </div>
  );
}
