'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Hash,
  CheckCircle,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Camera,
  ScanLine
} from 'lucide-react';
import { toast } from 'sonner';
import { SerialNumberScanner } from './SerialNumberScanner';

interface SerialNumberTrackingCardProps {
  jobId: string;
  lead: any;
  onUpdate?: () => void;
}

interface EquipmentSerial {
  id: string;
  equipmentType: string;
  serialNumber: string;
  brand?: string;
  model?: string;
  cecApproved: boolean;
  photoId?: string;
}

export function SerialNumberTrackingCard({ jobId, lead, onUpdate }: SerialNumberTrackingCardProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serials, setSerials] = useState<EquipmentSerial[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerType, setScannerType] = useState<'panel' | 'inverter' | 'battery'>('panel');
  const [scannerIndex, setScannerIndex] = useState<number | null>(null);
  
  // Panel serial numbers
  const [panelSerials, setPanelSerials] = useState<string[]>([]);
  const [inverterSerial, setInverterSerial] = useState('');
  const [batterySerial, setBatterySerial] = useState('');

  const panelCount = lead.numPanels || lead.InstallationJob?.panelCount || 0;
  const hasBattery = (lead.batterySizeKwh || lead.InstallationJob?.batteryCapacity || 0) > 0;

  useEffect(() => {
    fetchSerials();
  }, [jobId]);

  const fetchSerials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/jobs/${jobId}/serial-numbers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSerials(data.serials || []);
        
        // Populate form fields
        const panels = data.serials.filter((s: any) => s.equipmentType === 'panel');
        const inverter = data.serials.find((s: any) => s.equipmentType === 'inverter');
        const battery = data.serials.find((s: any) => s.equipmentType === 'battery');
        
        setPanelSerials(panels.map((p: any) => p.serialNumber));
        setInverterSerial(inverter?.serialNumber || '');
        setBatterySerial(battery?.serialNumber || '');
      }
    } catch (error) {
      console.error('Error fetching serials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanComplete = (serial: string, metadata: any, type: 'panel' | 'inverter' | 'battery', index?: number) => {
    if (type === 'panel' && index !== null && index !== undefined) {
      const newSerials = [...panelSerials];
      newSerials[index] = serial;
      setPanelSerials(newSerials);
      toast.success(`Panel ${index + 1} serial scanned!`);
    } else if (type === 'inverter') {
      setInverterSerial(serial);
      toast.success('Inverter serial scanned!');
    } else if (type === 'battery') {
      setBatterySerial(serial);
      toast.success('Battery serial scanned!');
    }
  };

  const openScanner = (type: 'panel' | 'inverter' | 'battery', index?: number) => {
    setScannerType(type);
    setScannerIndex(index ?? null);
    setShowScanner(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      const serialsToSave = [
        ...panelSerials.filter(s => s.trim()).map((serial, index) => ({
          equipmentType: 'panel',
          serialNumber: serial.trim(),
          brand: lead.CustomerQuote?.panelBrand || lead.CustomerQuote?.panelBrandName,
          model: lead.CustomerQuote?.panelModel
        })),
        ...(inverterSerial.trim() ? [{
          equipmentType: 'inverter',
          serialNumber: inverterSerial.trim(),
          brand: lead.CustomerQuote?.inverterBrand || lead.CustomerQuote?.inverterBrandName,
          model: lead.CustomerQuote?.inverterModel
        }] : []),
        ...(batterySerial.trim() && hasBattery ? [{
          equipmentType: 'battery',
          serialNumber: batterySerial.trim(),
          brand: lead.CustomerQuote?.batteryBrand || lead.CustomerQuote?.batteryBrandName,
          model: lead.CustomerQuote?.batteryModel
        }] : [])
      ];

      const response = await fetch(`/api/admin/jobs/${jobId}/serial-numbers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ serials: serialsToSave })
      });

      if (!response.ok) throw new Error('Failed to save serial numbers');

      toast.success('Serial numbers saved successfully');
      await fetchSerials();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error saving serials:', error);
      toast.error('Failed to save serial numbers');
    } finally {
      setSaving(false);
    }
  };

  const addPanelSerial = () => {
    setPanelSerials([...panelSerials, '']);
  };

  const removePanelSerial = (index: number) => {
    setPanelSerials(panelSerials.filter((_, i) => i !== index));
  };

  const updatePanelSerial = (index: number, value: string) => {
    const updated = [...panelSerials];
    updated[index] = value;
    setPanelSerials(updated);
  };

  const panelsFilled = panelSerials.filter(s => s.trim()).length;
  const inverterFilled = inverterSerial.trim() ? 1 : 0;
  const batteryFilled = (batterySerial.trim() && hasBattery) ? 1 : 0;
  const totalRequired = panelCount + 1 + (hasBattery ? 1 : 0);
  const totalFilled = panelsFilled + inverterFilled + batteryFilled;
  const completionPercentage = Math.round((totalFilled / totalRequired) * 100);
  const isComplete = totalFilled >= totalRequired;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-blue-600" />
            Equipment Serial Numbers
          </span>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge className="bg-orange-500">
                {totalFilled}/{totalRequired} Recorded
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Serial Numbers Progress</span>
            <span className="text-gray-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                isComplete ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Panel Serial Numbers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Solar Panel Serial Numbers ({panelsFilled}/{panelCount})
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPanelSerial}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Panel
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {panelSerials.map((serial, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Panel ${index + 1} serial number`}
                  value={serial}
                  onChange={(e) => updatePanelSerial(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openScanner('panel', index)}
                  title="Scan QR/Barcode"
                >
                  <ScanLine className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removePanelSerial(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {panelSerials.length < panelCount && (
            <p className="text-xs text-orange-600">
              ⚠️ {panelCount - panelSerials.length} more panel serial numbers needed
            </p>
          )}
        </div>

        <Separator />

        {/* Inverter Serial Number */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            Inverter Serial Number {inverterFilled ? '✓' : '(Required)'}
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Inverter serial number"
              value={inverterSerial}
              onChange={(e) => setInverterSerial(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => openScanner('inverter')}
              title="Scan QR/Barcode"
            >
              <ScanLine className="h-4 w-4" />
            </Button>
          </div>
          {lead.CustomerQuote?.inverterBrand && (
            <p className="text-xs text-gray-500">
              {lead.CustomerQuote.inverterBrand} {lead.CustomerQuote.inverterModel}
            </p>
          )}
        </div>

        {/* Battery Serial Number */}
        {hasBattery && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Battery Serial Number {batteryFilled ? '✓' : '(Required)'}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Battery serial number"
                  value={batterySerial}
                  onChange={(e) => setBatterySerial(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openScanner('battery')}
                  title="Scan QR/Barcode"
                >
                  <ScanLine className="h-4 w-4" />
                </Button>
              </div>
              {lead.CustomerQuote?.batteryBrand && (
                <p className="text-xs text-gray-500">
                  {lead.CustomerQuote.batteryBrand} {lead.CustomerQuote.batteryModel}
                </p>
              )}
            </div>
          </>
        )}

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Serial Numbers
            </>
          )}
        </Button>

        {/* Status Messages */}
        {!isComplete && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-sm text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <strong>Required for STC Rebate:</strong> All equipment serial numbers must be recorded and photographed.
            </p>
          </div>
        )}

        {isComplete && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <strong>Complete:</strong> All serial numbers recorded. Remember to photograph each serial number for compliance.
            </p>
          </div>
        )}
      </CardContent>

      {/* Scanner Modal */}
      {showScanner && (
        <SerialNumberScanner
          onScanComplete={(serial, metadata) => {
            handleScanComplete(serial, metadata, scannerType, scannerIndex ?? undefined);
            setShowScanner(false);
          }}
          existingSerials={[...panelSerials, inverterSerial, batterySerial].filter(s => s.trim())}
          expectedType={scannerType}
          onClose={() => setShowScanner(false)}
        />
      )}
    </Card>
  );
}
