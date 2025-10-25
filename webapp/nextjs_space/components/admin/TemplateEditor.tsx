'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Eye } from 'lucide-react';

interface PackageTemplate {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  tier: string;
  sortOrder?: number;
  active: boolean;
  solarSizingStrategy: string;
  solarCoveragePercent?: number;
  solarFixedKw?: number;
  batterySizingStrategy: string;
  batteryCoverageHours?: number;
  batteryFixedKwh?: number;
  includeMonitoring: boolean;
  includeWarranty: string;
  includeMaintenance: boolean;
  priceMultiplier: number;
  discountPercent: number;
  badge?: string;
  highlightColor?: string;
  features?: string[];
}

interface TemplateEditorProps {
  template: PackageTemplate | null;
  onClose: () => void;
}

export default function TemplateEditor({ template, onClose }: TemplateEditorProps) {
  const [formData, setFormData] = useState<PackageTemplate>({
    name: '',
    displayName: '',
    description: '',
    tier: 'BUDGET',
    active: true,
    solarSizingStrategy: 'coverage_percentage',
    solarCoveragePercent: 100,
    batterySizingStrategy: 'coverage_hours',
    batteryCoverageHours: 7,
    includeMonitoring: true,
    includeWarranty: 'standard',
    includeMaintenance: false,
    priceMultiplier: 1.0,
    discountPercent: 0,
    badge: '',
    highlightColor: '#3B82F6',
    features: [],
  });

  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData(template);
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = template
        ? `/api/admin/package-templates/${template.id}`
        : '/api/admin/package-templates';
      
      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to save template'}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {template ? 'Edit Package Template' : 'Create Package Template'}
          </h1>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Internal Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Budget, Recommended, Premium"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Used internally for identification</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Budget Saver, Balanced Solution"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Shown to customers</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of this package"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tier *
                    </label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="BUDGET">Budget</option>
                      <option value="RECOMMENDED">Recommended</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.active ? 'active' : 'inactive'}
                      onChange={(e) => setFormData({ ...formData, active: e.target.value === 'active' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Website Card Styling */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Website Card Styling</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Most Popular, Best Value"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Highlight Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.highlightColor || '#3B82F6'}
                      onChange={(e) => setFormData({ ...formData, highlightColor: e.target.value })}
                      className="h-10 w-20 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={formData.highlightColor || '#3B82F6'}
                      onChange={(e) => setFormData({ ...formData, highlightColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features (shown as bullet points)
                  </label>
                  <div className="space-y-2 mb-2">
                    {formData.features?.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="flex-1 px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm">
                          {feature}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add a feature..."
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Solar Configuration */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Solar System Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sizing Strategy *
                  </label>
                  <select
                    value={formData.solarSizingStrategy}
                    onChange={(e) => setFormData({ ...formData, solarSizingStrategy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="coverage_percentage">Coverage Percentage</option>
                    <option value="fixed_kw">Fixed kW</option>
                    <option value="max_roof">Max Roof Capacity</option>
                  </select>
                </div>

                {formData.solarSizingStrategy === 'coverage_percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coverage Percentage
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.solarCoveragePercent || 100}
                        onChange={(e) => setFormData({ ...formData, solarCoveragePercent: parseFloat(e.target.value) })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        max="200"
                        step="10"
                      />
                      <span className="text-gray-600">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      100% = covers full daily usage, 150% = excess for export
                    </p>
                  </div>
                )}

                {formData.solarSizingStrategy === 'fixed_kw' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fixed System Size (kW)
                    </label>
                    <input
                      type="number"
                      value={formData.solarFixedKw || 6.6}
                      onChange={(e) => setFormData({ ...formData, solarFixedKw: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Battery Configuration */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Battery Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sizing Strategy *
                  </label>
                  <select
                    value={formData.batterySizingStrategy}
                    onChange={(e) => setFormData({ ...formData, batterySizingStrategy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">No Battery</option>
                    <option value="coverage_hours">Coverage Hours</option>
                    <option value="fixed_kwh">Fixed kWh</option>
                    <option value="dynamic_multiplier">Dynamic (Tier-based)</option>
                    <option value="full_overnight">Full Overnight Coverage</option>
                  </select>
                </div>

                {formData.batterySizingStrategy === 'coverage_hours' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coverage Hours
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.batteryCoverageHours || 7}
                        onChange={(e) => setFormData({ ...formData, batteryCoverageHours: parseFloat(e.target.value) })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        max="24"
                        step="1"
                      />
                      <span className="text-gray-600">hours</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Hours of evening/night coverage needed
                    </p>
                  </div>
                )}

                {formData.batterySizingStrategy === 'fixed_kwh' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fixed Battery Size (kWh)
                    </label>
                    <input
                      type="number"
                      value={formData.batteryFixedKwh || 10}
                      onChange={(e) => setFormData({ ...formData, batteryFixedKwh: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.5"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Pricing & Features */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Features</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Multiplier
                    </label>
                    <input
                      type="number"
                      value={formData.priceMultiplier}
                      onChange={(e) => setFormData({ ...formData, priceMultiplier: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="2"
                      step="0.05"
                    />
                    <p className="text-xs text-gray-500 mt-1">1.0 = standard, 0.95 = 5% discount</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount %
                    </label>
                    <input
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="50"
                      step="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty Type
                  </label>
                  <select
                    value={formData.includeWarranty}
                    onChange={(e) => setFormData({ ...formData, includeWarranty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="standard">Standard (10 years)</option>
                    <option value="extended">Extended (15 years)</option>
                    <option value="premium">Premium (25 years)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.includeMonitoring}
                      onChange={(e) => setFormData({ ...formData, includeMonitoring: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Include Monitoring</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.includeMaintenance}
                      onChange={(e) => setFormData({ ...formData, includeMaintenance: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Include Maintenance</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
                <PackagePreview template={formData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Preview Component
function PackagePreview({ template }: { template: PackageTemplate }) {
  return (
    <div className="border-2 rounded-xl p-6 relative" style={{ borderColor: template.highlightColor || '#3B82F6' }}>
      {template.badge && (
        <div 
          className="absolute -top-3 left-6 px-3 py-1 rounded-full text-white text-sm font-semibold"
          style={{ backgroundColor: template.highlightColor || '#3B82F6' }}
        >
          {template.badge}
        </div>
      )}

      <div className="mt-2">
        <h3 className="text-2xl font-bold text-gray-900">{template.displayName}</h3>
        <p className="text-gray-600 mt-2">{template.description}</p>

        <div className="mt-4 space-y-2">
          {template.features?.map((feature, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Solar:</span>
              <span className="ml-2 font-semibold">
                {template.solarSizingStrategy === 'coverage_percentage' 
                  ? `${template.solarCoveragePercent}% coverage`
                  : template.solarSizingStrategy === 'fixed_kw'
                  ? `${template.solarFixedKw}kW`
                  : 'Max roof'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Battery:</span>
              <span className="ml-2 font-semibold">
                {template.batterySizingStrategy === 'none'
                  ? 'None'
                  : template.batterySizingStrategy === 'coverage_hours'
                  ? `${template.batteryCoverageHours}h`
                  : template.batterySizingStrategy === 'fixed_kwh'
                  ? `${template.batteryFixedKwh}kWh`
                  : 'Dynamic'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
