'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FileText, Download, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  generateSLDSVG, 
  calculateSLDParameters, 
  generateSLDReport,
  type SLDData 
} from '@/lib/sld-generator';

interface SLDGeneratorProps {
  jobId: string;
  initialData?: Partial<SLDData>;
}

export function SLDGenerator({ jobId, initialData }: SLDGeneratorProps) {
  const [formData, setFormData] = useState<SLDData>({
    systemSize: initialData?.systemSize || 6.6,
    panelCount: initialData?.panelCount || 20,
    panelWattage: 330,
    panelVoltage: 40,
    panelCurrent: 8.25,
    inverterModel: 'Fronius Primo 5.0',
    inverterCapacity: 5.0,
    inverterPhases: 1,
    inverterVoltage: 230,
    hasBattery: false,
    batteryModel: '',
    batteryCapacity: 0,
    batteryVoltage: 0,
    stringsCount: 2,
    panelsPerString: 10,
    dcIsolator: true,
    acIsolator: true,
    surgeProtection: true,
    earthing: true,
    dcCableSize: 6,
    dcCableLength: 15,
    acCableSize: 4,
    acCableLength: 10,
    gridVoltage: 230,
    exportLimit: 5,
    customerName: initialData?.customerName || '',
    address: initialData?.address || '',
    installationDate: new Date().toISOString().split('T')[0],
  });

  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const calculations = calculateSLDParameters(formData);

  const handleGenerate = () => {
    setShowPreview(true);
    toast({
      title: 'SLD Generated',
      description: 'Single Line Diagram has been generated successfully',
    });
  };

  const handleDownloadSVG = () => {
    const svg = generateSLDSVG(formData, calculations);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SLD_${formData.customerName.replace(/\s+/g, '_')}_${formData.installationDate}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    const report = generateSLDReport(formData);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SLD_Report_${formData.customerName.replace(/\s+/g, '_')}_${formData.installationDate}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-full p-3">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Single Line Diagram Generator</h2>
            <p className="text-sm text-gray-600">Generate AS/NZS 5033 compliant electrical diagrams</p>
          </div>
        </div>
      </Card>

      {/* System Configuration */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">System Configuration</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>System Size (kW)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.systemSize}
              onChange={(e) => setFormData({ ...formData, systemSize: parseFloat(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>Panel Count</Label>
            <Input
              type="number"
              value={formData.panelCount}
              onChange={(e) => setFormData({ ...formData, panelCount: parseInt(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>Panel Wattage (W)</Label>
            <Input
              type="number"
              value={formData.panelWattage}
              onChange={(e) => setFormData({ ...formData, panelWattage: parseInt(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>Strings Count</Label>
            <Input
              type="number"
              value={formData.stringsCount}
              onChange={(e) => setFormData({ ...formData, stringsCount: parseInt(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>Panels per String</Label>
            <Input
              type="number"
              value={formData.panelsPerString}
              onChange={(e) => setFormData({ ...formData, panelsPerString: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </Card>

      {/* Inverter Configuration */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Inverter Configuration</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label>Inverter Model</Label>
            <Input
              value={formData.inverterModel}
              onChange={(e) => setFormData({ ...formData, inverterModel: e.target.value })}
            />
          </div>
          
          <div>
            <Label>Capacity (kW)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.inverterCapacity}
              onChange={(e) => setFormData({ ...formData, inverterCapacity: parseFloat(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>Phases</Label>
            <Input
              type="number"
              value={formData.inverterPhases}
              onChange={(e) => setFormData({ ...formData, inverterPhases: parseInt(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>Voltage (V)</Label>
            <Input
              type="number"
              value={formData.inverterVoltage}
              onChange={(e) => setFormData({ ...formData, inverterVoltage: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </Card>

      {/* Cable Specifications */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Cable Specifications</h3>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <Label>DC Cable Size (mm²)</Label>
            <Input
              type="number"
              value={formData.dcCableSize}
              onChange={(e) => setFormData({ ...formData, dcCableSize: parseFloat(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>DC Cable Length (m)</Label>
            <Input
              type="number"
              value={formData.dcCableLength}
              onChange={(e) => setFormData({ ...formData, dcCableLength: parseFloat(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>AC Cable Size (mm²)</Label>
            <Input
              type="number"
              value={formData.acCableSize}
              onChange={(e) => setFormData({ ...formData, acCableSize: parseFloat(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>AC Cable Length (m)</Label>
            <Input
              type="number"
              value={formData.acCableLength}
              onChange={(e) => setFormData({ ...formData, acCableLength: parseFloat(e.target.value) })}
            />
          </div>
        </div>
      </Card>

      {/* Protection Equipment */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Protection Equipment</h3>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between">
            <Label>DC Isolator</Label>
            <Switch
              checked={formData.dcIsolator}
              onCheckedChange={(checked) => setFormData({ ...formData, dcIsolator: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>AC Isolator</Label>
            <Switch
              checked={formData.acIsolator}
              onCheckedChange={(checked) => setFormData({ ...formData, acIsolator: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Surge Protection</Label>
            <Switch
              checked={formData.surgeProtection}
              onCheckedChange={(checked) => setFormData({ ...formData, surgeProtection: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Earthing</Label>
            <Switch
              checked={formData.earthing}
              onCheckedChange={(checked) => setFormData({ ...formData, earthing: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Calculations Summary */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Calculations Summary</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">DC Side</h4>
            <div className="space-y-1 text-sm">
              <p>String Voltage: <span className="font-mono">{calculations.stringVoltage.toFixed(1)}V</span></p>
              <p>Total DC Current: <span className="font-mono">{calculations.totalDCCurrent.toFixed(1)}A</span></p>
              <p>Total DC Power: <span className="font-mono">{(calculations.totalDCPower / 1000).toFixed(2)}kW</span></p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">AC Side</h4>
            <div className="space-y-1 text-sm">
              <p>AC Current: <span className="font-mono">{calculations.acCurrent.toFixed(1)}A</span></p>
              <p>AC Power: <span className="font-mono">{(calculations.acPower / 1000).toFixed(2)}kW</span></p>
            </div>
          </div>
        </div>
        
        {/* Voltage Rise */}
        <div className={`mt-4 p-4 rounded-lg ${calculations.isVoltageRiseCompliant ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {calculations.isVoltageRiseCompliant ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="font-semibold">Voltage Rise: {calculations.voltageRisePercent.toFixed(2)}%</p>
              <p className="text-sm">{calculations.isVoltageRiseCompliant ? 'Compliant with AS/NZS 5033 (< 3%)' : 'Exceeds AS/NZS 5033 limit (3%)'}</p>
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        {calculations.recommendations.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-semibold mb-2">⚠ Recommendations:</p>
            <ul className="text-sm space-y-1">
              {calculations.recommendations.map((rec, i) => (
                <li key={i}>• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleGenerate}
          className="flex-1 bg-gradient-primary"
        >
          <Eye className="h-4 w-4 mr-2" />
          Generate SLD
        </Button>
        
        <Button
          onClick={handleDownloadSVG}
          variant="outline"
          disabled={!showPreview}
        >
          <Download className="h-4 w-4 mr-2" />
          Download SVG
        </Button>
        
        <Button
          onClick={handleDownloadReport}
          variant="outline"
          disabled={!showPreview}
        >
          <FileText className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Preview */}
      {showPreview && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">SLD Preview</h3>
          <div 
            className="border rounded-lg p-4 bg-white overflow-auto"
            dangerouslySetInnerHTML={{ __html: generateSLDSVG(formData, calculations) }}
          />
        </Card>
      )}
    </div>
  );
}
