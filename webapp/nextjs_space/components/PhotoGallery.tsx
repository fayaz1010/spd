'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, Trash2, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Photo {
  id: string;
  filename: string;
  url: string;
  category: string;
  uploadedAt: string;
  filesize: number;
  mimeType: string;
}

interface PhotoGalleryProps {
  jobId: string;
  category?: string;
  editable?: boolean;
  onPhotoDeleted?: (photoId: string) => void;
}

export function PhotoGallery({ jobId, category, editable = false, onPhotoDeleted }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [jobId, category]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ jobId });
      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`/api/photos/upload?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch photos');
      }

      setPhotos(data.photos);
    } catch (error: any) {
      setError(error.message);
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

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      setPhotos(prev => prev.filter(p => p.id !== photoId));
      
      if (onPhotoDeleted) {
        onPhotoDeleted(photoId);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-medium">Error loading photos</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No photos yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Upload photos to see them here
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-primary transition-colors"
          >
            {/* Photo */}
            <div className="aspect-square relative">
              <img
                src={photo.url}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-white/20 hover:bg-white/30 text-white"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <a
                  href={photo.url + '?download=true'}
                  download={photo.filename}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                {editable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-red-500/80 hover:bg-red-600 text-white"
                    onClick={() => handleDelete(photo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="text-xs font-medium text-gray-900 truncate">
                {photo.filename}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {formatFileSize(photo.filesize)}
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {photo.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="h-8 w-8" />
          </button>

          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.filename}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            
            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-lg mb-2">{selectedPhoto.filename}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="ml-2 font-medium">{selectedPhoto.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">Size:</span>
                  <span className="ml-2 font-medium">{formatFileSize(selectedPhoto.filesize)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">{selectedPhoto.mimeType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Uploaded:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedPhoto.uploadedAt)}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <a
                  href={selectedPhoto.url + '?download=true'}
                  download={selectedPhoto.filename}
                  className="flex-1"
                >
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
                {editable && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDelete(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
