'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  ZoomIn, 
  ZoomOut, 
  Ruler, 
  Save, 
  Download, 
  Wand2, 
  ArrowLeft,
  Layers,
  Settings
} from 'lucide-react';

// Dynamically import map component (no SSR)
const DynamicPanelMap = dynamic(
  () => import('@/components/design-tools/DynamicPanelMap'),
  { ssr: false }
);

interface Panel {
  id: string;
  latitude: number;
  longitude: number;
  orientationDegrees: number;
  segmentIndex: number;
  wattage: number;
  yearlyEnergyKwh: number;
  stringId?: string;
}

interface RoofSegment {
  pitchDegrees: number;
  azimuthDegrees: number;
  areaMeters2: number;
  centerLatitude?: number;
  centerLongitude?: number;
  stats?: {
    sunshineQuantiles: number[];
  };
}

interface RoofAnalysis {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  maxArrayPanelsCount: number;
  panelCapacityWatts: number;
  panelHeightMeters: number;
  panelWidthMeters: number;
  solarPanels: any[];
  roofSegments: RoofSegment[];
  rgbUrl: string;
  imageryProvider: string;
  imageryResolution: number;
}

interface JobData {
  id: string;
  customerName: string;
  address: string;
  roofAnalysis: RoofAnalysis;
}

export default function PanelArrayDesigner() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const [designMode, setDesignMode] = useState<'auto' | 'manual'>('auto');
  const [saving, setSaving] = useState(false);
  
  // Load job data
  useEffect(() => {
    loadJobData();
  }, [jobId]);
  
  async function loadJobData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/jobs/${jobId}/roof-analysis`);
      
      if (!response.ok) {
        throw new Error('Failed to load job data');
      }
      
      const data = await response.json();
      setJobData(data);
      
      // Load Google's automatic panel layout
      if (data.roofAnalysis?.solarPanels && data.roofAnalysis.solarPanels.length > 0) {
        const loadedPanels = data.roofAnalysis.solarPanels.map((p: any, idx: number) => ({
          id: `P${idx + 1}`,
          latitude: p.center?.latitude || p.centerLatitude,
          longitude: p.center?.longitude || p.centerLongitude,
          orientationDegrees: p.orientation || p.orientationDegrees || 0,
          segmentIndex: p.segmentIndex || 0,
          wattage: data.roofAnalysis.panelCapacityWatts,
          yearlyEnergyKwh: p.yearlyEnergyDcKwh || 0,
          stringId: `string-${Math.floor(idx / 12) + 1}` // 12 panels per string
        }));
        setPanels(loadedPanels);
      }
      
    } catch (error) {
      console.error('Failed to load job data:', error);
      alert('Failed to load job data. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleAutoDesign() {
    if (!jobData?.roofAnalysis) return;
    
    // Reload Google's automatic design
    await loadJobData();
    setDesignMode('auto');
  }
  
  async function handleSaveDesign() {
    if (!jobData) return;
    
    try {
      setSaving(true);
      
      const totalCapacity = (panels.length * jobData.roofAnalysis.panelCapacityWatts) / 1000;
      const totalProduction = panels.reduce((sum, p) => sum + p.yearlyEnergyKwh, 0);
      
      const response = await fetch(`/api/admin/jobs/${jobId}/save-panel-design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panels,
          totalPanels: panels.length,
          totalCapacity,
          totalProduction,
          designMode
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save design');
      }
      
      alert('Design saved successfully!');
      
    } catch (error) {
      console.error('Failed to save design:', error);
      alert('Failed to save design. Please try again.');
    } finally {
      setSaving(false);
    }
  }
  
  async function handleExportDrawings() {
    if (!jobData) return;
    
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/export-drawings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panels })
      });
      
      if (!response.ok) {
        throw new Error('Failed to export drawings');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solar-plan-${jobId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to export drawings:', error);
      alert('Failed to export drawings. Please try again.');
    }
  }
  
  function handlePanelMove(panelId: string, newLat: number, newLng: number) {
    setPanels(prevPanels => 
      prevPanels.map(p => 
        p.id === panelId 
          ? { ...p, latitude: newLat, longitude: newLng }
          : p
      )
    );
    setDesignMode('manual'); // Switch to manual mode when user moves panels
  }
  
  function handleAddPanel() {
    if (!jobData?.roofAnalysis) return;
    
    const newPanel: Panel = {
      id: `P${panels.length + 1}`,
      latitude: jobData.roofAnalysis.latitude,
      longitude: jobData.roofAnalysis.longitude,
      orientationDegrees: 0,
      segmentIndex: 0,
      wattage: jobData.roofAnalysis.panelCapacityWatts,
      yearlyEnergyKwh: 0,
      stringId: `string-${Math.floor(panels.length / 12) + 1}`
    };
    
    setPanels([...panels, newPanel]);
    setDesignMode('manual');
  }
  
  function handleRemovePanel(panelId: string) {
    setPanels(prevPanels => prevPanels.filter(p => p.id !== panelId));
    if (selectedPanel?.id === panelId) {
      setSelectedPanel(null);
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading panel designer...</p>
        </div>
      </div>
    );
  }
  
  if (!jobData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load job data</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  const totalCapacity = (panels.length * jobData.roofAnalysis.panelCapacityWatts) / 1000;
  const totalProduction = panels.reduce((sum, p) => sum + p.yearlyEnergyKwh, 0);
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Panel Array Designer
                </h1>
                <p className="text-sm text-gray-600">
                  {jobData.customerName} - {jobData.address}
                </p>
              </div>
            </div>
            
            {/* Center: Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDesignMode('auto')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  designMode === 'auto'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Auto Design
              </button>
              <button
                onClick={() => setDesignMode('manual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  designMode === 'manual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Manual Design
              </button>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoDesign}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Auto Design
              </button>
              <button
                onClick={handleSaveDesign}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleExportDrawings}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* System Overview */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                System Overview
              </h3>
              <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Panels:</span>
                  <span className="text-sm font-semibold text-gray-900">{panels.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">System Size:</span>
                  <span className="text-sm font-semibold text-gray-900">{totalCapacity.toFixed(2)}kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Annual Production:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {totalProduction.toFixed(0)} kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Panel Wattage:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {jobData.roofAnalysis.panelCapacityWatts}W
                  </span>
                </div>
              </div>
            </div>
            
            {/* Roof Segments */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Roof Segments</h3>
              <div className="space-y-2">
                {jobData.roofAnalysis.roofSegments?.map((segment: RoofSegment, idx: number) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-sm text-gray-900 mb-2">
                      Segment {idx + 1}
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Pitch:</span>
                        <span className="font-medium">{segment.pitchDegrees?.toFixed(1)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Azimuth:</span>
                        <span className="font-medium">{segment.azimuthDegrees?.toFixed(0)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Area:</span>
                        <span className="font-medium">{segment.areaMeters2?.toFixed(1)}m²</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Imagery Info */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Imagery</h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {jobData.roofAnalysis.imageryProvider}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Resolution:</span>
                  <span className="font-medium text-gray-900">
                    {jobData.roofAnalysis.imageryResolution}cm/pixel
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Map Canvas */}
        <div className="flex-1 relative bg-gray-100">
          {/* Interactive Leaflet Map */}
          <DynamicPanelMap
            centerLat={jobData.roofAnalysis.latitude}
            centerLng={jobData.roofAnalysis.longitude}
            panels={panels}
            roofSegments={jobData.roofAnalysis.roofSegments || []}
            selectedPanel={selectedPanel}
            onPanelSelect={setSelectedPanel}
            onPanelMove={handlePanelMove}
            panelWidthMeters={jobData.roofAnalysis.panelWidthMeters}
            panelHeightMeters={jobData.roofAnalysis.panelHeightMeters}
            rgbUrl={jobData.roofAnalysis.rgbUrl}
          />
          
          {/* Floating Controls */}
          <div className="absolute top-4 right-4 space-y-2 z-[1000]">
            <button 
              onClick={handleAddPanel}
              className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
              title="Add Panel"
            >
              <Layers className="w-5 h-5 text-gray-700" />
            </button>
            {selectedPanel && (
              <button 
                onClick={() => handleRemovePanel(selectedPanel.id)}
                className="bg-red-500 p-3 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                title="Remove Selected Panel"
              >
                <span className="text-white font-bold">×</span>
              </button>
            )}
          </div>
          
          {/* Info Overlay */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs z-[1000]">
            <div className="font-semibold mb-1">Map Controls:</div>
            <div className="text-gray-600 space-y-0.5">
              <div>• Click panel to select</div>
              <div>• Drag panel to move</div>
              <div>• Scroll to zoom</div>
              <div>• {designMode === 'auto' ? 'Auto' : 'Manual'} mode active</div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Selected Panel */}
            {selectedPanel ? (
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Selected Panel</h3>
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Panel ID:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedPanel.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Wattage:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedPanel.wattage}W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Production:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedPanel.yearlyEnergyKwh.toFixed(0)} kWh/yr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">String:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedPanel.stringId}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Panel Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600">
                  Click on a panel to view details
                </div>
              </div>
            )}
            
            {/* String Configuration */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">String Configuration</h3>
              <div className="space-y-2">
                {Array.from(new Set(panels.map(p => p.stringId))).map((stringId, idx) => {
                  const stringPanels = panels.filter(p => p.stringId === stringId);
                  const stringProduction = stringPanels.reduce((sum, p) => sum + p.yearlyEnergyKwh, 0);
                  
                  return (
                    <div key={stringId} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: getStringColor(idx) }}
                        />
                        <span className="font-medium text-sm text-gray-900">
                          String {idx + 1}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Panels:</span>
                          <span className="font-medium">{stringPanels.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Voltage:</span>
                          <span className="font-medium">~{stringPanels.length * 40}V</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Production:</span>
                          <span className="font-medium">{stringProduction.toFixed(0)} kWh/yr</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStringColor(index: number): string {
  const colors = [
    '#ef4444',  // Red
    '#3b82f6',  // Blue
    '#10b981',  // Green
    '#f59e0b',  // Orange
    '#8b5cf6',  // Purple
    '#ec4899',  // Pink
  ];
  return colors[index % colors.length];
}
