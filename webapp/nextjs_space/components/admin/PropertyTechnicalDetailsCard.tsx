'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Home,
  Zap,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface PropertyTechnicalDetailsCardProps {
  leadId: string;
  lead: any;
  onUpdate?: () => void;
}

export function PropertyTechnicalDetailsCard({ 
  leadId, 
  lead,
  onUpdate 
}: PropertyTechnicalDetailsCardProps) {
  const [saving, setSaving] = useState(false);
  
  // Property Details
  const [propertyOwnership, setPropertyOwnership] = useState(lead?.propertyOwnership || '');
  const [meterNumber, setMeterNumber] = useState(lead?.meterNumber || '');
  const [networkProvider, setNetworkProvider] = useState(lead?.networkProvider || '');
  const [tariffType, setTariffType] = useState(lead?.tariffType || '');
  const [postcode, setPostcode] = useState(lead?.postcode || '');
  
  // Technical Details
  const [mainSwitchRating, setMainSwitchRating] = useState(lead?.mainSwitchRating || '');
  const [exportLimitRequested, setExportLimitRequested] = useState(lead?.exportLimitRequested || '');
  
  // Auto-calculate export limit based on inverter size (WA regulations)
  const calculateExportLimit = () => {
    const inverterSize = lead?.inverterSizeKw || 0;
    if (inverterSize <= 5) {
      return 5.0; // Systems ≤5kVA get 5kW export limit
    } else {
      return 1.5; // Systems >5kVA get 1.5kW export limit
    }
  };
  
  // Auto-set export limit if not already set
  const suggestedExportLimit = calculateExportLimit();
  const [switchboardLocation, setSwitchboardLocation] = useState(lead?.switchboardLocation || '');
  const [meterLocation, setMeterLocation] = useState(lead?.meterLocation || '');
  const [storeyCount, setStoreyCount] = useState(lead?.storeyCount || 1);
  const [existingSolar, setExistingSolar] = useState(lead?.existingSolar || false);
  const [existingSolarSize, setExistingSolarSize] = useState(lead?.existingSolarSize || '');
  
  // Customer Details
  const [dateOfBirth, setDateOfBirth] = useState(
    lead?.dateOfBirth 
      ? new Date(lead.dateOfBirth).toISOString().split('T')[0]
      : ''
  );
  const [driverLicenseNumber, setDriverLicenseNumber] = useState(lead?.driverLicenseNumber || '');
  const [driverLicenseState, setDriverLicenseState] = useState(lead?.driverLicenseState || 'WA');
  const [vppSelection, setVppSelection] = useState(lead?.vppSelection || '');
  
  // Installation Details
  const [installationZone, setInstallationZone] = useState(lead?.installationZone || '');

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/leads/${leadId}/property-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyOwnership,
          meterNumber,
          networkProvider,
          tariffType,
          postcode,
          mainSwitchRating: mainSwitchRating ? parseInt(mainSwitchRating) : null,
          exportLimitRequested: exportLimitRequested ? parseFloat(exportLimitRequested) : null,
          switchboardLocation,
          meterLocation,
          storeyCount: parseInt(storeyCount.toString()),
          existingSolar,
          existingSolarSize: existingSolarSize ? parseFloat(existingSolarSize) : null,
          dateOfBirth: dateOfBirth || null,
          driverLicenseNumber,
          driverLicenseState,
          vppSelection,
          installationZone
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Property & technical details saved successfully');
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save property details');
    } finally {
      setSaving(false);
    }
  };

  // Calculate completion percentage
  const requiredFields = [
    propertyOwnership,
    meterNumber,
    networkProvider,
    mainSwitchRating,
    postcode
  ];
  const filledFields = requiredFields.filter(f => f && f !== '').length;
  const completionPercentage = Math.round((filledFields / requiredFields.length) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property & Technical Details
          </span>
          <div className="flex items-center gap-2">
            {completionPercentage < 100 && (
              <span className="text-sm text-orange-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {completionPercentage}% Complete
              </span>
            )}
            {completionPercentage === 100 && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Complete
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Property Details Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-600" />
            Property Information
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="propertyOwnership">Property Ownership *</Label>
              <select
                id="propertyOwnership"
                value={propertyOwnership}
                onChange={(e) => setPropertyOwnership(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select...</option>
                <option value="owner">Owner</option>
                <option value="renter">Renter</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="postcode">Postcode *</Label>
              <Input
                id="postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="6000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="meterNumber">Meter Number *</Label>
              <Input
                id="meterNumber"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                placeholder="NMI or meter number"
              />
            </div>
            
            <div>
              <Label htmlFor="networkProvider">Network Provider *</Label>
              <select
                id="networkProvider"
                value={networkProvider}
                onChange={(e) => setNetworkProvider(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select...</option>
                <option value="synergy">Synergy</option>
                <option value="horizon">Horizon Power</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tariffType">Tariff Type</Label>
              <Input
                id="tariffType"
                value={tariffType}
                onChange={(e) => setTariffType(e.target.value)}
                placeholder="e.g., A1, L1"
              />
            </div>
            
            <div>
              <Label htmlFor="storeyCount">Number of Storeys</Label>
              <Input
                id="storeyCount"
                type="number"
                value={storeyCount}
                onChange={(e) => setStoreyCount(parseInt(e.target.value) || 1)}
                min="1"
                max="3"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="existingSolar"
              checked={existingSolar}
              onChange={(e) => setExistingSolar(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="existingSolar" className="cursor-pointer">
              Property has existing solar system
            </Label>
          </div>

          {existingSolar && (
            <div>
              <Label htmlFor="existingSolarSize">Existing Solar Size (kW)</Label>
              <Input
                id="existingSolarSize"
                type="number"
                value={existingSolarSize}
                onChange={(e) => setExistingSolarSize(e.target.value)}
                placeholder="5.0"
                step="0.1"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Technical Details Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Electrical & Technical
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mainSwitchRating">Main Switch Rating (A) *</Label>
              <select
                id="mainSwitchRating"
                value={mainSwitchRating}
                onChange={(e) => setMainSwitchRating(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select or verify during site visit...</option>
                <option value="63">63A (Most common - older/smaller homes)</option>
                <option value="80">80A (Standard modern homes)</option>
                <option value="100">100A (Larger homes/high load)</option>
                <option value="other">Other (specify in notes)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                💡 Check switchboard label during site visit. Default to 63A if unsure.
              </p>
            </div>
            
            <div>
              <Label htmlFor="exportLimit">Export Limit Requested (kW)</Label>
              <select
                id="exportLimit"
                value={exportLimitRequested}
                onChange={(e) => setExportLimitRequested(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Auto-calculate...</option>
                <option value="5.0">5.0 kW (Systems ≤5kVA)</option>
                <option value="1.5">1.5 kW (Systems &gt;5kVA)</option>
                <option value="custom">Custom (retailer agreement)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {lead?.inverterSizeKw ? (
                  <span className="text-green-600 font-medium">
                    ✓ Suggested: {suggestedExportLimit} kW (based on {lead.inverterSizeKw}kW inverter)
                  </span>
                ) : (
                  <span>📋 WA regulation: ≤5kVA = 5kW, &gt;5kVA = 1.5kW export</span>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="switchboardLocation">Switchboard Location</Label>
              <Input
                id="switchboardLocation"
                value={switchboardLocation}
                onChange={(e) => setSwitchboardLocation(e.target.value)}
                placeholder="e.g., Garage, External wall"
              />
            </div>
            
            <div>
              <Label htmlFor="meterLocation">Meter Location</Label>
              <Input
                id="meterLocation"
                value={meterLocation}
                onChange={(e) => setMeterLocation(e.target.value)}
                placeholder="e.g., Front of house"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="installationZone">Installation Zone (for STC)</Label>
            <select
              id="installationZone"
              value={installationZone}
              onChange={(e) => setInstallationZone(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select...</option>
              <option value="zone1">Zone 1 (Perth Metro)</option>
              <option value="zone2">Zone 2</option>
              <option value="zone3">Zone 3</option>
              <option value="zone4">Zone 4</option>
            </select>
          </div>
        </div>

        <Separator />

        {/* Customer Details Section (for loans/rebates) */}
        {lead.batterySizeKwh > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Details (for Rebates/Loans)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="driverLicenseState">Driver License State</Label>
                <select
                  id="driverLicenseState"
                  value={driverLicenseState}
                  onChange={(e) => setDriverLicenseState(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="WA">WA</option>
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="QLD">QLD</option>
                  <option value="SA">SA</option>
                  <option value="TAS">TAS</option>
                  <option value="NT">NT</option>
                  <option value="ACT">ACT</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="driverLicenseNumber">Driver License Number</Label>
              <Input
                id="driverLicenseNumber"
                value={driverLicenseNumber}
                onChange={(e) => setDriverLicenseNumber(e.target.value)}
                placeholder="License number"
              />
            </div>

            <div>
              <Label htmlFor="vppSelection">VPP Selection (Required for Battery)</Label>
              <select
                id="vppSelection"
                value={vppSelection}
                onChange={(e) => setVppSelection(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select VPP...</option>
                <option value="synergy_vpp">Synergy VPP</option>
                <option value="plico_vpp">Plico VPP</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                VPP enrollment is mandatory for all battery installations
              </p>
            </div>
          </div>
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
              Save Property & Technical Details
            </>
          )}
        </Button>

        {/* Required Fields Notice */}
        {completionPercentage < 100 && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Required for regulatory applications:</strong> Property ownership, meter number, network provider, main switch rating, and postcode must be completed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
