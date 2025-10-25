'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  type: string;
  name: string;
  description: string;
  pdfUrl?: string;
  svgUrl?: string;
  generatedAt: Date;
  generatedBy?: string;
  status: string;
}

interface GeneratedDocumentsListProps {
  jobId: string;
}

export function GeneratedDocumentsList({ jobId }: GeneratedDocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, completed: 0, draft: 0, submitted: 0 });

  useEffect(() => {
    fetchDocuments();
  }, [jobId]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/installer/jobs/${jobId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (doc: Document) => {
    if (!doc.pdfUrl) {
      toast.error('Document not available');
      return;
    }

    // Handle data URL
    if (doc.pdfUrl.startsWith('data:application/pdf')) {
      const base64 = doc.pdfUrl.split(',')[1];
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else {
      window.open(doc.pdfUrl, '_blank');
    }
  };

  const handleDownload = (doc: Document) => {
    if (!doc.pdfUrl) {
      toast.error('Document not available');
      return;
    }

    try {
      if (doc.pdfUrl.startsWith('data:application/pdf')) {
        const base64 = doc.pdfUrl.split(',')[1];
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.name}.pdf`;
        a.click();
        
        toast.success('Document downloaded');
      } else {
        window.open(doc.pdfUrl, '_blank');
        toast.success('Document opened');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SIGNED':
        return <Badge className="bg-green-100 text-green-800">✓ Complete</Badge>;
      case 'SUBMITTED':
      case 'DELIVERED':
        return <Badge className="bg-blue-100 text-blue-800">✓ Submitted</Badge>;
      case 'DRAFT':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'SINGLE_LINE_DIAGRAM':
        return '📐';
      case 'TEST_RESULTS':
        return '⚡';
      case 'ELECTRICAL_CERTIFICATE':
        return '📜';
      case 'COMPLIANCE_STATEMENT':
        return '✓';
      case 'CUSTOMER_DECLARATION':
        return '✍️';
      case 'HANDOVER_PACK':
        return '📦';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generated Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">No Documents Yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Use the "Generate Documents" section above to create compliance documents.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generated Documents
          </span>
          <Button variant="outline" size="sm" onClick={fetchDocuments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
            <div className="text-xs text-gray-600">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.draft}</div>
            <div className="text-xs text-gray-600">Draft</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.submitted}</div>
            <div className="text-xs text-gray-600">Submitted</div>
          </div>
        </div>

        {/* Document List */}
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-3xl">{getDocumentIcon(doc.type)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{doc.name}</h4>
                    {getStatusBadge(doc.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                  <div className="text-xs text-gray-500">
                    Generated {new Date(doc.generatedAt).toLocaleString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {doc.pdfUrl && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(doc)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
