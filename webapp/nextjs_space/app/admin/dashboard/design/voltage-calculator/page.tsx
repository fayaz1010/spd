'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Info,
  Download,
  Save
} from 'lucide-react';

interface CableSpec {
  size: number; // mm²
  resistance: number; // Ω/km at 75°C
  maxCurrent: number; // A
}

const cableSizes: CableSpec[] = [
  { size: 1.5, resistance: 16.1, maxCurrent: 16 },
  { size: 2.5, resistance: 9.61, maxCurrent: 24 },
  { size: 4, resistance: 6.0, maxCurrent: 32 },
  { size: 6, resistance: 4.0, maxCurrent: 41 },
  { size: 10, resistance: 2.4, maxCurrent: 57 },
  { size: 16, resistance: 1.5, maxCurrent: 76 },
  { size: 25, resistance: 0.96, maxCurrent: 101 },
  { size: 35, resistance: 0.69, maxCurrent: 125 },
  { size: 50, resistance: 0.49, maxCurrent: 151 },
  { size: 70, resistance: 0.35, maxCurrent: 192 },
  { size: 95, resistance: 0.25, maxCurrent: 232 },
  { size: 120, resistance: 0.20, maxCurrent: 269 },
];

export default function VoltageRiseCalculator() {
  const router = useRouter();
  
  // Input parameters
  const [voltage, setVoltage] = useState(230); // V
  const [current, setCurrent] = useState(20); // A
  const [cableLength, setCableLength] = useState(20); // m
  const [cableSize, setCableSize] = useState(4); // mm²
  const [powerFactor, setPowerFactor] = useState(1.0);
  const [phaseType, setPhaseType] = useState<'single' | 'three'>('single');
  
  // Results
  const [voltageRise, setVoltageRise] = useState(0);
  const [voltageRisePercent, setVoltageRisePercent] = useState(0);
  const [compliant, setCompliant] = useState(true);
  const [recommendedSize, setRecommendedSize] = useState<number | null>(null);
  
  const calculateVoltageRise = () => {
    // Get cable resistance
    const cable = cableSizes.find(c => c.size === cableSize);
    if (!cable) return;
    
    // Convert length from meters to kilometers
    const lengthKm = cableLength / 1000;
    
    // Calculate resistance for the cable length
    const totalResistance = cable.resistance * lengthKm;
    
    // Calculate voltage drop
    // For single phase: V = 2 × I × R × cos(φ)
    // For three phase: V = √3 × I × R × cos(φ)
    let voltageDrop;
    if (phaseType === 'single') {
      voltageDrop = 2 * current * totalResistance * powerFactor;
    } else {
      voltageDrop = Math.sqrt(3) * current * totalResistance * powerFactor;
    }
    
    // Calculate percentage
    const percentDrop = (voltageDrop / voltage) * 100;
    
    setVoltageRise(voltageDrop);
    setVoltageRisePercent(percentDrop);
    
    // Check compliance (AS/NZS 3000:2018 - max 3% for final sub-circuits, 5% total)
    const isCompliant = percentDrop <= 3.0;
    setCompliant(isCompliant);
    
    // Find recommended cable size if not compliant
    if (!isCompliant) {
      const recommended = cableSizes.find(c => {
        const r = c.resistance * lengthKm;
        const vd = phaseType === 'single' 
          ? 2 * current * r * powerFactor
          : Math.sqrt(3) * current * r * powerFactor;
        const pd = (vd / voltage) * 100;
        return pd <= 3.0 && c.maxCurrent >= current;
      });
      setRecommendedSize(recommended?.size || null);
    } else {
      setRecommendedSize(null);
    }
  };
  
  const exportReport = () => {
    const report = `
VOLTAGE RISE CALCULATION REPORT
AS/NZS 3000:2018 Compliance Check

INPUT PARAMETERS:
- Nominal Voltage: ${voltage}V
- Load Current: ${current}A
- Cable Length: ${cableLength}m
- Cable Size: ${cableSize}mm²
- Power Factor: ${powerFactor}
- Phase Type: ${phaseType === 'single' ? 'Single Phase' : 'Three Phase'}

RESULTS:
- Voltage Drop: ${voltageRise.toFixed(2)}V
- Voltage Drop: ${voltageRisePercent.toFixed(2)}%
- Compliance Status: ${compliant ? 'COMPLIANT ✓' : 'NON-COMPLIANT ✗'}
- Standard: AS/NZS 3000:2018 (Max 3% for final sub-circuits)

${!compliant && recommendedSize ? `RECOMMENDATION:
- Recommended Cable Size: ${recommendedSize}mm²
- This will reduce voltage drop to acceptable levels` : ''}

Generated: ${new Date().toLocaleString('en-AU')}
Sun Direct Power - Professional Solar Design
    `.trim();
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VRC-Report-${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard/design">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calculator className="w-8 h-8 text-green-600" />
                Voltage Rise Calculator
              </h1>
              <p className="text-gray-600 mt-1">AS/NZS 3000:2018 Compliance Checking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Input Parameters</h2>
            
            <div className="space-y-6">
              {/* Phase Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phase Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPhaseType('single')}
                    className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      phaseType === 'single'
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Single Phase
                  </button>
                  <button
                    onClick={() => setPhaseType('three')}
                    className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      phaseType === 'three'
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Three Phase
                  </button>
                </div>
              </div>

              {/* Voltage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nominal Voltage (V)
                </label>
                <input
                  type="number"
                  value={voltage}
                  onChange={(e) => setVoltage(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="230"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Single phase: 230V, Three phase: 400V
                </p>
              </div>

              {/* Current */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Load Current (A)
                </label>
                <input
                  type="number"
                  value={current}
                  onChange={(e) => setCurrent(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="20"
                />
              </div>

              {/* Cable Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cable Length (m)
                </label>
                <input
                  type="number"
                  value={cableLength}
                  onChange={(e) => setCableLength(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="20"
                />
              </div>

              {/* Cable Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cable Size (mm²)
                </label>
                <select
                  value={cableSize}
                  onChange={(e) => setCableSize(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {cableSizes.map((cable) => (
                    <option key={cable.size} value={cable.size}>
                      {cable.size}mm² (Max {cable.maxCurrent}A)
                    </option>
                  ))}
                </select>
              </div>

              {/* Power Factor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Power Factor (cos φ)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={powerFactor}
                  onChange={(e) => setPowerFactor(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1.0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Typically 1.0 for resistive loads, 0.8-0.95 for inductive loads
                </p>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculateVoltageRise}
                className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5" />
                Calculate Voltage Rise
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Compliance Status */}
            <div className={`rounded-xl shadow-sm border-2 p-6 ${
              compliant 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-4">
                {compliant ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${
                    compliant ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {compliant ? 'COMPLIANT ✓' : 'NON-COMPLIANT ✗'}
                  </h3>
                  <p className={`text-sm ${
                    compliant ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {compliant 
                      ? 'Voltage drop is within acceptable limits per AS/NZS 3000:2018'
                      : 'Voltage drop exceeds maximum allowable limit of 3%'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Results Cards */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Calculation Results</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 mb-1">Voltage Drop</div>
                  <div className="text-3xl font-bold text-blue-900">
                    {voltageRise.toFixed(2)}V
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  compliant 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`text-sm mb-1 ${
                    compliant ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Voltage Drop Percentage
                  </div>
                  <div className={`text-3xl font-bold ${
                    compliant ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {voltageRisePercent.toFixed(2)}%
                  </div>
                  <div className={`text-xs mt-2 ${
                    compliant ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Maximum allowable: 3.0%
                  </div>
                </div>

                {!compliant && recommendedSize && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-yellow-900 mb-1">
                          Recommendation
                        </div>
                        <div className="text-sm text-yellow-800">
                          Use <strong>{recommendedSize}mm²</strong> cable to meet compliance requirements
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Technical Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cable Resistance:</span>
                  <span className="font-semibold">
                    {cableSizes.find(c => c.size === cableSize)?.resistance} Ω/km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Current Rating:</span>
                  <span className="font-semibold">
                    {cableSizes.find(c => c.size === cableSize)?.maxCurrent}A
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Load:</span>
                  <span className={`font-semibold ${
                    current > (cableSizes.find(c => c.size === cableSize)?.maxCurrent || 0)
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {((current / (cableSizes.find(c => c.size === cableSize)?.maxCurrent || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Standard:</span>
                  <span className="font-semibold">AS/NZS 3000:2018</span>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={exportReport}
              className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">AS/NZS 3000:2018 Requirements</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Maximum voltage drop for final sub-circuits: <strong>3%</strong></li>
                <li>• Maximum total voltage drop (including mains): <strong>5%</strong></li>
                <li>• Voltage drop calculated at maximum demand</li>
                <li>• Cable sizing must consider both current capacity and voltage drop</li>
                <li>• Temperature derating factors may apply</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
