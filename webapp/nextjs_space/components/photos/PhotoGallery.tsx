'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Photo {
  id: string;
  url: string;
  filename: string;
  category: string;
  description?: string;
  uploadedBy: string;
  createdAt: string;
}

interface PhotoGalleryProps {
  jobId: string;
  canDelete?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  BEFORE: 'bg-blue-100 text-blue-800',
  DURING: 'bg-yellow-100 text-yellow-800',
  AFTER: 'bg-green-100 text-green-800',
  ROOF: 'bg-purple-100 text-purple-800',
  PANELS: 'bg-orange-100 text-orange-800',
  INVERTER: 'bg-red-100 text-red-800',
  BATTERY: 'bg-emerald-100 text-emerald-800',
  ELECTRICAL: 'bg-indigo-100 text-indigo-800',
  COMPLIANCE: 'bg-pink-100 text-pink-800',
  GENERAL: 'bg-gray-100 text-gray-800',
};

export function PhotoGallery({ jobId, canDelete = false }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPhotos();
  }, [jobId]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/photos/job/${jobId}`);
      const result = await response.json();

      if (result.success) {
        setPhotos(result.photos);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load photos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        toast({
          title: 'Success',
          description: 'Photo deleted successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (photo: Photo) => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = photo.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading photos...</p>
        </CardContent>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No photos uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Installation Photos ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors">
                  <img
                    src={photo.url}
                    alt={photo.description || photo.filename}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                
                <Badge
                  className={`absolute top-2 left-2 ${CATEGORY_COLORS[photo.category] || CATEGORY_COLORS.GENERAL}`}
                >
                  {photo.category}
                </Badge>

                {canDelete && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {photo.description && (
                  <p className="mt-2 text-xs text-gray-600 truncate">
                    {photo.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.description || selectedPhoto.filename}
              className="w-full max-h-[80vh] object-contain"
            />
            
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className={CATEGORY_COLORS[selectedPhoto.category]}>
                    {selectedPhoto.category}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedPhoto.description || selectedPhoto.filename}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Uploaded by {selectedPhoto.uploadedBy} on{' '}
                    {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(selectedPhoto)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        handleDelete(selectedPhoto.id);
                        setSelectedPhoto(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
