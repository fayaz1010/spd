'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Camera, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InverterValidatorProps {
  jobId: string;
  onInverterAdded?: (inverter: any) => void;
}

export function InverterValidator({ jobId, onInverterAdded }: InverterValidatorProps) {
  const [inverter, setInverter] = useState({
    serialNumber: '',
    manufacturer: '',
    model: '',
    capacity: '',
  });
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const handleValidate = async () => {
    if (!inverter.manufacturer || !inverter.model || !inverter.capacity) {
      alert('Please fill in all fields');
      return;
    }

    setValidating(true);
    setValidation(null);

    try {
      const response = await fetch('/api/validation/inverter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          manufacturer: inverter.manufacturer,
          model: inverter.model,
          capacity: parseFloat(inverter.capacity),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Validation failed');
      }

      setValidation(data.validation);
    } catch (error: any) {
      alert(error.message || 'Failed to validate inverter');
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!inverter.serialNumber) {
      alert('Please enter serial number');
      return;
    }

    if (!validation || !validation.valid) {
      alert('Please validate the inverter first');
      return;
    }

    try {
      const response = await fetch('/api/validation/inverter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          jobId,
          serialNumber: inverter.serialNumber,
          manufacturer: inverter.manufacturer,
          model: inverter.model,
          capacity: parseFloat(inverter.capacity),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save inverter');
      }

      setSaved(true);

      if (onInverterAdded) {
        onInverterAdded(data.inverter);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save inverter');
    }
  };

  const getValidationIcon = () => {
    if (!validation) return null;

    if (validation.valid && validation.as4777Compliant) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (validation.approved && !validation.as4777Compliant) {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getValidationColor = () => {
    if (!validation) return '';
    
    if (validation.valid && validation.as4777Compliant) {
      return 'bg-green-50 border-green-200 text-green-800';
    }
    if (validation.approved && !validation.as4777Compliant) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
    return 'bg-red-50 border-red-200 text-red-800';
  };

  if (saved) {
    return (
      <div className="bg-white rounded-lg border-2 border-green-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">Inverter Validated & Saved</h3>
            <p className="text-sm text-gray-600">CEC approved and AS/NZS 4777.2:2020 compliant</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Serial Number:</span>
            <span className="font-medium">{inverter.serialNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Manufacturer:</span>
            <span className="font-medium">{inverter.manufacturer}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Model:</span>
            <span className="font-medium">{inverter.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Capacity:</span>
            <span className="font-medium">{inverter.capacity} kW</span>
          </div>
        </div>

        <Button
          onClick={() => {
            setSaved(false);
            setInverter({
              serialNumber: '',
              manufacturer: '',
              model: '',
              capacity: '',
            });
            setValidation(null);
          }}
          variant="outline"
          className="w-full mt-4"
        >
          Add Another Inverter
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Inverter Validation</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="inverterSerial">Serial Number *</Label>
            <div className="flex gap-2">
              <Input
                id="inverterSerial"
                value={inverter.serialNumber}
                onChange={(e) => setInverter({ ...inverter, serialNumber: e.target.value })}
                placeholder="INV123456789"
                className="flex-1"
              />
              <Button variant="outline" size="icon" title="Scan barcode">
                <Scan className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="Take photo">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="inverterManufacturer">Manufacturer *</Label>
            <Input
              id="inverterManufacturer"
              value={inverter.manufacturer}
              onChange={(e) => setInverter({ ...inverter, manufacturer: e.target.value })}
              placeholder="e.g., Fronius, SMA, Sungrow"
            />
          </div>

          <div>
            <Label htmlFor="inverterModel">Model Number *</Label>
            <Input
              id="inverterModel"
              value={inverter.model}
              onChange={(e) => setInverter({ ...inverter, model: e.target.value })}
              placeholder="e.g., Primo 5.0-1"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="inverterCapacity">Capacity (kW) *</Label>
            <Input
              id="inverterCapacity"
              type="number"
              step="0.1"
              value={inverter.capacity}
              onChange={(e) => setInverter({ ...inverter, capacity: e.target.value })}
              placeholder="e.g., 5.0"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleValidate}
            disabled={validating}
            variant="outline"
            className="flex-1"
          >
            {validating ? 'Validating...' : 'Validate with CEC'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!validation || !validation.valid}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Save Inverter
          </Button>
        </div>

        {/* Validation Result */}
        {validation && (
          <div className={`mt-4 p-4 rounded-lg border flex items-start gap-3 ${getValidationColor()}`}>
            {getValidationIcon()}
            <div className="flex-1">
              <p className="font-medium">{validation.message}</p>
              {validation.details && (
                <div className="text-sm mt-2 space-y-1">
                  <p>Manufacturer: {validation.details.manufacturer}</p>
                  <p>Model: {validation.details.model}</p>
                  <p>Capacity: {validation.details.capacity} kW</p>
                  <p>CEC Approved: {validation.details.approved ? '✓ Yes' : '✗ No'}</p>
                  <p>AS/NZS 4777.2:2020: {validation.details.as4777Compliant ? '✓ Compliant' : '✗ Not Compliant'}</p>
                  <p>Approved: {validation.details.approvalDate}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compliance Info */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Important:</strong> Inverter must be CEC approved AND AS/NZS 4777.2:2020 compliant for:
          </p>
          <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
            <li>STC rebate eligibility</li>
            <li>Grid connection approval</li>
            <li>Compliance certification</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
