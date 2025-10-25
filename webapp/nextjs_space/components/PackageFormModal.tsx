'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Save } from 'lucide-react';

interface PackageFormData {
  name: string;
  displayName: string;
  description: string;
  suitability: string;
  dailyUsage: string;
  badge: string;
  sortOrder: string;
  heroImageUrl: string;
  infographicUrl: string;
  hookText: string;
  ctaText: string;
  featureList: string[];
}

interface PackageFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: PackageFormData) => Promise<void>;
  initialData?: Partial<PackageFormData>;
  title?: string;
  description?: string;
}

export function PackageFormModal({
  open,
  onClose,
  onSave,
  initialData,
  title = 'Package Details',
  description = 'Configure package information and marketing content',
}: PackageFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingInfographic, setUploadingInfographic] = useState(false);
  
  // Form state
  const [packageName, setPackageName] = useState('');
  const [packageDisplayName, setPackageDisplayName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageSuitability, setPackageSuitability] = useState('');
  const [packageDailyUsage, setPackageDailyUsage] = useState('');
  const [packageBadge, setPackageBadge] = useState('');
  const [packageSortOrder, setPackageSortOrder] = useState('0');
  const [packageHeroImageUrl, setPackageHeroImageUrl] = useState('');
  const [packageInfographicUrl, setPackageInfographicUrl] = useState('');
  const [packageHookText, setPackageHookText] = useState('');
  const [packageCtaText, setPackageCtaText] = useState('Get This Package Now');
  const [packageFeatures, setPackageFeatures] = useState<string[]>([
    '25-year panel warranty',
    'CEC certified installer',
    'Tier 1 panels',
    'Professional installation',
    'Monitoring included',
    'Full rebate assistance',
  ]);

  // Load initial data when modal opens
  useEffect(() => {
    if (open && initialData) {
      setPackageName(initialData.name || '');
      setPackageDisplayName(initialData.displayName || '');
      setPackageDescription(initialData.description || '');
      setPackageSuitability(initialData.suitability || '');
      setPackageDailyUsage(initialData.dailyUsage || '');
      setPackageBadge(initialData.badge || '');
      setPackageSortOrder(initialData.sortOrder || '0');
      setPackageHeroImageUrl(initialData.heroImageUrl || '');
      setPackageInfographicUrl(initialData.infographicUrl || '');
      setPackageHookText(initialData.hookText || '');
      setPackageCtaText(initialData.ctaText || 'Get This Package Now');
      setPackageFeatures(initialData.featureList || [
        '25-year panel warranty',
        'CEC certified installer',
        'Tier 1 panels',
        'Professional installation',
        'Monitoring included',
        'Full rebate assistance',
      ]);
    }
  }, [open, initialData]);

  const handleImageUpload = async (file: File, type: 'hero' | 'infographic') => {
    const setUploading = type === 'hero' ? setUploadingHero : setUploadingInfographic;
    const setUrl = type === 'hero' ? setPackageHeroImageUrl : setPackageInfographicUrl;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUrl(data.url);
        alert(`${type === 'hero' ? 'Hero image' : 'Infographic'} uploaded successfully!`);
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!packageName || !packageDisplayName) {
      alert('Please fill in package name and display name');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        name: packageName,
        displayName: packageDisplayName,
        description: packageDescription,
        suitability: packageSuitability,
        dailyUsage: packageDailyUsage,
        badge: packageBadge,
        sortOrder: packageSortOrder,
        heroImageUrl: packageHeroImageUrl,
        infographicUrl: packageInfographicUrl,
        hookText: packageHookText,
        ctaText: packageCtaText,
        featureList: packageFeatures.filter(f => f.trim() !== ''),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-[70vh] overflow-y-auto">
          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="packageName">Package Name (Internal) *</Label>
                <Input
                  id="packageName"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="6.6kW Solar + 13.5kWh Battery"
                />
              </div>
              
              <div>
                <Label htmlFor="packageDisplayName">Display Name *</Label>
                <Input
                  id="packageDisplayName"
                  value={packageDisplayName}
                  onChange={(e) => setPackageDisplayName(e.target.value)}
                  placeholder="Medium Family Package"
                />
              </div>
              
              <div>
                <Label htmlFor="packageDescription">Description</Label>
                <Textarea
                  id="packageDescription"
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  placeholder="Perfect for medium-sized families with moderate energy usage"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="packageSuitability">Suitability</Label>
                <Input
                  id="packageSuitability"
                  value={packageSuitability}
                  onChange={(e) => setPackageSuitability(e.target.value)}
                  placeholder="4-5 people"
                />
              </div>
              
              <div>
                <Label htmlFor="packageDailyUsage">Daily Usage</Label>
                <Input
                  id="packageDailyUsage"
                  value={packageDailyUsage}
                  onChange={(e) => setPackageDailyUsage(e.target.value)}
                  placeholder="30-40kWh"
                />
              </div>
              
              <div>
                <Label htmlFor="packageBadge">Badge (Optional)</Label>
                <Input
                  id="packageBadge"
                  value={packageBadge}
                  onChange={(e) => setPackageBadge(e.target.value)}
                  placeholder="Most Popular"
                />
              </div>
              
              <div>
                <Label htmlFor="packageSortOrder">Sort Order</Label>
                <Input
                  id="packageSortOrder"
                  type="number"
                  value={packageSortOrder}
                  onChange={(e) => setPackageSortOrder(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            
            {/* Right Column - Marketing & Features */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm mb-3">Marketing & Graphics</h4>
              
              <div>
                <Label htmlFor="packageHookText">Hook Text (Savings Badge)</Label>
                <Input
                  id="packageHookText"
                  value={packageHookText}
                  onChange={(e) => setPackageHookText(e.target.value)}
                  placeholder="SAVE $9,927 IN REBATES!"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from rebates</p>
              </div>
              
              <div>
                <Label htmlFor="packageCtaText">Call-to-Action Button Text</Label>
                <Input
                  id="packageCtaText"
                  value={packageCtaText}
                  onChange={(e) => setPackageCtaText(e.target.value)}
                  placeholder="Get This Package Now"
                />
              </div>
              
              <div>
                <Label htmlFor="packageHeroImageUrl">Hero Image (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="packageHeroImageUrl"
                    value={packageHeroImageUrl}
                    onChange={(e) => setPackageHeroImageUrl(e.target.value)}
                    placeholder="/packages/solar-panel.jpg"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingHero}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleImageUpload(file, 'hero');
                      };
                      input.click();
                    }}
                  >
                    {uploadingHero ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                {packageHeroImageUrl && (
                  <div className="mt-2 border rounded p-2">
                    <img src={packageHeroImageUrl} alt="Hero preview" className="w-full h-32 object-cover rounded" />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Recommended: 800x600px, max 5MB</p>
              </div>
              
              <div>
                <Label htmlFor="packageInfographicUrl">Infographic (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="packageInfographicUrl"
                    value={packageInfographicUrl}
                    onChange={(e) => setPackageInfographicUrl(e.target.value)}
                    placeholder="/packages/infographic.jpg"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingInfographic}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleImageUpload(file, 'infographic');
                      };
                      input.click();
                    }}
                  >
                    {uploadingInfographic ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                {packageInfographicUrl && (
                  <div className="mt-2 border rounded p-2">
                    <img src={packageInfographicUrl} alt="Infographic preview" className="w-full h-32 object-cover rounded" />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Recommended: Vertical format, max 5MB</p>
              </div>
              
              {/* Feature List Editor */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-sm mb-3">Feature List</h4>
                <div className="space-y-2">
                  {packageFeatures.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...packageFeatures];
                          newFeatures[index] = e.target.value;
                          setPackageFeatures(newFeatures);
                        }}
                        placeholder="Feature description"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFeatures = packageFeatures.filter((_, i) => i !== index);
                          setPackageFeatures(newFeatures);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPackageFeatures([...packageFeatures, ''])}
                    className="w-full"
                  >
                    + Add Feature
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Package
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
