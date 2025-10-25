'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NEM12UploaderProps {
  leadId: string;
  onUploadComplete?: (uploadId: string, summary: any) => void;
}

export function NEM12Uploader({ leadId, onUploadComplete }: NEM12UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setStatus('idle');
      setError('');
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please upload a .csv NEM12 file',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus('uploading');
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('leadId', leadId);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/nem12/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        toast({
          title: 'Upload Successful',
          description: 'Your NEM12 file has been processed successfully',
        });

        // Trigger AI analysis
        fetch(`/api/nem12/${leadId}/ai-analysis`, {
          method: 'POST',
        }).catch(console.error);

        onUploadComplete?.(data.uploadId, data.summary);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to upload file');
      toast({
        title: 'Upload Failed',
        description: err.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setError('');
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Upload NEM12 Data</h3>
          <p className="text-sm text-gray-600">
            Upload your smart meter data (NEM12 format) for accurate consumption analysis
          </p>
        </div>

        {/* Drop Zone */}
        {!file && status === 'idle' && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              Drop your NEM12 file here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <span>Select File</span>
              </Button>
            </label>
            <p className="text-xs text-gray-400 mt-4">
              Supported format: .csv (NEM12)
            </p>
          </div>
        )}

        {/* File Selected */}
        {file && status === 'idle' && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                Remove
              </Button>
            </div>

            <Button onClick={handleUpload} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload & Analyze
            </Button>
          </div>
        )}

        {/* Uploading */}
        {status === 'uploading' && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="font-medium">Processing {file?.name}</p>
                <p className="text-sm text-gray-500">
                  Analyzing consumption data...
                </p>
              </div>
            </div>

            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-center text-gray-600">
              {progress}% complete
            </p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  Upload Successful!
                </p>
                <p className="text-sm text-green-700">
                  Your consumption data has been analyzed
                </p>
              </div>
            </div>

            <Button onClick={reset} variant="outline" className="w-full">
              Upload Another File
            </Button>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Upload Failed</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>

            <Button onClick={reset} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            How to get your NEM12 file:
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Contact your electricity retailer</li>
            <li>Request your smart meter data (NEM12 format)</li>
            <li>They'll email you a .csv file</li>
            <li>Upload it here for instant analysis</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}
