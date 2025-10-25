'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gift,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  DollarSign,
  Wrench,
  Package,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AddonFormDialog from '@/components/admin/AddonFormDialog';

// Addon categories
const ADDON_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'solar_equipment', label: 'Solar Equipment' },
  { value: 'energy_efficiency', label: 'Energy Efficiency' },
  { value: 'protection', label: 'Protection' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'hvac_services', label: 'HVAC Services' },
  { value: 'plumbing_services', label: 'Plumbing Services' },
];

interface Addon {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  sku: string;
  isAvailable: boolean;
  isRecommended: boolean;
  sortOrder: number;
  tier: string;
  addonCategory: string;
  showAtCheckout: boolean;
  showBeforeCheckout: boolean;
  benefits: string[];
  iconName: string;
  unitCost: number;
  retailPrice: number;
  supplierId: string;
  supplierName: string;
  laborType: string;
  laborHours: number;
  laborRate: number;
  installationCost: number;
}

export default function AddonsManagementPage() {
  const router = useRouter();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [filteredAddons, setFilteredAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load addons
  useEffect(() => {
    loadAddons();
  }, []);

  // Filter addons
  useEffect(() => {
    let filtered = addons;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(a => a.addonCategory === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(term) ||
        a.manufacturer.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term)
      );
    }

    setFilteredAddons(filtered);
  }, [addons, selectedCategory, searchTerm]);

  const loadAddons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/addon-products');
      const data = await response.json();
      
      if (data.success) {
        setAddons(data.addons);
      } else {
        console.error('Failed to load addons:', data.error);
      }
    } catch (error) {
      console.error('Error loading addons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingAddon(null);
    setShowFormDialog(true);
  };

  const handleEdit = (addon: Addon) => {
    setEditingAddon(addon);
    setShowFormDialog(true);
  };

  const handleDelete = async (addon: Addon) => {
    if (!confirm(`Are you sure you want to delete "${addon.name}"?`)) {
      return;
    }

    try {
      setDeleting(addon.id);
      const response = await fetch(`/api/admin/addon-products?id=${addon.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadAddons();
      } else {
        alert('Failed to delete addon: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting addon:', error);
      alert('Failed to delete addon');
    } finally {
      setDeleting(null);
    }
  };

  const handleFormClose = (saved: boolean) => {
    setShowFormDialog(false);
    setEditingAddon(null);
    if (saved) {
      loadAddons();
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

  const getCategoryLabel = (value: string) => {
    return ADDON_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      solar_equipment: 'bg-blue-100 text-blue-800',
      energy_efficiency: 'bg-green-100 text-green-800',
      protection: 'bg-purple-100 text-purple-800',
      home_services: 'bg-orange-100 text-orange-800',
      hvac_services: 'bg-red-100 text-red-800',
      plumbing_services: 'bg-cyan-100 text-cyan-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Gift className="w-8 h-8 text-blue-600" />
              Add-on Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage add-on products and services for solar installations
            </p>
          </div>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add New Add-on
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Add-ons</p>
                <p className="text-2xl font-bold">{addons.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {addons.filter(a => a.isAvailable).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recommended</p>
                <p className="text-2xl font-bold text-purple-600">
                  {addons.filter(a => a.isRecommended).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Set(addons.map(a => a.addonCategory)).size}
                </p>
              </div>
              <Filter className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by name, manufacturer, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ADDON_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add-ons List */}
      {filteredAddons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {searchTerm || selectedCategory
                ? 'No add-ons found matching your filters'
                : 'No add-ons yet. Click "Add New Add-on" to create one.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAddons.map(addon => (
            <Card key={addon.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {addon.name}
                      {addon.isRecommended && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{addon.manufacturer}</p>
                  </div>
                  <Badge className={getCategoryColor(addon.addonCategory)}>
                    {getCategoryLabel(addon.addonCategory)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {addon.description}
                </p>

                {/* Pricing */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Retail Price:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(addon.retailPrice)}
                    </span>
                  </div>
                  {addon.installationCost > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Installation:</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(addon.installationCost)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(addon.retailPrice + addon.installationCost)}
                    </span>
                  </div>
                </div>

                {/* Installation Info */}
                {addon.laborType && (
                  <div className="bg-gray-50 rounded p-2 mb-4 text-xs">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Wrench className="w-3 h-3" />
                      <span>{addon.laborType}: {addon.laborHours}hrs @ {formatCurrency(addon.laborRate)}/hr</span>
                    </div>
                  </div>
                )}

                {/* Visibility Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {addon.showAtCheckout && (
                    <Badge variant="outline" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Checkout
                    </Badge>
                  )}
                  {addon.showBeforeCheckout && (
                    <Badge variant="outline" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Customization
                    </Badge>
                  )}
                  {!addon.isAvailable && (
                    <Badge variant="destructive" className="text-xs">
                      <EyeOff className="w-3 h-3 mr-1" />
                      Unavailable
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(addon)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(addon)}
                    disabled={deleting === addon.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleting === addon.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      {showFormDialog && (
        <AddonFormDialog
          addon={editingAddon}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
