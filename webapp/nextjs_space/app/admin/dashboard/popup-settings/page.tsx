'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Calculator,
  Smartphone,
  Info,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';

interface PopupSettings {
  // Calculate My System Popup
  calculatePopup: {
    enabled: boolean;
    showOnPages: string[]; // Array of page paths
    excludePages: string[]; // Array of page paths to exclude
    showAfterSeconds: number; // Delay before showing
    showOnScrollPercent: number; // Show after scrolling X%
    showOnExitIntent: boolean; // Show when user tries to leave
    title: string;
    description: string;
    buttonText: string;
    targetUrl: string;
    // Location-based
    showInPerth: boolean;
    showInWA: boolean;
    showNationwide: boolean;
    // Device-based
    showOnDesktop: boolean;
    showOnMobile: boolean;
    showOnTablet: boolean;
  };
  
  // Install App Popup (PWA)
  installAppPopup: {
    enabled: boolean;
    showOnPages: string[]; // Array of page paths
    excludePages: string[]; // Array of page paths to exclude
    showAfterSeconds: number;
    showAfterVisits: number; // Show after X visits
    title: string;
    description: string;
    buttonText: string;
    // Only show on admin/installer pages
    adminOnly: boolean;
    installerOnly: boolean;
    // Device-based
    showOnDesktop: boolean;
    showOnMobile: boolean;
    showOnTablet: boolean;
  };
}

export default function PopupSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPage, setNewPage] = useState('');
  const [newExcludePage, setNewExcludePage] = useState('');
  const [activePopup, setActivePopup] = useState<'calculate' | 'install'>('calculate');
  
  const [settings, setSettings] = useState<PopupSettings>({
    calculatePopup: {
      enabled: true,
      showOnPages: ['/', '/about', '/services', '/contact'],
      excludePages: ['/calculator', '/calculator-v2', '/admin'],
      showAfterSeconds: 5,
      showOnScrollPercent: 50,
      showOnExitIntent: true,
      title: 'Get Your Solar Quote',
      description: 'Ready for a complete solar system? Get a personalized quote in minutes!',
      buttonText: 'Calculate My System',
      targetUrl: '/calculator-v2',
      showInPerth: true,
      showInWA: true,
      showNationwide: true,
      showOnDesktop: true,
      showOnMobile: true,
      showOnTablet: true,
    },
    installAppPopup: {
      enabled: true,
      showOnPages: ['/admin', '/installer'],
      excludePages: [],
      showAfterSeconds: 10,
      showAfterVisits: 2,
      title: 'Install Installer App',
      description: 'Install the app for offline access, faster loading, and a better experience.',
      buttonText: 'Install',
      adminOnly: true,
      installerOnly: true,
      showOnDesktop: true,
      showOnMobile: true,
      showOnTablet: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/popup-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching popup settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/popup-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Popup settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const addPage = (type: 'calculate' | 'install', isExclude: boolean = false) => {
    const page = isExclude ? newExcludePage : newPage;
    if (!page.trim()) return;

    if (type === 'calculate') {
      if (isExclude) {
        setSettings({
          ...settings,
          calculatePopup: {
            ...settings.calculatePopup,
            excludePages: [...settings.calculatePopup.excludePages, page],
          },
        });
        setNewExcludePage('');
      } else {
        setSettings({
          ...settings,
          calculatePopup: {
            ...settings.calculatePopup,
            showOnPages: [...settings.calculatePopup.showOnPages, page],
          },
        });
        setNewPage('');
      }
    } else {
      if (isExclude) {
        setSettings({
          ...settings,
          installAppPopup: {
            ...settings.installAppPopup,
            excludePages: [...settings.installAppPopup.excludePages, page],
          },
        });
        setNewExcludePage('');
      } else {
        setSettings({
          ...settings,
          installAppPopup: {
            ...settings.installAppPopup,
            showOnPages: [...settings.installAppPopup.showOnPages, page],
          },
        });
        setNewPage('');
      }
    }
  };

  const removePage = (type: 'calculate' | 'install', page: string, isExclude: boolean = false) => {
    if (type === 'calculate') {
      if (isExclude) {
        setSettings({
          ...settings,
          calculatePopup: {
            ...settings.calculatePopup,
            excludePages: settings.calculatePopup.excludePages.filter(p => p !== page),
          },
        });
      } else {
        setSettings({
          ...settings,
          calculatePopup: {
            ...settings.calculatePopup,
            showOnPages: settings.calculatePopup.showOnPages.filter(p => p !== page),
          },
        });
      }
    } else {
      if (isExclude) {
        setSettings({
          ...settings,
          installAppPopup: {
            ...settings.installAppPopup,
            excludePages: settings.installAppPopup.excludePages.filter(p => p !== page),
          },
        });
      } else {
        setSettings({
          ...settings,
          installAppPopup: {
            ...settings.installAppPopup,
            showOnPages: settings.installAppPopup.showOnPages.filter(p => p !== page),
          },
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const currentSettings = activePopup === 'calculate' ? settings.calculatePopup : settings.installAppPopup;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/dashboard/settings')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                  Popup Settings
                </h1>
                <p className="text-gray-600 mt-1">
                  Control when and where popups appear on your website
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About Popup Settings:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Control which pages show the "Calculate My System" and "Install App" popups</li>
                <li>Set timing, location, and device-based rules</li>
                <li>Changes take effect immediately on the website</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Popup Type Selector */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activePopup === 'calculate' ? 'default' : 'outline'}
            onClick={() => setActivePopup('calculate')}
            className="flex-1"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate My System
          </Button>
          <Button
            variant={activePopup === 'install' ? 'default' : 'outline'}
            onClick={() => setActivePopup('install')}
            className="flex-1"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Install App (PWA)
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>
                Enable/disable and configure popup content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">Enable Popup</Label>
                <Switch
                  id="enabled"
                  checked={currentSettings.enabled}
                  onCheckedChange={(checked) => {
                    if (activePopup === 'calculate') {
                      setSettings({
                        ...settings,
                        calculatePopup: { ...settings.calculatePopup, enabled: checked },
                      });
                    } else {
                      setSettings({
                        ...settings,
                        installAppPopup: { ...settings.installAppPopup, enabled: checked },
                      });
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="title">Popup Title</Label>
                <Input
                  id="title"
                  value={currentSettings.title}
                  onChange={(e) => {
                    if (activePopup === 'calculate') {
                      setSettings({
                        ...settings,
                        calculatePopup: { ...settings.calculatePopup, title: e.target.value },
                      });
                    } else {
                      setSettings({
                        ...settings,
                        installAppPopup: { ...settings.installAppPopup, title: e.target.value },
                      });
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={currentSettings.description}
                  onChange={(e) => {
                    if (activePopup === 'calculate') {
                      setSettings({
                        ...settings,
                        calculatePopup: { ...settings.calculatePopup, description: e.target.value },
                      });
                    } else {
                      setSettings({
                        ...settings,
                        installAppPopup: { ...settings.installAppPopup, description: e.target.value },
                      });
                    }
                  }}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="buttonText">Button Text</Label>
                <Input
                  id="buttonText"
                  value={currentSettings.buttonText}
                  onChange={(e) => {
                    if (activePopup === 'calculate') {
                      setSettings({
                        ...settings,
                        calculatePopup: { ...settings.calculatePopup, buttonText: e.target.value },
                      });
                    } else {
                      setSettings({
                        ...settings,
                        installAppPopup: { ...settings.installAppPopup, buttonText: e.target.value },
                      });
                    }
                  }}
                />
              </div>

              {activePopup === 'calculate' && (
                <div>
                  <Label htmlFor="targetUrl">Target URL</Label>
                  <Input
                    id="targetUrl"
                    value={settings.calculatePopup.targetUrl}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        calculatePopup: { ...settings.calculatePopup, targetUrl: e.target.value },
                      });
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Timing & Behavior</CardTitle>
              <CardDescription>
                When to show the popup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="showAfterSeconds">Show After (seconds)</Label>
                <Input
                  id="showAfterSeconds"
                  type="number"
                  value={currentSettings.showAfterSeconds}
                  onChange={(e) => {
                    if (activePopup === 'calculate') {
                      setSettings({
                        ...settings,
                        calculatePopup: { ...settings.calculatePopup, showAfterSeconds: parseInt(e.target.value) },
                      });
                    } else {
                      setSettings({
                        ...settings,
                        installAppPopup: { ...settings.installAppPopup, showAfterSeconds: parseInt(e.target.value) },
                      });
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Delay before showing popup (0 = immediate)
                </p>
              </div>

              {activePopup === 'calculate' && (
                <>
                  <div>
                    <Label htmlFor="showOnScrollPercent">Show After Scroll (%)</Label>
                    <Input
                      id="showOnScrollPercent"
                      type="number"
                      value={settings.calculatePopup.showOnScrollPercent}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          calculatePopup: { ...settings.calculatePopup, showOnScrollPercent: parseInt(e.target.value) },
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Show after user scrolls X% down the page
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showOnExitIntent">Show on Exit Intent</Label>
                    <Switch
                      id="showOnExitIntent"
                      checked={settings.calculatePopup.showOnExitIntent}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          calculatePopup: { ...settings.calculatePopup, showOnExitIntent: checked },
                        });
                      }}
                    />
                  </div>
                </>
              )}

              {activePopup === 'install' && (
                <div>
                  <Label htmlFor="showAfterVisits">Show After Visits</Label>
                  <Input
                    id="showAfterVisits"
                    type="number"
                    value={settings.installAppPopup.showAfterVisits}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        installAppPopup: { ...settings.installAppPopup, showAfterVisits: parseInt(e.target.value) },
                      });
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Show after user has visited X times
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Page Rules */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Page Rules</CardTitle>
              <CardDescription>
                Control which pages show or hide the popup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Show On Pages */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Show On Pages</Label>
                  <div className="space-y-2 mb-3">
                    {currentSettings.showOnPages.map((page) => (
                      <div key={page} className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
                        <span className="text-sm font-mono">{page}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removePage(activePopup, page, false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="/page-path"
                      value={newPage}
                      onChange={(e) => setNewPage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addPage(activePopup, false);
                        }
                      }}
                    />
                    <Button onClick={() => addPage(activePopup, false)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Add page paths (e.g., /, /about, /services)
                  </p>
                </div>

                {/* Exclude Pages */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Exclude Pages</Label>
                  <div className="space-y-2 mb-3">
                    {currentSettings.excludePages.map((page) => (
                      <div key={page} className="flex items-center justify-between bg-red-50 border border-red-200 rounded px-3 py-2">
                        <span className="text-sm font-mono">{page}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removePage(activePopup, page, true)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="/page-path"
                      value={newExcludePage}
                      onChange={(e) => setNewExcludePage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addPage(activePopup, true);
                        }
                      }}
                    />
                    <Button onClick={() => addPage(activePopup, true)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Pages where popup will NOT show
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device & Location Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Device Settings</CardTitle>
              <CardDescription>
                Control which devices show the popup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showOnDesktop">Show on Desktop</Label>
                <Switch
                  id="showOnDesktop"
                  checked={currentSettings.showOnDesktop}
                  onCheckedChange={(checked) => {
                    if (activePopup === 'calculate') {
                      setSettings({
                        ...settings,
                        calculatePopup: { ...settings.calculatePopup, showOnDesktop: checked },
                      });
                    } else {
                      setSettings({
                        ...settings,
                        installAppPopup: { ...settings.installAppPopup, showOnDesktop: checked },
                      });
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showOnMobile">Show on Mobile</Label>
                <Switch
                  id="showOnMobile"
                  checked={currentSettings.showOnMobile}
                  onCheckedChange={(checked) => {
                    if (activePopup === 'calculate') {
                      setSettings({
                        ...settings,
                        calculatePopup: { ...settings.calculatePopup, showOnMobile: checked },
                      });
                    } else {
                      setSettings({
                        ...settings,
                        installAppPopup: { ...settings.installAppPopup, showOnMobile: checked },
                      });
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showOnTablet">Show on Tablet</Label>
                <Switch
                  id="showOnTablet"
                  checked={currentSettings.showOnTablet}
                  onCheckedChange={(checked) => {
                    if (activePopup === 'calculate') {
                      setSettings({
                        ...settings,
                        calculatePopup: { ...settings.calculatePopup, showOnTablet: checked },
                      });
                    } else {
                      setSettings({
                        ...settings,
                        installAppPopup: { ...settings.installAppPopup, showOnTablet: checked },
                      });
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location & User Settings */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activePopup === 'calculate' ? 'Location Settings' : 'User Settings'}
              </CardTitle>
              <CardDescription>
                {activePopup === 'calculate' 
                  ? 'Control which locations see the popup'
                  : 'Control which users see the popup'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activePopup === 'calculate' ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showInPerth">Show in Perth</Label>
                    <Switch
                      id="showInPerth"
                      checked={settings.calculatePopup.showInPerth}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          calculatePopup: { ...settings.calculatePopup, showInPerth: checked },
                        });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showInWA">Show in WA</Label>
                    <Switch
                      id="showInWA"
                      checked={settings.calculatePopup.showInWA}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          calculatePopup: { ...settings.calculatePopup, showInWA: checked },
                        });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showNationwide">Show Nationwide</Label>
                    <Switch
                      id="showNationwide"
                      checked={settings.calculatePopup.showNationwide}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          calculatePopup: { ...settings.calculatePopup, showNationwide: checked },
                        });
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="adminOnly">Admin Users Only</Label>
                    <Switch
                      id="adminOnly"
                      checked={settings.installAppPopup.adminOnly}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          installAppPopup: { ...settings.installAppPopup, adminOnly: checked },
                        });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="installerOnly">Installer Users Only</Label>
                    <Switch
                      id="installerOnly"
                      checked={settings.installAppPopup.installerOnly}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          installAppPopup: { ...settings.installAppPopup, installerOnly: checked },
                        });
                      }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Warning Box */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Changes take effect immediately on the website</li>
                <li>Popups respect user dismissals (won't show again if closed)</li>
                <li>Test on different devices and pages after saving</li>
                <li>Exit intent only works on desktop browsers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
