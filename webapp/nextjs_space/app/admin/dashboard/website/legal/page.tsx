'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Eye,
  Shield,
  FileText,
  Cookie,
  RefreshCw,
  Map
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LegalDocuments {
  privacyPolicy: string;
  termsConditions: string;
  cookiePolicy: string;
  lastUpdated: string;
}

export default function ManageLegalDocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [documents, setDocuments] = useState<LegalDocuments>({
    privacyPolicy: '',
    termsConditions: '',
    cookiePolicy: '',
    lastUpdated: new Date().toISOString(),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/legal-documents');
      const data = await response.json();
      
      if (data.success && data.documents) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load legal documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/legal-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...documents,
          lastUpdated: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Legal documents saved successfully!');
        loadData();
      } else {
        toast.error('Failed to save legal documents');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save legal documents');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSitemap = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/admin/generate-sitemap', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Sitemap generated successfully!');
      } else {
        toast.error('Failed to generate sitemap');
      }
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast.error('Failed to generate sitemap');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/dashboard/website')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website Management
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Legal Documents & Compliance</h1>
              <p className="text-gray-600 mt-1">Manage privacy policy, terms & conditions, and cookie consent</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleGenerateSitemap}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Sitemap
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-coral hover:bg-coral/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="privacy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy Policy
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Terms & Conditions
            </TabsTrigger>
            <TabsTrigger value="cookies" className="flex items-center gap-2">
              <Cookie className="w-4 h-4" />
              Cookie Policy
            </TabsTrigger>
            <TabsTrigger value="sitemap" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Sitemap
            </TabsTrigger>
          </TabsList>

          {/* Privacy Policy Tab */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Privacy Policy
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/privacy-policy', '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={documents.privacyPolicy}
                  onChange={(e) => setDocuments({ ...documents, privacyPolicy: e.target.value })}
                  rows={20}
                  placeholder="Enter your privacy policy content here (supports Markdown)..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {new Date(documents.lastUpdated).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms & Conditions Tab */}
          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Terms & Conditions
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/terms-conditions', '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={documents.termsConditions}
                  onChange={(e) => setDocuments({ ...documents, termsConditions: e.target.value })}
                  rows={20}
                  placeholder="Enter your terms and conditions content here (supports Markdown)..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {new Date(documents.lastUpdated).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cookie Policy Tab */}
          <TabsContent value="cookies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Cookie className="w-5 h-5 text-orange-600" />
                    Cookie Policy & Consent
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/cookie-policy', '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={documents.cookiePolicy}
                  onChange={(e) => setDocuments({ ...documents, cookiePolicy: e.target.value })}
                  rows={20}
                  placeholder="Enter your cookie policy content here (supports Markdown)..."
                  className="font-mono text-sm"
                />
                <div className="bg-orange-50 border-l-4 border-orange-600 p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Cookie Consent Banner:</strong> A cookie consent banner will automatically appear on your website for first-time visitors. Users can accept or decline non-essential cookies.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sitemap Tab */}
          <TabsContent value="sitemap">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-purple-600" />
                    Sitemap Management
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/sitemap-page', '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Sitemap
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/sitemap.xml', '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      XML Sitemap
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Automatic Sitemap Generation</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Click the "Generate Sitemap" button to automatically create an XML sitemap for search engines. This will scan all your public pages and create a sitemap.xml file.
                  </p>
                  <Button
                    onClick={handleGenerateSitemap}
                    disabled={generating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Sitemap...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generate XML Sitemap Now
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Visual Sitemap</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      User-friendly sitemap page for website visitors
                    </p>
                    <a href="/sitemap-page" target="_blank" className="text-coral hover:text-coral-600 text-sm font-semibold">
                      View Sitemap Page →
                    </a>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">XML Sitemap</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      SEO-optimized sitemap for search engines
                    </p>
                    <a href="/sitemap.xml" target="_blank" className="text-coral hover:text-coral-600 text-sm font-semibold">
                      View XML Sitemap →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Box */}
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-700">
              <strong>Legal Disclaimer:</strong> These templates are provided as a starting point. Please consult with a legal professional to ensure compliance with Australian Privacy Principles (APPs), Australian Consumer Law, and other applicable regulations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
