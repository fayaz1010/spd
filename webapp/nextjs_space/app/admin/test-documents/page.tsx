'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function TestDocumentsPage() {
  const [jobId, setJobId] = useState('');
  const [documentType, setDocumentType] = useState('sld');
  const [state, setState] = useState('WA');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

  const handleGenerate = async () => {
    if (!jobId) {
      setResult({ success: false, message: 'Please enter a Job ID' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const body: any = {
        jobId,
        documentType,
      };

      if (documentType === 'certificate') {
        body.state = state;
      }

      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // Get the PDF blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentType}-${jobId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setResult({
          success: true,
          message: `✅ ${documentType.toUpperCase()} generated successfully! Check your downloads.`,
          url,
        });
      } else {
        const error = await response.json();
        setResult({
          success: false,
          message: `❌ Error: ${error.error || 'Failed to generate document'}`,
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `❌ Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Document Generation Test</h1>
          <p className="text-gray-600">
            Test the SLD and other document generation functionality
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate Document</CardTitle>
            <CardDescription>
              Enter a job ID from the seeded data to test document generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job ID Input */}
            <div className="space-y-2">
              <Label htmlFor="jobId">Job ID</Label>
              <Input
                id="jobId"
                placeholder="Enter job ID (e.g., from seeded data)"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Use the job ID from the seeded Sarah Johnson installation
              </p>
            </div>

            {/* Document Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sld">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Single Line Diagram (SLD)
                    </div>
                  </SelectItem>
                  <SelectItem value="certificate">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Electrical Certificate (COES)
                    </div>
                  </SelectItem>
                  <SelectItem value="compliance">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Compliance Statement
                    </div>
                  </SelectItem>
                  <SelectItem value="test-results">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Test Results Form
                    </div>
                  </SelectItem>
                  <SelectItem value="customer-declaration">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Customer Declaration
                    </div>
                  </SelectItem>
                  <SelectItem value="handover-pack">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Handover Pack
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* State Selection (only for certificates) */}
            {documentType === 'certificate' && (
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WA">Western Australia (WA)</SelectItem>
                    <SelectItem value="VIC">Victoria (VIC)</SelectItem>
                    <SelectItem value="NSW">New South Wales (NSW)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !jobId}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate & Download PDF
                </>
              )}
            </Button>

            {/* Result Message */}
            {result && (
              <div
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        result.success ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Step 1: Get Job ID</h3>
              <p className="text-sm text-gray-600">
                Run the seeding script to create test data:
              </p>
              <code className="block mt-2 p-3 bg-gray-100 rounded text-sm">
                npx tsx prisma/seed-completed-simple.ts
              </code>
              <p className="text-sm text-gray-600 mt-2">
                The script will output a Job ID. Copy it and paste above.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 2: Select Document Type</h3>
              <p className="text-sm text-gray-600">
                Choose which document you want to generate:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li><strong>SLD:</strong> Single Line Diagram (for grid connection)</li>
                <li><strong>Certificate:</strong> State-specific COES</li>
                <li><strong>Compliance:</strong> CEC compliance statement</li>
                <li><strong>Test Results:</strong> Electrical test results</li>
                <li><strong>Customer Declaration:</strong> For STC rebates</li>
                <li><strong>Handover Pack:</strong> Complete documentation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 3: Generate</h3>
              <p className="text-sm text-gray-600">
                Click "Generate & Download PDF" and the document will automatically download.
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">What to Check</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>PDF opens correctly</li>
                <li>All information is populated</li>
                <li>Diagram is professional and clear (for SLD)</li>
                <li>Compliance notes are included</li>
                <li>Company branding is present</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
