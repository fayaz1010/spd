'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  Upload,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  validatePhoto,
  addMetadataWatermark,
  formatGPS,
  type PhotoMetadata
} from '@/lib/photoMetadata';

interface SmartPhotoUploadProps {
  jobId: string;
  category: string;
  onUploadComplete: () => void;
  requireGPS?: boolean;
  siteLocation?: { latitude: number; longitude: number };
}

export function SmartPhotoUpload({
  jobId,
  category,
  onUploadComplete,
  requireGPS = true,
  siteLocation
}: SmartPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setValidating(true);
    setSelectedFiles(files);

    // Validate each file
    const results = [];
    for (const file of files) {
      const result = await validatePhoto(file, requireGPS);
      results.push({ file, ...result });
    }

    setValidationResults(results);
    setValidating(false);

    // Check if any have errors
    const hasErrors = results.some(r => !r.isValid);
    if (hasErrors) {
      toast.error('Some photos have validation errors');
    } else {
      toast.success('All photos validated successfully');
    }
  };

  const handleUpload = async () => {
    const validPhotos = validationResults.filter(r => r.isValid);
    if (validPhotos.length === 0) {
      toast.error('No valid photos to upload');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('admin_token');

      for (const { file, metadata } of validPhotos) {
        // Add watermark with metadata
        const watermarkedBlob = await addMetadataWatermark(file, metadata);
        
        const formData = new FormData();
        formData.append('photo', watermarkedBlob, file.name);
        formData.append('category', category);
        formData.append('jobId', jobId);
        formData.append('metadata', JSON.stringify(metadata));

        const response = await fetch(`/api/admin/jobs/${jobId}/photos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      toast.success(`${validPhotos.length} photo(s) uploaded successfully`);
      setSelectedFiles([]);
      setValidationResults([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setValidationResults(prev => prev.filter((_, i) => i !== index));
  };

  const validCount = validationResults.filter(r => r.isValid).length;
  const invalidCount = validationResults.filter(r => !r.isValid).length;

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          id="photo-upload"
        />
        <label htmlFor="photo-upload" className="flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={validating || uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Take/Select Photos
              </>
            )}
          </Button>
        </label>

        {validCount > 0 && (
          <Button
            onClick={handleUpload}
            disabled={uploading || validCount === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {validCount}
              </>
            )}
          </Button>
        )}
      </div>

      {/* GPS Requirement Notice */}
      {requireGPS && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            GPS location is required for all photos. Please enable location services.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Selected Photos:</span>
            <div className="flex gap-2">
              {validCount > 0 && (
                <span className="text-green-600">
                  {validCount} valid
                </span>
              )}
              {invalidCount > 0 && (
                <span className="text-red-600">
                  {invalidCount} invalid
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {validationResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.isValid
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {result.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm">
                        {result.file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(result.file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>

                    {/* Metadata Display */}
                    {result.metadata && (
                      <div className="ml-6 space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(result.metadata.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {result.metadata.hasGPS && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {formatGPS(
                                result.metadata.latitude!,
                                result.metadata.longitude!
                              )}
                            </span>
                            {result.metadata.accuracy && (
                              <span className="text-gray-400">
                                (±{Math.round(result.metadata.accuracy)}m)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Errors */}
                    {result.errors.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {result.errors.map((error: string, i: number) => (
                          <div key={i} className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {error}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {result.warnings.map((warning: string, i: number) => (
                          <div key={i} className="text-xs text-orange-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
