
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  CheckCircle,
  Play,
  Upload,
  Camera,
  FileText,
  Home,
  Wrench,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SiteVisitCard } from '@/components/admin/SiteVisitCard';

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string | null;
  systemSize: number;
  lead: {
    fullName: string;
    address: string;
  };
}

export default function InstallerJobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [lead, setLead] = useState<any>(null);
  const [siteVisit, setSiteVisit] = useState<any>(null);

  useEffect(() => {
    fetchJob();
  }, [params.id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/installer/jobs/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch job');
      const data = await response.json();
      setJob(data.job);
      setNotes(data.job.installationNotes || '');
      
      // Fetch lead data if leadId exists
      if (data.job.leadId) {
        const leadResponse = await fetch(`/api/admin/leads/${data.job.leadId}`);
        if (leadResponse.ok) {
          const leadData = await leadResponse.json();
          setLead(leadData.lead);
        }
        
        // Fetch site visit data
        const siteVisitResponse = await fetch(`/api/admin/leads/${data.job.leadId}/site-visit`);
        if (siteVisitResponse.ok) {
          const siteVisitData = await siteVisitResponse.json();
          setSiteVisit(siteVisitData.siteVisit);
        }
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/installer/jobs/${params.id}/start`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to start job');
      toast.success('Installation started');
      await fetchJob();
    } catch (error) {
      console.error('Error starting job:', error);
      toast.error('Failed to start installation');
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    try {
      setUpdating(true);

      // Create form data for photos
      const formData = new FormData();
      formData.append('notes', notes);
      photos.forEach((photo, index) => {
        formData.append(`photo${index}`, photo);
      });

      const response = await fetch(`/api/installer/jobs/${params.id}/complete`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to complete job');
      toast.success('Installation completed!');
      router.push('/installer/jobs');
    } catch (error) {
      console.error('Error completing job:', error);
      toast.error('Failed to complete installation');
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos([...photos, ...files]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Job not found</p>
        </Card>
      </div>
    );
  }

  const canStart = ['SCHEDULED', 'SUB_CONFIRMED', 'MATERIALS_READY'].includes(job.status);
  const canComplete = job.status === 'IN_PROGRESS';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{job.jobNumber}</h1>
          <p className="text-sm text-muted-foreground">{job.lead.fullName}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Status Card */}
        <Card className="p-6">
          <div className="text-center">
            <Badge className="text-lg py-2 px-4">
              {job.status.replace(/_/g, ' ')}
            </Badge>
            {job.scheduledDate && (
              <p className="text-sm text-muted-foreground mt-2">
                Scheduled: {format(new Date(job.scheduledDate), 'PPP')}
              </p>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="installation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="site-visit">
              <Home className="h-4 w-4 mr-2" />
              Site Visit
            </TabsTrigger>
            <TabsTrigger value="installation">
              <Wrench className="h-4 w-4 mr-2" />
              Installation
            </TabsTrigger>
          </TabsList>

          {/* Site Visit Tab */}
          <TabsContent value="site-visit" className="space-y-4 mt-4">
            {lead ? (
              <SiteVisitCard 
                leadId={lead.id}
                lead={lead}
                siteVisit={siteVisit}
                onUpdate={() => {
                  fetchJob();
                }}
              />
            ) : (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">Loading site visit data...</p>
              </Card>
            )}
          </TabsContent>

          {/* Installation Tab */}
          <TabsContent value="installation" className="space-y-4 mt-4">

        {/* Start Installation */}
        {canStart && (
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Ready to Start?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Mark this installation as in progress to begin work.
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={handleStart}
              disabled={updating}
            >
              <Play className="h-5 w-5 mr-2" />
              Start Installation
            </Button>
          </Card>
        )}

        {/* In Progress / Complete */}
        {canComplete && (
          <>
            {/* Notes */}
            <Card className="p-6 space-y-4">
              <h2 className="font-semibold">Installation Notes</h2>
              <div>
                <Label htmlFor="notes">Add any notes or observations</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Panel installation completed, minor roof repair needed..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </Card>

            {/* Photos */}
            <Card className="p-6 space-y-4">
              <h2 className="font-semibold">Installation Photos</h2>
              <p className="text-sm text-muted-foreground">
                Upload before and after photos of the installation
              </p>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoCapture}
                className="hidden"
                id="photo-input"
              />

              <label htmlFor="photo-input">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo ({photos.length})
                  </span>
                </Button>
              </label>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Complete Button */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Complete Installation</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Mark this job as completed once all work is done.
              </p>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={handleComplete}
                disabled={updating || photos.length === 0}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Complete Installation
              </Button>
              {photos.length === 0 && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  Please upload at least one photo before completing
                </p>
              )}
            </Card>
          </>
        )}

        {/* Completed */}
        {job.status === 'COMPLETED' && (
          <Card className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="font-bold text-xl mb-2">Installation Completed!</h2>
            <p className="text-muted-foreground">
              Great job! This installation has been marked as complete.
            </p>
          </Card>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
