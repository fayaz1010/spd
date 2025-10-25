'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  ArrowLeft, 
  Save, 
  Loader2,
  Eye,
  EyeOff,
  Star,
  DollarSign,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface Addon {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  specifications: {
    addonCategory: string;
    showAtCheckout: boolean;
    showBeforeCheckout: boolean;
    benefits: string[];
    iconName: string;
  };
  isRecommended: boolean;
  isAvailable: boolean;
  sortOrder: number;
  retailPrice: number;
  installationCost: number;
  totalCost: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  ev_charging: 'EV Charging',
  energy_management: 'Energy Management',
  monitoring: 'Monitoring',
  protection: 'Protection',
  backup: 'Backup Power',
  automation: 'Automation',
  warranty: 'Warranty',
  service: 'Service',
};

export default function ManageAddonsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/addons');
      const data = await response.json();
      
      if (data.success) {
        setAddons(data.addons);
      } else {
        toast.error('Failed to load addons');
      }
    } catch (error) {
      console.error('Error loading addons:', error);
      toast.error('Error loading addons');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowAtCheckout = (addonId: string) => {
    setAddons(prev => prev.map(addon => {
      if (addon.id === addonId) {
        return {
          ...addon,
          specifications: {
            ...addon.specifications,
            showAtCheckout: !addon.specifications.showAtCheckout,
          }
        };
      }
      return addon;
    }));
  };

  const toggleShowBeforeCheckout = (addonId: string) => {
    setAddons(prev => prev.map(addon => {
      if (addon.id === addonId) {
        return {
          ...addon,
          specifications: {
            ...addon.specifications,
            showBeforeCheckout: !addon.specifications.showBeforeCheckout,
          }
        };
      }
      return addon;
    }));
  };

  const toggleRecommended = (addonId: string) => {
    setAddons(prev => prev.map(addon => {
      if (addon.id === addonId) {
        return {
          ...addon,
          isRecommended: !addon.isRecommended,
        };
      }
      return addon;
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/addons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addons }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Addon settings saved successfully!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const filteredAddons = addons.filter(addon => {
    const matchesSearch = addon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         addon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || addon.specifications.addonCategory === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(addons.map(a => a.specifications.addonCategory)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/dashboard/settings')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-8 h-8 text-coral" />
                  Manage Add-ons
                </h1>
                <p className="text-gray-600 mt-1">
                  Control which add-ons appear in calculator checkout
                </p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search addons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Add-ons</div>
              <div className="text-2xl font-bold">{addons.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Show at Checkout</div>
              <div className="text-2xl font-bold text-green-600">
                {addons.filter(a => a.specifications.showAtCheckout).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Recommended</div>
              <div className="text-2xl font-bold text-yellow-600">
                {addons.filter(a => a.isRecommended).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Available</div>
              <div className="text-2xl font-bold text-blue-600">
                {addons.filter(a => a.isAvailable).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Addons List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredAddons.map(addon => (
            <Card key={addon.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{addon.name}</h3>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[addon.specifications.addonCategory] || addon.specifications.addonCategory}
                      </Badge>
                      {addon.isRecommended && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      {!addon.isAvailable && (
                        <Badge variant="destructive">Unavailable</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{addon.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-coral font-semibold">
                        <DollarSign className="w-4 h-4" />
                        ${addon.totalCost.toLocaleString()}
                      </span>
                      <span className="text-gray-500">
                        Product: ${addon.retailPrice} + Install: ${addon.installationCost}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 ml-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={addon.specifications.showAtCheckout}
                        onCheckedChange={() => toggleShowAtCheckout(addon.id)}
                      />
                      <div className="flex items-center gap-1">
                        {addon.specifications.showAtCheckout ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">Show at Checkout</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={addon.specifications.showBeforeCheckout}
                        onCheckedChange={() => toggleShowBeforeCheckout(addon.id)}
                      />
                      <span className="text-sm font-medium">Show Before Checkout</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={addon.isRecommended}
                        onCheckedChange={() => toggleRecommended(addon.id)}
                      />
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">Recommended</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAddons.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No addons found matching your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
