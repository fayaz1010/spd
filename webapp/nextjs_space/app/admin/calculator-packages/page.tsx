'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calculator,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CalculatorPackage {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  solarCoverage: number;
  batteryStrategy: string;
  profitMargin: number;
  badge: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function CalculatorPackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<CalculatorPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<CalculatorPackage | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/calculator-packages');
      const data = await response.json();
      if (data.success) {
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (pkg: Partial<CalculatorPackage>) => {
    try {
      const url = pkg.id 
        ? `/api/admin/calculator-packages/${pkg.id}`
        : '/api/admin/calculator-packages';
      
      const response = await fetch(url, {
        method: pkg.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkg),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success(`Package ${pkg.id ? 'updated' : 'created'}`);
      setShowModal(false);
      setEditingPackage(null);
      fetchPackages();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save package');
    }
  };

  const handleToggleActive = async (pkg: CalculatorPackage) => {
    try {
      const response = await fetch(`/api/admin/calculator-packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pkg, isActive: !pkg.isActive }),
      });

      if (!response.ok) throw new Error('Failed to toggle');

      toast.success(`Package ${pkg.isActive ? 'deactivated' : 'activated'}`);
      fetchPackages();
    } catch (error) {
      console.error('Error toggling:', error);
      toast.error('Failed to toggle package');
    }
  };

  const handleDelete = async (pkg: CalculatorPackage) => {
    if (!confirm(`Delete "${pkg.displayName}"?`)) return;

    try {
      const response = await fetch(`/api/admin/calculator-packages/${pkg.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Package deleted');
      fetchPackages();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete package');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/admin/dashboard/packages')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Package Builder
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Calculator className="w-8 h-8 mr-3 text-blue-600" />
                Calculator Packages
              </h1>
              <p className="text-gray-600 mt-2">
                Configure the 3 packages shown in the public solar calculator
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingPackage(null);
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </div>
        </div>

        {/* Packages Grid */}
        {packages.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Calculator Packages Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create packages for the solar calculator (Budget, Mid, Premium)
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Package
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={`${!pkg.isActive ? 'opacity-60' : ''} hover:shadow-lg transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pkg.displayName}</CardTitle>
                    {pkg.badge && (
                      <span className="bg-coral text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Solar Coverage</span>
                      <span className="font-semibold text-blue-600">{pkg.solarCoverage}%</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Battery Strategy</span>
                      <span className="font-semibold capitalize text-sm">{pkg.batteryStrategy.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Profit Margin</span>
                      <span className="font-semibold text-green-600">{pkg.profitMargin}%</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(pkg)}
                      className="flex-1"
                    >
                      {pkg.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingPackage(pkg);
                        setShowModal(true);
                      }}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(pkg)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 About Calculator Packages</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• These packages appear in the public solar calculator at /calculator-v2</li>
            <li>• <strong>Solar Coverage</strong>: % of daily usage covered by solar (75%, 110%, 140%)</li>
            <li>• <strong>Battery Strategy</strong>: How battery size is determined</li>
            <li>• <strong>Profit Margin</strong>: Markup % applied to costs (40%, 35%, 30%)</li>
            <li>• Typically 3 packages: Budget, Mid, Premium</li>
          </ul>
        </div>

        {/* Modal */}
        {showModal && (
          <PackageModal
            package={editingPackage}
            onClose={() => {
              setShowModal(false);
              setEditingPackage(null);
            }}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}

// Modal Component
function PackageModal({
  package: pkg,
  onClose,
  onSave,
}: {
  package: CalculatorPackage | null;
  onClose: () => void;
  onSave: (pkg: Partial<CalculatorPackage>) => void;
}) {
  const [formData, setFormData] = useState({
    name: pkg?.name || '',
    displayName: pkg?.displayName || '',
    description: pkg?.description || '',
    solarCoverage: pkg?.solarCoverage || 100,
    batteryStrategy: pkg?.batteryStrategy || 'dynamic',
    profitMargin: pkg?.profitMargin || 35,
    badge: pkg?.badge || '',
    sortOrder: pkg?.sortOrder || 0,
    isActive: pkg?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(pkg?.id ? { ...formData, id: pkg.id } : formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {pkg ? 'Edit Package' : 'Add Package'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name (ID) *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase() })}
                placeholder="budget"
                required
              />
            </div>
            <div>
              <Label>Display Name *</Label>
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Budget Package"
                required
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Essential solar coverage..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Solar Coverage % *</Label>
              <Input
                type="number"
                value={formData.solarCoverage}
                onChange={(e) => setFormData({ ...formData, solarCoverage: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label>Battery Strategy *</Label>
              <select
                value={formData.batteryStrategy}
                onChange={(e) => setFormData({ ...formData, batteryStrategy: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="dynamic">Dynamic</option>
                <option value="full_backup">Full Backup</option>
                <option value="autonomy">Autonomy</option>
              </select>
            </div>
            <div>
              <Label>Profit Margin % *</Label>
              <Input
                type="number"
                value={formData.profitMargin}
                onChange={(e) => setFormData({ ...formData, profitMargin: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Badge</Label>
              <Input
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="Best Value"
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <Label>Active</Label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
