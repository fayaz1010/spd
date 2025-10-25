'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock,
  Camera,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Play,
  Square,
  Coffee,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

interface TimeEntry {
  id: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  timestamp: string;
  gpsLatitude: number;
  gpsLongitude: number;
  selfieUrl?: string;
}

export default function InstallerAttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'clocked_out' | 'clocked_in' | 'on_break'>('clocked_out');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturingFor, setCapturingFor] = useState<'clock_in' | 'clock_out' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!jobId) {
      router.push('/installer/jobs');
      return;
    }
    fetchJobAndAttendance();
  }, [jobId]);

  const fetchJobAndAttendance = async () => {
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

      // Fetch time entries
      const attendanceResponse = await fetch(`/api/installer/attendance/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        setTimeEntries(attendanceData.entries || []);
        setCurrentStatus(attendanceData.currentStatus || 'clocked_out');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async (action: 'clock_in' | 'clock_out') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' } // Front camera for selfie
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCapturingFor(action);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
      setCapturingFor(null);
    }
  };

  const captureSelfie = async () => {
    if (!videoRef.current || !canvasRef.current || !capturingFor) return;

    setProcessing(true);

    try {
      // Capture selfie
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg');
      });

      // Get GPS location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      // Upload selfie and record time
      const formData = new FormData();
      formData.append('selfie', blob);
      formData.append('jobId', jobId!);
      formData.append('type', capturingFor);
      formData.append('latitude', position.coords.latitude.toString());
      formData.append('longitude', position.coords.longitude.toString());

      const token = localStorage.getItem('installer_token');
      const response = await fetch('/api/installer/attendance/record', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setTimeEntries(prev => [...prev, data.entry]);
        setCurrentStatus(data.currentStatus);
        stopCamera();
        alert(`${capturingFor === 'clock_in' ? 'Clocked in' : 'Clocked out'} successfully!`);
      } else {
        alert('Failed to record time');
      }
    } catch (error: any) {
      console.error('Error recording time:', error);
      if (error.code === 1) {
        alert('GPS location is required. Please enable location services.');
      } else {
        alert('Failed to record time');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleBreak = async (action: 'start' | 'end') => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const token = localStorage.getItem('installer_token');
      const response = await fetch('/api/installer/attendance/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId,
          type: action === 'start' ? 'break_start' : 'break_end',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTimeEntries(prev => [...prev, data.entry]);
        setCurrentStatus(data.currentStatus);
        alert(`Break ${action === 'start' ? 'started' : 'ended'}`);
      }
    } catch (error) {
      console.error('Error recording break:', error);
      alert('Failed to record break');
    }
  };

  const calculateTotalHours = () => {
    const clockIn = timeEntries.find(e => e.type === 'clock_in');
    const clockOut = timeEntries.find(e => e.type === 'clock_out');
    
    if (!clockIn) return 0;
    
    const endTime = clockOut ? new Date(clockOut.timestamp) : new Date();
    const startTime = new Date(clockIn.timestamp);
    const totalMs = endTime.getTime() - startTime.getTime();
    
    // Subtract break time
    let breakMs = 0;
    let breakStart: Date | null = null;
    
    timeEntries.forEach(entry => {
      if (entry.type === 'break_start') {
        breakStart = new Date(entry.timestamp);
      } else if (entry.type === 'break_end' && breakStart) {
        breakMs += new Date(entry.timestamp).getTime() - breakStart.getTime();
        breakStart = null;
      }
    });
    
    const workMs = totalMs - breakMs;
    return workMs / (1000 * 60 * 60); // Convert to hours
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
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

  const totalHours = calculateTotalHours();
  const clockInEntry = timeEntries.find(e => e.type === 'clock_in');
  const clockOutEntry = timeEntries.find(e => e.type === 'clock_out');

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
                <h1 className="text-xl font-bold text-gray-900">Time & Attendance</h1>
                <p className="text-xs text-gray-500">{job.jobNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{job.lead.fullName}</p>
              <p className="text-xs text-gray-500">
                {totalHours > 0 ? `${totalHours.toFixed(2)} hours` : 'Not started'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Status */}
        <Card className="mb-6 border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Current Status
              </span>
              {currentStatus === 'clocked_in' ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Clocked In
                </Badge>
              ) : currentStatus === 'on_break' ? (
                <Badge className="bg-yellow-600">
                  <Coffee className="h-3 w-3 mr-1" />
                  On Break
                </Badge>
              ) : (
                <Badge variant="outline">
                  Not Clocked In
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {clockInEntry ? formatTime(clockInEntry.timestamp) : '--:--'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Clock In</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {clockOutEntry ? formatTime(clockOutEntry.timestamp) : '--:--'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Clock Out</div>
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <div className="text-4xl font-bold text-blue-900 mb-2">
                {totalHours.toFixed(2)}
              </div>
              <div className="text-sm text-gray-700">Total Hours Worked</div>
            </div>
          </CardContent>
        </Card>

        {/* Camera for Selfie */}
        {cameraActive && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Take Selfie to {capturingFor === 'clock_in' ? 'Clock In' : 'Clock Out'}
                </span>
                <Button variant="ghost" size="sm" onClick={stopCamera}>
                  Cancel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full transform scale-x-[-1]"
                  />
                </div>
                <canvas ref={canvasRef} className="hidden" />
                
                <Button
                  onClick={captureSelfie}
                  disabled={processing}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Selfie
                    </>
                  )}
                </Button>

                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Your selfie and GPS location will be recorded for verification purposes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {!cameraActive && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentStatus === 'clocked_out' && (
                <Button
                  onClick={() => startCamera('clock_in')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Clock In (with Selfie)
                </Button>
              )}

              {currentStatus === 'clocked_in' && (
                <>
                  <Button
                    onClick={() => handleBreak('start')}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Start Break
                  </Button>
                  <Button
                    onClick={() => startCamera('clock_out')}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Clock Out (with Selfie)
                  </Button>
                </>
              )}

              {currentStatus === 'on_break' && (
                <Button
                  onClick={() => handleBreak('end')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  End Break
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Time Entries Log */}
        <Card>
          <CardHeader>
            <CardTitle>Time Log ({timeEntries.length} entries)</CardTitle>
          </CardHeader>
          <CardContent>
            {timeEntries.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No time entries yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Clock in to start tracking your time
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      {entry.type === 'clock_in' && <Play className="h-5 w-5 text-green-600" />}
                      {entry.type === 'clock_out' && <Square className="h-5 w-5 text-red-600" />}
                      {entry.type === 'break_start' && <Coffee className="h-5 w-5 text-yellow-600" />}
                      {entry.type === 'break_end' && <Play className="h-5 w-5 text-blue-600" />}
                      
                      <div>
                        <div className="font-semibold">
                          {entry.type === 'clock_in' && 'Clocked In'}
                          {entry.type === 'clock_out' && 'Clocked Out'}
                          {entry.type === 'break_start' && 'Break Started'}
                          {entry.type === 'break_end' && 'Break Ended'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.selfieUrl && (
                        <Badge className="bg-purple-600">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        GPS
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complete Button */}
        {clockOutEntry && (
          <div className="mt-8">
            <Link href={`/installer/jobs?jobId=${jobId}`}>
              <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Installation
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
