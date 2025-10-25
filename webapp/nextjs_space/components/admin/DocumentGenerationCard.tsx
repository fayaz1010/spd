'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { SldPreviewModal } from './SldPreviewModal';

interface DocumentGenerationCardProps {
  jobId: string;
  jobNumber?: string;
}

interface DocumentOption {
  id: string;
  name: string;
  description: string;
  apiType: string;
  needsState?: boolean;
}

export function DocumentGenerationCard({ jobId, jobNumber }: DocumentGenerationCardProps) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [sldPreview, setSldPreview] = useState<{
    isOpen: boolean;
    svgContent: string;
    fileName: string;
  }>({
    isOpen: false,
    svgContent: '',
    fileName: '',
  });

  const checkJobData = async () => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Job Data:', data);
        setJobData(data);
        alert('Job data logged to console. Press F12 to view.');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
    }
  };

  const documents: DocumentOption[] = [
    {
      id: 'sld',
      name: 'Single Line Diagram (SLD)',
      description: 'Standard professional diagram',
      apiType: 'sld'
    },
    {
      id: 'sld-wp-compliant',
      name: 'SLD - WP Compliant (Enhanced)',
      description: '100% Western Power compliant with footer, legend & specs',
      apiType: 'sld-wp-compliant'
    },
    {
      id: 'coes',
      name: 'Certificate of Electrical Safety (COES)',
      description: 'State electrical compliance certificate',
      apiType: 'certificate',
      needsState: true
    },
    {
      id: 'compliance',
      name: 'CEC Compliance Statement',
      description: 'Required for STC rebate claims',
      apiType: 'compliance'
    },
    {
      id: 'test-results',
      name: 'Test Results & Commissioning',
      description: 'All electrical test results',
      apiType: 'test-results'
    },
    {
      id: 'customer-declaration',
      name: 'Customer Declaration',
      description: 'For STC rebate authorization',
      apiType: 'customer-declaration'
    },
    {
      id: 'commissioning-report',
      name: 'Commissioning Report',
      description: 'Comprehensive installation report',
      apiType: 'commissioning-report'
    },
    {
      id: 'handover',
      name: 'Handover Pack',
      description: 'Complete customer documentation package',
      apiType: 'handover-pack'
    }
  ];

  const handleGenerate = async (doc: DocumentOption) => {
    setGenerating(doc.id);
    try {
      // Map document types to new API endpoints
      const endpointMap: Record<string, string> = {
        'sld': `/api/installer/jobs/${jobId}/documents/sld/generate`,
        'sld-wp-compliant': `/api/installer/jobs/${jobId}/documents/sld/generate`,
        'test-results': `/api/installer/jobs/${jobId}/documents/test-results/generate`,
        'certificate': `/api/installer/jobs/${jobId}/documents/electrical-cert/generate`,
        'compliance': `/api/installer/jobs/${jobId}/documents/compliance/generate`,
        'customer-declaration': `/api/installer/jobs/${jobId}/documents/customer-declaration/generate`,
        'commissioning-report': `/api/installer/jobs/${jobId}/documents/commissioning-report/generate`,
        'handover-pack': `/api/installer/jobs/${jobId}/documents/handover-pack/generate`,
      };

      const endpoint = endpointMap[doc.apiType] || '/api/documents/generate';
      
      // Get admin token
      const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        throw new Error(error.error || error.details || 'Failed to generate document');
      }

      // New API returns JSON with pdfUrl
      const result = await response.json();
      console.log('API Result:', result);

      if (result.success && result.pdfUrl) {
        // Handle data URL (base64 PDF)
        if (result.pdfUrl.startsWith('data:application/pdf')) {
          // Convert data URL to blob
          const base64 = result.pdfUrl.split(',')[1];
          const binaryString = window.atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          
          // Open in new tab
          window.open(url, '_blank');
          
          // Also trigger download
          const a = document.createElement('a');
          a.href = url;
          a.download = `${doc.id}-${jobNumber || jobId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          toast.success(`${doc.name} generated! Opening in new tab...`);
        } else {
          // Regular URL - open in new tab
          window.open(result.pdfUrl, '_blank');
          toast.success(`${doc.name} generated!`);
        }
      } else if (result.svgUrl) {
        // Handle SVG for SLD
        window.open(result.svgUrl, '_blank');
        toast.success(`${doc.name} generated!`);
      } else {
        throw new Error('No document URL in response');
      }
    } catch (error: any) {
      console.error('Error generating document:', error);
      toast.error(error.message || 'Failed to generate document');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Generate Documents
          </span>
          <Badge className="bg-blue-600">
            Auto-Generate
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <strong>Quick Generate:</strong> Click any button below to automatically generate professional compliance documents.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={checkJobData}
              className="text-xs"
            >
              Debug Job Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((doc) => (
            <div key={doc.id} className="border rounded-lg p-4 space-y-3 hover:border-blue-300 transition-colors">
              <div>
                <div className="font-medium text-sm mb-1">{doc.name}</div>
                <p className="text-xs text-gray-500">{doc.description}</p>
              </div>
              <Button
                onClick={() => handleGenerate(doc)}
                disabled={generating === doc.id}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {generating === doc.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mt-4">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <strong>Note:</strong> Generated documents will download automatically. You can also upload them to Stage 26 for record keeping.
          </p>
        </div>
      </CardContent>

      {/* SLD Preview Modal */}
      <SldPreviewModal
        isOpen={sldPreview.isOpen}
        onClose={() => setSldPreview({ isOpen: false, svgContent: '', fileName: '' })}
        svgContent={sldPreview.svgContent}
        fileName={sldPreview.fileName}
        jobNumber={jobNumber || jobId}
      />
    </Card>
  );
}
