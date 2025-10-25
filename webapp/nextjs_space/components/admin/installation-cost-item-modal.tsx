'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface InstallationCostItem {
  id?: string;
  name: string;
  code: string;
  category: string;
  calculationType: string;
  baseRate: number;
  multiplier: number;
  formula?: string;
  minSystemSize?: number;
  maxSystemSize?: number;
  roofType?: string;
  roofPitch?: string;
  orientation?: string;
  storeys?: number;
  phases?: number;
  hasOptimisers?: boolean;
  hasBattery?: boolean;
  batteryType?: string;
  isRetrofit?: boolean;
  estimatedHours?: number;
  skillLevel?: string;
  teamSize: number;
  providerId?: string;
  providerType?: string;
  minQuantity: number;
  maxQuantity?: number;
  isRequired: boolean;
  isOptional: boolean;
  defaultIncluded: boolean;
  description?: string;
  notes?: string;
  isActive: boolean;
  priority: number;
  sortOrder: number;
  applicationTiming: string;
  showInCalculator: boolean;
  showInQuote: boolean;
  requiresInspection: boolean;
  itemGroup?: string;
  mutuallyExclusive: boolean;
}

const CATEGORIES = ['BASE', 'COMPLEXITY', 'LABOR', 'EQUIPMENT', 'RENTAL', 'REGULATORY'];
const CALCULATION_TYPES = ['FIXED', 'PER_WATT', 'PER_PANEL', 'PER_KW', 'PER_KWH', 'PER_UNIT', 'HOURLY', 'FORMULA'];
const APPLICATION_TIMINGS = ['MANDATORY', 'SITE_INSPECTION', 'CUSTOMER_ADDON', 'MANUAL'];
const ROOF_TYPES = ['tile', 'metal', 'klip_lok', 'slate', 'colorbond'];
const ROOF_PITCHES = ['flat', 'standard', 'steep_30_40', 'steep_40_50'];
const ORIENTATIONS = ['portrait', 'landscape'];
const BATTERY_TYPES = ['dc_coupled', 'ac_coupled'];
const PROVIDER_TYPES = ['INTERNAL', 'SUBCONTRACTOR', 'RENTAL'];

interface Props {
  item: InstallationCostItem | null;
  onClose: () => void;
  onSave: (item: InstallationCostItem) => Promise<void>;
}

export function InstallationCostItemModal({ item, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<InstallationCostItem>({
    name: '',
    code: '',
    category: 'BASE',
    calculationType: 'FIXED',
    baseRate: 0,
    multiplier: 1.0,
    teamSize: 1,
    minQuantity: 0,
    isRequired: false,
    isOptional: true,
    defaultIncluded: false,
    isActive: true,
    priority: 0,
    sortOrder: 0,
    applicationTiming: 'MANDATORY',
    showInCalculator: true,
    showInQuote: true,
    requiresInspection: false,
    mutuallyExclusive: false,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof InstallationCostItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {item?.id ? 'Edit Installation Cost Item' : 'Add Installation Cost Item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calculation Type *
              </label>
              <select
                value={formData.calculationType}
                onChange={(e) => updateField('calculationType', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                {CALCULATION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Timing *
              </label>
              <select
                value={formData.applicationTiming}
                onChange={(e) => updateField('applicationTiming', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                {APPLICATION_TIMINGS.map(timing => (
                  <option key={timing} value={timing}>
                    {timing.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.applicationTiming === 'MANDATORY' && 'Auto-applied in calculator'}
                {formData.applicationTiming === 'SITE_INSPECTION' && 'Added after site visit'}
                {formData.applicationTiming === 'CUSTOMER_ADDON' && 'Optional in calculator'}
                {formData.applicationTiming === 'MANUAL' && 'Admin-only charges'}
              </p>
            </div>
          </div>

          {/* Rates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Rate *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.baseRate}
                onChange={(e) => updateField('baseRate', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.multiplier}
                onChange={(e) => updateField('multiplier', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {formData.calculationType === 'FORMULA' && (
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formula
                </label>
                <input
                  type="text"
                  value={formData.formula || ''}
                  onChange={(e) => updateField('formula', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  placeholder="e.g., CEIL(panelCount / 6)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: systemSize, panelCount, batteryCapacity, storeys, CEIL, FLOOR, ROUND, MAX, MIN
                </p>
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Conditions (when does this apply?)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min System Size (kW)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.minSystemSize || ''}
                  onChange={(e) => updateField('minSystemSize', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max System Size (kW)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.maxSystemSize || ''}
                  onChange={(e) => updateField('maxSystemSize', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storeys
                </label>
                <input
                  type="number"
                  value={formData.storeys || ''}
                  onChange={(e) => updateField('storeys', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roof Type
                </label>
                <select
                  value={formData.roofType || ''}
                  onChange={(e) => updateField('roofType', e.target.value || undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Any</option>
                  {ROOF_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roof Pitch
                </label>
                <select
                  value={formData.roofPitch || ''}
                  onChange={(e) => updateField('roofPitch', e.target.value || undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Any</option>
                  {ROOF_PITCHES.map(pitch => (
                    <option key={pitch} value={pitch}>{pitch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orientation
                </label>
                <select
                  value={formData.orientation || ''}
                  onChange={(e) => updateField('orientation', e.target.value || undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Any</option>
                  {ORIENTATIONS.map(orient => (
                    <option key={orient} value={orient}>{orient}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phases
                </label>
                <select
                  value={formData.phases || ''}
                  onChange={(e) => updateField('phases', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Any</option>
                  <option value="1">1-Phase</option>
                  <option value="3">3-Phase</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Battery Type
                </label>
                <select
                  value={formData.batteryType || ''}
                  onChange={(e) => updateField('batteryType', e.target.value || undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Any</option>
                  {BATTERY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.hasOptimisers || false}
                  onChange={(e) => updateField('hasOptimisers', e.target.checked || undefined)}
                  className="rounded"
                />
                <span className="text-sm">Has Optimisers</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.hasBattery || false}
                  onChange={(e) => updateField('hasBattery', e.target.checked || undefined)}
                  className="rounded"
                />
                <span className="text-sm">Has Battery</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isRetrofit || false}
                  onChange={(e) => updateField('isRetrofit', e.target.checked || undefined)}
                  className="rounded"
                />
                <span className="text-sm">Is Retrofit</span>
              </label>
            </div>
          </div>

          {/* Provider */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Provider</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Type
                </label>
                <select
                  value={formData.providerType || ''}
                  onChange={(e) => updateField('providerType', e.target.value || undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">None</option>
                  {PROVIDER_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider ID
                </label>
                <input
                  type="text"
                  value={formData.providerId || ''}
                  onChange={(e) => updateField('providerId', e.target.value || undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., kluem_electrical"
                />
              </div>
            </div>
          </div>

          {/* Constraints & Settings */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Constraints & Settings</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Quantity
                </label>
                <input
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => updateField('minQuantity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Quantity
                </label>
                <input
                  type="number"
                  value={formData.maxQuantity || ''}
                  onChange={(e) => updateField('maxQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => updateField('priority', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => updateField('sortOrder', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) => updateField('isRequired', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Required</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isOptional}
                  onChange={(e) => updateField('isOptional', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Optional</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.defaultIncluded}
                  onChange={(e) => updateField('defaultIncluded', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Default Included</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => updateField('isActive', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.showInCalculator}
                  onChange={(e) => updateField('showInCalculator', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show in Calculator</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.showInQuote}
                  onChange={(e) => updateField('showInQuote', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show in Quote</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.requiresInspection}
                  onChange={(e) => updateField('requiresInspection', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Requires Inspection</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.mutuallyExclusive}
                  onChange={(e) => updateField('mutuallyExclusive', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Mutually Exclusive</span>
              </label>
            </div>
          </div>

          {/* Description & Notes */}
          <div className="border-t pt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value || undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value || undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
