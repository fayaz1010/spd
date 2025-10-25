'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2,
  Wrench,
  DollarSign,
  Users,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface LaborType {
  id: string;
  name: string;
  code: string;
  category: string;
  baseRate: number;
  perUnitRate: number | null;
  hourlyRate: number | null;
  estimatedHours: number | null;
  skillLevel: string;
  teamSize: number;
}

interface InstallationRequirement {
  id: string;
  laborTypeId: string;
  quantityMultiplier: number;
  isRequired: boolean;
  additionalCost: number;
  notes: string | null;
  InstallationLaborType: LaborType;
}

interface ProductInstallationModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export default function ProductInstallationModal({
  productId,
  productName,
  onClose,
}: ProductInstallationModalProps) {
  const [laborTypes, setLaborTypes] = useState<LaborType[]>([]);
  const [requirements, setRequirements] = useState<InstallationRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewQuantity, setPreviewQuantity] = useState(10);

  const [formData, setFormData] = useState({
    laborTypeId: '',
    quantityMultiplier: '1.0',
    isRequired: true,
    additionalCost: '0',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [laborTypesRes, requirementsRes] = await Promise.all([
        fetch('/api/admin/installation-labor'),
        fetch(`/api/admin/products/${productId}/installation`),
      ]);

      const laborTypesData = await laborTypesRes.json();
      const requirementsData = await requirementsRes.json();

      setLaborTypes(laborTypesData.laborTypes || []);
      setRequirements(requirementsData.installationReqs || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch installation data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      laborTypeId: '',
      quantityMultiplier: '1.0',
      isRequired: true,
      additionalCost: '0',
      notes: '',
    });
    setShowAddForm(true);
  };

  const handleEdit = (req: InstallationRequirement) => {
    setEditingId(req.id);
    setFormData({
      laborTypeId: req.laborTypeId,
      quantityMultiplier: req.quantityMultiplier.toString(),
      isRequired: req.isRequired,
      additionalCost: req.additionalCost.toString(),
      notes: req.notes || '',
    });
    setShowAddForm(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        ...(editingId && { requirementId: editingId }),
        laborTypeId: formData.laborTypeId,
        quantityMultiplier: formData.quantityMultiplier,
        isRequired: formData.isRequired,
        additionalCost: formData.additionalCost,
        notes: formData.notes || null,
      };

      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(`/api/admin/products/${productId}/installation`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save requirement');
      }

      await fetchData();
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(error.message || 'Failed to save requirement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (requirementId: string) => {
    if (!confirm('Remove this installation requirement?')) return;

    try {
      const res = await fetch(
        `/api/admin/products/${productId}/installation?requirementId=${requirementId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        throw new Error('Failed to remove requirement');
      }

      await fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to remove requirement');
    }
  };

  const calculateCost = (req: InstallationRequirement, quantity: number) => {
    const labor = req.InstallationLaborType;
    const units = quantity * req.quantityMultiplier;
    
    let cost = labor.baseRate;
    
    if (labor.perUnitRate) {
      cost += units * labor.perUnitRate;
    }
    
    if (labor.hourlyRate && labor.estimatedHours) {
      cost += labor.hourlyRate * labor.estimatedHours * units;
    }
    
    cost += req.additionalCost;
    
    return cost;
  };

  const getTotalCost = (quantity: number) => {
    return requirements.reduce((total, req) => total + calculateCost(req, quantity), 0);
  };

  const getAvailableLaborTypes = () => {
    const usedIds = requirements.map(r => r.laborTypeId);
    return laborTypes.filter(lt => !usedIds.includes(lt.id) || lt.id === formData.laborTypeId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Manage Installation</h2>
            <p className="text-sm text-gray-600">{productName}</p>
          </div>
          <div className="flex items-center space-x-2">
            {!showAddForm && (
              <Button onClick={handleAdd} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Labor
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
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : (
            <>
              {/* Add/Edit Form */}
              {showAddForm && (
                <div className="bg-gray-50 border rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-4">
                    {editingId ? 'Edit Installation Requirement' : 'Add Installation Requirement'}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Labor Type Selection */}
                    <div>
                      <Label>Labor Type *</Label>
                      <select
                        value={formData.laborTypeId}
                        onChange={(e) => setFormData({ ...formData, laborTypeId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                        disabled={!!editingId}
                      >
                        <option value="">Select labor type...</option>
                        {getAvailableLaborTypes().map(labor => (
                          <option key={labor.id} value={labor.id}>
                            {labor.name} - ${labor.baseRate}
                            {labor.perUnitRate && ` + $${labor.perUnitRate}/unit`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Quantity Multiplier *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.quantityMultiplier}
                          onChange={(e) => setFormData({ ...formData, quantityMultiplier: e.target.value })}
                          placeholder="e.g., 1.0"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Labor units per product unit
                        </p>
                      </div>

                      <div>
                        <Label>Additional Cost ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.additionalCost}
                          onChange={(e) => setFormData({ ...formData, additionalCost: e.target.value })}
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Extra cost per product
                        </p>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.isRequired}
                            onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Required</span>
                        </label>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes..."
                        rows={2}
                      />
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
                        className="bg-orange-600 hover:bg-orange-700"
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

              {/* Requirements List */}
              {requirements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No installation requirements yet. Click "Add Labor" to get started.
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {requirements.map((req) => (
                      <div key={req.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {req.InstallationLaborType.name}
                              </h3>
                              {req.isRequired ? (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                  Required
                                </span>
                              ) : (
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                  Optional
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <div>
                                  <div className="text-gray-500">Base Rate</div>
                                  <div className="font-semibold">
                                    ${req.InstallationLaborType.baseRate}
                                  </div>
                                </div>
                              </div>

                              {req.InstallationLaborType.perUnitRate && (
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <div className="text-gray-500">Per Unit</div>
                                    <div className="font-semibold">
                                      ${req.InstallationLaborType.perUnitRate}
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center space-x-2">
                                <Wrench className="w-4 h-4 text-orange-600" />
                                <div>
                                  <div className="text-gray-500">Multiplier</div>
                                  <div className="font-semibold">{req.quantityMultiplier}x</div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-purple-600" />
                                <div>
                                  <div className="text-gray-500">Team Size</div>
                                  <div className="font-semibold">
                                    {req.InstallationLaborType.teamSize}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {req.notes && (
                              <div className="text-xs text-gray-600 mt-2">
                                <strong>Notes:</strong> {req.notes}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              onClick={() => handleEdit(req)}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(req.id)}
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

                  {/* Cost Preview */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-blue-900">Installation Cost Preview</h3>
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Quantity:</Label>
                        <Input
                          type="number"
                          value={previewQuantity}
                          onChange={(e) => setPreviewQuantity(parseInt(e.target.value) || 1)}
                          className="w-20"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {requirements.map((req) => {
                        const cost = calculateCost(req, previewQuantity);
                        return (
                          <div key={req.id} className="flex justify-between">
                            <span className="text-blue-700">
                              {req.InstallationLaborType.name}
                            </span>
                            <span className="font-semibold text-blue-900">
                              ${cost.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                      <div className="border-t border-blue-300 pt-2 flex justify-between font-bold">
                        <span className="text-blue-900">Total Installation Cost:</span>
                        <span className="text-blue-900 text-lg">
                          ${getTotalCost(previewQuantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
