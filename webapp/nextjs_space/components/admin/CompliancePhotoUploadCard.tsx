'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Camera,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface CompliancePhotoUploadCardProps {
  jobId: string;
  onUpdate?: () => void;
}

interface PhotoCategory {
  id: string;
  name: string;
  description: string;
  required: number;
  uploaded: number;
}

export function CompliancePhotoUploadCard({ jobId, onUpdate }: CompliancePhotoUploadCardProps) {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<PhotoCategory[]>([
    {
      id: 'equipment',
      name: 'Equipment Serial Numbers',
      description: 'Photos of all panel, inverter, and battery serial numbers',
      required: 15,
      uploaded: 0
    },
    {
      id: 'progress',
      name: 'Installation Progress',
      description: 'Roof work, electrical work, battery installation',
      required: 20,
      uploaded: 0
    },
    {
      id: 'safety',
      name: 'Safety & Compliance',
      description: 'Installer selfie, ID badge, licenses, safety equipment',
      required: 8,
      uploaded: 0
    },
    {
      id: 'final',
      name: 'Final Documentation',
      description: 'Completed system, clean site, customer handover',
      required: 7,
      uploaded: 0
    }
  ]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('equipment');

  useEffect(() => {
    fetchPhotos();
  }, [jobId]);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/jobs/${jobId}/photos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
        updateCategoryCounts(data.photos || []);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCategoryCounts = (photoList: any[]) => {
    const counts: Record<string, number> = {};
    photoList.forEach((photo: any) => {
      counts[photo.category] = (counts[photo.category] || 0) + 1;
    });

    setCategories(prev => prev.map(cat => ({
      ...cat,
      uploaded: counts[cat.id] || 0
    })));
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('category', selectedCategory);
        formData.append('jobId', jobId);

        const response = await fetch(`/api/admin/jobs/${jobId}/photos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
      }

      toast.success(`${files.length} photo(s) uploaded successfully`);
      await fetchPhotos();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/jobs/${jobId}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete photo');

      toast.success('Photo deleted');
      await fetchPhotos();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  const totalRequired = categories.reduce((sum, cat) => sum + cat.required, 0);
  const totalUploaded = categories.reduce((sum, cat) => sum + cat.uploaded, 0);
  const completionPercentage = Math.round((totalUploaded / totalRequired) * 100);
  const isComplete = totalUploaded >= totalRequired;

  const getCategoryPhotos = (categoryId: string) => {
    return photos.filter(p => p.category === categoryId);
  };

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
    <Card className="border-2 border-purple-200">
      <CardHeader className="bg-purple-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-600" />
            Installation Photos
          </span>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge className="bg-orange-500">
                {totalUploaded}/{totalRequired} Photos
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="text-gray-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                isComplete ? 'bg-green-600' : 'bg-purple-600'
              }`}
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minimum {totalRequired} photos required for compliance
          </p>
        </div>

        <Separator />

        {/* Category Progress */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Photo Categories</h3>
          {categories.map((category) => {
            const isComplete = category.uploaded >= category.required;
            const percentage = Math.round((category.uploaded / category.required) * 100);
            
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{category.name}</span>
                      {isComplete && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                  <Badge variant={isComplete ? "default" : "secondary"} className={isComplete ? "bg-green-600" : ""}>
                    {category.uploaded}/{category.required}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      isComplete ? 'bg-green-600' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Upload Section */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.uploaded}/{cat.required})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <label className="flex-1">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={uploading}
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos
                  </>
                )}
              </Button>
            </label>
          </div>
        </div>

        {/* Photo Gallery */}
        {getCategoryPhotos(selectedCategory).length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm mb-3">
                {categories.find(c => c.id === selectedCategory)?.name} Photos
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {getCategoryPhotos(selectedCategory).map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.thumbnailUrl || photo.photoUrl}
                      alt={photo.description || 'Installation photo'}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Compliance Warning */}
        {!isComplete && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-sm text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <strong>Action Required:</strong> Upload at least {totalRequired - totalUploaded} more photos to meet compliance requirements.
            </p>
          </div>
        )}

        {/* Success Message */}
        {isComplete && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <strong>Complete:</strong> All required photos have been uploaded. Ready for compliance submission.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
