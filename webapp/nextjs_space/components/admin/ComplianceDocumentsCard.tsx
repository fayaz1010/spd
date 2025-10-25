'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle,
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface ComplianceDocumentsCardProps {
  jobId: string;
  onUpdate?: () => void;
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  documentId?: string;
  documentUrl?: string;
  fileName?: string;
  uploadedAt?: string;
}

export function ComplianceDocumentsCard({ jobId, onUpdate }: ComplianceDocumentsCardProps) {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentType[]>([
    {
      id: 'coes',
      name: 'Certificate of Electrical Safety (COES)',
      description: 'Completed and signed by licensed electrician',
      required: true,
      uploaded: false
    },
    {
      id: 'compliance_cert',
      name: 'Certificate of Compliance',
      description: 'Required for STC rebate claim',
      required: true,
      uploaded: false
    },
    {
      id: 'electrical_completion',
      name: 'Electrical Work Completion Certificate',
      description: 'Signed by accredited installer',
      required: true,
      uploaded: false
    },
    {
      id: 'commissioning',
      name: 'System Commissioning Report',
      description: 'All test results and system specifications',
      required: true,
      uploaded: false
    },
    {
      id: 'handover',
      name: 'Customer Handover Form',
      description: 'Customer signature confirming completion',
      required: true,
      uploaded: false
    },
    {
      id: 'single_line',
      name: 'Single Line Diagram',
      description: 'System electrical diagram',
      required: true,
      uploaded: false
    },
    {
      id: 'site_plan',
      name: 'Site Plan',
      description: 'Property layout with system location',
      required: false,
      uploaded: false
    },
    {
      id: 'test_results',
      name: 'Test Results',
      description: 'Insulation, earth continuity, polarity tests',
      required: true,
      uploaded: false
    }
  ]);

  useEffect(() => {
    fetchDocuments();
  }, [jobId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/jobs/${jobId}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update document status
        setDocuments(prev => prev.map(doc => {
          const uploaded = data.documents?.find((d: any) => d.documentType === doc.id);
          return uploaded ? {
            ...doc,
            uploaded: true,
            documentId: uploaded.id,
            documentUrl: uploaded.documentUrl,
            fileName: uploaded.fileName,
            uploadedAt: uploaded.uploadedAt
          } : doc;
        }));
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    setUploading(documentType);
    try {
      const token = localStorage.getItem('admin_token');
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      formData.append('jobId', jobId);

      const response = await fetch(`/api/admin/jobs/${jobId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload document');

      toast.success('Document uploaded successfully');
      await fetchDocuments();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const handleGenerateDocument = async (documentType: string) => {
    setUploading(documentType);
    try {
      const token = localStorage.getItem('admin_token');
      
      // Map document types to API document types
      const docTypeMap: Record<string, string> = {
        'single_line': 'sld',
        'coes': 'certificate',
        'compliance_cert': 'compliance',
        'test_results': 'test-results',
        'commissioning': 'test-results',
        'handover': 'customer-declaration'
      };

      const apiDocType = docTypeMap[documentType];
      if (!apiDocType) {
        toast.error('This document cannot be auto-generated');
        return;
      }

      const body: any = { jobId, documentType: apiDocType };
      
      // Add state for certificates
      if (apiDocType === 'certificate') {
        body.state = 'WA'; // Default to WA, could be made configurable
      }

      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate document');
      }

      // Get the PDF blob
      const blob = await response.blob();
      const fileName = `${documentType}-${jobId}.pdf`;
      
      // Create a file from the blob
      const file = new File([blob], fileName, { type: 'application/pdf' });
      
      // Upload the generated document
      await handleFileUpload(documentType, file);
      
      toast.success('Document generated and uploaded successfully!');
    } catch (error: any) {
      console.error('Error generating document:', error);
      toast.error(error.message || 'Failed to generate document');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/jobs/${jobId}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete document');

      toast.success('Document deleted');
      await fetchDocuments();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const canGenerate = (docType: string) => {
    return ['single_line', 'coes', 'compliance_cert', 'test_results', 'commissioning', 'handover'].includes(docType);
  };

  const requiredDocs = documents.filter(d => d.required);
  const uploadedRequired = requiredDocs.filter(d => d.uploaded).length;
  const completionPercentage = Math.round((uploadedRequired / requiredDocs.length) * 100);
  const isComplete = uploadedRequired === requiredDocs.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-indigo-200">
      <CardHeader className="bg-indigo-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Compliance Documents
          </span>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge className="bg-orange-500">
                {uploadedRequired}/{requiredDocs.length} Uploaded
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Required Documents</span>
            <span className="text-gray-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                isComplete ? 'bg-green-600' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Document List */}
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{doc.name}</span>
                    {doc.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                    {doc.uploaded && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                </div>
              </div>

              {doc.uploaded ? (
                <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-xs font-medium">{doc.fileName}</div>
                      <div className="text-xs text-gray-500">
                        Uploaded {new Date(doc.uploadedAt!).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.documentUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.documentId!)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {canGenerate(doc.id) && (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={uploading === doc.id}
                      onClick={() => handleGenerateDocument(doc.id)}
                    >
                      {uploading === doc.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  )}
                  <label className={canGenerate(doc.id) ? "flex-1" : "flex-1 w-full"}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(doc.id, file);
                      }}
                      disabled={uploading === doc.id}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={uploading === doc.id}
                      onClick={() => {
                        const input = document.querySelector<HTMLInputElement>(`input[type="file"]`);
                        input?.click();
                      }}
                    >
                      {uploading === doc.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Status Messages */}
        {!isComplete && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-sm text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <strong>Action Required:</strong> Upload {requiredDocs.length - uploadedRequired} more required documents.
            </p>
          </div>
        )}

        {isComplete && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <strong>Complete:</strong> All required documents uploaded. Ready for compliance submission.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
