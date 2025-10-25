'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Check, 
  X, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Scan,
  Plus,
  Trash2,
  Shield
} from 'lucide-react';
import Link from 'next/link';

interface ScannedEquipment {
  id: string;
  type: 'panel' | 'inverter' | 'battery';
  serialNumber: string;
  brand?: string;
  model?: string;
  cecApproved?: boolean;
  scannedAt: string;
}

export default function InstallerScannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [equipment, setEquipment] = useState<ScannedEquipment[]>([]);
  
  // Manual entry
  const [manualEntry, setManualEntry] = useState(false);
  const [equipmentType, setEquipmentType] = useState<'panel' | 'inverter' | 'battery'>('panel');
  const [serialNumber, setSerialNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');

  useEffect(() => {
    if (!jobId) {
      router.push('/installer/jobs');
      return;
    }
    fetchJobAndEquipment();
  }, [jobId]);

  const fetchJobAndEquipment = async () => {
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

      // Fetch scanned equipment
      const equipmentResponse = await fetch(`/api/installer/equipment/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData.equipment || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
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
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setScanning(true);
    
    try {
      // Capture frame from video
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

      // Send to OCR API
      const formData = new FormData();
      formData.append('image', blob);
      formData.append('jobId', jobId!);

      const token = localStorage.getItem('installer_token');
      const response = await fetch('/api/installer/scan-equipment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.serialNumber) {
          // Add to equipment list
          const newEquipment: ScannedEquipment = {
            id: Date.now().toString(),
            type: 'panel', // Default, can be changed
            serialNumber: data.serialNumber,
            brand: data.brand,
            model: data.model,
            cecApproved: data.cecApproved,
            scannedAt: new Date().toISOString()
          };
          setEquipment(prev => [...prev, newEquipment]);
          alert('Serial number scanned successfully!');
        } else {
          alert('No serial number detected. Try manual entry.');
        }
      }
    } catch (error) {
      console.error('Error scanning:', error);
      alert('Scan failed. Try manual entry.');
    } finally {
      setScanning(false);
    }
  };

  const handleManualAdd = async () => {
    if (!serialNumber.trim()) {
      alert('Please enter a serial number');
      return;
    }

    try {
      const token = localStorage.getItem('installer_token');
      const response = await fetch('/api/installer/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId,
          type: equipmentType,
          serialNumber: serialNumber.trim(),
          brand: brand.trim(),
          model: model.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEquipment(prev => [...prev, data.equipment]);
        
        // Reset form
        setSerialNumber('');
        setBrand('');
        setModel('');
        setManualEntry(false);
        
        alert('Equipment added successfully!');
      }
    } catch (error) {
      console.error('Error adding equipment:', error);
      alert('Failed to add equipment');
    }
  };

  const handleDelete = async (equipmentId: string) => {
    if (!confirm('Delete this equipment record?')) return;

    try {
      const token = localStorage.getItem('installer_token');
      const response = await fetch(`/api/installer/equipment/${equipmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setEquipment(prev => prev.filter(e => e.id !== equipmentId));
        alert('Equipment deleted');
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert('Failed to delete equipment');
    }
  };

  const getEquipmentCount = (type: 'panel' | 'inverter' | 'battery') => {
    return equipment.filter(e => e.type === type).length;
  };

  const getRequiredCount = (type: 'panel' | 'inverter' | 'battery') => {
    if (!job) return 0;
    if (type === 'panel') return job.panelCount || 0;
    if (type === 'inverter') return 1;
    if (type === 'battery') return job.batteryCapacity ? 1 : 0;
    return 0;
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

  const panelCount = getEquipmentCount('panel');
  const inverterCount = getEquipmentCount('inverter');
  const batteryCount = getEquipmentCount('battery');
  
  const panelRequired = getRequiredCount('panel');
  const inverterRequired = getRequiredCount('inverter');
  const batteryRequired = getRequiredCount('battery');

  const allScanned = panelCount >= panelRequired && 
                     inverterCount >= inverterRequired && 
                     batteryCount >= batteryRequired;

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
                <h1 className="text-xl font-bold text-gray-900">Equipment Scanner</h1>
                <p className="text-xs text-gray-500">{job.jobNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{job.lead.fullName}</p>
              <p className="text-xs text-gray-500">{equipment.length} items scanned</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Summary */}
        <Card className="mb-6 border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-blue-600" />
                Scanning Progress
              </span>
              {allScanned ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="destructive">
                  {equipment.length}/{panelRequired + inverterRequired + batteryRequired} scanned
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{panelCount}</div>
                <div className="text-sm text-gray-600">Panels</div>
                <div className="text-xs text-gray-500">{panelRequired} required</div>
                {panelCount >= panelRequired && (
                  <CheckCircle className="h-4 w-4 text-green-600 mx-auto mt-1" />
                )}
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{inverterCount}</div>
                <div className="text-sm text-gray-600">Inverters</div>
                <div className="text-xs text-gray-500">{inverterRequired} required</div>
                {inverterCount >= inverterRequired && (
                  <CheckCircle className="h-4 w-4 text-green-600 mx-auto mt-1" />
                )}
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{batteryCount}</div>
                <div className="text-sm text-gray-600">Batteries</div>
                <div className="text-xs text-gray-500">{batteryRequired} required</div>
                {batteryCount >= batteryRequired && (
                  <CheckCircle className="h-4 w-4 text-green-600 mx-auto mt-1" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Camera Scanner */}
        {!manualEntry && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                QR Code / Serial Number Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!cameraActive ? (
                <div className="text-center py-12">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Scan QR codes or serial numbers on equipment
                  </p>
                  <Button onClick={startCamera} size="lg">
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full"
                    />
                    <div className="absolute inset-0 border-4 border-blue-500 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white"></div>
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="flex gap-4">
                    <Button
                      onClick={captureAndScan}
                      disabled={scanning}
                      className="flex-1"
                      size="lg"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Scan className="h-4 w-4 mr-2" />
                          Capture & Scan
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      size="lg"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => {
                        stopCamera();
                        setManualEntry(true);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      Enter Manually Instead
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Manual Entry */}
        {manualEntry && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Manual Entry
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManualEntry(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Equipment Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant={equipmentType === 'panel' ? 'default' : 'outline'}
                    onClick={() => setEquipmentType('panel')}
                  >
                    Panel
                  </Button>
                  <Button
                    variant={equipmentType === 'inverter' ? 'default' : 'outline'}
                    onClick={() => setEquipmentType('inverter')}
                  >
                    Inverter
                  </Button>
                  <Button
                    variant={equipmentType === 'battery' ? 'default' : 'outline'}
                    onClick={() => setEquipmentType('battery')}
                  >
                    Battery
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="serialNumber">Serial Number *</Label>
                <Input
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Enter serial number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand (Optional)</Label>
                  <Input
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g., Longi"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model (Optional)</Label>
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g., LR5-72HPH-550M"
                  />
                </div>
              </div>

              <Button
                onClick={handleManualAdd}
                className="w-full"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Scanned Equipment List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Scanned Equipment ({equipment.length})</span>
              {!manualEntry && !cameraActive && (
                <Button
                  onClick={() => setManualEntry(true)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manually
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {equipment.length === 0 ? (
              <div className="text-center py-12">
                <Scan className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No equipment scanned yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Use the scanner or manual entry to add equipment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {equipment.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">
                          {item.type.toUpperCase()}
                        </Badge>
                        {item.cecApproved && (
                          <Badge className="bg-green-600">
                            <Shield className="h-3 w-3 mr-1" />
                            CEC Approved
                          </Badge>
                        )}
                      </div>
                      <p className="font-mono text-sm font-semibold">{item.serialNumber}</p>
                      {(item.brand || item.model) && (
                        <p className="text-xs text-gray-600 mt-1">
                          {item.brand} {item.model}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Scanned: {new Date(item.scannedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Link href={`/installer/photos?jobId=${jobId}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Photos
            </Button>
          </Link>
          {allScanned && (
            <Link href={`/installer/checklist?jobId=${jobId}`} className="flex-1">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceed to Checklist
              </Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
