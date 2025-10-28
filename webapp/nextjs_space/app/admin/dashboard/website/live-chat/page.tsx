'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft,
  Save,
  Bot,
  Brain,
  UserCheck,
  MessageSquare,
  CheckCircle,
  Zap,
  Book
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AILiveChatSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const [apiKeysStatus, setApiKeysStatus] = useState<Record<string, boolean>>({});

  // AI Chat Settings
  const [enabled, setEnabled] = useState(true);
  const [aiModel, setAiModel] = useState('gpt-4');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('500');
  
  // Knowledge Base
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [productInfo, setProductInfo] = useState('');
  const [pricingInfo, setPricingInfo] = useState('');
  
  // Staff Override
  const [staffOverrideEnabled, setStaffOverrideEnabled] = useState(true);
  const [autoTransferToStaff, setAutoTransferToStaff] = useState(false);
  const [transferKeywords, setTransferKeywords] = useState('');
  const [notifyStaffOnChat, setNotifyStaffOnChat] = useState(true);
  
  // Display Settings
  const [position, setPosition] = useState('bottom-right');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [aiName, setAiName] = useState('Solar Assistant');
  const [showOnMobile, setShowOnMobile] = useState(true);
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoOpenDelay, setAutoOpenDelay] = useState('5');

  useEffect(() => {
    fetchSettings();
    fetchApiKeysStatus();
  }, []);

  const fetchApiKeysStatus = async () => {
    try {
      const res = await fetch('/api/admin/settings/api');
      const data = await res.json();
      if (data) {
        setApiKeysStatus({
          'gpt-4': !!data.geminiEnabled && !!data.geminiApiKey,
          'gpt-4-turbo': !!data.geminiEnabled && !!data.geminiApiKey,
          'gpt-3.5-turbo': !!data.geminiEnabled && !!data.geminiApiKey,
          'claude-3': !!data.geminiEnabled && !!data.geminiApiKey,
        });
      }
    } catch (error) {
      console.error('Error fetching API keys status:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/website/live-chat-settings');
      const data = await res.json();

      if (data) {
        setEnabled(data.enabled !== undefined ? data.enabled : true);
        setAiModel(data.aiModel || 'gpt-4');
        setSystemPrompt(data.systemPrompt || '');
        setTemperature(data.temperature?.toString() || '0.7');
        setMaxTokens(data.maxTokens?.toString() || '500');
        setKnowledgeBase(data.knowledgeBase || '');
        setCompanyInfo(data.companyInfo || '');
        setProductInfo(data.productInfo || '');
        setPricingInfo(data.pricingInfo || '');
        setStaffOverrideEnabled(data.staffOverrideEnabled !== undefined ? data.staffOverrideEnabled : true);
        setAutoTransferToStaff(data.autoTransferToStaff || false);
        setTransferKeywords(data.transferKeywords || '');
        setNotifyStaffOnChat(data.notifyStaffOnChat !== undefined ? data.notifyStaffOnChat : true);
        setPosition(data.position || 'bottom-right');
        setWelcomeMessage(data.welcomeMessage || 'Hi! I\'m your Solar Assistant. How can I help you today?');
        setAiName(data.aiName || 'Solar Assistant');
        setShowOnMobile(data.showOnMobile !== undefined ? data.showOnMobile : true);
        setAutoOpen(data.autoOpen || false);
        setAutoOpenDelay(data.autoOpenDelay?.toString() || '5');
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
      const res = await fetch('/api/admin/website/live-chat-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          aiModel,
          systemPrompt,
          temperature: parseFloat(temperature),
          maxTokens: parseInt(maxTokens),
          knowledgeBase,
          companyInfo,
          productInfo,
          pricingInfo,
          staffOverrideEnabled,
          autoTransferToStaff,
          transferKeywords,
          notifyStaffOnChat,
          position,
          welcomeMessage,
          aiName,
          showOnMobile,
          autoOpen,
          autoOpenDelay: parseInt(autoOpenDelay),
        }),
      });

      if (res.ok) {
        toast.success('AI Chat settings saved successfully');
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="w-8 h-8 text-blue-600" />
              AI Live Chat Settings
            </h1>
            <p className="text-gray-600">Configure AI assistant, knowledge base, and staff override</p>
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
              <CardTitle>AI Chat Status</CardTitle>
              <CardDescription>Enable or disable AI chat assistant on your website</CardDescription>
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

      {/* AI Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Model Configuration
          </CardTitle>
          <CardDescription>Configure AI model and behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>AI Model</Label>
              <Link href="/admin/dashboard/settings/api" className="text-xs text-blue-600 hover:underline">
                Configure API Keys →
              </Link>
            </div>
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">
                  <div className="flex items-center gap-2">
                    <span>GPT-4 (Most Capable)</span>
                    {apiKeysStatus['gpt-4'] ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <span className="text-red-600 text-xs">⚠ No API Key</span>
                    }
                  </div>
                </SelectItem>
                <SelectItem value="gpt-4-turbo">
                  <div className="flex items-center gap-2">
                    <span>GPT-4 Turbo (Faster)</span>
                    {apiKeysStatus['gpt-4-turbo'] ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <span className="text-red-600 text-xs">⚠ No API Key</span>
                    }
                  </div>
                </SelectItem>
                <SelectItem value="gpt-3.5-turbo">
                  <div className="flex items-center gap-2">
                    <span>GPT-3.5 Turbo (Cost Effective)</span>
                    {apiKeysStatus['gpt-3.5-turbo'] ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <span className="text-red-600 text-xs">⚠ No API Key</span>
                    }
                  </div>
                </SelectItem>
                <SelectItem value="claude-3">
                  <div className="flex items-center gap-2">
                    <span>Claude 3 (Alternative)</span>
                    {apiKeysStatus['claude-3'] ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <span className="text-red-600 text-xs">⚠ No API Key</span>
                    }
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 mt-1">Select the AI model for chat responses (maps to Gemini API)</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>System Prompt</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{systemPrompt.length} characters</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedPrompt(!expandedPrompt)}
                >
                  {expandedPrompt ? 'Collapse' : 'Expand'}
                </Button>
              </div>
            </div>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={expandedPrompt ? 30 : 8}
              className="font-mono text-sm"
              placeholder="You are a helpful solar energy assistant for Sun Direct Power. You help customers understand solar systems, pricing, and installation processes."
            />
            <p className="text-xs text-gray-600 mt-1">Define the AI's role and behavior. This is the complete system prompt loaded from the database.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Temperature (0-1)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
              <p className="text-xs text-gray-600 mt-1">Lower = more focused, Higher = more creative</p>
            </div>
            <div>
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
              />
              <p className="text-xs text-gray-600 mt-1">Maximum response length</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="w-5 h-5 text-blue-600" />
            Knowledge Base
          </CardTitle>
          <CardDescription>Provide information for the AI to reference</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Company Information</Label>
            <Textarea
              value={companyInfo}
              onChange={(e) => setCompanyInfo(e.target.value)}
              rows={3}
              placeholder="Sun Direct Power is Western Australia's leading solar installation company. We specialize in residential and commercial solar systems..."
            />
            <p className="text-xs text-gray-600 mt-1">Company background, services, and values</p>
          </div>

          <div>
            <Label>Product Information</Label>
            <Textarea
              value={productInfo}
              onChange={(e) => setProductInfo(e.target.value)}
              rows={3}
              placeholder="We offer premium solar panels (Tier 1), hybrid inverters (Fronius, Alpha ESS), and battery systems (BYD, Tesla)..."
            />
            <p className="text-xs text-gray-600 mt-1">Products, brands, and specifications</p>
          </div>

          <div>
            <Label>Pricing Information</Label>
            <Textarea
              value={pricingInfo}
              onChange={(e) => setPricingInfo(e.target.value)}
              rows={3}
              placeholder="6.6kW system starts from $4,500. 10kW system from $7,000. Battery systems from $8,000. Includes installation and warranty..."
            />
            <p className="text-xs text-gray-600 mt-1">Pricing ranges and packages</p>
          </div>

          <div>
            <Label>General Knowledge Base</Label>
            <Textarea
              value={knowledgeBase}
              onChange={(e) => setKnowledgeBase(e.target.value)}
              rows={4}
              placeholder="FAQs, policies, installation process, warranty information, rebates, financing options..."
            />
            <p className="text-xs text-gray-600 mt-1">Additional information, FAQs, and policies</p>
          </div>
        </CardContent>
      </Card>

      {/* Staff Override */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-orange-600" />
            Staff Override & Handoff
          </CardTitle>
          <CardDescription>Allow staff to take over from AI and manage chats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div>
              <Label className="text-base font-semibold">Enable Staff Override</Label>
              <p className="text-sm text-gray-600">Allow staff to pause AI and take over conversations</p>
            </div>
            <Switch
              checked={staffOverrideEnabled}
              onCheckedChange={setStaffOverrideEnabled}
            />
          </div>

          {staffOverrideEnabled && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Transfer to Staff</Label>
                  <p className="text-sm text-gray-600">Automatically notify staff when keywords detected</p>
                </div>
                <Switch
                  checked={autoTransferToStaff}
                  onCheckedChange={setAutoTransferToStaff}
                />
              </div>

              {autoTransferToStaff && (
                <div>
                  <Label>Transfer Keywords</Label>
                  <Input
                    value={transferKeywords}
                    onChange={(e) => setTransferKeywords(e.target.value)}
                    placeholder="quote, pricing, urgent, complaint, manager"
                  />
                  <p className="text-xs text-gray-600 mt-1">Comma-separated keywords that trigger staff notification</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify Staff on New Chat</Label>
                  <p className="text-sm text-gray-600">Alert staff when a new chat session starts</p>
                </div>
                <Switch
                  checked={notifyStaffOnChat}
                  onCheckedChange={setNotifyStaffOnChat}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Staff Override Features:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Staff can click "Take Over" button to pause AI</li>
                  <li>• AI responses stop, staff can chat directly</li>
                  <li>• Staff can resume AI at any time</li>
                  <li>• Chat history preserved during handoff</li>
                  <li>• Staff availability status shown to customers</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Display Settings
          </CardTitle>
          <CardDescription>Customize chat widget appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>AI Assistant Name</Label>
            <Input
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              placeholder="Solar Assistant"
            />
            <p className="text-xs text-gray-600 mt-1">Name shown to customers</p>
          </div>

          <div>
            <Label>Welcome Message</Label>
            <Textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={2}
              placeholder="Hi! I'm your Solar Assistant. How can I help you today?"
            />
          </div>

          <div>
            <Label>Widget Position</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show on Mobile</Label>
              <p className="text-sm text-gray-600">Display chat on mobile devices</p>
            </div>
            <Switch
              checked={showOnMobile}
              onCheckedChange={setShowOnMobile}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Open</Label>
              <p className="text-sm text-gray-600">Automatically open chat after delay</p>
            </div>
            <Switch
              checked={autoOpen}
              onCheckedChange={setAutoOpen}
            />
          </div>

          {autoOpen && (
            <div>
              <Label>Auto Open Delay (seconds)</Label>
              <Input
                type="number"
                value={autoOpenDelay}
                onChange={(e) => setAutoOpenDelay(e.target.value)}
                min="1"
                max="60"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Zap className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2 text-lg">AI Chat Best Practices</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• <strong>System Prompt:</strong> Define clear role and boundaries for the AI</li>
                <li>• <strong>Knowledge Base:</strong> Keep information current and accurate</li>
                <li>• <strong>Staff Override:</strong> Monitor AI conversations and intervene when needed</li>
                <li>• <strong>Temperature:</strong> Use 0.7 for balanced responses (0.3 for precise, 0.9 for creative)</li>
                <li>• <strong>Keywords:</strong> Set up auto-transfer for complex queries requiring human expertise</li>
                <li>• <strong>Testing:</strong> Regularly test AI responses and update knowledge base</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
