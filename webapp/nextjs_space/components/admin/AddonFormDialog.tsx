'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface AddonFormDialogProps {
  addon?: any;
  onClose: (saved: boolean) => void;
}

const ADDON_CATEGORIES = [
  { value: 'solar_equipment', label: 'Solar Equipment' },
  { value: 'energy_efficiency', label: 'Energy Efficiency' },
  { value: 'protection', label: 'Protection' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'hvac_services', label: 'HVAC Services' },
  { value: 'plumbing_services', label: 'Plumbing Services' },
];

const ICON_OPTIONS = [
  'Car', 'Zap', 'Droplet', 'Wind', 'Shield', 'Sparkles', 'Home', 
  'Droplets', 'Paintbrush', 'Flame', 'Package', 'Gift', 'Wrench',
  'Settings', 'Sun', 'Battery', 'Plug', 'Tool', 'HardHat'
];

export default function AddonFormDialog({ addon, onClose }: AddonFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    description: '',
    retailPrice: '',
    unitCost: '',
    addonCategory: 'solar_equipment',
    showAtCheckout: true,
    showBeforeCheckout: false,
    benefits: '',
    iconName: 'Package',
    isRecommended: false,
    sortOrder: '0',
  });

  useEffect(() => {
    if (addon) {
      setFormData({
        name: addon.name || '',
        manufacturer: addon.manufacturer || '',
        description: addon.description || '',
        retailPrice: addon.retailPrice?.toString() || '',
        unitCost: addon.unitCost?.toString() || '',
        addonCategory: addon.addonCategory || 'solar_equipment',
        showAtCheckout: addon.showAtCheckout !== undefined ? addon.showAtCheckout : true,
        showBeforeCheckout: addon.showBeforeCheckout !== undefined ? addon.showBeforeCheckout : false,
        benefits: Array.isArray(addon.benefits) ? addon.benefits.join('\n') : '',
        iconName: addon.iconName || 'Package',
        isRecommended: addon.isRecommended || false,
        sortOrder: addon.sortOrder?.toString() || '0',
      });
    }
  }, [addon]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.retailPrice || parseFloat(formData.retailPrice) <= 0) {
      newErrors.retailPrice = 'Valid retail price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      const benefitsArray = formData.benefits
        .split('\n')
        .map(b => b.trim())
        .filter(b => b.length > 0);

      const payload = {
        ...(addon && { id: addon.id }),
        name: formData.name.trim(),
        manufacturer: formData.manufacturer.trim(),
        description: formData.description.trim(),
        retailPrice: parseFloat(formData.retailPrice),
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : parseFloat(formData.retailPrice) * 0.7,
        addonCategory: formData.addonCategory,
        showAtCheckout: formData.showAtCheckout,
        showBeforeCheckout: formData.showBeforeCheckout,
        benefits: benefitsArray,
        iconName: formData.iconName,
        isRecommended: formData.isRecommended,
        sortOrder: parseInt(formData.sortOrder) || 0,
      };

      const url = '/api/admin/addon-products';
      const method = addon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onClose(true);
      } else {
        alert('Error: ' + (data.error || 'Failed to save addon'));
      }
    } catch (error) {
      console.error('Error saving addon:', error);
      alert('Failed to save addon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            {addon ? 'Edit Add-on' : 'Create New Add-on'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="EV Charger 7kW"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="manufacturer">
                  Manufacturer <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
                  placeholder="Tesla"
                  className={errors.manufacturer ? 'border-red-500' : ''}
                />
                {errors.manufacturer && (
                  <p className="text-red-500 text-sm mt-1">{errors.manufacturer}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Level 2 home EV charger with smart scheduling"
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Pricing</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="retailPrice">
                  Retail Price (AUD) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="retailPrice"
                  type="number"
                  step="0.01"
                  value={formData.retailPrice}
                  onChange={(e) => handleChange('retailPrice', e.target.value)}
                  placeholder="2500"
                  className={errors.retailPrice ? 'border-red-500' : ''}
                />
                {errors.retailPrice && (
                  <p className="text-red-500 text-sm mt-1">{errors.retailPrice}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Customer-facing price</p>
              </div>

              <div>
                <Label htmlFor="unitCost">Unit Cost (AUD)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => handleChange('unitCost', e.target.value)}
                  placeholder="1750"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wholesale cost (defaults to 70% of retail)
                </p>
              </div>
            </div>
          </div>

          {/* Category & Display */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Category & Display</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addonCategory">Category</Label>
                <select
                  id="addonCategory"
                  value={formData.addonCategory}
                  onChange={(e) => handleChange('addonCategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ADDON_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="iconName">Icon</Label>
                <select
                  id="iconName"
                  value={formData.iconName}
                  onChange={(e) => handleChange('iconName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ICON_OPTIONS.map(icon => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Lucide icon name</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Visibility</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showAtCheckout"
                  checked={formData.showAtCheckout}
                  onCheckedChange={(checked) => handleChange('showAtCheckout', checked)}
                />
                <label htmlFor="showAtCheckout" className="text-sm font-normal cursor-pointer">
                  Show in checkout drawer (after contact form)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showBeforeCheckout"
                  checked={formData.showBeforeCheckout}
                  onCheckedChange={(checked) => handleChange('showBeforeCheckout', checked)}
                />
                <label htmlFor="showBeforeCheckout" className="text-sm font-normal cursor-pointer">
                  Show in customization page (before contact)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecommended"
                  checked={formData.isRecommended}
                  onCheckedChange={(checked) => handleChange('isRecommended', checked)}
                />
                <label htmlFor="isRecommended" className="text-sm font-normal cursor-pointer">
                  Mark as recommended/popular
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => handleChange('sortOrder', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers appear first
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Benefits</h3>

            <div>
              <Label htmlFor="benefits">Benefits (one per line)</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => handleChange('benefits', e.target.value)}
                placeholder="Charge overnight with solar&#10;Smart scheduling via app&#10;7kW fast charging"
                rows={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter each benefit on a new line
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {addon ? 'Update' : 'Create'} Add-on
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
