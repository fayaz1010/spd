'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploaderProps {
  jobId: string;
  onUploadComplete?: () => void;
}

const PHOTO_CATEGORIES = [
  { value: 'BEFORE', label: 'Before Installation' },
  { value: 'DURING', label: 'During Installation' },
  { value: 'AFTER', label: 'After Installation' },
  { value: 'ROOF', label: 'Roof' },
  { value: 'PANELS', label: 'Solar Panels' },
  { value: 'INVERTER', label: 'Inverter' },
  { value: 'BATTERY', label: 'Battery' },
  { value: 'ELECTRICAL', label: 'Electrical Work' },
  { value: 'COMPLIANCE', label: 'Compliance Documentation' },
  { value: 'GENERAL', label: 'General' },
];

export function PhotoUploader({ jobId, onUploadComplete }: PhotoUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('GENERAL');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isImage) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an image`,
          variant: 'destructive',
        });
        return false;
      }
      
      if (!isUnder10MB) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 10MB limit`,
          variant: 'destructive',
        });
        return false;
      }
      
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one photo to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // For now, we'll convert to base64 and send to API
      // In production, use proper file upload service (UploadThing, Cloudinary, S3)
      const uploadPromises = selectedFiles.map(async (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              filename: file.name,
              mimeType: file.type,
              filesize: file.size,
              data: reader.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const fileData = await Promise.all(uploadPromises);

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          photos: fileData,
          category,
          description,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success!',
          description: `${selectedFiles.length} photo(s) uploaded successfully`,
        });
        
        // Reset form
        setSelectedFiles([]);
        setPreviews([]);
        setDescription('');
        setCategory('GENERAL');
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        onUploadComplete?.();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload photos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <Label htmlFor="photo-upload" className="text-base font-semibold mb-2 block">
            Upload Photos
          </Label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, JPEG up to 10MB each
            </p>
            <input
              ref={fileInputRef}
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Preview Grid */}
        {previews.length > 0 && (
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
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {(selectedFiles[index].size / 1024).toFixed(0)}KB
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Selection */}
        <div>
          <Label htmlFor="category">Photo Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {PHOTO_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            type="text"
            placeholder="Add a description for these photos..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading {selectedFiles.length} photo(s)...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Upload {selectedFiles.length} Photo(s)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
