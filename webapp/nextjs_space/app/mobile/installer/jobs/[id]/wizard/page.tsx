'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardProgress } from '@/components/installer/WizardProgress';
import { PhotoCapture } from '@/components/installer/PhotoCapture';
import { QRScanner } from '@/components/installer/QRScanner';
import { DocumentList } from '@/components/installer/DocumentList';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Package,
  MapPin,
  Wrench,
  Zap,
  FileCheck,
  FileText,
  HandHeart,
  Trophy,
  Clock,
  DollarSign,
  Shield,
  Users,
  Calendar,
  Camera,
  Scan,
  Play,
  Save,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';

interface SerialScan {
  serial: string;
  photo: string;
  timestamp: Date;
}

interface WizardData {
  // Stage 1: Pre-Installation
  materialsVerified: boolean;
  panelSerials: SerialScan[];
  inverterSerial: SerialScan | null;
  batterySerial: SerialScan | null;
  preCheckPhotos: any[];
  safetyCheckDone: boolean;

  // Stage 2: On-Site
  arrivalTime: Date | null;
  arrivalPhoto: any[];
  customerSignature: string;
  safetyBriefing: boolean;

  // Stage 3: Installation
  panelsInstalled: number;
  inverterInstalled: boolean;
  batteryInstalled: boolean;
  electricalComplete: boolean;
  installationPhotos: any[];
  breaks: any[];

  // Stage 4: Testing
  voltageTest: string;
  currentTest: string;
  inverterOnline: boolean;
  batteryCharging: boolean;
  gridExportTest: boolean;
  testPhotos: any[];

  // Stage 5: Compliance
  electricalCertPhoto: string;
  complianceLabels: any[];
  systemPhotos: any[];
  customerDeclaration: string;

  // Stage 6: Handover
  demoComplete: boolean;
  appSetup: boolean;
  monitoringActive: boolean;
  warrantyProvided: boolean;
  customerRating: number;
  finalSignature: string;

  // Stage 7: Complete
  clockOutTime: Date | null;
  totalHours: number;
  notes: string;
}

export default function JobWizardPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    materialsVerified: false,
    panelSerials: [],
    inverterSerial: null,
    batterySerial: null,
    preCheckPhotos: [],
    safetyCheckDone: false,
    arrivalTime: null,
    arrivalPhoto: [],
    customerSignature: '',
    safetyBriefing: false,
    panelsInstalled: 0,
    inverterInstalled: false,
    batteryInstalled: false,
    electricalComplete: false,
    installationPhotos: [],
    breaks: [],
    voltageTest: '',
    currentTest: '',
    inverterOnline: false,
    batteryCharging: false,
    gridExportTest: false,
    testPhotos: [],
    electricalCertPhoto: '',
    complianceLabels: [],
    systemPhotos: [],
    customerDeclaration: '',
    demoComplete: false,
    appSetup: false,
    monitoringActive: false,
    warrantyProvided: false,
    customerRating: 0,
    finalSignature: '',
    clockOutTime: null,
    totalHours: 0,
    notes: '',
  });

  const stages = [
    { number: 1, name: 'Pre-Check', status: (currentStage > 1 ? 'completed' : currentStage === 1 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming' },
    { number: 2, name: 'Arrival', status: (currentStage > 2 ? 'completed' : currentStage === 2 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming' },
    { number: 3, name: 'Install', status: (currentStage > 3 ? 'completed' : currentStage === 3 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming' },
    { number: 4, name: 'Testing', status: (currentStage > 4 ? 'completed' : currentStage === 4 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming' },
    { number: 5, name: 'Compliance', status: (currentStage > 5 ? 'completed' : currentStage === 5 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming' },
    { number: 6, name: 'Handover', status: (currentStage > 6 ? 'completed' : currentStage === 6 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming' },
    { number: 7, name: 'Complete', status: (currentStage > 7 ? 'completed' : currentStage === 7 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming' },
  ];

  useEffect(() => {
    fetchJob();
  }, [params.id]);

  const fetchJob = async () => {
    try {
      const token = localStorage.getItem('installer_token') || localStorage.getItem('auth_token') || localStorage.getItem('team_token') || localStorage.getItem('admin_token');
      const response = await fetch(`/api/installer/jobs/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setJob(data.job);
        
        // Always start at stage 1 unless job is completed
        // Installer must go through all stages sequentially
        if (data.job.status === 'COMPLETED') {
          setCurrentStage(7);
        } else {
          setCurrentStage(1);
        }
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    try {
      const token = localStorage.getItem('installer_token') || localStorage.getItem('auth_token') || localStorage.getItem('team_token') || localStorage.getItem('admin_token');
      await fetch(`/api/installer/jobs/${params.id}/wizard`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: currentStage,
          data: wizardData,
        }),
      });
      toast.success('Progress saved');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save progress');
    }
  };

  const nextStage = () => {
    if (currentStage < 7) {
      setCurrentStage(currentStage + 1);
      saveProgress();
    }
  };

  const prevStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-6 text-center">
          <p className="text-gray-600">Job not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="text-sm opacity-90">{job.jobNumber}</div>
            <h1 className="text-xl font-bold">{job.lead.name}</h1>
          </div>
        </div>
        <div className="text-sm opacity-90">
          <MapPin className="w-4 h-4 inline mr-1" />
          {job.lead.suburb}
        </div>
      </div>

      {/* Progress */}
      <WizardProgress stages={stages} currentStage={currentStage} />

      {/* Stage Content */}
      <div className="p-4 space-y-4">
        {currentStage === 1 && <Stage1PreCheck job={job} data={wizardData} setData={setWizardData} />}
        {currentStage === 2 && <Stage2Arrival job={job} data={wizardData} setData={setWizardData} />}
        {currentStage === 3 && <Stage3Installation job={job} data={wizardData} setData={setWizardData} />}
        {currentStage === 4 && <Stage4Testing job={job} data={wizardData} setData={setWizardData} />}
        {currentStage === 5 && <Stage5Compliance job={job} data={wizardData} setData={setWizardData} />}
        {currentStage === 6 && <Stage6Handover job={job} data={wizardData} setData={setWizardData} />}
        {currentStage === 7 && <Stage7Complete job={job} data={wizardData} setData={setWizardData} />}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3">
        {currentStage > 1 && (
          <Button variant="outline" onClick={prevStage} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}
        <Button onClick={saveProgress} variant="outline" className="px-6">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        {currentStage < 7 && (
          <Button onClick={nextStage} className="flex-1">
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Stage Components (will be defined below)
function Stage1PreCheck({ job, data, setData }: any) {
  const totalPanels = job.lead.numPanels || 20;
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Pre-Installation Check
        </h2>

        {/* Materials Verification */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="font-medium">Materials Delivered</span>
            <input
              type="checkbox"
              checked={data.materialsVerified}
              onChange={(e) => setData({ ...data, materialsVerified: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          {/* Panel Serials */}
          <div>
            <Label>Scan Panel Serial Numbers ({data.panelSerials.length}/{totalPanels})</Label>
            <QRScanner
              label=""
              onScan={(result) => {
                const alreadyScanned = data.panelSerials.some((s: SerialScan) => s.serial === result.data);
                if (!alreadyScanned) {
                  setData({ 
                    ...data, 
                    panelSerials: [...data.panelSerials, {
                      serial: result.data,
                      photo: result.photo,
                      timestamp: result.timestamp
                    }] 
                  });
                  toast.success(`Panel ${data.panelSerials.length + 1} scanned & photo captured`);
                }
              }}
              placeholder="Scan panel barcode"
            />
            <div className="mt-2 text-sm text-gray-600">
              Scanned: {data.panelSerials.length} / {totalPanels}
            </div>
            {/* Show scanned serials */}
            {data.panelSerials.length > 0 && (
              <div className="mt-2 space-y-1">
                {data.panelSerials.map((scan: SerialScan, idx: number) => (
                  <div key={idx} className="text-xs bg-green-50 p-2 rounded flex items-center justify-between">
                    <span className="font-mono">{scan.serial}</span>
                    {scan.photo && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inverter Serial */}
          <QRScanner
            label="Inverter Serial Number"
            onScan={(result) => setData({ 
              ...data, 
              inverterSerial: {
                serial: result.data,
                photo: result.photo,
                timestamp: result.timestamp
              }
            })}
            placeholder="Scan inverter serial"
          />
          {data.inverterSerial && (
            <div className="text-xs bg-green-50 p-2 rounded flex items-center justify-between">
              <span className="font-mono">{data.inverterSerial.serial}</span>
              {data.inverterSerial.photo && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
          )}

          {/* Battery Serial (if applicable) */}
          {job.lead.batterySizeKwh > 0 && (
            <>
              <QRScanner
                label="Battery Serial Number"
                onScan={(result) => setData({ 
                  ...data, 
                  batterySerial: {
                    serial: result.data,
                    photo: result.photo,
                    timestamp: result.timestamp
                  }
                })}
                placeholder="Scan battery serial"
              />
              {data.batterySerial && (
                <div className="text-xs bg-green-50 p-2 rounded flex items-center justify-between">
                  <span className="font-mono">{data.batterySerial.serial}</span>
                  {data.batterySerial.photo && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
              )}
            </>
          )}

          {/* Photos */}
          <div>
            <Label>Materials Photos</Label>
            <PhotoCapture
              category="pre-check"
              onPhotosChange={(photos) => setData({ ...data, preCheckPhotos: photos })}
              existingPhotos={data.preCheckPhotos}
              minPhotos={2}
              maxPhotos={5}
            />
          </div>

          {/* Safety Check */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="font-medium">Safety Equipment Check</span>
            <input
              type="checkbox"
              checked={data.safetyCheckDone}
              onChange={(e) => setData({ ...data, safetyCheckDone: e.target.checked })}
              className="w-5 h-5"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stage2Arrival({ job, data, setData }: any) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          On-Site Arrival
        </h2>

        <div className="space-y-4">
          {/* Clock In */}
          <Button
            onClick={() => {
              setData({ ...data, arrivalTime: new Date() });
              toast.success('Clocked in successfully');
            }}
            className="w-full"
            disabled={!!data.arrivalTime}
          >
            <Clock className="w-4 h-4 mr-2" />
            {data.arrivalTime ? `Arrived at ${new Date(data.arrivalTime).toLocaleTimeString()}` : 'Clock In'}
          </Button>

          {/* Site Photo */}
          <div>
            <Label>Site Photo (Before Work)</Label>
            <PhotoCapture
              category="arrival"
              onPhotosChange={(photos) => setData({ ...data, arrivalPhoto: photos })}
              existingPhotos={data.arrivalPhoto}
              minPhotos={1}
              maxPhotos={3}
            />
          </div>

          {/* Safety Briefing */}
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <span className="font-medium">Safety Briefing Complete</span>
            <input
              type="checkbox"
              checked={data.safetyBriefing}
              onChange={(e) => setData({ ...data, safetyBriefing: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          {/* Customer Contact */}
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <p className="font-medium">Customer Contact</p>
            <a href={`tel:${job.lead.phone}`} className="flex items-center gap-2 text-blue-600">
              <Phone className="w-4 h-4" />
              {job.lead.phone}
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stage3Installation({ job, data, setData }: any) {
  const totalPanels = job.lead.numPanels || 20;
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-600" />
          Installation Progress
        </h2>

        <div className="space-y-4">
          {/* Panels */}
          <div>
            <Label>Panels Installed</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={data.panelsInstalled}
                onChange={(e) => setData({ ...data, panelsInstalled: parseInt(e.target.value) || 0 })}
                max={totalPanels}
                className="flex-1"
              />
              <span className="text-sm text-gray-600">/ {totalPanels}</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(data.panelsInstalled / totalPanels) * 100}%` }}
              />
            </div>
          </div>

          {/* Inverter */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="font-medium">Inverter Installed</span>
            <input
              type="checkbox"
              checked={data.inverterInstalled}
              onChange={(e) => setData({ ...data, inverterInstalled: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          {/* Battery */}
          {job.lead.batterySizeKwh > 0 && (
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">Battery Installed</span>
              <input
                type="checkbox"
                checked={data.batteryInstalled}
                onChange={(e) => setData({ ...data, batteryInstalled: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
          )}

          {/* Electrical */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="font-medium">Electrical Work Complete</span>
            <input
              type="checkbox"
              checked={data.electricalComplete}
              onChange={(e) => setData({ ...data, electricalComplete: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          {/* Installation Photos */}
          <div>
            <Label>Installation Photos</Label>
            <PhotoCapture
              category="installation"
              onPhotosChange={(photos) => setData({ ...data, installationPhotos: photos })}
              existingPhotos={data.installationPhotos}
              minPhotos={5}
              maxPhotos={20}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stage4Testing({ job, data, setData }: any) {
  const [generatingSLD, setGeneratingSLD] = useState(false);
  const [generatingTests, setGeneratingTests] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [documentsKey, setDocumentsKey] = useState(0);

  const generateSLD = async () => {
    setGeneratingSLD(true);
    try {
      const token = localStorage.getItem('installer_token') || 
                    localStorage.getItem('auth_token') || 
                    localStorage.getItem('team_token') || 
                    localStorage.getItem('admin_token');
                    
      const response = await fetch(`/api/installer/jobs/${job.id}/documents/sld/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Single Line Diagram generated successfully!');
        // Refresh document list
        setDocumentsKey(prev => prev + 1);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate SLD');
      }
    } catch (error) {
      console.error('SLD generation error:', error);
      toast.error('Failed to generate SLD');
    } finally {
      setGeneratingSLD(false);
    }
  };

  const generateTestResults = async () => {
    setGeneratingTests(true);
    try {
      const token = localStorage.getItem('installer_token') || 
                    localStorage.getItem('auth_token') || 
                    localStorage.getItem('team_token') || 
                    localStorage.getItem('admin_token');
                    
      const response = await fetch(`/api/installer/jobs/${job.id}/documents/test-results/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Test Results generated successfully!');
        // Refresh document list
        setDocumentsKey(prev => prev + 1);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate test results');
      }
    } catch (error) {
      console.error('Test results generation error:', error);
      toast.error('Failed to generate test results');
    } finally {
      setGeneratingTests(false);
    }
  };

  const generateElectricalCert = async () => {
    setGeneratingCert(true);
    try {
      const token = localStorage.getItem('installer_token') || 
                    localStorage.getItem('auth_token') || 
                    localStorage.getItem('team_token') || 
                    localStorage.getItem('admin_token');
                    
      const response = await fetch(`/api/installer/jobs/${job.id}/documents/electrical-cert/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Electrical Certificate generated successfully!');
        // Refresh document list
        setDocumentsKey(prev => prev + 1);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate electrical certificate');
      }
    } catch (error) {
      console.error('Electrical certificate generation error:', error);
      toast.error('Failed to generate electrical certificate');
    } finally {
      setGeneratingCert(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          Testing & Commissioning
        </h2>

        <div className="space-y-4">
          {/* Voltage Test */}
          <div>
            <Label>Voltage Test (V)</Label>
            <Input
              type="number"
              step="0.1"
              value={data.voltageTest}
              onChange={(e) => setData({ ...data, voltageTest: e.target.value })}
              placeholder="240.0"
            />
          </div>

          {/* Current Test */}
          <div>
            <Label>Current Test (A)</Label>
            <Input
              type="number"
              step="0.1"
              value={data.currentTest}
              onChange={(e) => setData({ ...data, currentTest: e.target.value })}
              placeholder="8.5"
            />
          </div>

          {/* System Tests */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="font-medium">Inverter Online</span>
            <input
              type="checkbox"
              checked={data.inverterOnline}
              onChange={(e) => setData({ ...data, inverterOnline: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          {job.lead.batterySizeKwh > 0 && (
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">Battery Charging</span>
              <input
                type="checkbox"
                checked={data.batteryCharging}
                onChange={(e) => setData({ ...data, batteryCharging: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="font-medium">Grid Export Test</span>
            <input
              type="checkbox"
              checked={data.gridExportTest}
              onChange={(e) => setData({ ...data, gridExportTest: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          {/* Test Photos */}
          <div>
            <Label>System Display & Meter Photos</Label>
            <PhotoCapture
              category="testing"
              onPhotosChange={(photos) => setData({ ...data, testPhotos: photos })}
              existingPhotos={data.testPhotos}
              minPhotos={2}
              maxPhotos={5}
            />
          </div>
        </div>
      </Card>

      {/* Documentation Generation */}
      <Card className="p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          Generate Documentation
        </h3>

        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Generate compliance documents after completing all tests.
          </p>

          <Button
            onClick={generateSLD}
            disabled={generatingSLD || !data.voltageTest || !data.currentTest}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {generatingSLD ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Single Line Diagram
              </>
            )}
          </Button>

          <Button
            onClick={generateTestResults}
            disabled={generatingTests || !data.voltageTest || !data.currentTest || !data.inverterOnline}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {generatingTests ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Test Results
              </>
            )}
          </Button>

          <Button
            onClick={generateElectricalCert}
            disabled={generatingCert || !data.voltageTest || !data.currentTest || !data.inverterOnline}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {generatingCert ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Generate Electrical Certificate
              </>
            )}
          </Button>

          {(!data.voltageTest || !data.currentTest) && (
            <p className="text-xs text-orange-600">
              Complete voltage and current tests before generating documents
            </p>
          )}
          
          {(!data.inverterOnline) && data.voltageTest && data.currentTest && (
            <p className="text-xs text-orange-600">
              Inverter must be online to generate test results and certificates
            </p>
          )}
        </div>
      </Card>

      {/* Document List */}
      <Card className="p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          Generated Documents
        </h3>
        <DocumentList key={documentsKey} jobId={job.id} />
      </Card>
    </div>
  );
}

function Stage5Compliance({ job, data, setData }: any) {
  const [generatingCompliance, setGeneratingCompliance] = useState(false);
  const [documentsKey, setDocumentsKey] = useState(0);

  const generateComplianceStatement = async () => {
    setGeneratingCompliance(true);
    try {
      const token = localStorage.getItem('installer_token') || 
                    localStorage.getItem('auth_token') || 
                    localStorage.getItem('team_token') || 
                    localStorage.getItem('admin_token');
                    
      const response = await fetch(`/api/installer/jobs/${job.id}/documents/compliance/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Compliance Statement generated successfully!');
        setDocumentsKey(prev => prev + 1);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate compliance statement');
      }
    } catch (error) {
      console.error('Compliance statement generation error:', error);
      toast.error('Failed to generate compliance statement');
    } finally {
      setGeneratingCompliance(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-600" />
          Compliance Documentation
        </h2>

        <div className="space-y-4">
          {/* Compliance Labels */}
          <div>
            <Label>Compliance Labels Photos</Label>
            <PhotoCapture
              category="compliance-labels"
              onPhotosChange={(photos) => setData({ ...data, complianceLabels: photos })}
              existingPhotos={data.complianceLabels}
              minPhotos={3}
              maxPhotos={10}
            />
          </div>

          {/* System Overview Photos */}
          <div>
            <Label>System Overview Photos</Label>
            <PhotoCapture
              category="system-overview"
              onPhotosChange={(photos) => setData({ ...data, systemPhotos: photos })}
              existingPhotos={data.systemPhotos}
              minPhotos={4}
              maxPhotos={10}
            />
          </div>
        </div>
      </Card>

      {/* Generate Compliance Statement */}
      <Card className="p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-green-600" />
          Generate CEC Compliance
        </h3>

        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Generate CEC compliance statement with equipment serials and installer credentials.
          </p>

          <Button
            onClick={generateComplianceStatement}
            disabled={generatingCompliance || data.complianceLabels?.length < 3}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {generatingCompliance ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4 mr-2" />
                Generate CEC Compliance Statement
              </>
            )}
          </Button>

          {data.complianceLabels?.length < 3 && (
            <p className="text-xs text-orange-600">
              Upload at least 3 compliance label photos before generating
            </p>
          )}
        </div>
      </Card>

      {/* Document List */}
      <Card className="p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          Generated Documents
        </h3>
        <DocumentList key={documentsKey} jobId={job.id} />
      </Card>
    </div>
  );
}

function Stage6Handover({ job, data, setData }: any) {
  const [generatingDeclaration, setGeneratingDeclaration] = useState(false);
  const [documentsKey, setDocumentsKey] = useState(0);

  const generateCustomerDeclaration = async () => {
    setGeneratingDeclaration(true);
    try {
      const token = localStorage.getItem('installer_token') || 
                    localStorage.getItem('auth_token') || 
                    localStorage.getItem('team_token') || 
                    localStorage.getItem('admin_token');
                    
      const response = await fetch(`/api/installer/jobs/${job.id}/documents/customer-declaration/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Customer Declaration generated! ${result.stcCount} STCs worth $${result.stcValue}`);
        setDocumentsKey(prev => prev + 1);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate customer declaration');
      }
    } catch (error) {
      console.error('Customer declaration generation error:', error);
      toast.error('Failed to generate customer declaration');
    } finally {
      setGeneratingDeclaration(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <HandHeart className="w-5 h-5 text-pink-600" />
          Customer Handover
        </h2>

        <div className="space-y-4">
          {/* Handover Checklist */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="font-medium">System Demo Complete</span>
            <input
              type="checkbox"
              checked={data.demoComplete}
              onChange={(e) => setData({ ...data, demoComplete: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="font-medium">Monitoring App Setup</span>
            <input
              type="checkbox"
              checked={data.appSetup}
              onChange={(e) => setData({ ...data, appSetup: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="font-medium">Monitoring Active</span>
            <input
              type="checkbox"
              checked={data.monitoringActive}
              onChange={(e) => setData({ ...data, monitoringActive: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <span className="font-medium">Warranty Documents Provided</span>
            <input
              type="checkbox"
              checked={data.warrantyProvided}
              onChange={(e) => setData({ ...data, warrantyProvided: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          {/* Customer Rating */}
          <div>
            <Label>Customer Satisfaction Rating</Label>
            <p className="text-sm text-gray-500 mb-2">Tap stars to rate (1-5)</p>
            <div className="flex gap-2 mt-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setData({ ...data, customerRating: star })}
                  className={`text-4xl transition-all hover:scale-110 ${
                    star <= data.customerRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {data.customerRating > 0 && (
              <p className="text-center text-sm text-green-600 mt-2 font-medium">
                Rated {data.customerRating} out of 5 stars
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Generate Customer Declaration */}
      <Card className="p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          STC Rebate Declaration
        </h3>

        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Generate customer declaration for STC (Small-scale Technology Certificate) rebate assignment.
          </p>

          <Button
            onClick={generateCustomerDeclaration}
            disabled={generatingDeclaration || !data.demoComplete}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {generatingDeclaration ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Generate Customer Declaration
              </>
            )}
          </Button>

          {!data.demoComplete && (
            <p className="text-xs text-orange-600">
              Complete system demo before generating customer declaration
            </p>
          )}
        </div>
      </Card>

      {/* Document List */}
      <Card className="p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          Generated Documents
        </h3>
        <DocumentList key={documentsKey} jobId={job.id} />
      </Card>
    </div>
  );
}

function Stage7Complete({ job, data, setData }: any) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingHandover, setGeneratingHandover] = useState(false);
  const [documentsKey, setDocumentsKey] = useState(0);
  
  // Calculate total hours from arrival to now
  const calculateTotalHours = () => {
    if (!data.arrivalTime) return 0;
    const arrival = new Date(data.arrivalTime);
    const now = new Date();
    const diffMs = now.getTime() - arrival.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 10) / 10; // Round to 1 decimal
  };
  
  const totalHours = calculateTotalHours();

  const generateCommissioningReport = async () => {
    setGeneratingReport(true);
    try {
      const token = localStorage.getItem('installer_token') || 
                    localStorage.getItem('auth_token') || 
                    localStorage.getItem('team_token') || 
                    localStorage.getItem('admin_token');
                    
      const response = await fetch(`/api/installer/jobs/${job.id}/documents/commissioning-report/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Commissioning Report generated successfully!');
        setDocumentsKey(prev => prev + 1);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate commissioning report');
      }
    } catch (error) {
      console.error('Commissioning report generation error:', error);
      toast.error('Failed to generate commissioning report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const generateHandoverPack = async () => {
    setGeneratingHandover(true);
    try {
      const token = localStorage.getItem('installer_token') || 
                    localStorage.getItem('auth_token') || 
                    localStorage.getItem('team_token') || 
                    localStorage.getItem('admin_token');
                    
      const response = await fetch(`/api/installer/jobs/${job.id}/documents/handover-pack/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Handover Pack generated! Includes ${result.documentsIncluded} documents`);
        setDocumentsKey(prev => prev + 1);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate handover pack');
      }
    } catch (error) {
      console.error('Handover pack generation error:', error);
      toast.error('Failed to generate handover pack');
    } finally {
      setGeneratingHandover(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card className="p-6 text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="font-bold text-2xl mb-2">Job Complete! 🎉</h2>
        <p className="text-gray-600 mb-6">Great work on completing this installation</p>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {totalHours > 0 ? `${totalHours}h` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Total Time</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {data.customerRating > 0 ? `${data.customerRating}/5` : 'Not Rated'}
            </div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
        </div>

        {/* Notes */}
        <div className="text-left mb-6">
          <Label>Final Notes</Label>
          <Textarea
            value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            placeholder="Any additional notes or observations..."
            rows={4}
          />
        </div>
      </Card>

      {/* Generate Final Documents */}
      <Card className="p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          Final Documentation
        </h3>

        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Generate final documents for customer handover.
          </p>

          <Button
            onClick={generateCommissioningReport}
            disabled={generatingReport}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {generatingReport ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4 mr-2" />
                Generate Commissioning Report
              </>
            )}
          </Button>

          <Button
            onClick={generateHandoverPack}
            disabled={generatingHandover}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {generatingHandover ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Generate Handover Pack
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Document List */}
      <Card className="p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          All Generated Documents
        </h3>
        <DocumentList key={documentsKey} jobId={job.id} />
      </Card>

      {/* Clock Out */}
      <Card className="p-6 text-center">
        <Button
          onClick={async () => {
            if (isCompleting) return; // Prevent double-click
            
            setIsCompleting(true);
            const clockOutTime = new Date();
            const finalData = { 
              ...data, 
              clockOutTime,
              totalHours
            };
            setData(finalData);
            
            // Save completion to database
            try {
              const token = localStorage.getItem('installer_token') || localStorage.getItem('auth_token') || localStorage.getItem('team_token') || localStorage.getItem('admin_token');
              const response = await fetch(`/api/installer/jobs/${job.id}/wizard`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  stage: 7,
                  data: finalData,
                }),
              });
              
              if (response.ok) {
                toast.success('Job completed successfully!');
                setTimeout(() => router.push('/mobile/installer'), 1500);
              } else {
                toast.error('Failed to complete job. Please try again.');
                setIsCompleting(false);
              }
            } catch (error) {
              console.error('Complete job error:', error);
              toast.error('Failed to complete job. Please try again.');
              setIsCompleting(false);
            }
          }}
          disabled={isCompleting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
          size="lg"
        >
          {isCompleting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Completing...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Clock Out & Complete Job
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}
