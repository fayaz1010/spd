'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Upload, 
  Check, 
  X, 
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';

interface PhotoCategory {
  id: string;
  name: string;
  description: string;
  required: number;
  optional: number;
  examples: string[];
}

interface UploadedPhoto {
  id: string;
  category: string;
  filename: string;
  url: string;
  uploadedAt: string;
  metadata?: {
    gps?: { lat: number; lng: number };
    timestamp?: string;
  };
}

export default function InstallerPhotosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Photo categories based on compliance requirements
  const categories: PhotoCategory[] = [
    {
      id: 'equipment_serials',
      name: 'Equipment Serial Numbers',
      description: 'Photo of EACH panel, inverter, and battery serial number',
      required: 15,
      optional: 5,
      examples: [
        'Each solar panel serial number (clear and legible)',
        'Inverter serial number and datasheet',
        'Battery serial number and datasheet',
        'QR codes on equipment',
        'Equipment datasheets/labels'
      ]
    },
    {
      id: 'installation_progress',
      name: 'Installation Progress',
      description: 'Before, during, and after installation photos',
      required: 15,
      optional: 5,
      examples: [
        'Roof before installation (clean)',
        'Mounting rails installed',
        'Panels being installed',
        'Completed panel array',
        'Cable management/conduit',
        'Roof penetrations sealed',
        'Inverter mounting',
        'Switchboard modifications',
        'Battery installation (if applicable)'
      ]
    },
    {
      id: 'safety_compliance',
      name: 'Safety & Compliance',
      description: 'Installer verification and safety equipment',
      required: 5,
      optional: 3,
      examples: [
        'Installer selfie with ID badge',
        'CEC accreditation card',
        'Electrical license',
        'Safety equipment in use',
        'Warning labels installed',
        'System information labels',
        'Emergency shutdown instructions'
      ]
    },
    {
      id: 'final_documentation',
      name: 'Final Documentation',
      description: 'Completed system and customer handover',
      required: 5,
      optional: 5,
      examples: [
        'Overall system photo (panels visible)',
        'Inverter installation (final)',
        'Switchboard (final)',
        'Battery installation (final)',
        'Meter box (final)',
        'All labels visible',
        'Site cleaned',
        'Customer handover photo',
        'System producing power',
        'Test equipment readings'
      ]
    }
  ];

  useEffect(() => {
    if (!jobId) {
      router.push('/installer/jobs');
      return;
    }
    fetchJobAndPhotos();
  }, [jobId]);

  const fetchJobAndPhotos = async () => {
    try {
      const token = localStorage.getItem('installer_token');
      
      // Fetch job details
      const jobResponse = await fetch(`/api/installer/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData.job);
      }

      // Fetch existing photos
      const photosResponse = await fetch(`/api/installer/photos/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        setPhotos(photosData.photos || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      // Get GPS location if available
      let gpsData = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          gpsData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (error) {
          console.log('GPS not available');
        }
      }

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('jobId', jobId!);
        formData.append('category', category);
        if (gpsData) {
          formData.append('gps', JSON.stringify(gpsData));
        }

        const token = localStorage.getItem('installer_token');
        const response = await fetch('/api/installer/photos/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          setPhotos(prev => [...prev, data.photo]);
        }
      }

      alert(`${files.length} photo(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;

    try {
      const token = localStorage.getItem('installer_token');
      const response = await fetch(`/api/installer/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        alert('Photo deleted');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  const getCategoryPhotos = (categoryId: string) => {
    return photos.filter(p => p.category === categoryId);
  };

  const getCategoryProgress = (category: PhotoCategory) => {
    const uploaded = getCategoryPhotos(category.id).length;
    const required = category.required;
    const percentage = Math.min((uploaded / required) * 100, 100);
    return { uploaded, required, percentage };
  };

  const getTotalProgress = () => {
    const totalRequired = categories.reduce((sum, cat) => sum + cat.required, 0);
    const totalUploaded = photos.length;
    const percentage = Math.min((totalUploaded / totalRequired) * 100, 100);
    return { uploaded: totalUploaded, required: totalRequired, percentage };
  };

  const allRequirementsMet = () => {
    return categories.every(cat => {
      const progress = getCategoryProgress(cat);
      return progress.uploaded >= progress.required;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Job not found</p>
          <Link href="/installer/jobs">
            <Button className="mt-4">Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalProgress = getTotalProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href={`/installer/jobs?jobId=${jobId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Photo Upload</h1>
                <p className="text-xs text-gray-500">{job.jobNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{job.lead.fullName}</p>
              <p className="text-xs text-gray-500">{job.lead.address}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Progress */}
        <Card className="mb-6 border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Overall Progress
              </span>
              {allRequirementsMet() ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="destructive">
                  {totalProgress.uploaded}/{totalProgress.required} photos
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Total Photos Uploaded</span>
                  <span className="text-gray-600">
                    {totalProgress.uploaded} / {totalProgress.required} required
                  </span>
                </div>
                <Progress value={totalProgress.percentage} className="h-3" />
              </div>

              {allRequirementsMet() ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">All required photos uploaded!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    You can now proceed to the compliance checklist.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">
                      {totalProgress.required - totalProgress.uploaded} more photos required
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Upload photos in each category below to complete documentation.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photo Categories */}
        <div className="space-y-6">
          {categories.map((category) => {
            const progress = getCategoryProgress(category);
            const categoryPhotos = getCategoryPhotos(category.id);
            const isComplete = progress.uploaded >= progress.required;

            return (
              <Card key={category.id} className={`border-2 ${isComplete ? 'border-green-200' : 'border-gray-200'}`}>
                <CardHeader className={isComplete ? 'bg-green-50' : 'bg-gray-50'}>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ImageIcon className="h-5 w-5" />
                        {category.name}
                      </div>
                      <p className="text-sm font-normal text-gray-600">{category.description}</p>
                    </div>
                    {isComplete ? (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {progress.uploaded}/{progress.required}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="text-gray-600">
                        {progress.uploaded} / {progress.required} required
                        {category.optional > 0 && ` (+${category.optional} optional)`}
                      </span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                  </div>

                  {/* Examples */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Examples to capture:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {category.examples.map((example, idx) => (
                        <li key={idx}>• {example}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Upload Button */}
                  <div className="mb-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={(e) => handleFileSelect(e, category.id)}
                      className="hidden"
                      id={`upload-${category.id}`}
                      disabled={uploading}
                    />
                    <label htmlFor={`upload-${category.id}`}>
                      <Button
                        className="w-full"
                        disabled={uploading}
                        asChild
                      >
                        <span>
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 mr-2" />
                              Take/Upload Photos
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>

                  {/* Uploaded Photos Grid */}
                  {categoryPhotos.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-3">Uploaded Photos ({categoryPhotos.length})</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {categoryPhotos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                              <img
                                src={photo.url}
                                alt={photo.filename}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setPreviewPhoto(photo.url)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeletePhoto(photo.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {photo.metadata?.gps && (
                              <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-1 py-0.5 rounded">
                                GPS
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Link href={`/installer/jobs?jobId=${jobId}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Save & Continue Later
            </Button>
          </Link>
          {allRequirementsMet() && (
            <Link href={`/installer/checklist?jobId=${jobId}`} className="flex-1">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceed to Checklist
              </Button>
            </Link>
          )}
        </div>
      </main>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewPhoto}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <Button
              className="absolute top-4 right-4"
              variant="secondary"
              size="sm"
              onClick={() => setPreviewPhoto(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
