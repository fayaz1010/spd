'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Camera, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PanelSerialValidatorProps {
  jobId: string;
  onPanelAdded?: (panel: any) => void;
}

export function PanelSerialValidator({ jobId, onPanelAdded }: PanelSerialValidatorProps) {
  const [panels, setPanels] = useState<any[]>([]);
  const [currentPanel, setCurrentPanel] = useState({
    serialNumber: '',
    manufacturer: '',
    model: '',
    wattage: '',
  });
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [fraudCheck, setFraudCheck] = useState<any>(null);

  const handleValidate = async () => {
    if (!currentPanel.manufacturer || !currentPanel.model || !currentPanel.wattage) {
      alert('Please fill in manufacturer, model, and wattage');
      return;
    }

    setValidating(true);
    setValidation(null);
    setFraudCheck(null);

    try {
      const response = await fetch('/api/validation/panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          jobId,
          manufacturer: currentPanel.manufacturer,
          model: currentPanel.model,
          wattage: parseFloat(currentPanel.wattage),
          serialNumber: currentPanel.serialNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Validation failed');
      }

      setValidation(data.validation);
      setFraudCheck(data.fraudCheck);
    } catch (error: any) {
      alert(error.message || 'Failed to validate panel');
    } finally {
      setValidating(false);
    }
  };

  const handleAddPanel = async () => {
    if (!currentPanel.serialNumber) {
      alert('Please enter serial number');
      return;
    }

    if (!validation || !validation.valid) {
      alert('Please validate the panel first');
      return;
    }

    if (fraudCheck && fraudCheck.fraudDetected) {
      if (!confirm('Fraud detected! Are you sure you want to add this panel?')) {
        return;
      }
    }

    try {
      const response = await fetch('/api/validation/panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          jobId,
          serialNumber: currentPanel.serialNumber,
          manufacturer: currentPanel.manufacturer,
          model: currentPanel.model,
          wattage: parseFloat(currentPanel.wattage),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save panel');
      }

      // Add to list
      setPanels([...panels, data.panel]);

      // Reset form
      setCurrentPanel({
        serialNumber: '',
        manufacturer: '',
        model: '',
        wattage: '',
      });
      setValidation(null);
      setFraudCheck(null);

      if (onPanelAdded) {
        onPanelAdded(data.panel);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to add panel');
    }
  };

  const getValidationIcon = () => {
    if (!validation) return null;

    if (validation.valid) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getValidationColor = () => {
    if (!validation) return '';
    return validation.valid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Current Panel Form */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Add Panel Serial Number</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="serialNumber">Serial Number *</Label>
            <div className="flex gap-2">
              <Input
                id="serialNumber"
                value={currentPanel.serialNumber}
                onChange={(e) => setCurrentPanel({ ...currentPanel, serialNumber: e.target.value })}
                placeholder="ABC123456789"
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
            <Label htmlFor="manufacturer">Manufacturer *</Label>
            <Input
              id="manufacturer"
              value={currentPanel.manufacturer}
              onChange={(e) => setCurrentPanel({ ...currentPanel, manufacturer: e.target.value })}
              placeholder="e.g., Trina Solar, JA Solar"
            />
          </div>

          <div>
            <Label htmlFor="model">Model Number *</Label>
            <Input
              id="model"
              value={currentPanel.model}
              onChange={(e) => setCurrentPanel({ ...currentPanel, model: e.target.value })}
              placeholder="e.g., TSM-DE09.08"
            />
          </div>

          <div>
            <Label htmlFor="wattage">Wattage (W) *</Label>
            <Input
              id="wattage"
              type="number"
              value={currentPanel.wattage}
              onChange={(e) => setCurrentPanel({ ...currentPanel, wattage: e.target.value })}
              placeholder="e.g., 405"
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
            onClick={handleAddPanel}
            disabled={!validation || !validation.valid}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Add Panel
          </Button>
        </div>

        {/* Validation Result */}
        {validation && (
          <div className={`mt-4 p-4 rounded-lg border flex items-start gap-3 ${getValidationColor()}`}>
            {getValidationIcon()}
            <div className="flex-1">
              <p className="font-medium">{validation.message}</p>
              {validation.details && (
                <div className="text-sm mt-2">
                  <p>Manufacturer: {validation.details.manufacturer}</p>
                  <p>Model: {validation.details.model}</p>
                  <p>Wattage: {validation.details.wattage}W</p>
                  <p>Approved: {validation.details.approvalDate}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fraud Alert */}
        {fraudCheck && fraudCheck.fraudDetected && (
          <div className="mt-4 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-bold">FRAUD ALERT</p>
              <p className="text-sm mt-1">{fraudCheck.message}</p>
              {fraudCheck.previousJobs && (
                <p className="text-sm mt-1">
                  Previous jobs: {fraudCheck.previousJobs.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Added Panels List */}
      {panels.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">
            Added Panels ({panels.length})
          </h3>

          <div className="space-y-2">
            {panels.map((panel, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{panel.serialNumber}</p>
                    <p className="text-sm text-gray-600">
                      {panel.manufacturer} {panel.model} - {panel.wattage}W
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  CEC Approved
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Total Panels:</strong> {panels.length} <br />
              <strong>Total Capacity:</strong>{' '}
              {(panels.reduce((sum, p) => sum + p.wattage, 0) / 1000).toFixed(2)} kW
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
