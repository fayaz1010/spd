
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Plus,
  Eye,
  EyeOff,
  Truck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BrandSupplierManager } from './brand-supplier-manager';

interface BrandTableProps {
  brands: any[];
  type: 'panel' | 'battery' | 'inverter';
  onRefresh: () => void;
}

export function BrandTable({ brands, type, onRefresh }: BrandTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [expandedSuppliers, setExpandedSuppliers] = useState<string | null>(null);

  const getEmptyForm = () => {
    if (type === 'panel') {
      return {
        name: '',
        manufacturer: '',
        wattage: 440,
        pricePerKw: 1000,
        efficiency: 21,
        warrantyYears: 25,
        tier: 'premium',
        features: [],
        bestFor: [],
        isAvailable: true,
        isRecommended: false,
        sortOrder: 0,
        description: '',
      };
    } else if (type === 'battery') {
      return {
        name: '',
        manufacturer: '',
        capacityKwh: 10,
        usableKwh: 9,
        price: 10000,
        warrantyYears: 10,
        cycleLife: 6000,
        tier: 'premium',
        features: [],
        bestFor: [],
        isAvailable: true,
        isRecommended: false,
        sortOrder: 0,
        description: '',
      };
    } else {
      return {
        name: '',
        manufacturer: '',
        capacityKw: 10,
        pricePerKw: 150,
        warrantyYears: 10,
        hasOptimizers: false,
        optimizerCost: 0,
        tier: 'premium',
        features: [],
        bestFor: [],
        isAvailable: true,
        isRecommended: false,
        sortOrder: 0,
        description: '',
      };
    }
  };

  const handleAdd = () => {
    setFormData(getEmptyForm());
    setEditingId('new');
    setShowForm(true);
  };

  const handleEdit = (brand: any) => {
    setFormData({
      ...brand,
      features: typeof brand.features === 'string' ? JSON.parse(brand.features) : brand.features,
      bestFor: typeof brand.bestFor === 'string' ? JSON.parse(brand.bestFor) : brand.bestFor,
    });
    setEditingId(brand.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const url = `/api/admin/${type}-brands`;
      const method = editingId === 'new' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`${type} brand ${editingId === 'new' ? 'added' : 'updated'} successfully!`);
        setEditingId(null);
        setShowForm(false);
        onRefresh();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving brand:', error);
      alert('Failed to save brand');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/${type}-brands?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Brand deleted successfully!');
        onRefresh();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('Failed to delete brand');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({});
  };

  const handleArrayChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value.split(',').map(v => v.trim()).filter(Boolean),
    });
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">
          {type.charAt(0).toUpperCase() + type.slice(1)} Brands ({brands.length})
        </h3>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-primary-200">
          <h4 className="font-bold text-gray-900 mb-4">
            {editingId === 'new' ? 'Add New Brand' : 'Edit Brand'}
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Brand Name</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., LG NeON R 440W"
              />
            </div>

            <div>
              <Label>Manufacturer</Label>
              <Input
                value={formData.manufacturer || ''}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g., LG"
              />
            </div>

            {type === 'panel' && (
              <>
                <div>
                  <Label>Wattage (W)</Label>
                  <Input
                    type="number"
                    value={formData.wattage || ''}
                    onChange={(e) => setFormData({ ...formData, wattage: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Price per kW ($)</Label>
                  <Input
                    type="number"
                    value={formData.pricePerKw || ''}
                    onChange={(e) => setFormData({ ...formData, pricePerKw: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Efficiency (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.efficiency || ''}
                    onChange={(e) => setFormData({ ...formData, efficiency: parseFloat(e.target.value) })}
                  />
                </div>
              </>
            )}

            {type === 'battery' && (
              <>
                <div>
                  <Label>Capacity (kWh)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.capacityKwh || ''}
                    onChange={(e) => setFormData({ ...formData, capacityKwh: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Usable Capacity (kWh)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.usableKwh || ''}
                    onChange={(e) => setFormData({ ...formData, usableKwh: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Cycle Life</Label>
                  <Input
                    type="number"
                    value={formData.cycleLife || ''}
                    onChange={(e) => setFormData({ ...formData, cycleLife: parseInt(e.target.value) })}
                  />
                </div>
              </>
            )}

            {type === 'inverter' && (
              <>
                <div>
                  <Label>Capacity (kW)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.capacityKw || ''}
                    onChange={(e) => setFormData({ ...formData, capacityKw: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Price per kW ($)</Label>
                  <Input
                    type="number"
                    value={formData.pricePerKw || ''}
                    onChange={(e) => setFormData({ ...formData, pricePerKw: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={formData.hasOptimizers || false}
                    onChange={(e) => setFormData({ ...formData, hasOptimizers: e.target.checked })}
                    className="rounded"
                  />
                  <Label>Has Optimizers</Label>
                </div>
                {formData.hasOptimizers && (
                  <div>
                    <Label>Optimizer Cost ($)</Label>
                    <Input
                      type="number"
                      value={formData.optimizerCost || ''}
                      onChange={(e) => setFormData({ ...formData, optimizerCost: parseFloat(e.target.value) })}
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <Label>Warranty (Years)</Label>
              <Input
                type="number"
                value={formData.warrantyYears || ''}
                onChange={(e) => setFormData({ ...formData, warrantyYears: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label>Tier</Label>
              <Select
                value={formData.tier || 'premium'}
                onValueChange={(value) => setFormData({ ...formData, tier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="ultimate">Ultimate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sortOrder || 0}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center gap-4 pt-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isAvailable || false}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded"
                />
                <Label>Available</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isRecommended || false}
                  onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                  className="rounded"
                />
                <Label>Recommended</Label>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Features (comma-separated)</Label>
              <Input
                value={Array.isArray(formData.features) ? formData.features.join(', ') : ''}
                onChange={(e) => handleArrayChange('features', e.target.value)}
                placeholder="High efficiency, Better in shade, Premium aesthetics"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Best For (comma-separated)</Label>
              <Input
                value={Array.isArray(formData.bestFor) ? formData.bestFor.join(', ') : ''}
                onChange={(e) => handleArrayChange('bestFor', e.target.value)}
                placeholder="partial_shading, limited_space, quality_focused"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the brand/model"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Save
            </Button>
            <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Brands Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tier</th>
                {type === 'panel' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price/kW</th>}
                {type === 'battery' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Capacity</th>}
                {type === 'inverter' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price/kW</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Warranty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {brands.map((brand) => (
                <>
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{brand.name}</p>
                      <p className="text-sm text-gray-500">{brand.manufacturer}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                        brand.tier === 'budget' ? 'bg-gray-100 text-gray-700' :
                        brand.tier === 'premium' ? 'bg-gold-100 text-gold-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {brand.tier}
                      </span>
                    </td>
                    {type === 'panel' && (
                      <td className="px-4 py-4 text-gray-900">${brand.pricePerKw}/kW</td>
                    )}
                    {type === 'battery' && (
                      <td className="px-4 py-4 text-gray-900">{brand.capacityKwh} kWh</td>
                    )}
                    {type === 'inverter' && (
                      <td className="px-4 py-4 text-gray-900">${brand.pricePerKw}/kW</td>
                    )}
                    <td className="px-4 py-4 text-gray-900">{brand.warrantyYears}yr</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {brand.isAvailable ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <Eye className="h-3 w-3" /> Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <EyeOff className="h-3 w-3" /> Hidden
                          </span>
                        )}
                        {brand.isRecommended && (
                          <span className="text-xs text-gold-600 font-semibold">★ Recommended</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(brand)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedSuppliers(expandedSuppliers === brand.id ? null : brand.id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Truck className="h-3 w-3" />
                          {expandedSuppliers === brand.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(brand.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedSuppliers === brand.id && (
                    <tr key={`${brand.id}-suppliers`}>
                      <td colSpan={7} className="px-4 py-6 bg-gray-50">
                        <BrandSupplierManager
                          brandId={brand.id}
                          brandCategory={type.toUpperCase() as 'PANEL' | 'BATTERY' | 'INVERTER'}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {brands.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No brands found. Click "Add Brand" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
