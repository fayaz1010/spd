'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function InstallerDocumentsPage() {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    // Simulate upload
    setTimeout(() => {
      toast.success('Documents uploaded successfully');
      setUploading(false);
    }, 1500);
  };

  const requiredDocuments = [
    { name: 'COES Certificate', uploaded: false },
    { name: 'Certificate of Compliance', uploaded: false },
    { name: 'Commissioning Report', uploaded: false },
    { name: 'Customer Handover Signature', uploaded: false },
    { name: 'Final System Photos', uploaded: false },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Upload className="h-8 w-8" />
          Document Upload
        </h1>
        <p className="text-muted-foreground">
          Upload certificates and compliance documents
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            accept="image/*,.pdf"
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={uploading}>
              <span>
                {uploading ? 'Uploading...' : 'Select Files'}
              </span>
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Accepted: Images, PDF
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Required Documents</h3>
        <div className="space-y-3">
          {requiredDocuments.map((doc) => (
            <div key={doc.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="font-medium">{doc.name}</span>
              </div>
              {doc.uploaded ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <span className="text-sm text-red-600">Required</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-2">📋 Important</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• All documents must be uploaded before job completion</li>
          <li>• Ensure all certificates are signed and dated</li>
          <li>• Photos must be clear and legible</li>
          <li>• Customer signature required on handover documents</li>
        </ul>
      </Card>
    </div>
  );
}
