'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackageFormModal } from '@/components/PackageFormModal';
import {
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Loader2,
  Plus,
  DollarSign,
  Zap,
  Battery,
  Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PackageTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  tier: string;
  badge: string | null;
  sortOrder: number;
  active: boolean;
  features: any;
  createdAt: string;
  updatedAt: string;
}

export default function PackageManagementPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<PackageTemplate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/packages');
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

  const handleEdit = (pkg: PackageTemplate) => {
    setEditingPackage(pkg);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (formData: any) => {
    if (!editingPackage) return;

    try {
      const response = await fetch(`/api/admin/packages/${editingPackage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          badge: formData.badge || null,
          sortOrder: parseInt(formData.sortOrder),
          suitability: formData.suitability,
          dailyUsage: formData.dailyUsage,
          heroImageUrl: formData.heroImageUrl || null,
          infographicUrl: formData.infographicUrl || null,
          hookText: formData.hookText || null,
          ctaText: formData.ctaText || 'Get This Package Now',
          featureList: formData.featureList,
        }),
      });

      if (!response.ok) throw new Error('Failed to update package');

      toast.success('Package updated successfully');
      setShowEditModal(false);
      setEditingPackage(null);
      fetchPackages();
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error('Failed to update package');
      throw error;
    }
  };

  const handleToggleActive = async (pkg: PackageTemplate) => {
    try {
      const response = await fetch(`/api/admin/packages/${pkg.id}/toggle`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to toggle package');

      toast.success(`Package ${pkg.active ? 'deactivated' : 'activated'}`);
      fetchPackages();
    } catch (error) {
      console.error('Error toggling package:', error);
      toast.error('Failed to toggle package');
    }
  };

  const handleDelete = async (pkg: PackageTemplate) => {
    if (!confirm(`Are you sure you want to delete "${pkg.displayName}"?`)) return;

    try {
      const response = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete package');

      toast.success('Package deleted');
      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    }
  };

  const handleReorder = async (pkg: PackageTemplate, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? pkg.sortOrder - 1 : pkg.sortOrder + 1;
    
    try {
      const response = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: newOrder }),
      });

      if (!response.ok) throw new Error('Failed to reorder');

      fetchPackages();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder package');
    }
  };

  const handleRecalculateAll = async () => {
    if (!confirm('Recalculate pricing for all packages? This will update prices based on current product costs and rebates.')) return;

    try {
      setRecalculating(true);
      const response = await fetch('/api/admin/packages/recalculate', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to recalculate');

      const data = await response.json();
      toast.success(`Recalculated ${data.updated} packages`);
      fetchPackages();
    } catch (error) {
      console.error('Error recalculating:', error);
      toast.error('Failed to recalculate packages');
    } finally {
      setRecalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
            onClick={() => router.push('/admin/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Package className="w-8 h-8 mr-3 text-blue-600" />
              Package Builder
            </h1>
            <p className="text-gray-600 mt-2">
              Manage calculator packages and homepage promotional packages
            </p>
          </div>
        </div>

        {/* Two Cards Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Calculator Packages Card */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center text-blue-900">
                <Calculator className="w-5 h-5 mr-2" />
                Calculator Packages
              </CardTitle>
              <p className="text-sm text-blue-700 mt-1">
                3 packages shown in the public solar calculator
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Purpose:</span>
                  <span className="font-medium">Solar Calculator Options</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Packages:</span>
                  <span className="font-medium">Budget, Mid, Premium</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Settings:</span>
                  <span className="font-medium">Coverage %, Margin %</span>
                </div>
              </div>
              <Button
                onClick={() => router.push('/admin/calculator-packages')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Manage Calculator Packages →
              </Button>
            </CardContent>
          </Card>

          {/* Homepage Packages Card */}
          <Card className="border-2 border-purple-200">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center text-purple-900">
                <Package className="w-5 h-5 mr-2" />
                Homepage Packages
              </CardTitle>
              <p className="text-sm text-purple-700 mt-1">
                Promotional packages displayed on website homepage
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Purpose:</span>
                  <span className="font-medium">Website Promotions</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current:</span>
                  <span className="font-medium">{packages.length} packages</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Features:</span>
                  <span className="font-medium">Full product details</span>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push('/admin/quote-tester')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create from Quote Tester
                </Button>
                <Button
                  onClick={handleRecalculateAll}
                  disabled={recalculating}
                  variant="outline"
                  className="w-full"
                >
                  {recalculating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recalculating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Recalculate Pricing
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Homepage Packages List */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Homepage Packages</h2>
        </div>

        {/* Packages List */}
        <div className="space-y-4">
          {packages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Packages Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create packages from the Quote Tester
                </p>
                <Button onClick={() => router.push('/admin/quote-tester')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Go to Quote Tester
                </Button>
              </CardContent>
            </Card>
          ) : (
            packages.map((pkg) => {
              const features = pkg.features || {};
              
              return (
                <Card key={pkg.id} className={!pkg.active ? 'opacity-60' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {pkg.displayName}
                          </h3>
                          {pkg.badge && (
                            <span className="bg-coral text-white px-3 py-1 rounded-full text-sm font-semibold">
                              {pkg.badge}
                            </span>
                          )}
                          {!pkg.active && (
                            <span className="bg-gray-400 text-white px-3 py-1 rounded-full text-sm">
                              Inactive
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            Order: {pkg.sortOrder}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-4">{pkg.description}</p>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-sm">
                              <strong>{features.systemSizeKw}kW</strong> ({features.panelCount} panels)
                            </span>
                          </div>

                          {features.batterySizeKwh > 0 && (
                            <div className="flex items-center space-x-2">
                              <Battery className="w-4 h-4 text-green-600" />
                              <span className="text-sm">
                                <strong>{features.batterySizeKwh}kWh</strong> battery
                              </span>
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-coral" />
                            <span className="text-sm">
                              <strong>{formatCurrency(features.finalPrice)}</strong>
                            </span>
                          </div>

                          <div className="text-sm text-gray-600">
                            ${features.costPerDay}/day • {features.suitability}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Tier: {pkg.tier}</span>
                          <span>•</span>
                          <span>Annual Savings: {formatCurrency(features.annualSavings)}</span>
                          <span>•</span>
                          <span>Payback: {features.paybackYears} years</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(pkg, 'up')}
                          disabled={pkg.sortOrder === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(pkg, 'down')}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(pkg)}
                        >
                          {pkg.active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(pkg)}
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
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Edit Modal - Comprehensive Form */}
        <PackageFormModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingPackage(null);
          }}
          onSave={handleSaveEdit}
          initialData={editingPackage ? {
            name: editingPackage.name,
            displayName: editingPackage.displayName,
            description: editingPackage.description,
            suitability: editingPackage.features?.suitability || '',
            dailyUsage: editingPackage.features?.dailyUsage || '',
            badge: editingPackage.badge || '',
            sortOrder: editingPackage.sortOrder.toString(),
            heroImageUrl: editingPackage.features?.heroImageUrl || '',
            infographicUrl: editingPackage.features?.infographicUrl || '',
            hookText: editingPackage.features?.hookText || '',
            ctaText: editingPackage.features?.ctaText || 'Get This Package Now',
            featureList: editingPackage.features?.featureList || [],
          } : undefined}
          title="Edit Package"
          description="Update package information, marketing content, and features"
        />
      </div>
    </div>
  );
}
