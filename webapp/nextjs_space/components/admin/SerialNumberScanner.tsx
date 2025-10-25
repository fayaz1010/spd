'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ScanLine,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import {
  validateSerialNumber,
  extractSerialNumber,
  detectEquipmentType,
  isDuplicate,
  formatSerialNumber,
  vibrateOnScan,
  beepOnScan,
  parseManufacturer,
  ScanStatistics
} from '@/lib/barcodeScanner';

interface SerialNumberScannerProps {
  onScanComplete: (serial: string, metadata: any) => void;
  existingSerials?: string[];
  expectedType?: 'panel' | 'inverter' | 'battery';
  onClose: () => void;
}

export function SerialNumberScanner({
  onScanComplete,
  existingSerials = [],
  expectedType,
  onClose
}: SerialNumberScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [detectedType, setDetectedType] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stats] = useState(new ScanStatistics());
  const scannerRef = useRef<any>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const scanStartTime = useRef<number>(0);

  useEffect(() => {
    // Dynamically import html5-qrcode to avoid SSR issues
    if (scanning && videoRef.current) {
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        const scanner = new Html5Qrcode('scanner-region');
        scannerRef.current = scanner;

        scanner.start(
          { facingMode: 'environment' }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText, decodedResult) => {
            handleScanSuccess(decodedText, decodedResult);
          },
          (errorMessage) => {
            // Ignore continuous scan errors
          }
        ).catch((err) => {
          console.error('Scanner start error:', err);
          setCameraError('Failed to access camera. Please check permissions.');
          setScanning(false);
        });

        scanStartTime.current = Date.now();
      });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err: any) => {
          console.error('Scanner stop error:', err);
        });
      }
    };
  }, [scanning]);

  const handleScanSuccess = (decodedText: string, decodedResult: any) => {
    const scanTime = Date.now() - scanStartTime.current;
    
    // Extract serial number from scanned text
    const serial = extractSerialNumber(decodedText);
    setScannedText(serial);

    // Validate serial number
    const validation = validateSerialNumber(serial);
    setValidationResult(validation);

    // Detect equipment type
    const typeDetection = detectEquipmentType(serial);
    setDetectedType(typeDetection);

    // Check for duplicate
    const duplicate = isDuplicate(serial, existingSerials);

    // Vibrate and beep on successful scan
    vibrateOnScan();
    beepOnScan();

    // Record statistics
    if (validation.isValid && !duplicate) {
      stats.recordSuccess(scanTime);
      toast.success('Serial number scanned!');
    } else if (duplicate) {
      stats.recordDuplicate();
      toast.error('Duplicate serial number!');
    } else {
      stats.recordFailure();
      toast.error('Invalid serial number');
    }

    // Stop scanning
    setScanning(false);
    if (scannerRef.current) {
      scannerRef.current.stop();
    }
  };

  const handleConfirm = () => {
    if (!validationResult?.isValid) {
      toast.error('Cannot confirm invalid serial number');
      return;
    }

    const duplicate = isDuplicate(scannedText, existingSerials);
    if (duplicate) {
      toast.error('Cannot confirm duplicate serial number');
      return;
    }

    const manufacturer = parseManufacturer(scannedText);

    const metadata = {
      scannedAt: new Date().toISOString(),
      scanMethod: 'qr_barcode',
      detectedType: detectedType?.type,
      detectedManufacturer: manufacturer,
      confidence: detectedType?.confidence,
      scanStats: stats.getStats()
    };

    onScanComplete(scannedText, metadata);
    onClose();
  };

  const handleManualEntry = () => {
    // Switch to manual entry mode (handled by parent component)
    onClose();
  };

  const startScanning = () => {
    setScanning(true);
    setCameraError(null);
    setScannedText('');
    setValidationResult(null);
    setDetectedType(null);
  };

  const duplicate = scannedText ? isDuplicate(scannedText, existingSerials) : false;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Scan Serial Number</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Scanner Region */}
          {scanning && (
            <div className="space-y-4">
              <div
                id="scanner-region"
                ref={videoRef}
                className="rounded-lg overflow-hidden border-4 border-blue-500"
              />
              <Alert>
                <Camera className="h-4 w-4" />
                <AlertDescription>
                  Point your camera at the QR code or barcode on the equipment
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Camera Error */}
          {cameraError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{cameraError}</AlertDescription>
            </Alert>
          )}

          {/* Scan Result */}
          {scannedText && !scanning && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Scanned Serial:</span>
                  {validationResult?.isValid && !duplicate ? (
                    <Badge className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {duplicate ? 'Duplicate' : 'Invalid'}
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-mono font-bold">
                  {formatSerialNumber(scannedText)}
                </div>
              </div>

              {/* Equipment Type Detection */}
              {detectedType && detectedType.type !== 'unknown' && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Auto-Detected:</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-gray-600">Type:</span>{' '}
                      <span className="font-medium capitalize">{detectedType.type}</span>
                    </div>
                    {parseManufacturer(scannedText) && (
                      <div>
                        <span className="text-gray-600">Manufacturer:</span>{' '}
                        <span className="font-medium">{parseManufacturer(scannedText)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Confidence:</span>{' '}
                      <span className="font-medium">
                        {Math.round(detectedType.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Type Mismatch Warning */}
              {expectedType &&
                detectedType?.type !== 'unknown' &&
                detectedType?.type !== expectedType && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Expected {expectedType}, but detected {detectedType.type}
                    </AlertDescription>
                  </Alert>
                )}

              {/* Validation Errors */}
              {validationResult?.errors.length > 0 && (
                <div className="space-y-2">
                  {validationResult.errors.map((error: string, i: number) => (
                    <Alert key={i} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Validation Warnings */}
              {validationResult?.warnings.length > 0 && (
                <div className="space-y-2">
                  {validationResult.warnings.map((warning: string, i: number) => (
                    <Alert key={i}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Duplicate Warning */}
              {duplicate && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This serial number has already been scanned
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!scanning && !scannedText && (
              <>
                <Button onClick={startScanning} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
                <Button variant="outline" onClick={handleManualEntry}>
                  Manual Entry
                </Button>
              </>
            )}

            {scanning && (
              <Button
                variant="outline"
                onClick={() => {
                  setScanning(false);
                  if (scannerRef.current) {
                    scannerRef.current.stop();
                  }
                }}
                className="flex-1"
              >
                Cancel Scan
              </Button>
            )}

            {scannedText && !scanning && (
              <>
                <Button
                  onClick={handleConfirm}
                  disabled={!validationResult?.isValid || duplicate}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm & Save
                </Button>
                <Button variant="outline" onClick={startScanning}>
                  Scan Again
                </Button>
              </>
            )}
          </div>

          {/* Help Text */}
          {!scanning && !scannedText && (
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium">Tips for successful scanning:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure good lighting</li>
                <li>Hold camera steady</li>
                <li>Keep QR code/barcode in frame</li>
                <li>Clean the code if dirty</li>
                <li>Try different angles if not scanning</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
