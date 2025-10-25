'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  Scan,
  FileText,
  Clock
} from 'lucide-react';

interface ValidationResult {
  valid: boolean;
  manufacturer?: string;
  model?: string;
  wattage?: number;
  message: string;
}

export default function PanelScanner() {
  const router = useRouter();
  const [serialNumber, setSerialNumber] = useState('');
  const [scanning, setScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [scannedPanels, setScannedPanels] = useState<string[]>([]);

  const validateSerial = async () => {
    if (!serialNumber.trim()) {
      alert('Please enter a serial number');
      return;
    }

    setScanning(true);
    try {
      // Call validation API
      const response = await fetch('/api/validation/panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialNumber: serialNumber.trim() })
      });

      const data = await response.json();
      
      setValidationResult({
        valid: data.valid,
        manufacturer: data.manufacturer,
        model: data.model,
        wattage: data.wattage,
        message: data.message
      });

      if (data.valid) {
        setScannedPanels([...scannedPanels, serialNumber.trim()]);
        // Clear input for next scan
        setTimeout(() => {
          setSerialNumber('');
          setValidationResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error validating serial:', error);
      setValidationResult({
        valid: false,
        message: 'Failed to validate serial number'
      });
    } finally {
      setScanning(false);
    }
  };

  const startCamera = () => {
    alert('Camera scanning will be implemented with barcode scanner library');
    // In production, use react-qr-scanner or @zxing/library
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Panel Serial Validation</h1>
              <p className="text-sm opacity-90">Scan or enter panel serial numbers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Scan Methods */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Scan Method</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={startCamera}
              className="p-4 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl shadow-md active:scale-95 transition-transform"
            >
              <Camera className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold text-sm">Camera Scan</div>
            </button>
            <button
              onClick={() => document.getElementById('serialInput')?.focus()}
              className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md active:scale-95 transition-transform"
            >
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold text-sm">Manual Entry</div>
            </button>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Enter Serial Number</h2>
          <div className="space-y-3">
            <input
              id="serialInput"
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
              placeholder="e.g., TRINA-2024-ABC123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              onKeyPress={(e) => e.key === 'Enter' && validateSerial()}
            />
            <button
              onClick={validateSerial}
              disabled={scanning || !serialNumber.trim()}
              className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {scanning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Validating...
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5" />
                  Validate Serial
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`rounded-xl p-4 border-2 ${
            validationResult.valid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {validationResult.valid ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <div className={`font-bold mb-1 ${
                  validationResult.valid ? 'text-green-900' : 'text-red-900'
                }`}>
                  {validationResult.valid ? 'Valid Panel ✓' : 'Invalid Panel'}
                </div>
                <div className={`text-sm mb-2 ${
                  validationResult.valid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validationResult.message}
                </div>
                {validationResult.valid && (
                  <div className="space-y-1 text-sm text-gray-700">
                    <div><strong>Manufacturer:</strong> {validationResult.manufacturer}</div>
                    <div><strong>Model:</strong> {validationResult.model}</div>
                    <div><strong>Wattage:</strong> {validationResult.wattage}W</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scanned Panels */}
        {scannedPanels.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Scanned Panels</h2>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                {scannedPanels.length} panels
              </span>
            </div>
            <div className="space-y-2">
              {scannedPanels.map((serial, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 font-mono text-sm">{serial}</div>
                  <div className="text-xs text-gray-500">#{index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <div className="font-semibold mb-1">Panel Validation</div>
              <ul className="space-y-1 text-blue-800">
                <li>• Validates against CEC approved database</li>
                <li>• Checks for duplicate serial numbers</li>
                <li>• Detects counterfeit panels</li>
                <li>• Required for rebate submission</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link href="/mobile/installer" className="flex flex-col items-center py-2 text-gray-600">
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/mobile/installer/jobs" className="flex flex-col items-center py-2 text-gray-600">
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs">Jobs</span>
          </Link>
          <Link href="/mobile/installer/scan" className="flex flex-col items-center py-2 text-teal-600">
            <Scan className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Scan</span>
          </Link>
          <Link href="/mobile/clock" className="flex flex-col items-center py-2 text-gray-600">
            <Clock className="w-6 h-6 mb-1" />
            <span className="text-xs">Clock</span>
          </Link>
          <Link href="/mobile/schedule" className="flex flex-col items-center py-2 text-gray-600">
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs">More</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
