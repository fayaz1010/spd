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
  XCircle, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check,
  AlertCircle,
  FileText,
  Zap,
  Loader2,
  Upload,
  Paperclip,
  Download,
  Trash2
} from 'lucide-react';

interface RegulatoryApplicationsCardProps {
  leadId: string;
  lead: any;
  regulatoryApplication?: any;
  onUpdate?: () => void;
}

export function RegulatoryApplicationsCard({ 
  leadId, 
  lead, 
  regulatoryApplication,
  onUpdate 
}: RegulatoryApplicationsCardProps) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Use lead.regulatoryApplication if regulatoryApplication prop is not provided
  const regApp = regulatoryApplication || lead?.regulatoryApplication;
  
  // Document uploads
  const [synergyReceiptUrl, setSynergyReceiptUrl] = useState('');
  const [wpReceiptUrl, setWpReceiptUrl] = useState('');
  
  // Synergy fields
  const [synergyReferenceNumber, setSynergyReferenceNumber] = useState('');
  const [synergyFilledAt, setSynergyFilledAt] = useState('');
  const [synergyApproved, setSynergyApproved] = useState(false);
  const [synergyApprovedAt, setSynergyApprovedAt] = useState('');
  
  // Western Power fields
  const [wpReferenceNumber, setWpReferenceNumber] = useState('');
  const [wpSubmittedAt, setWpSubmittedAt] = useState('');
  const [wpApproved, setWpApproved] = useState(false);
  const [wpApprovedAt, setWpApprovedAt] = useState('');

  // Load data from lead when component mounts or lead changes
  useEffect(() => {
    if (regApp) {
      console.log('Loading regulatory application data:', regApp);
      setSynergyReceiptUrl(regApp.synergyReceiptUrl || '');
      setWpReceiptUrl(regApp.wpReceiptUrl || '');
      setSynergyReferenceNumber(regApp.synergyReferenceNumber || '');
      setSynergyFilledAt(
        regApp.synergyFilledAt 
          ? new Date(regApp.synergyFilledAt).toISOString().split('T')[0]
          : ''
      );
      setSynergyApproved(regApp.synergyApproved || false);
      setSynergyApprovedAt(
        regApp.synergyApprovedAt 
          ? new Date(regApp.synergyApprovedAt).toISOString().split('T')[0]
          : ''
      );
      setWpReferenceNumber(regApp.wpReferenceNumber || '');
      setWpSubmittedAt(
        regApp.wpSubmittedAt 
          ? new Date(regApp.wpSubmittedAt).toISOString().split('T')[0]
          : ''
      );
      setWpApproved(regApp.wpApproved || false);
      setWpApprovedAt(
        regApp.wpApprovedAt 
          ? new Date(regApp.wpApprovedAt).toISOString().split('T')[0]
          : ''
      );
      console.log('Synergy approved:', regApp.synergyApproved, 'WP approved:', regApp.wpApproved);
    }
  }, [lead, regulatoryApplication]);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileUpload = async (file: File, type: 'synergy' | 'wp') => {
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('leadId', leadId);
      formData.append('type', type);

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      if (type === 'synergy') {
        setSynergyReceiptUrl(data.url);
      } else {
        setWpReceiptUrl(data.url);
      }

      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/regulatory-applications/${leadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          synergyReferenceNumber,
          synergyFilledAt: synergyFilledAt || null,
          synergyApproved,
          synergyApprovedAt: synergyApprovedAt || null,
          synergyReceiptUrl,
          wpReferenceNumber,
          wpSubmittedAt: wpSubmittedAt || null,
          wpApproved,
          wpApprovedAt: wpApprovedAt || null,
          wpReceiptUrl
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
      alert('Regulatory applications updated successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save regulatory applications');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkApproved = async (type: 'synergy' | 'wp') => {
    const today = new Date().toISOString().split('T')[0];
    
    if (type === 'synergy') {
      setSynergyApproved(true);
      setSynergyApprovedAt(today);
    } else {
      setWpApproved(true);
      setWpApprovedAt(today);
    }
    
    // Auto-save after marking as approved
    setTimeout(() => handleSave(), 100);
  };

  // Prepare data for copy-to-clipboard
  const synergyData = {
    'Customer Name': lead.name || `${lead.firstName} ${lead.lastName}`,
    'Email': lead.email,
    'Phone': lead.phone,
    'Address': lead.address,
    'Suburb': lead.suburb,
    'Postcode': lead.postcode || '',
    'Property Ownership': lead.propertyOwnership || '',
    'Meter Number': lead.meterNumber || '',
    'Network Provider': lead.networkProvider || '',
    'Tariff Type': lead.tariffType || '',
    'System Size (kW)': lead.systemSizeKw,
    'Panel Count': lead.numPanels,
    'Panel Brand': lead.CustomerQuote?.panelBrand || lead.CustomerQuote?.panelBrandName || '',
    'Panel Model': lead.CustomerQuote?.panelModel || '',
    'Battery Size (kWh)': lead.batterySizeKwh || 'No battery',
    'Battery Brand': lead.CustomerQuote?.batteryBrand || lead.CustomerQuote?.batteryBrandName || '',
    'Battery Model': lead.CustomerQuote?.batteryModel || '',
    'Inverter': lead.CustomerQuote?.inverterBrand || lead.CustomerQuote?.inverterBrandName || 'TBD',
    'Inverter Model': lead.CustomerQuote?.inverterModel || '',
    'VPP Selection': lead.vppSelection || '',
    'Installation Address': lead.address,
    'Installation Zone': lead.installationZone || ''
  };

  const wpData = {
    'Applicant Name': lead.name || `${lead.firstName} ${lead.lastName}`,
    'Contact Email': lead.email,
    'Contact Phone': lead.phone,
    'Property Address': lead.address,
    'Suburb': lead.suburb,
    'Postcode': lead.postcode || '',
    'Property Type': lead.propertyType || '',
    'Property Ownership': lead.propertyOwnership || '',
    'Roof Type': lead.roofType || '',
    'Number of Storeys': lead.storeyCount || 1,
    'System Capacity (kW)': lead.systemSizeKw,
    'Panel Count': lead.numPanels,
    'Inverter Capacity (kW)': lead.CustomerQuote?.inverterBrandCapacity || lead.systemSizeKw,
    'Battery Capacity (kWh)': lead.batterySizeKwh || 'No battery',
    'Main Switch Rating (A)': lead.mainSwitchRating || '',
    'Export Limit Requested (kW)': lead.exportLimitRequested || '',
    'Switchboard Location': lead.switchboardLocation || '',
    'Meter Location': lead.meterLocation || '',
    'Existing Solar': lead.existingSolar ? 'Yes' : 'No',
    'Existing Solar Size (kW)': lead.existingSolarSize || 'N/A'
  };

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader className="bg-orange-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Regulatory Applications
          </span>
          <div className="flex gap-2">
            {synergyApproved && wpApproved ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                All Approved
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
        {/* Synergy DES Application */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-600" />
              Synergy DES Application
            </h3>
            {synergyApproved ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            ) : synergyReferenceNumber ? (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                Submitted
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
                  Synergy Self-Service Portal
                </p>
                <p className="text-xs text-blue-700">
                  Submit Distributed Energy System (DES) application
                </p>
              </div>
              <ExternalPortalModal
                portalName="Synergy DES Application Portal"
                portalUrl="https://selfserve.synergy.net.au/distributed-energy-system.html"
                copyData={Object.entries(synergyData).map(([key, value]) => ({
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

          {/* Customer Data for Copy */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Customer Information (Copy to Portal)</Label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg text-sm">
              {Object.entries(synergyData).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="text-xs text-gray-600">{key}:</span>
                    <p className="font-medium">{value}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(String(value), `synergy-${key}`)}
                  >
                    {copied === `synergy-${key}` ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Application Tracking */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="synergyRef">Reference Number</Label>
              <Input
                id="synergyRef"
                value={synergyReferenceNumber}
                onChange={(e) => setSynergyReferenceNumber(e.target.value)}
                placeholder="SYN-2025-XXXXX"
              />
            </div>
            <div>
              <Label htmlFor="synergySubmitted">Submitted Date</Label>
              <Input
                id="synergySubmitted"
                type="date"
                value={synergyFilledAt}
                onChange={(e) => setSynergyFilledAt(e.target.value)}
              />
            </div>
          </div>

          {/* Upload Submission Receipt */}
          <div className="space-y-2">
            <Label>Submission Receipt (PDF/Image)</Label>
            {synergyReceiptUrl ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Paperclip className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 flex-1">Receipt uploaded</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(synergyReceiptUrl, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSynergyReceiptUrl('')}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'synergy');
                  }}
                  disabled={uploading === 'synergy'}
                  className="flex-1"
                />
                {uploading === 'synergy' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Upload the submission receipt/confirmation from Synergy portal
            </p>
          </div>

          {!synergyApproved && (
            <Button
              onClick={() => handleMarkApproved('synergy')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Approved
            </Button>
          )}

          {synergyApproved && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Approved on {synergyApprovedAt}
                </span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Western Power Application */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              Western Power Application
            </h3>
            {wpApproved ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            ) : wpReferenceNumber ? (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                Submitted
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
                  Western Power Portal
                </p>
                <p className="text-xs text-blue-700">
                  Submit connection application for solar/battery system
                </p>
              </div>
              <ExternalPortalModal
                portalName="Western Power Application Portal"
                portalUrl="https://www.westernpower.com.au/products-and-services/"
                copyData={Object.entries(wpData).map(([key, value]) => ({
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

          {/* Customer Data for Copy */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Customer Information (Copy to Portal)</Label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg text-sm">
              {Object.entries(wpData).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="text-xs text-gray-600">{key}:</span>
                    <p className="font-medium">{value}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(String(value), `wp-${key}`)}
                  >
                    {copied === `wp-${key}` ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Application Tracking */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="wpRef">Reference Number</Label>
              <Input
                id="wpRef"
                value={wpReferenceNumber}
                onChange={(e) => setWpReferenceNumber(e.target.value)}
                placeholder="WP-2025-XXXXX"
              />
            </div>
            <div>
              <Label htmlFor="wpSubmitted">Submitted Date</Label>
              <Input
                id="wpSubmitted"
                type="date"
                value={wpSubmittedAt}
                onChange={(e) => setWpSubmittedAt(e.target.value)}
              />
            </div>
          </div>

          {/* Upload Submission Receipt */}
          <div className="space-y-2">
            <Label>Submission Receipt (PDF/Image)</Label>
            {wpReceiptUrl ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Paperclip className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 flex-1">Receipt uploaded</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(wpReceiptUrl, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setWpReceiptUrl('')}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'wp');
                  }}
                  disabled={uploading === 'wp'}
                  className="flex-1"
                />
                {uploading === 'wp' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Upload the submission receipt/confirmation from Western Power portal
            </p>
          </div>

          {!wpApproved && (
            <Button
              onClick={() => handleMarkApproved('wp')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Approved
            </Button>
          )}

          {wpApproved && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Approved on {wpApprovedAt}
                </span>
              </div>
            </div>
          )}
        </div>

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
              Save Applications
            </>
          )}
        </Button>

        {/* Status Summary */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Application Status Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Synergy DES:</span>
              {synergyApproved ? (
                <Badge className="bg-green-600">Approved</Badge>
              ) : synergyFilledAt ? (
                <Badge variant="outline">Submitted - Awaiting Approval</Badge>
              ) : (
                <Badge variant="destructive">Not Submitted</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Western Power:</span>
              {wpApproved ? (
                <Badge className="bg-green-600">Approved</Badge>
              ) : wpSubmittedAt ? (
                <Badge variant="outline">Submitted - Awaiting Approval</Badge>
              ) : (
                <Badge variant="destructive">Not Submitted</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Both Synergy and Western Power approvals are required before installation can be scheduled.
            Use the copy buttons to quickly fill in portal forms.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
