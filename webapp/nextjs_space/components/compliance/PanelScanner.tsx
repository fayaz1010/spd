'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Camera, CheckCircle2, XCircle, AlertTriangle, Scan, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PanelScannerProps {
  jobId: string;
  onScanComplete?: (serial: string, isValid: boolean) => void;
  mode?: 'camera' | 'manual' | 'bulk';
}

interface ValidationResult {
  serialNumber: string;
  isValid: boolean;
  isCecApproved: boolean;
  manufacturer?: string;
  model?: string;
  wattage?: number;
  isFlagged: boolean;
  flagReason?: string;
}

export function PanelScanner({ jobId, onScanComplete, mode = 'manual' }: PanelScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualSerial, setManualSerial] = useState('');
  const [validating, setValidating] = useState(false);
  const [lastResult, setLastResult] = useState<ValidationResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ValidationResult[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validatePanelSerial = async (serialNumber: string): Promise<ValidationResult> => {
    try {
      const response = await fetch('/api/compliance/validate-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, serialNumber }),
      });

      if (!response.ok) throw new Error('Validation failed');

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Panel validation error:', error);
      return {
        serialNumber,
        isValid: false,
        isCecApproved: false,
        isFlagged: true,
        flagReason: 'Validation service unavailable',
      };
    }
  };

  const handleManualScan = async () => {
    if (!manualSerial.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a serial number',
        variant: 'destructive',
      });
      return;
    }

    setValidating(true);
    try {
      const result = await validatePanelSerial(manualSerial);
      setLastResult(result);
      setScanHistory([result, ...scanHistory]);

      if (result.isCecApproved) {
        toast({
          title: '✓ Panel Validated',
          description: `${result.manufacturer} ${result.model} - ${result.wattage}W`,
        });
      } else if (result.isFlagged) {
        toast({
          title: '⚠ Panel Flagged',
          description: result.flagReason || 'Not CEC approved',
          variant: 'destructive',
        });
      }

      onScanComplete?.(manualSerial, result.isCecApproved);
      setManualSerial('');
    } catch (error) {
      toast({
        title: 'Validation Error',
        description: 'Failed to validate panel serial number',
        variant: 'destructive',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Read CSV/TXT file with serial numbers
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const serials = text.split(/[\n,]/).map(s => s.trim()).filter(s => s);

      toast({
        title: 'Bulk Validation Started',
        description: `Validating ${serials.length} panel serial numbers...`,
      });

      // Validate each serial
      for (const serial of serials) {
        const result = await validatePanelSerial(serial);
        setScanHistory(prev => [result, ...prev]);
      }

      toast({
        title: 'Bulk Validation Complete',
        description: `Validated ${serials.length} panels`,
      });
    };
    reader.readAsText(file);
  };

  const handleCameraScan = () => {
    setScanning(true);
    // In production, integrate with react-qr-scanner or @zxing/library
    toast({
      title: 'Camera Scanner',
      description: 'Camera scanning will be available in next update',
    });
    setScanning(false);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Mode Selection */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'camera' ? 'default' : 'outline'}
          onClick={handleCameraScan}
          disabled={scanning}
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera Scan
        </Button>
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          onClick={() => {}}
        >
          <Scan className="h-4 w-4 mr-2" />
          Manual Entry
        </Button>
        <Button
          variant={mode === 'bulk' ? 'default' : 'outline'}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleBulkUpload}
          className="hidden"
        />
      </div>

      {/* Manual Entry */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="serialNumber">Panel Serial Number</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="serialNumber"
                value={manualSerial}
                onChange={(e) => setManualSerial(e.target.value)}
                placeholder="Enter or scan serial number"
                onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
              />
              <Button
                onClick={handleManualScan}
                disabled={validating || !manualSerial.trim()}
              >
                {validating ? 'Validating...' : 'Validate'}
              </Button>
            </div>
          </div>

          {/* Last Result */}
          {lastResult && (
            <div
              className={`p-4 rounded-lg border-2 ${
                lastResult.isCecApproved
                  ? 'bg-green-50 border-green-200'
                  : lastResult.isFlagged
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {lastResult.isCecApproved ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : lastResult.isFlagged ? (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">
                    {lastResult.isCecApproved ? 'Panel Validated ✓' : 'Validation Failed'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Serial: {lastResult.serialNumber}
                  </p>
                  {lastResult.manufacturer && (
                    <p className="text-sm text-gray-600">
                      {lastResult.manufacturer} {lastResult.model} - {lastResult.wattage}W
                    </p>
                  )}
                  {lastResult.flagReason && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠ {lastResult.flagReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            Scan History ({scanHistory.length} panels)
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {scanHistory.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {result.isCecApproved ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{result.serialNumber}</p>
                    {result.manufacturer && (
                      <p className="text-xs text-gray-600">
                        {result.manufacturer} {result.model}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    result.isCecApproved
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {result.isCecApproved ? 'Approved' : 'Not Approved'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
