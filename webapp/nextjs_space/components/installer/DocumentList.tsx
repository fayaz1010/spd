'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface DocumentListProps {
  jobId: string;
  onDocumentGenerated?: () => void;
}

export function DocumentList({ jobId, onDocumentGenerated }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, completed: 0, draft: 0, submitted: 0 });

  useEffect(() => {
    fetchDocuments();
  }, [jobId]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('installer_token') || 
                    localStorage.getItem('auth_token') || 
                    localStorage.getItem('team_token') || 
                    localStorage.getItem('admin_token');
                    
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

  const handleDownload = async (doc: Document) => {
    if (!doc.pdfUrl) {
      toast.error('Document not available');
      return;
    }

    try {
      // If it's a data URL, download directly
      if (doc.pdfUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = doc.pdfUrl;
        link.download = `${doc.name}.pdf`;
        link.click();
      } else {
        // Otherwise, fetch and download
        window.open(doc.pdfUrl, '_blank');
      }
      toast.success('Document downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handlePreview = (doc: Document) => {
    if (!doc.pdfUrl) {
      toast.error('Document not available');
      return;
    }

    // Open in new tab
    window.open(doc.pdfUrl, '_blank');
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
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading documents...</span>
        </div>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="p-6 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-2">No Documents Yet</h3>
        <p className="text-sm text-gray-600 mb-4">
          Documents will appear here as you generate them during the installation process.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
            <div className="text-xs text-gray-600">Complete</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{summary.draft}</div>
            <div className="text-xs text-gray-600">Draft</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{summary.submitted}</div>
            <div className="text-xs text-gray-600">Submitted</div>
          </div>
        </div>
      </Card>

      {/* Document List */}
      <div className="space-y-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="p-4">
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
              <div className="flex flex-col gap-2">
                {doc.pdfUrl && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(doc)}
                      className="whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Refresh Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={fetchDocuments}
      >
        Refresh Documents
      </Button>
    </div>
  );
}
