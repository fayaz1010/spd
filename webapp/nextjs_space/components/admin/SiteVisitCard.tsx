'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Home,
  Calendar,
  Camera,
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Zap,
  Upload,
  X,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface SiteVisitCardProps {
  leadId: string;
  lead: any;
  siteVisit?: any;
  onUpdate?: () => void;
}

export function SiteVisitCard({ 
  leadId, 
  lead,
  siteVisit,
  onUpdate 
}: SiteVisitCardProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Scheduling
  const [siteVisitDate, setSiteVisitDate] = useState(
    siteVisit?.scheduledDate 
      ? new Date(siteVisit.scheduledDate).toISOString().split('T')[0]
      : ''
  );
  const [siteVisitTime, setSiteVisitTime] = useState(
    siteVisit?.scheduledDate 
      ? new Date(siteVisit.scheduledDate).toISOString().split('T')[1].substring(0, 5)
      : ''
  );
  
  // Roof Assessment
  const [roofCondition, setRoofCondition] = useState(siteVisit?.roofCondition || '');
  const [roofType, setRoofType] = useState(siteVisit?.roofType || '');
  const [roofMaterial, setRoofMaterial] = useState(siteVisit?.roofMaterial || '');
  const [roofPitch, setRoofPitch] = useState(siteVisit?.roofPitch || '');
  const [roofAccess, setRoofAccess] = useState(siteVisit?.roofAccess || '');
  const [scaffoldingRequired, setScaffoldingRequired] = useState(siteVisit?.scaffoldingRequired || false);
  const [safetyRailsRequired, setSafetyRailsRequired] = useState(siteVisit?.safetyRailsRequired || false);
  const [roofNotes, setRoofNotes] = useState(siteVisit?.roofNotes || '');
  
  // Electrical Assessment
  const [switchboardLocation, setSwitchboardLocation] = useState(siteVisit?.switchboardLocation || '');
  const [switchboardCondition, setSwitchboardCondition] = useState(siteVisit?.switchboardCondition || '');
  const [switchboardType, setSwitchboardType] = useState(siteVisit?.switchboardType || '');
  const [mainSwitchRating, setMainSwitchRating] = useState(siteVisit?.mainSwitchRating || '');
  const [threePhasePower, setThreePhasePower] = useState(siteVisit?.threePhasePower || false);
  const [meterBoxLocation, setMeterBoxLocation] = useState(siteVisit?.meterBoxLocation || '');
  const [meterType, setMeterType] = useState(siteVisit?.meterType || '');
  const [meterNumber, setMeterNumber] = useState(siteVisit?.meterNumber || lead?.meterNumber || '');
  const [electricalNotes, setElectricalNotes] = useState(siteVisit?.electricalNotes || '');
  
  // Site Conditions
  const [shadingIssues, setShadingIssues] = useState(siteVisit?.shadingIssues || false);
  const [shadingDescription, setShadingDescription] = useState(siteVisit?.shadingDescription || '');
  const [shadingImpact, setShadingImpact] = useState(siteVisit?.shadingImpact || '');
  const [asbestosPresent, setAsbestosPresent] = useState(siteVisit?.asbestosPresent || false);
  const [heritageProperty, setHeritageProperty] = useState(siteVisit?.heritageProperty || false);
  const [strataProperty, setStrataProperty] = useState(siteVisit?.strataProperty || false);
  const [accessNotes, setAccessNotes] = useState(siteVisit?.accessNotes || '');
  
  // Photos
  const [photos, setPhotos] = useState<any[]>(siteVisit?.photos || []);
  
  // Documents
  const [documents, setDocuments] = useState<any[]>(siteVisit?.documents || []);
  
  // Quote Adjustment
  const [quoteAdjustmentRequired, setQuoteAdjustmentRequired] = useState(siteVisit?.quoteAdjustmentRequired || false);
  const [adjustmentReason, setAdjustmentReason] = useState(siteVisit?.adjustmentReason || '');
  const [additionalCost, setAdditionalCost] = useState(siteVisit?.additionalCost || '');
  const [adjustmentType, setAdjustmentType] = useState(siteVisit?.adjustmentType || '');
  
  // Summary
  const [summary, setSummary] = useState(siteVisit?.summary || '');
  
  // Installation Cost Items (SITE_INSPECTION)
  const [installationCostItems, setInstallationCostItems] = useState<any[]>([]);
  const [selectedCostItems, setSelectedCostItems] = useState<string[]>(siteVisit?.selectedCostItems || []);
  
  // Fetch installation cost items
  useEffect(() => {
    const fetchInstallationCostItems = async () => {
      try {
        const response = await fetch('/api/admin/installation-costing?isActive=true');
        const data = await response.json();
        
        const siteInspectionItems = data.items?.filter((item: any) => 
          item.applicationTiming === 'SITE_INSPECTION'
        ) || [];
        
        setInstallationCostItems(siteInspectionItems);
      } catch (error) {
        console.error('Error fetching installation cost items:', error);
      }
    };
    
    fetchInstallationCostItems();
  }, []);
  
  // Check if deposit paid
  const depositPaid = lead?.depositPaid || false;
  const completed = siteVisit?.completedAt;
  
  // Calculate completion
  const requiredPhotos = 12;
  const hasMinPhotos = photos.length >= requiredPhotos;
  const hasRoofAssessment = roofCondition && roofType && roofPitch && roofAccess;
  const hasElectricalAssessment = switchboardLocation && switchboardCondition && mainSwitchRating;
  const canComplete = hasMinPhotos && hasRoofAssessment && hasElectricalAssessment;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('photos', file);
      });
      formData.append('leadId', leadId);

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/upload/site-photos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setPhotos([...photos, ...data.photos]);
      toast.success(`${data.photos.length} photo(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId));
    toast.success('Photo removed');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/leads/${leadId}/site-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scheduledDate: siteVisitDate && siteVisitTime 
            ? new Date(`${siteVisitDate}T${siteVisitTime}`).toISOString()
            : null,
          roofCondition,
          roofType,
          roofMaterial,
          roofPitch,
          roofAccess,
          scaffoldingRequired,
          safetyRailsRequired,
          roofNotes,
          switchboardLocation,
          switchboardCondition,
          switchboardType,
          mainSwitchRating: mainSwitchRating ? parseInt(mainSwitchRating) : null,
          threePhasePower,
          meterBoxLocation,
          meterType,
          meterNumber,
          electricalNotes,
          shadingIssues,
          shadingDescription,
          shadingImpact: shadingImpact ? parseFloat(shadingImpact) : null,
          asbestosPresent,
          heritageProperty,
          strataProperty,
          accessNotes,
          photos,
          documents,
          quoteAdjustmentRequired,
          adjustmentReason,
          additionalCost: additionalCost ? parseFloat(additionalCost) : null,
          adjustmentType,
          summary,
          selectedCostItems
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Site visit data saved successfully');
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save site visit data');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!canComplete) {
      toast.error('Please complete all required fields and upload minimum 12 photos');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      // First, save all the site visit data
      const saveResponse = await fetch(`/api/admin/leads/${leadId}/site-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scheduledDate: siteVisitDate && siteVisitTime 
            ? new Date(`${siteVisitDate}T${siteVisitTime}`).toISOString()
            : null,
          roofCondition,
          roofType,
          roofMaterial,
          roofPitch,
          roofAccess,
          scaffoldingRequired,
          safetyRailsRequired,
          roofNotes,
          switchboardLocation,
          switchboardCondition,
          switchboardType,
          mainSwitchRating: mainSwitchRating ? parseInt(mainSwitchRating) : null,
          threePhasePower,
          meterBoxLocation,
          meterType,
          meterNumber,
          electricalNotes,
          shadingIssues,
          shadingDescription,
          shadingImpact: shadingImpact ? parseFloat(shadingImpact) : null,
          asbestosPresent,
          heritageProperty,
          strataProperty,
          accessNotes,
          photos,
          documents,
          quoteAdjustmentRequired,
          adjustmentReason,
          additionalCost: additionalCost ? parseFloat(additionalCost) : null,
          adjustmentType,
          summary
        })
      });

      if (!saveResponse.ok) throw new Error('Failed to save site visit data');

      // Then mark as complete
      const completeResponse = await fetch(`/api/admin/leads/${leadId}/site-visit/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!completeResponse.ok) throw new Error('Failed to mark as complete');

      toast.success('Site visit saved and marked as complete!');
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Complete error:', error);
      toast.error('Failed to complete site visit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Site Visit & Technical Assessment
          </span>
          <div className="flex items-center gap-2">
            {!depositPaid && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Awaiting Deposit
              </Badge>
            )}
            {depositPaid && !completed && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Calendar className="h-3 w-3 mr-1" />
                In Progress
              </Badge>
            )}
            {completed && (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Deposit Check */}
        {!depositPaid && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Site visit can only be scheduled after deposit is paid.
            </AlertDescription>
          </Alert>
        )}

        {/* Scheduling Section */}
        {depositPaid && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Schedule Site Visit
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siteVisitDate">Date</Label>
                <Input
                  id="siteVisitDate"
                  type="date"
                  value={siteVisitDate}
                  onChange={(e) => setSiteVisitDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="siteVisitTime">Time</Label>
                <Input
                  id="siteVisitTime"
                  type="time"
                  value={siteVisitTime}
                  onChange={(e) => setSiteVisitTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Roof Assessment */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Home className="h-5 w-5 text-orange-600" />
            Roof Assessment
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roofCondition">Roof Condition *</Label>
              <select
                id="roofCondition"
                value={roofCondition}
                onChange={(e) => setRoofCondition(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={!depositPaid}
              >
                <option value="">Select...</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="requires_repair">Requires Repair</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="roofType">Roof Type *</Label>
              <select
                id="roofType"
                value={roofType}
                onChange={(e) => setRoofType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={!depositPaid}
              >
                <option value="">Select...</option>
                <option value="tile">Tile</option>
                <option value="metal_colorbond">Metal (Colorbond)</option>
                <option value="tin">Tin</option>
                <option value="flat">Flat</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roofPitch">Roof Pitch *</Label>
              <select
                id="roofPitch"
                value={roofPitch}
                onChange={(e) => setRoofPitch(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={!depositPaid}
              >
                <option value="">Select...</option>
                <option value="flat">Flat (0-10°)</option>
                <option value="low">Low (10-20°)</option>
                <option value="medium">Medium (20-35°)</option>
                <option value="steep">Steep (35°+)</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="roofAccess">Roof Access *</Label>
              <select
                id="roofAccess"
                value={roofAccess}
                onChange={(e) => setRoofAccess(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={!depositPaid}
              >
                <option value="">Select...</option>
                <option value="easy">Easy (ground level)</option>
                <option value="moderate">Moderate (single storey)</option>
                <option value="difficult">Difficult (two storey)</option>
                <option value="very_difficult">Very Difficult (three storey or complex)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scaffoldingRequired"
                checked={scaffoldingRequired}
                onChange={(e) => setScaffoldingRequired(e.target.checked)}
                className="w-4 h-4"
                disabled={!depositPaid}
              />
              <Label htmlFor="scaffoldingRequired" className="cursor-pointer">
                Scaffolding Required
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="safetyRailsRequired"
                checked={safetyRailsRequired}
                onChange={(e) => setSafetyRailsRequired(e.target.checked)}
                className="w-4 h-4"
                disabled={!depositPaid}
              />
              <Label htmlFor="safetyRailsRequired" className="cursor-pointer">
                Safety Rails Required
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="roofNotes">Roof Notes</Label>
            <Textarea
              id="roofNotes"
              value={roofNotes}
              onChange={(e) => setRoofNotes(e.target.value)}
              placeholder="Any concerns, damage, or special considerations..."
              rows={3}
              disabled={!depositPaid}
            />
          </div>
        </div>

        <Separator />

        {/* Electrical Assessment */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Electrical Assessment
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="switchboardLocation">Switchboard Location *</Label>
              <Input
                id="switchboardLocation"
                value={switchboardLocation}
                onChange={(e) => setSwitchboardLocation(e.target.value)}
                placeholder="e.g., Garage, External wall"
                disabled={!depositPaid}
              />
            </div>
            
            <div>
              <Label htmlFor="switchboardCondition">Switchboard Condition *</Label>
              <select
                id="switchboardCondition"
                value={switchboardCondition}
                onChange={(e) => setSwitchboardCondition(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={!depositPaid}
              >
                <option value="">Select...</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="upgrade_needed">Upgrade Needed</option>
                <option value="urgent_upgrade">Urgent Upgrade Required</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mainSwitchRating">Main Switch Rating (Amps) *</Label>
              <Input
                id="mainSwitchRating"
                type="number"
                value={mainSwitchRating}
                onChange={(e) => setMainSwitchRating(e.target.value)}
                placeholder="63, 80, or 100"
                disabled={!depositPaid}
              />
            </div>
            
            <div>
              <Label htmlFor="meterNumber">Meter Number (NMI)</Label>
              <Input
                id="meterNumber"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                placeholder="NMI number"
                disabled={!depositPaid}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="threePhasePower"
              checked={threePhasePower}
              onChange={(e) => setThreePhasePower(e.target.checked)}
              className="w-4 h-4"
              disabled={!depositPaid}
            />
            <Label htmlFor="threePhasePower" className="cursor-pointer">
              Three Phase Power Available
            </Label>
          </div>
        </div>

        <Separator />

        {/* Site Conditions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Site Conditions</h3>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shadingIssues"
              checked={shadingIssues}
              onChange={(e) => setShadingIssues(e.target.checked)}
              className="w-4 h-4"
              disabled={!depositPaid}
            />
            <Label htmlFor="shadingIssues" className="cursor-pointer">
              Shading Issues Present
            </Label>
          </div>

          {shadingIssues && (
            <div className="ml-6 space-y-3">
              <Textarea
                placeholder="Describe shading issues (trees, buildings, time of day...)"
                value={shadingDescription}
                onChange={(e) => setShadingDescription(e.target.value)}
                rows={2}
                disabled={!depositPaid}
              />
              <Input
                type="number"
                placeholder="Estimated shading impact (%)"
                value={shadingImpact}
                onChange={(e) => setShadingImpact(e.target.value)}
                disabled={!depositPaid}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="asbestosPresent"
              checked={asbestosPresent}
              onChange={(e) => setAsbestosPresent(e.target.checked)}
              className="w-4 h-4"
              disabled={!depositPaid}
            />
            <Label htmlFor="asbestosPresent" className="cursor-pointer">
              Asbestos Present
            </Label>
          </div>

          {asbestosPresent && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Asbestos detected. Specialist contractor required. Do not proceed without proper certification.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="heritageProperty"
                checked={heritageProperty}
                onChange={(e) => setHeritageProperty(e.target.checked)}
                className="w-4 h-4"
                disabled={!depositPaid}
              />
              <Label htmlFor="heritageProperty" className="cursor-pointer">
                Heritage Listed Property
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="strataProperty"
                checked={strataProperty}
                onChange={(e) => setStrataProperty(e.target.checked)}
                className="w-4 h-4"
                disabled={!depositPaid}
              />
              <Label htmlFor="strataProperty" className="cursor-pointer">
                Strata/Body Corporate
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="accessNotes">Site Access Notes</Label>
            <Textarea
              id="accessNotes"
              value={accessNotes}
              onChange={(e) => setAccessNotes(e.target.value)}
              placeholder="Parking, gates, pets, access restrictions..."
              rows={2}
              disabled={!depositPaid}
            />
          </div>
        </div>

        <Separator />

        {/* Photos Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-600" />
            Site Photos *
          </h3>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              📸 Minimum {requiredPhotos} photos required. Current: {photos.length}
            </AlertDescription>
          </Alert>

          {depositPaid && (
            <div>
              <Label htmlFor="photoUpload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG up to 10MB each
                  </p>
                </div>
              </Label>
              <Input
                id="photoUpload"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.id || index} className="relative group">
                  <img 
                    src={photo.url} 
                    alt={photo.description || `Photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={!depositPaid}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Installation Cost Adjustments */}
        {depositPaid && installationCostItems.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Installation Cost Adjustments
            </h3>
            <p className="text-sm text-gray-600">
              Select any additional costs discovered during site inspection
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {installationCostItems.map((item) => {
                const isSelected = selectedCostItems.includes(item.id);
                return (
                  <div 
                    key={item.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => {
                      setSelectedCostItems(prev => 
                        prev.includes(item.id)
                          ? prev.filter(id => id !== item.id)
                          : [...prev, item.id]
                      );
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded"
                          />
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-600 mt-1 ml-6">{item.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">
                        ${item.baseRate}
                        {item.calculationType !== 'FIXED' && (
                          <span className="text-xs ml-1">
                            /{item.calculationType.replace('PER_', '').toLowerCase()}
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {selectedCostItems.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                <p className="text-sm font-medium text-purple-900">
                  {selectedCostItems.length} additional cost item(s) selected
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  These will be added to the quote automatically
                </p>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Site Visit Summary</h3>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Overall assessment, recommendations, next steps..."
            rows={4}
            disabled={!depositPaid}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            disabled={saving || !depositPaid}
            variant="outline"
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>

          {!completed && (
            <Button 
              onClick={handleComplete} 
              disabled={saving || !canComplete || !depositPaid}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Site Visit Complete
                </>
              )}
            </Button>
          )}
        </div>

        {/* Completion Checklist */}
        {!completed && depositPaid && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">Completion Checklist:</h4>
            <div className="space-y-1 text-sm">
              <div className={hasMinPhotos ? 'text-green-600' : 'text-gray-600'}>
                {hasMinPhotos ? '✓' : '○'} Minimum {requiredPhotos} photos uploaded ({photos.length}/{requiredPhotos})
              </div>
              <div className={hasRoofAssessment ? 'text-green-600' : 'text-gray-600'}>
                {hasRoofAssessment ? '✓' : '○'} Roof assessment complete
              </div>
              <div className={hasElectricalAssessment ? 'text-green-600' : 'text-gray-600'}>
                {hasElectricalAssessment ? '✓' : '○'} Electrical assessment complete
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
