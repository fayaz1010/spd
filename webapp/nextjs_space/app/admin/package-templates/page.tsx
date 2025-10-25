'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Save, X, DollarSign, Zap, Battery, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface PackageTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  tier: string;
  sortOrder: number;
  active: boolean;
  solarSizingStrategy: string;
  solarCoveragePercent: number | null;
  solarFixedKw: number | null;
  batterySizingStrategy: string;
  batteryCoverageHours: number | null;
  batteryFixedKwh: number | null;
  includeMonitoring: boolean;
  includeWarranty: string;
  includeMaintenance: boolean;
  priceMultiplier: number;
  discountPercent: number;
  badge: string | null;
  highlightColor: string | null;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export default function PackageTemplatesPage() {
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<PackageTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<PackageTemplate>>({
    name: '',
    displayName: '',
    description: '',
    tier: 'budget',
    sortOrder: 1,
    active: true,
    solarSizingStrategy: 'coverage_percentage',
    solarCoveragePercent: 100,
    batterySizingStrategy: 'dynamic_multiplier',
    includeMonitoring: true,
    includeWarranty: 'standard',
    includeMaintenance: false,
    priceMultiplier: 1.0,
    discountPercent: 0,
    features: [],
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/package-templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      tier: 'budget',
      sortOrder: templates.length + 1,
      active: true,
      solarSizingStrategy: 'coverage_percentage',
      solarCoveragePercent: 100,
      batterySizingStrategy: 'dynamic_multiplier',
      includeMonitoring: true,
      includeWarranty: 'standard',
      includeMaintenance: false,
      priceMultiplier: 1.0,
      discountPercent: 0,
      features: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: PackageTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = editingTemplate
        ? `/api/admin/package-templates/${editingTemplate.id}`
        : '/api/admin/package-templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadTemplates();
        setIsDialogOpen(false);
        setEditingTemplate(null);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/package-templates/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await loadTemplates();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleToggleActive = async (template: PackageTemplate) => {
    try {
      const response = await fetch(`/api/admin/package-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...template, active: !template.active }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadTemplates();
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
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

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'budget': return 'bg-green-100 text-green-800';
      case 'mid': return 'bg-orange-100 text-orange-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading package templates...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Package Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage system packages for the calculator
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className={!template.active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <CardTitle className="text-xl">{template.displayName}</CardTitle>
                    {template.badge && (
                      <Badge 
                        className="text-xs"
                        style={{ backgroundColor: template.highlightColor || undefined }}
                      >
                        {template.badge}
                      </Badge>
                    )}
                  </div>
                  <Badge className={getTierBadgeColor(template.tier)}>
                    {template.tier.toUpperCase()}
                  </Badge>
                </div>
                <Switch
                  checked={template.active}
                  onCheckedChange={() => handleToggleActive(template)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{template.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">
                    {template.solarCoveragePercent}% solar
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Battery className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">
                    {template.batterySizingStrategy === 'dynamic_multiplier' ? 'Dynamic' : 'Fixed'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-700">
                    {template.priceMultiplier}x margin
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-700">
                    Sort: {template.sortOrder}
                  </span>
                </div>
              </div>

              {/* Features */}
              {template.features && template.features.length > 0 && (
                <div className="text-xs text-gray-500">
                  {template.features.length} features
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Package Template' : 'Create Package Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Internal Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="budget"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName || ''}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Smart Starter"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Perfect starter system..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tier">Tier</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(value) => setFormData({ ...formData, tier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="mid">Mid</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder || 1}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Solar Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Solar Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="solarStrategy">Sizing Strategy</Label>
                  <Select
                    value={formData.solarSizingStrategy}
                    onValueChange={(value) => setFormData({ ...formData, solarSizingStrategy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coverage_percentage">Coverage Percentage</SelectItem>
                      <SelectItem value="fixed_kw">Fixed kW</SelectItem>
                      <SelectItem value="max_roof">Max Roof Capacity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.solarSizingStrategy === 'coverage_percentage' && (
                  <div>
                    <Label htmlFor="solarCoverage">Coverage % (e.g., 75, 110, 140)</Label>
                    <Input
                      id="solarCoverage"
                      type="number"
                      value={formData.solarCoveragePercent || ''}
                      onChange={(e) => setFormData({ ...formData, solarCoveragePercent: parseFloat(e.target.value) })}
                      placeholder="100"
                    />
                  </div>
                )}
                {formData.solarSizingStrategy === 'fixed_kw' && (
                  <div>
                    <Label htmlFor="solarFixed">Fixed kW</Label>
                    <Input
                      id="solarFixed"
                      type="number"
                      step="0.1"
                      value={formData.solarFixedKw || ''}
                      onChange={(e) => setFormData({ ...formData, solarFixedKw: parseFloat(e.target.value) })}
                      placeholder="6.6"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Battery Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Battery Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="batteryStrategy">Sizing Strategy</Label>
                  <Select
                    value={formData.batterySizingStrategy}
                    onValueChange={(value) => setFormData({ ...formData, batterySizingStrategy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Battery</SelectItem>
                      <SelectItem value="dynamic_multiplier">Dynamic (Recommended)</SelectItem>
                      <SelectItem value="coverage_hours">Coverage Hours</SelectItem>
                      <SelectItem value="fixed_kwh">Fixed kWh</SelectItem>
                      <SelectItem value="full_overnight">Full Overnight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.batterySizingStrategy === 'coverage_hours' && (
                  <div>
                    <Label htmlFor="batteryCoverage">Coverage Hours</Label>
                    <Input
                      id="batteryCoverage"
                      type="number"
                      value={formData.batteryCoverageHours || ''}
                      onChange={(e) => setFormData({ ...formData, batteryCoverageHours: parseFloat(e.target.value) })}
                      placeholder="7"
                    />
                  </div>
                )}
                {formData.batterySizingStrategy === 'fixed_kwh' && (
                  <div>
                    <Label htmlFor="batteryFixed">Fixed kWh</Label>
                    <Input
                      id="batteryFixed"
                      type="number"
                      step="0.1"
                      value={formData.batteryFixedKwh || ''}
                      onChange={(e) => setFormData({ ...formData, batteryFixedKwh: parseFloat(e.target.value) })}
                      placeholder="13.5"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Pricing</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priceMultiplier">Price Multiplier (e.g., 1.4 = 40% margin)</Label>
                  <Input
                    id="priceMultiplier"
                    type="number"
                    step="0.01"
                    value={formData.priceMultiplier || ''}
                    onChange={(e) => setFormData({ ...formData, priceMultiplier: parseFloat(e.target.value) })}
                    placeholder="1.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Budget: 1.4 (40%), Mid: 1.35 (35%), Premium: 1.3 (30%)
                  </p>
                </div>
                <div>
                  <Label htmlFor="discountPercent">Discount %</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    step="0.1"
                    value={formData.discountPercent || ''}
                    onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* UI Elements */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">UI Elements</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="badge">Badge Text</Label>
                  <Input
                    id="badge"
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="Most Popular"
                  />
                </div>
                <div>
                  <Label htmlFor="highlightColor">Highlight Color (hex)</Label>
                  <Input
                    id="highlightColor"
                    value={formData.highlightColor || ''}
                    onChange={(e) => setFormData({ ...formData, highlightColor: e.target.value })}
                    placeholder="#F97316"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Features</h3>
              
              <div className="flex space-x-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature..."
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                />
                <Button type="button" onClick={addFeature}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {formData.features?.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Included Services</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.includeMonitoring}
                    onCheckedChange={(checked) => setFormData({ ...formData, includeMonitoring: checked })}
                  />
                  <Label>Monitoring</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.includeMaintenance}
                    onCheckedChange={(checked) => setFormData({ ...formData, includeMaintenance: checked })}
                  />
                  <Label>Maintenance</Label>
                </div>
                <div>
                  <Label htmlFor="warranty">Warranty</Label>
                  <Select
                    value={formData.includeWarranty}
                    onValueChange={(value) => setFormData({ ...formData, includeWarranty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="extended">Extended</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
