'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, File, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentManagementPage() {
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

  const documentCategories = [
    {
      name: 'Certificates',
      description: 'COES, Certificate of Compliance, Commissioning Reports',
      count: 0,
    },
    {
      name: 'Installation Photos',
      description: 'Pre, during, and post-installation photos',
      count: 0,
    },
    {
      name: 'Equipment Serials',
      description: 'Panel, inverter, and battery serial number photos',
      count: 0,
    },
    {
      name: 'Customer Documents',
      description: 'ID verification, property ownership proof',
      count: 0,
    },
    {
      name: 'Test Results',
      description: 'Insulation, earth continuity, polarity tests',
      count: 0,
    },
    {
      name: 'Compliance',
      description: 'Safety equipment, installer credentials',
      count: 0,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Upload className="h-8 w-8" />
          Document Management
        </h1>
        <p className="text-muted-foreground">
          Upload and manage compliance documents
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
            accept="image/*,.pdf,.doc,.docx"
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={uploading}>
              <span>
                {uploading ? 'Uploading...' : 'Select Files'}
              </span>
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Accepted: Images, PDF, Word documents
          </p>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documentCategories.map((category) => (
          <Card key={category.name} className="p-6">
            <div className="flex items-start justify-between mb-3">
              <File className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-400">{category.count}</span>
            </div>
            <h3 className="font-semibold mb-1">{category.name}</h3>
            <p className="text-sm text-muted-foreground">{category.description}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Uploads</h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No documents uploaded yet. Upload documents to see them here.
        </p>
      </Card>
    </div>
  );
}
