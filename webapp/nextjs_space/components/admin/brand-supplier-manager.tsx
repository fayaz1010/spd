

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Star,
  Package,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface BrandSupplierManagerProps {
  brandId: string;
  brandCategory: 'PANEL' | 'BATTERY' | 'INVERTER';
}

export function BrandSupplierManager({ brandId, brandCategory }: BrandSupplierManagerProps) {
  const [mappings, setMappings] = useState<any[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    supplierProductId: '',
    supplierCost: 0,
    ourCommission: 0,
    commissionType: 'fixed',
    isPrimary: false,
    leadTimeDays: null,
    minOrderQty: null,
    isActive: true,
    notes: '',
  });

  useEffect(() => {
    fetchMappings();
    fetchSupplierProducts();
  }, [brandId, brandCategory]);

  const fetchMappings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `/api/admin/brand-suppliers?brandId=${brandId}&category=${brandCategory}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setMappings(data);
    } catch (error) {
      console.error('Error fetching mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierProducts = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/supplier-products', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setSupplierProducts(data);
    } catch (error) {
      console.error('Error fetching supplier products:', error);
    }
  };

  const handleAdd = () => {
    setFormData({
      supplierProductId: '',
      supplierCost: 0,
      ourCommission: 0,
      commissionType: 'fixed',
      isPrimary: false,
      leadTimeDays: null,
      minOrderQty: null,
      isActive: true,
      notes: '',
    });
    setEditingId('new');
    setShowForm(true);
  };

  const handleEdit = (mapping: any) => {
    setFormData({
      supplierProductId: mapping.supplierProductId,
      supplierCost: mapping.supplierCost,
      ourCommission: mapping.ourCommission,
      commissionType: mapping.commissionType,
      isPrimary: mapping.isPrimary,
      leadTimeDays: mapping.leadTimeDays,
      minOrderQty: mapping.minOrderQty,
      isActive: mapping.isActive,
      notes: mapping.notes || '',
    });
    setEditingId(mapping.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const payload = {
        ...formData,
        brandId,
        brandCategory,
      };

      const isNew = editingId === 'new';
      const url = isNew
        ? '/api/admin/brand-suppliers'
        : `/api/admin/brand-suppliers`;

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(isNew ? payload : { id: editingId, ...payload }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        fetchMappings();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving mapping:', error);
      alert('Failed to save mapping');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier mapping?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/brand-suppliers?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchMappings();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting mapping:', error);
      alert('Failed to delete mapping');
    }
  };

  const calculateRetailPrice = () => {
    const cost = formData.supplierCost || 0;
    const commission = formData.ourCommission || 0;
    if (formData.commissionType === 'percentage') {
      return cost * (1 + commission / 100);
    }
    return cost + commission;
  };

  if (loading) {
    return <div className="text-center py-4">Loading supplier mappings...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-primary">Supplier Mappings</h3>
        <Button onClick={handleAdd} size="sm" className="bg-emerald hover:bg-emerald-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Mappings List */}
      {mappings.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No supplier mappings configured</p>
          <p className="text-sm text-gray-500 mt-1">
            Add suppliers to track inventory and pricing
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mappings.map((mapping) => (
            <div
              key={mapping.id}
              className={`border rounded-lg p-4 ${
                mapping.isPrimary ? 'border-gold bg-gold-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-primary">
                      {mapping.supplierProduct?.supplier?.name || 'Unknown Supplier'}
                    </h4>
                    {mapping.isPrimary && (
                      <span className="bg-gold text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Primary
                      </span>
                    )}
                    {!mapping.isActive && (
                      <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {mapping.supplierProduct?.productName || 'Product'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(mapping)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(mapping.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <DollarSign className="h-3 w-3 mr-1" />
                    <span className="text-xs">Cost</span>
                  </div>
                  <p className="font-semibold text-primary">
                    ${mapping.supplierCost?.toLocaleString()}
                  </p>
                </div>

                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span className="text-xs">Commission</span>
                  </div>
                  <p className="font-semibold text-primary">
                    {mapping.commissionType === 'percentage'
                      ? `${mapping.ourCommission}%`
                      : `$${mapping.ourCommission?.toLocaleString()}`}
                  </p>
                </div>

                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Clock className="h-3 w-3 mr-1" />
                    <span className="text-xs">Lead Time</span>
                  </div>
                  <p className="font-semibold text-primary">
                    {mapping.leadTimeDays || mapping.supplierProduct?.leadTime || '—'} days
                  </p>
                </div>

                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Package className="h-3 w-3 mr-1" />
                    <span className="text-xs">Stock</span>
                  </div>
                  <p className={`font-semibold ${
                    mapping.supplierProduct?.stockStatus === 'in_stock' ? 'text-emerald' :
                    mapping.supplierProduct?.stockStatus === 'low_stock' ? 'text-orange-500' :
                    'text-red-500'
                  }`}>
                    {mapping.supplierProduct?.stockStatus?.replace('_', ' ') || 'Unknown'}
                  </p>
                </div>
              </div>

              {mapping.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">{mapping.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-primary">
                {editingId === 'new' ? 'Add Supplier Mapping' : 'Edit Supplier Mapping'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Supplier Product *</Label>
                <Select
                  value={formData.supplierProductId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplierProductId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier product" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.supplier?.name} - {product.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Supplier Cost ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.supplierCost}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierCost: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div>
                  <Label>Commission Type</Label>
                  <Select
                    value={formData.commissionType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, commissionType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>
                  Our Commission ({formData.commissionType === 'percentage' ? '%' : '$'})
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.ourCommission}
                  onChange={(e) =>
                    setFormData({ ...formData, ourCommission: parseFloat(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-gray-600 mt-1">
                  Retail Price: ${calculateRetailPrice().toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lead Time (days)</Label>
                  <Input
                    type="number"
                    value={formData.leadTimeDays || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        leadTimeDays: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Leave empty to use supplier default"
                  />
                </div>

                <div>
                  <Label>Min Order Qty</Label>
                  <Input
                    type="number"
                    value={formData.minOrderQty || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrderQty: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Primary Supplier</Label>
                  <Switch
                    checked={formData.isPrimary}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPrimary: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 min-h-[80px]"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any additional notes about this supplier relationship..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary-600">
                  <Save className="h-4 w-4 mr-2" />
                  Save Mapping
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

