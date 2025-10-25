'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PhotoUploadProps {
  jobId: string;
  category?: 'before' | 'during' | 'after' | 'general';
  onUploadComplete?: (photos: any[]) => void;
}

export function PhotoUpload({ jobId, category = 'general', onUploadComplete }: PhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Filter for images only
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== selectedFiles.length) {
      setUploadStatus({
        type: 'error',
        message: 'Only image files are allowed'
      });
      return;
    }

    setFiles(prev => [...prev, ...imageFiles]);

    // Generate previews
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setUploadStatus(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus({
        type: 'error',
        message: 'Please select at least one photo'
      });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('category', category);
      
      files.forEach(file => {
        formData.append('photos', file);
      });

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadStatus({
        type: 'success',
        message: data.message || 'Photos uploaded successfully!'
      });

      // Clear files and previews
      setFiles([]);
      setPreviews([]);

      // Callback
      if (onUploadComplete) {
        onUploadComplete(data.photos);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000);

    } catch (error: any) {
      setUploadStatus({
        type: 'error',
        message: error.message || 'Failed to upload photos'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Status */}
      {uploadStatus && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            uploadStatus.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {uploadStatus.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <p className="font-medium">{uploadStatus.message}</p>
        </div>
      )}

      {/* File Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <label
          htmlFor="photo-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <div className="bg-primary/10 rounded-full p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              Click to upload photos
            </p>
            <p className="text-sm text-gray-600 mt-1">
              or drag and drop (JPG, PNG, WebP)
            </p>
          </div>
        </label>
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            Selected Photos ({files.length})
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-1 rounded truncate">
                  {files[index].name}
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} Photo{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
