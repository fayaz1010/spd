'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  ArrowLeft,
  Save,
  Download,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid,
  Settings,
  FileDown,
  Image as ImageIcon,
  FileText,
  Trash2,
  Copy,
  Plus
} from 'lucide-react';
import Link from 'next/link';

// Component types for the library
const componentTypes = {
  solarArray: { label: 'Solar Array', icon: '☀️', color: '#fef3c7' },
  inverter: { label: 'Inverter', icon: '⚡', color: '#e0e7ff' },
  battery: { label: 'Battery', icon: '🔋', color: '#fef3c7' },
  dcIsolator: { label: 'DC Isolator', icon: '🔴', color: '#fecaca' },
  acIsolator: { label: 'AC Isolator', icon: '🔴', color: '#fecaca' },
  combiner: { label: 'DC Combiner', icon: '🔗', color: '#dbeafe' },
  breaker: { label: 'Circuit Breaker', icon: '⚠️', color: '#fed7aa' },
  meter: { label: 'Meter', icon: '📊', color: '#d1fae5' },
  switchboard: { label: 'Switchboard', icon: '🔌', color: '#dcfce7' },
  earthing: { label: 'Earthing', icon: '⏚', color: '#f3f4f6' },
  grid: { label: 'Grid Connection', icon: '🏭', color: '#e5e7eb' },
};

interface SLDData {
  jobId: string;
  jobNumber: string;
  systemSize: number;
  nodes: Node[];
  edges: Edge[];
  calculations: {
    dcVoltage: number;
    dcCurrent: number;
    acVoltage: number;
    acCurrent: number;
    voltageRise: number;
  };
}

export default function InteractiveSLDDesigner({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [calculations, setCalculations] = useState({
    dcVoltage: 0,
    dcCurrent: 0,
    acVoltage: 230,
    acCurrent: 0,
    voltageRise: 0,
  });
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    fetchDesign();
  }, [params.id]);

  const fetchDesign = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/design/sld/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setJobData(data.job);
        
        if (data.design) {
          setNodes(data.design.nodes || []);
          setEdges(data.design.edges || []);
          setCalculations(data.design.calculations || calculations);
        } else {
          // Initialize with default layout
          initializeDefaultLayout(data.job);
        }
      }
    } catch (error) {
      console.error('Error fetching design:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultLayout = (job: any) => {
    // Create default SLD layout based on job data
    const defaultNodes: Node[] = [
      {
        id: 'solar-1',
        type: 'default',
        position: { x: 50, y: 100 },
        data: { 
          label: `Solar Array\n${job.systemSize}kW`,
          type: 'solarArray',
          specs: {
            power: job.systemSize,
            panels: job.panelCount,
            voltage: 400,
            current: 10
          }
        },
        style: { 
          background: componentTypes.solarArray.color,
          border: '2px solid #000',
          borderRadius: '8px',
          padding: '10px',
          width: 120
        }
      },
      {
        id: 'combiner-1',
        type: 'default',
        position: { x: 220, y: 100 },
        data: { 
          label: 'DC Combiner',
          type: 'combiner'
        },
        style: { 
          background: componentTypes.combiner.color,
          border: '2px solid #000',
          borderRadius: '8px',
          padding: '10px',
          width: 100
        }
      },
      {
        id: 'dc-isolator-1',
        type: 'default',
        position: { x: 370, y: 100 },
        data: { 
          label: 'DC Isolator',
          type: 'dcIsolator'
        },
        style: { 
          background: componentTypes.dcIsolator.color,
          border: '2px solid #000',
          borderRadius: '8px',
          padding: '10px',
          width: 100
        }
      },
      {
        id: 'inverter-1',
        type: 'default',
        position: { x: 520, y: 80 },
        data: { 
          label: `Inverter\n${job.systemSize}kW`,
          type: 'inverter',
          specs: {
            capacity: job.systemSize,
            acVoltage: 230,
            maxCurrent: (job.systemSize * 1000) / 230
          }
        },
        style: { 
          background: componentTypes.inverter.color,
          border: '2px solid #000',
          borderRadius: '8px',
          padding: '10px',
          width: 120,
          height: 80
        }
      },
      {
        id: 'ac-isolator-1',
        type: 'default',
        position: { x: 690, y: 100 },
        data: { 
          label: 'AC Isolator',
          type: 'acIsolator'
        },
        style: { 
          background: componentTypes.acIsolator.color,
          border: '2px solid #000',
          borderRadius: '8px',
          padding: '10px',
          width: 100
        }
      },
      {
        id: 'switchboard-1',
        type: 'default',
        position: { x: 840, y: 80 },
        data: { 
          label: 'Main\nSwitchboard',
          type: 'switchboard'
        },
        style: { 
          background: componentTypes.switchboard.color,
          border: '2px solid #000',
          borderRadius: '8px',
          padding: '10px',
          width: 100,
          height: 80
        }
      },
      {
        id: 'grid-1',
        type: 'default',
        position: { x: 990, y: 100 },
        data: { 
          label: 'Grid',
          type: 'grid'
        },
        style: { 
          background: componentTypes.grid.color,
          border: '2px solid #000',
          borderRadius: '8px',
          padding: '10px',
          width: 80
        }
      }
    ];

    const defaultEdges: Edge[] = [
      { id: 'e1-2', source: 'solar-1', target: 'combiner-1', animated: true, label: '400V DC' },
      { id: 'e2-3', source: 'combiner-1', target: 'dc-isolator-1', animated: true },
      { id: 'e3-4', source: 'dc-isolator-1', target: 'inverter-1', animated: true },
      { id: 'e4-5', source: 'inverter-1', target: 'ac-isolator-1', animated: true, label: '230V AC' },
      { id: 'e5-6', source: 'ac-isolator-1', target: 'switchboard-1', animated: true },
      { id: 'e6-7', source: 'switchboard-1', target: 'grid-1', animated: true },
    ];

    setNodes(defaultNodes);
    setEdges(defaultEdges);
    calculateSystem(defaultNodes, defaultEdges);
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addComponent = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 500 + 100, y: Math.random() * 300 + 100 },
      data: { 
        label: componentTypes[type as keyof typeof componentTypes].label,
        type: type
      },
      style: { 
        background: componentTypes[type as keyof typeof componentTypes].color,
        border: '2px solid #000',
        borderRadius: '8px',
        padding: '10px',
        width: 100
      }
    };

    setNodes((nds) => [...nds, newNode]);
    saveToHistory();
  };

  const calculateSystem = (currentNodes: Node[], currentEdges: Edge[]) => {
    // Real-time calculation logic
    const solarNodes = currentNodes.filter(n => n.data.type === 'solarArray');
    const inverterNodes = currentNodes.filter(n => n.data.type === 'inverter');

    let totalDCVoltage = 0;
    let totalDCCurrent = 0;
    let totalACCurrent = 0;

    solarNodes.forEach(node => {
      if (node.data.specs) {
        totalDCVoltage = Math.max(totalDCVoltage, node.data.specs.voltage || 0);
        totalDCCurrent += node.data.specs.current || 0;
      }
    });

    inverterNodes.forEach(node => {
      if (node.data.specs) {
        totalACCurrent += node.data.specs.maxCurrent || 0;
      }
    });

    setCalculations({
      dcVoltage: totalDCVoltage,
      dcCurrent: totalDCCurrent,
      acVoltage: 230,
      acCurrent: totalACCurrent,
      voltageRise: 0, // TODO: Calculate based on cable lengths
    });
  };

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const saveDesign = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/design/sld/${params.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nodes,
          edges,
          calculations
        })
      });

      if (response.ok) {
        alert('✓ Design saved successfully!');
      }
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const exportToPDF = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/design/sld/${params.id}/export/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nodes, edges, calculations })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SLD-${jobData?.jobNumber || 'design'}.pdf`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const exportToPNG = () => {
    // TODO: Implement PNG export using html2canvas
    alert('PNG export coming soon!');
  };

  const exportToSVG = () => {
    // TODO: Implement SVG export
    alert('SVG export coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SLD Designer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Interactive SLD Designer</h1>
              <p className="text-sm text-gray-600">
                {jobData?.jobNumber} - {jobData?.systemSize}kW System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              title="Undo"
            >
              <Undo className="w-5 h-5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              title="Redo"
            >
              <Redo className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Export Options */}
            <div className="relative group">
              <button className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block z-50">
                <button
                  onClick={exportToPDF}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export as PDF
                </button>
                <button
                  onClick={exportToPNG}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Export as PNG
                </button>
                <button
                  onClick={exportToSVG}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Export as SVG
                </button>
              </div>
            </div>

            <button
              onClick={saveDesign}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Design'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Component Library */}
        {showComponentLibrary && (
          <div className="w-64 bg-white border-r overflow-y-auto">
            <div className="p-4">
              <h2 className="font-bold text-gray-900 mb-3">Component Library</h2>
              <div className="space-y-2">
                {Object.entries(componentTypes).map(([key, component]) => (
                  <button
                    key={key}
                    onClick={() => addComponent(key)}
                    className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left flex items-center gap-3 border border-gray-200"
                  >
                    <span className="text-2xl">{component.icon}</span>
                    <span className="text-sm font-medium">{component.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Right Sidebar - Properties & Calculations */}
        {showProperties && (
          <div className="w-80 bg-white border-l overflow-y-auto">
            <div className="p-4">
              <h2 className="font-bold text-gray-900 mb-3">Real-Time Calculations</h2>
              
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600 mb-1">DC Voltage</div>
                  <div className="text-2xl font-bold text-green-900">{calculations.dcVoltage}V</div>
                </div>

                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-xs text-red-600 mb-1">DC Current</div>
                  <div className="text-2xl font-bold text-red-900">{calculations.dcCurrent.toFixed(1)}A</div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-600 mb-1">AC Voltage</div>
                  <div className="text-2xl font-bold text-blue-900">{calculations.acVoltage}V</div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-xs text-purple-600 mb-1">AC Current</div>
                  <div className="text-2xl font-bold text-purple-900">{calculations.acCurrent.toFixed(1)}A</div>
                </div>
              </div>

              <h2 className="font-bold text-gray-900 mb-3">System Info</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Components:</span>
                  <span className="font-semibold">{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connections:</span>
                  <span className="font-semibold">{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">System Size:</span>
                  <span className="font-semibold">{jobData?.systemSize}kW</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
