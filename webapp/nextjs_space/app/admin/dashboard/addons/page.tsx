'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as Icons from 'lucide-react';
import toast from 'react-hot-toast';

interface Addon {
  id: string;
  addonId: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  iconName: string;
  benefits: string[];
  sortOrder: number;
  active: boolean;
}

const CATEGORIES = [
  { value: 'efficiency', label: 'Efficiency' },
  { value: 'convenience', label: 'Convenience' },
  { value: 'protection', label: 'Protection' },
  { value: 'energy_management', label: 'Energy Management' },
  { value: 'general', label: 'General' },
];

const ICON_OPTIONS = [
  'Package', 'Zap', 'Battery', 'Shield', 'Settings', 'Sparkles', 
  'Car', 'Smartphone', 'Monitor', 'Sun', 'Home', 'Wifi',
  'Clock', 'Award', 'Star', 'Heart', 'Check', 'AlertCircle'
];

export default function AddonsPage() {
  const router = useRouter();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [formData, setFormData] = useState({
    addonId: '',
    name: '',
    description: '',
    cost: '',
    category: 'general',
    iconName: 'Package',
    benefits: [''],
    sortOrder: '0',
    active: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/addons', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch add-ons');

      const data = await response.json();
      setAddons(data.addons);
    } catch (error) {
      console.error('Error fetching add-ons:', error);
      toast.error('Failed to load add-ons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (addon?: Addon) => {
    if (addon) {
      setEditingAddon(addon);
      setFormData({
        addonId: addon.addonId,
        name: addon.name,
        description: addon.description,
        cost: addon.cost.toString(),
        category: addon.category,
        iconName: addon.iconName,
        benefits: addon.benefits.length > 0 ? addon.benefits : [''],
        sortOrder: addon.sortOrder.toString(),
        active: addon.active,
      });
    } else {
      setEditingAddon(null);
      setFormData({
        addonId: '',
        name: '',
        description: '',
        cost: '',
        category: 'general',
        iconName: 'Package',
        benefits: [''],
        sortOrder: '0',
        active: true,
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingAddon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('admin_token');
      const url = editingAddon ? '/api/admin/addons' : '/api/admin/addons';
      const method = editingAddon ? 'PUT' : 'POST';

      const payload: any = {
        name: formData.name,
        description: formData.description,
        cost: parseFloat(formData.cost),
        category: formData.category,
        iconName: formData.iconName,
        benefits: formData.benefits.filter(b => b.trim() !== ''),
        sortOrder: parseInt(formData.sortOrder),
        active: formData.active,
      };

      if (editingAddon) {
        payload.id = editingAddon.id;
      } else {
        payload.addonId = formData.addonId;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save add-on');
      }

      toast.success(editingAddon ? 'Add-on updated successfully' : 'Add-on created successfully');
      handleCloseDialog();
      fetchAddons();
    } catch (error: any) {
      console.error('Error saving add-on:', error);
      toast.error(error.message || 'Failed to save add-on');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this add-on?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/addons?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete add-on');

      toast.success('Add-on deleted successfully');
      fetchAddons();
    } catch (error) {
      console.error('Error deleting add-on:', error);
      toast.error('Failed to delete add-on');
    }
  };

  const handleToggleActive = async (addon: Addon) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/addons', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: addon.id,
          active: !addon.active,
        }),
      });

      if (!response.ok) throw new Error('Failed to update add-on status');

      toast.success(`Add-on ${!addon.active ? 'activated' : 'deactivated'} successfully`);
      fetchAddons();
    } catch (error) {
      console.error('Error toggling add-on status:', error);
      toast.error('Failed to update add-on status');
    }
  };

  const addBenefitField = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, ''],
    }));
  };

  const removeBenefitField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => i === index ? value : b),
    }));
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const groupedAddons = addons.reduce((acc, addon) => {
    if (!acc[addon.category]) {
      acc[addon.category] = [];
    }
    acc[addon.category].push(addon);
    return acc;
  }, {} as Record<string, Addon[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard">
                <Button variant="ghost" className="mr-4">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Add-ons Management</h1>
                <p className="text-xs text-gray-500">Manage additional products and services</p>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()} className="bg-coral hover:bg-coral-600">
              <Plus className="mr-2 h-4 w-4" />
              Add New Add-on
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading add-ons...</p>
          </div>
        ) : addons.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center py-12">
              <Icons.Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Add-ons Yet</h2>
              <p className="text-gray-600 mb-4">
                Create your first add-on to offer additional products and services to customers.
              </p>
              <Button onClick={() => handleOpenDialog()} className="bg-coral hover:bg-coral-600">
                <Plus className="mr-2 h-4 w-4" />
                Create First Add-on
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedAddons).map(([category, categoryAddons]) => (
              <div key={category} className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-primary mb-4">
                  {getCategoryLabel(category)}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {categoryAddons.map((addon) => {
                    const IconComponent = (Icons as any)[addon.iconName] || Icons.Package;
                    return (
                      <div
                        key={addon.id}
                        className={`border-2 rounded-xl p-4 ${
                          addon.active ? 'border-gray-200' : 'border-gray-300 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="bg-coral rounded-full p-2 mr-3">
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{addon.name}</h3>
                              <p className="text-sm text-gray-500">{addon.addonId}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActive(addon)}
                              title={addon.active ? 'Deactivate' : 'Activate'}
                            >
                              {addon.active ? (
                                <Eye className="h-4 w-4 text-emerald" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDialog(addon)}
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(addon.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{addon.description}</p>
                        <p className="text-2xl font-bold text-coral mb-3">
                          ${addon.cost.toLocaleString()}
                        </p>
                        {addon.benefits.length > 0 && (
                          <div className="space-y-1">
                            {addon.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-start text-sm text-gray-700">
                                <Icons.Check className="h-4 w-4 text-emerald mr-2 flex-shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddon ? 'Edit Add-on' : 'Create New Add-on'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingAddon && (
              <div>
                <Label htmlFor="addonId">Add-on ID *</Label>
                <Input
                  id="addonId"
                  value={formData.addonId}
                  onChange={(e) => setFormData({ ...formData, addonId: e.target.value })}
                  placeholder="e.g., evCharger"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier (camelCase, no spaces)
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., EV Charger Installation"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the add-on"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost">Cost (AUD) *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="2500.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="iconName">Icon</Label>
                <Select
                  value={formData.iconName}
                  onValueChange={(value) => setFormData({ ...formData, iconName: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Benefits</Label>
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      placeholder="Enter a benefit"
                    />
                    {formData.benefits.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBenefitField(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBenefitField}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Benefit
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" className="bg-coral hover:bg-coral-600">
                {editingAddon ? 'Update Add-on' : 'Create Add-on'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
