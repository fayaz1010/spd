'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2,
  DollarSign,
  Package,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Supplier {
  id: string;
  name: string;
  email: string;
}

interface SupplierProduct {
  id: string;
  supplierId: string;
  unitCost: number;
  retailPrice: number | null;
  markupPercent: number | null;
  sku: string | null;
  leadTime: number | null;
  minOrderQty: number | null;
  isActive: boolean;
  supplier: Supplier;
}

interface ProductSuppliersModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export default function ProductSuppliersModal({
  productId,
  productName,
  onClose,
}: ProductSuppliersModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    supplierId: '',
    unitCost: '',
    retailPrice: '',
    markupPercent: '',
    sku: '',
    leadTime: '',
    minOrderQty: '',
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, productSuppliersRes] = await Promise.all([
        fetch('/api/admin/suppliers'),
        fetch(`/api/admin/products/${productId}/suppliers`),
      ]);

      const suppliersData = await suppliersRes.json();
      const productSuppliersData = await productSuppliersRes.json();

      setSuppliers(suppliersData.suppliers || []);
      setSupplierProducts(productSuppliersData.supplierProducts || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      supplierId: '',
      unitCost: '',
      retailPrice: '',
      markupPercent: '',
      sku: '',
      leadTime: '',
      minOrderQty: '',
      isActive: true,
    });
    setShowAddForm(true);
  };

  const handleEdit = (sp: SupplierProduct) => {
    setEditingId(sp.id);
    setFormData({
      supplierId: sp.supplierId,
      unitCost: sp.unitCost.toString(),
      retailPrice: sp.retailPrice?.toString() || '',
      markupPercent: sp.markupPercent?.toString() || '',
      sku: sp.sku || '',
      leadTime: sp.leadTime?.toString() || '',
      minOrderQty: sp.minOrderQty?.toString() || '',
      isActive: sp.isActive,
    });
    setShowAddForm(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        ...(editingId && { supplierProductId: editingId }),
        supplierId: formData.supplierId,
        unitCost: formData.unitCost,
        retailPrice: formData.retailPrice || null,
        markupPercent: formData.markupPercent || null,
        sku: formData.sku || null,
        leadTime: formData.leadTime || null,
        minOrderQty: formData.minOrderQty || null,
        isActive: formData.isActive,
      };

      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(`/api/admin/products/${productId}/suppliers`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save supplier link');
      }

      await fetchData();
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(error.message || 'Failed to save supplier link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplierProductId: string) => {
    if (!confirm('Remove this supplier link?')) return;

    try {
      const res = await fetch(
        `/api/admin/products/${productId}/suppliers?supplierProductId=${supplierProductId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        throw new Error('Failed to remove supplier link');
      }

      await fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to remove supplier link');
    }
  };

  const calculateRetailFromMarkup = () => {
    if (formData.unitCost && formData.markupPercent) {
      const cost = parseFloat(formData.unitCost);
      const markup = parseFloat(formData.markupPercent);
      const retail = cost * (1 + markup / 100);
      setFormData({ ...formData, retailPrice: retail.toFixed(2) });
    }
  };

  const calculateMarkupFromRetail = () => {
    if (formData.unitCost && formData.retailPrice) {
      const cost = parseFloat(formData.unitCost);
      const retail = parseFloat(formData.retailPrice);
      const markup = ((retail - cost) / cost) * 100;
      setFormData({ ...formData, markupPercent: markup.toFixed(2) });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Manage Suppliers</h2>
            <p className="text-sm text-gray-600">{productName}</p>
          </div>
          <div className="flex items-center space-x-2">
            {!showAddForm && (
              <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            )}
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Add/Edit Form */}
              {showAddForm && (
                <div className="bg-gray-50 border rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-4">
                    {editingId ? 'Edit Supplier Link' : 'Add Supplier Link'}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Supplier Selection */}
                    <div>
                      <Label>Supplier *</Label>
                      <select
                        value={formData.supplierId}
                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={!!editingId}
                      >
                        <option value="">Select a supplier...</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Unit Cost ($) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.unitCost}
                          onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                          placeholder="e.g., 1000"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Cost from supplier</p>
                      </div>

                      <div>
                        <Label>Markup (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.markupPercent}
                          onChange={(e) => setFormData({ ...formData, markupPercent: e.target.value })}
                          onBlur={calculateRetailFromMarkup}
                          placeholder="e.g., 30"
                        />
                        <p className="text-xs text-gray-500 mt-1">Profit margin</p>
                      </div>

                      <div>
                        <Label>Retail Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.retailPrice}
                          onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                          onBlur={calculateMarkupFromRetail}
                          placeholder="e.g., 1300"
                        />
                        <p className="text-xs text-gray-500 mt-1">Price to customer</p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Supplier SKU</Label>
                        <Input
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          placeholder="Supplier's SKU"
                        />
                      </div>

                      <div>
                        <Label>Lead Time (days)</Label>
                        <Input
                          type="number"
                          value={formData.leadTime}
                          onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                          placeholder="e.g., 7"
                        />
                      </div>

                      <div>
                        <Label>Min Order Qty</Label>
                        <Input
                          type="number"
                          value={formData.minOrderQty}
                          onChange={(e) => setFormData({ ...formData, minOrderQty: e.target.value })}
                          placeholder="e.g., 1"
                        />
                      </div>
                    </div>

                    {/* Active Checkbox */}
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                      <Button
                        onClick={() => setShowAddForm(false)}
                        variant="outline"
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Supplier Products List */}
              {supplierProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No suppliers linked yet. Click "Add Supplier" to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {supplierProducts.map((sp) => (
                    <div key={sp.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="font-semibold text-lg">{sp.supplier.name}</h3>
                            {!sp.isActive && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Inactive
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-red-600" />
                              <div>
                                <div className="text-gray-500">Unit Cost</div>
                                <div className="font-semibold">${sp.unitCost.toFixed(2)}</div>
                              </div>
                            </div>

                            {sp.retailPrice && (
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <div>
                                  <div className="text-gray-500">Retail Price</div>
                                  <div className="font-semibold">${sp.retailPrice.toFixed(2)}</div>
                                </div>
                              </div>
                            )}

                            {sp.markupPercent && (
                              <div className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                <div>
                                  <div className="text-gray-500">Markup</div>
                                  <div className="font-semibold">{sp.markupPercent.toFixed(1)}%</div>
                                </div>
                              </div>
                            )}

                            {sp.leadTime && (
                              <div className="flex items-center space-x-2">
                                <Package className="w-4 h-4 text-purple-600" />
                                <div>
                                  <div className="text-gray-500">Lead Time</div>
                                  <div className="font-semibold">{sp.leadTime} days</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {sp.sku && (
                            <div className="mt-2 text-xs text-gray-500">
                              Supplier SKU: <span className="font-mono">{sp.sku}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            onClick={() => handleEdit(sp)}
                            variant="ghost"
                            size="sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(sp.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
