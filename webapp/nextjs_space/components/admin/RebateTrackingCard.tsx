'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalPortalModal } from '@/components/admin/ExternalPortalModal';
import { 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check,
  DollarSign,
  Loader2,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';

interface RebateTrackingCardProps {
  leadId: string;
  lead: any;
  rebateTracking?: any;
  onUpdate?: () => void;
}

export function RebateTrackingCard({ 
  leadId, 
  lead, 
  rebateTracking,
  onUpdate 
}: RebateTrackingCardProps) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  // Use lead.rebateTracking if rebateTracking prop is not provided
  const rebateData = rebateTracking || lead?.rebateTracking;
  
  // STC fields
  const [stcAmount, setStcAmount] = useState(0);
  const [stcReferenceNumber, setStcReferenceNumber] = useState('');
  const [stcSubmittedAt, setStcSubmittedAt] = useState('');
  const [stcConfirmed, setStcConfirmed] = useState(false);
  const [stcConfirmedAt, setStcConfirmedAt] = useState('');
  
  // Federal Battery fields
  const [federalBatteryAmount, setFederalBatteryAmount] = useState(0);
  const [federalBatteryReferenceNumber, setFederalBatteryReferenceNumber] = useState('');
  const [federalBatterySubmittedAt, setFederalBatterySubmittedAt] = useState('');
  const [federalBatteryConfirmed, setFederalBatteryConfirmed] = useState(false);
  const [federalBatteryConfirmedAt, setFederalBatteryConfirmedAt] = useState('');
  
  // WA State fields
  const [waStateAmount, setWaStateAmount] = useState(0);
  const [waStateReferenceNumber, setWaStateReferenceNumber] = useState('');
  const [waStateSubmittedAt, setWaStateSubmittedAt] = useState('');
  const [waStateConfirmed, setWaStateConfirmed] = useState(false);
  const [waStateConfirmedAt, setWaStateConfirmedAt] = useState('');
  
  // Track original quote values for validation
  const originalStcAmount = lead?.CustomerQuote?.federalSolarRebate || 0;
  const originalFederalBatteryAmount = lead?.CustomerQuote?.federalBatteryRebate || 0;
  const originalWaStateAmount = lead?.CustomerQuote?.stateBatteryRebate || 0;
  
  // Check if values have been modified from original quote
  const stcModified = stcAmount > 0 && stcAmount !== originalStcAmount;
  const federalModified = federalBatteryAmount > 0 && federalBatteryAmount !== originalFederalBatteryAmount;
  const waStateModified = waStateAmount > 0 && waStateAmount !== originalWaStateAmount;

  // Load data from lead when component mounts or lead changes
  useEffect(() => {
    if (rebateData) {
      // Load from rebateTracking if it exists
      setStcAmount(rebateData.stcAmount || 0);
      setStcReferenceNumber(rebateData.stcReferenceNumber || '');
      setStcSubmittedAt(
        rebateData.stcSubmittedAt 
          ? new Date(rebateData.stcSubmittedAt).toISOString().split('T')[0]
          : ''
      );
      setStcConfirmed(rebateData.stcConfirmed || false);
      setStcConfirmedAt(
        rebateData.stcConfirmedAt 
          ? new Date(rebateData.stcConfirmedAt).toISOString().split('T')[0]
          : ''
      );
      setFederalBatteryAmount(rebateData.federalBatteryAmount || 0);
      setFederalBatteryReferenceNumber(rebateData.federalBatteryReferenceNumber || '');
      setFederalBatterySubmittedAt(
        rebateData.federalBatterySubmittedAt 
          ? new Date(rebateData.federalBatterySubmittedAt).toISOString().split('T')[0]
          : ''
      );
      setFederalBatteryConfirmed(rebateData.federalBatteryConfirmed || false);
      setFederalBatteryConfirmedAt(
        rebateData.federalBatteryConfirmedAt 
          ? new Date(rebateData.federalBatteryConfirmedAt).toISOString().split('T')[0]
          : ''
      );
      setWaStateAmount(rebateData.waStateAmount || 0);
      setWaStateReferenceNumber(rebateData.waStateReferenceNumber || '');
      setWaStateSubmittedAt(
        rebateData.waStateSubmittedAt 
          ? new Date(rebateData.waStateSubmittedAt).toISOString().split('T')[0]
          : ''
      );
      setWaStateConfirmed(rebateData.waStateConfirmed || false);
      setWaStateConfirmedAt(
        rebateData.waStateConfirmedAt 
          ? new Date(rebateData.waStateConfirmedAt).toISOString().split('T')[0]
          : ''
      );
    } else if (lead?.CustomerQuote) {
      // Pre-populate from CustomerQuote if rebateTracking doesn't exist yet
      setStcAmount(lead.CustomerQuote.federalSolarRebate || 0);
      setFederalBatteryAmount(lead.CustomerQuote.federalBatteryRebate || 0);
      setWaStateAmount(lead.CustomerQuote.stateBatteryRebate || 0);
    }
  }, [lead, rebateTracking]);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/rebate-tracking/${leadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stcAmount: parseFloat(String(stcAmount)) || 0,
          stcReferenceNumber,
          stcSubmittedAt: stcSubmittedAt || null,
          stcConfirmed,
          stcConfirmedAt: stcConfirmedAt || null,
          federalBatteryAmount: parseFloat(String(federalBatteryAmount)) || 0,
          federalBatteryReferenceNumber,
          federalBatterySubmittedAt: federalBatterySubmittedAt || null,
          federalBatteryConfirmed,
          federalBatteryConfirmedAt: federalBatteryConfirmedAt || null,
          waStateAmount: parseFloat(String(waStateAmount)) || 0,
          waStateReferenceNumber,
          waStateSubmittedAt: waStateSubmittedAt || null,
          waStateConfirmed,
          waStateConfirmedAt: waStateConfirmedAt || null,
          // Audit trail: track if values were modified from original quote
          changeLog: {
            stcModified,
            federalModified,
            waStateModified,
            originalStcAmount,
            originalFederalBatteryAmount,
            originalWaStateAmount,
            modifiedAt: new Date().toISOString(),
            modifiedBy: 'admin' // TODO: Get actual admin user
          }
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      // Trigger readiness check
      await fetch(`/api/admin/leads/${leadId}/check-readiness`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (onUpdate) onUpdate();
      alert('Rebate tracking updated successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save rebate tracking');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkConfirmed = (type: 'stc' | 'federal' | 'wa') => {
    const today = new Date().toISOString().split('T')[0];
    if (type === 'stc') {
      setStcConfirmed(true);
      setStcConfirmedAt(today);
    } else if (type === 'federal') {
      setFederalBatteryConfirmed(true);
      setFederalBatteryConfirmedAt(today);
    } else {
      setWaStateConfirmed(true);
      setWaStateConfirmedAt(today);
    }
    
    // Auto-save after marking as confirmed
    setTimeout(() => handleSave(), 100);
  };

  // Customer data for portals
  const stcData = {
    'Customer Name': lead.name || `${lead.firstName} ${lead.lastName}`,
    'Email': lead.email,
    'Phone': lead.phone,
    'Address': lead.address,
    'Postcode': lead.postcode || '',
    'System Size (kW)': lead.systemSizeKw,
    'Panel Count': lead.numPanels,
    'Panel Brand': lead.CustomerQuote?.panelBrand || lead.CustomerQuote?.panelBrandName || '',
    'Panel Model': lead.CustomerQuote?.panelModel || '',
    'Inverter Brand': lead.CustomerQuote?.inverterBrand || lead.CustomerQuote?.inverterBrandName || '',
    'Inverter Model': lead.CustomerQuote?.inverterModel || '',
    'Installation Zone': lead.installationZone || '',
    'Installer CEC Number': lead.CustomerQuote?.installerCecNumber || '',
    'Installer License': lead.CustomerQuote?.installerLicenseNumber || ''
  };

  const batteryData = {
    'Customer Name': lead.name || `${lead.firstName} ${lead.lastName}`,
    'Email': lead.email,
    'Phone': lead.phone,
    'Date of Birth': lead.dateOfBirth ? new Date(lead.dateOfBirth).toLocaleDateString() : '',
    'Driver License Number': lead.driverLicenseNumber || '',
    'Driver License State': lead.driverLicenseState || '',
    'Address': lead.address,
    'Postcode': lead.postcode || '',
    'Household Income': lead.householdIncome || '',
    'Number of Dependents': lead.numberOfDependents || '',
    'Employment Status': lead.employmentStatus || '',
    'Pension Card Holder': lead.pensionCardHolder ? 'Yes' : 'No',
    'Battery Size (kWh)': lead.batterySizeKwh || 0,
    'Battery Brand': lead.CustomerQuote?.batteryBrand || lead.CustomerQuote?.batteryBrandName || 'TBD',
    'Battery Model': lead.CustomerQuote?.batteryModel || '',
    'VPP Selection': lead.vppSelection || '',
    'Installation Date': lead.installationScheduledDate || 'TBD'
  };

  const allConfirmed = stcConfirmed && 
    (federalBatteryAmount > 0 ? federalBatteryConfirmed : true) &&
    (waStateAmount > 0 ? waStateConfirmed : true);

  return (
    <Card className="border-2 border-green-200">
      <CardHeader className="bg-green-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Rebate Tracking
          </span>
          <div className="flex gap-2">
            {allConfirmed ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                All Confirmed
              </Badge>
            ) : (
              <Badge variant="destructive">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* STC Rebate */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              STC Rebate (Required)
            </h3>
            {stcConfirmed ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Confirmed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>

          {/* Portal Link */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Greendeal STC Portal
                </p>
                <p className="text-xs text-blue-700">
                  Submit Small-scale Technology Certificate application
                </p>
              </div>
              <ExternalPortalModal
                portalName="Greendeal STC Portal"
                portalUrl="https://www.greendeal.com.au/retailers/pvds"
                copyData={Object.entries(stcData).map(([key, value]) => ({
                  label: key,
                  value: String(value)
                }))}
                trigger={
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Portal
                  </Button>
                }
              />
            </div>
          </div>

          {/* Customer Data */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">System Information (Copy to Portal)</Label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg text-sm">
              {Object.entries(stcData).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="text-xs text-gray-600">{key}:</span>
                    <p className="font-medium">{value}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(String(value), `stc-${key}`)}
                  >
                    {copied === `stc-${key}` ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="stcAmount">Rebate Amount ($)</Label>
              <Input
                id="stcAmount"
                type="number"
                value={stcAmount}
                onChange={(e) => setStcAmount(parseFloat(e.target.value) || 0)}
                placeholder="3500"
                className={stcModified ? 'border-orange-400 bg-orange-50' : ''}
              />
              {stcModified && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Modified from quote: ${originalStcAmount.toLocaleString()}
                </p>
              )}
              {originalStcAmount > 0 && !stcModified && stcAmount > 0 && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Matches quote amount
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="stcRef">Reference Number</Label>
              <Input
                id="stcRef"
                value={stcReferenceNumber}
                onChange={(e) => setStcReferenceNumber(e.target.value)}
                placeholder="STC-2025-XXXXX"
              />
            </div>
            <div>
              <Label htmlFor="stcSubmitted">Submitted Date</Label>
              <Input
                id="stcSubmitted"
                type="date"
                value={stcSubmittedAt}
                onChange={(e) => setStcSubmittedAt(e.target.value)}
              />
            </div>
          </div>

          {!stcConfirmed && (
            <Button
              onClick={() => handleMarkConfirmed('stc')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Confirmed
            </Button>
          )}

          {stcConfirmed && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Confirmed on {stcConfirmedAt} - Amount: ${stcAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Federal Battery Rebate */}
        {lead.batterySizeKwh > 0 && (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Federal Battery Rebate
                </h3>
                {federalBatteryConfirmed ? (
                  <Badge className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Confirmed
                  </Badge>
                ) : federalBatteryAmount > 0 ? (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Applicable</Badge>
                )}
              </div>

              {/* Portal Link */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Plenti Battery Rebate Portal
                    </p>
                    <p className="text-xs text-blue-700">
                      Submit federal battery rebate application
                    </p>
                  </div>
                  <ExternalPortalModal
                    portalName="Plenti Battery Rebate Portal"
                    portalUrl="https://portal.plenti.com.au/"
                    copyData={Object.entries(batteryData).map(([key, value]) => ({
                      label: key,
                      value: String(value)
                    }))}
                    trigger={
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Portal
                      </Button>
                    }
                  />
                </div>
              </div>

              {/* Tracking Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fedAmount">Rebate Amount ($)</Label>
                  <Input
                    id="fedAmount"
                    type="number"
                    value={federalBatteryAmount}
                    onChange={(e) => setFederalBatteryAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className={federalModified ? 'border-orange-400 bg-orange-50' : ''}
                  />
                  {federalModified && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Modified from quote: ${originalFederalBatteryAmount.toLocaleString()}
                    </p>
                  )}
                  {originalFederalBatteryAmount > 0 && !federalModified && federalBatteryAmount > 0 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Matches quote amount
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="fedRef">Reference Number</Label>
                  <Input
                    id="fedRef"
                    value={federalBatteryReferenceNumber}
                    onChange={(e) => setFederalBatteryReferenceNumber(e.target.value)}
                    placeholder="FED-2025-XXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="fedSubmitted">Submitted Date</Label>
                  <Input
                    id="fedSubmitted"
                    type="date"
                    value={federalBatterySubmittedAt}
                    onChange={(e) => setFederalBatterySubmittedAt(e.target.value)}
                  />
                </div>
              </div>

              {!federalBatteryConfirmed && federalBatteryAmount > 0 && (
                <Button
                  onClick={() => handleMarkConfirmed('federal')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Confirmed
                </Button>
              )}

              {federalBatteryConfirmed && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      Confirmed on {federalBatteryConfirmedAt} - Amount: ${federalBatteryAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* WA State Rebate */}
        {lead.batterySizeKwh > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                WA State Battery Rebate
              </h3>
              {waStateConfirmed ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Confirmed
                </Badge>
              ) : waStateAmount > 0 ? (
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              ) : (
                <Badge variant="outline">Not Applicable</Badge>
              )}
            </div>

            {/* Portal Link */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Plenti WA Battery Scheme Portal
                  </p>
                  <p className="text-xs text-blue-700">
                    Submit WA state battery rebate application
                  </p>
                </div>
                <ExternalPortalModal
                  portalName="Plenti WA Battery Scheme Portal"
                  portalUrl="https://portal.plenti.com.au/"
                  copyData={Object.entries(batteryData).map(([key, value]) => ({
                    label: key,
                    value: String(value)
                  }))}
                  trigger={
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Portal
                    </Button>
                  }
                />
              </div>
            </div>

            {/* Tracking Fields */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="waAmount">Rebate Amount ($)</Label>
                <Input
                  id="waAmount"
                  type="number"
                  value={waStateAmount}
                  onChange={(e) => setWaStateAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className={waStateModified ? 'border-orange-400 bg-orange-50' : ''}
                />
                {waStateModified && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Modified from quote: ${originalWaStateAmount.toLocaleString()}
                  </p>
                )}
                {originalWaStateAmount > 0 && !waStateModified && waStateAmount > 0 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Matches quote amount
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="waRef">Reference Number</Label>
                <Input
                  id="waRef"
                  value={waStateReferenceNumber}
                  onChange={(e) => setWaStateReferenceNumber(e.target.value)}
                  placeholder="WA-2025-XXXXX"
                />
              </div>
              <div>
                <Label htmlFor="waSubmitted">Submitted Date</Label>
                <Input
                  id="waSubmitted"
                  type="date"
                  value={waStateSubmittedAt}
                  onChange={(e) => setWaStateSubmittedAt(e.target.value)}
                />
              </div>
            </div>

            {!waStateConfirmed && waStateAmount > 0 && (
              <Button
                onClick={() => handleMarkConfirmed('wa')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Confirmed
              </Button>
            )}

            {waStateConfirmed && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Confirmed on {waStateConfirmedAt} - Amount: ${waStateAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

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
              <FileText className="h-4 w-4 mr-2" />
              Save Rebate Tracking
            </>
          )}
        </Button>

        {/* Total Rebates */}
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Total Rebates</h4>
          <div className="text-2xl font-bold text-green-900">
            ${(stcAmount + federalBatteryAmount + waStateAmount).toLocaleString()}
          </div>
          <div className="text-xs text-green-700 mt-1">
            STC: ${stcAmount.toLocaleString()} | 
            Federal: ${federalBatteryAmount.toLocaleString()} | 
            WA State: ${waStateAmount.toLocaleString()}
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> STC rebate is required for all installations. Battery rebates are optional but must be confirmed if applicable before installation can be scheduled.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
