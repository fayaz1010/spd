'use client';

import { useState, useEffect } from 'react';
import { X, Gift, Star, Check, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Addon {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  addonCategory: string;
  benefits: string[];
  iconName: string;
  isRecommended: boolean;
  retailPrice: number;
  installationCost: number;
  totalCost: number;
  laborType: string | null;
  laborHours: number;
}

interface AddonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (selectedAddonIds: string[], totalCost: number) => void;
  systemDetails: {
    solarKw: number;
    batteryKwh: number;
    totalInvestment: number;
  };
  preSelectedAddonIds?: string[]; // Addons selected in customization page
}

const CATEGORY_LABELS: Record<string, string> = {
  solar_equipment: 'Solar Equipment',
  energy_efficiency: 'Energy Efficiency',
  protection: 'Protection',
  home_services: 'Home Services',
  hvac_services: 'HVAC Services',
  plumbing_services: 'Plumbing Services',
};

export default function AddonDrawer({
  isOpen,
  onClose,
  onComplete,
  systemDetails,
  preSelectedAddonIds = [],
}: AddonDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [categories, setCategories] = useState<Record<string, Addon[]>>({});
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set(preSelectedAddonIds));
  const [activeCategory, setActiveCategory] = useState('solar_equipment');

  useEffect(() => {
    if (isOpen) {
      loadAddons();
      // Pre-select addons from customization page
      if (preSelectedAddonIds.length > 0) {
        setSelectedAddonIds(new Set(preSelectedAddonIds));
      }
    }
  }, [isOpen, preSelectedAddonIds]);

  const loadAddons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/addons?showAtCheckout=true');
      const data = await response.json();

      if (data.success) {
        setAddons(data.addons);
        setCategories(data.categories);
        
        // Set first available category as active
        const firstCategory = Object.keys(data.categories)[0];
        if (firstCategory) {
          setActiveCategory(firstCategory);
        }
      }
    } catch (error) {
      console.error('Error loading addons:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(addonId)) {
        newSet.delete(addonId);
      } else {
        newSet.add(addonId);
      }
      return newSet;
    });
  };

  const calculateTotal = () => {
    return addons
      .filter(addon => selectedAddonIds.has(addon.id))
      .reduce((sum, addon) => sum + addon.totalCost, 0);
  };

  const handleComplete = () => {
    const selectedIds = Array.from(selectedAddonIds);
    const totalCost = calculateTotal();
    onComplete(selectedIds, totalCost);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const recommendedAddons = addons.filter(a => a.isRecommended).slice(0, 3);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-white w-full sm:max-w-5xl sm:rounded-t-2xl rounded-t-2xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-coral/10 to-orange-50 border-b-2 border-coral/20 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-coral to-orange-600 rounded-full p-2 shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Enhance Your Solar Investment
              </h2>
              <p className="text-gray-600 text-sm">
                Popular add-ons that complement your {systemDetails.solarKw}kW system
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Already Included Addons */}
              {preSelectedAddonIds.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    Already Included in Your Quote
                  </h3>
                  <p className="text-sm text-green-600 mb-3">
                    {preSelectedAddonIds.length} add-on{preSelectedAddonIds.length !== 1 ? 's' : ''} selected during customization
                  </p>
                  <div className="text-xs text-gray-600">
                    You can add more items below or continue to finalize your quote.
                  </div>
                </div>
              )}

              {/* Recommended Section */}
              {recommendedAddons.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    Recommended for You
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {recommendedAddons.map(addon => (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={`text-left p-3 rounded-lg border-2 transition-all ${
                          selectedAddonIds.has(addon.id)
                            ? 'border-coral bg-coral/10'
                            : 'border-gray-200 bg-white hover:border-coral/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-sm">{addon.name}</div>
                          {selectedAddonIds.has(addon.id) && (
                            <Check className="w-5 h-5 text-coral flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-lg font-bold text-coral">
                          {formatCurrency(addon.totalCost)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Tabs */}
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                  {Object.keys(categories).map(category => (
                    <TabsTrigger key={category} value={category} className="text-xs sm:text-sm">
                      {CATEGORY_LABELS[category] || category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(categories).map(([category, categoryAddons]) => (
                  <TabsContent key={category} value={category} className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryAddons.map(addon => (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedAddonIds.has(addon.id)
                              ? 'border-coral bg-coral/10 shadow-md'
                              : 'border-gray-200 hover:border-coral/50 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg flex items-center gap-2">
                                {addon.name}
                                {addon.isRecommended && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                )}
                              </h4>
                              <p className="text-sm text-gray-600">{addon.manufacturer}</p>
                            </div>
                            {selectedAddonIds.has(addon.id) && (
                              <div className="bg-gradient-to-br from-coral to-orange-600 rounded-full p-1">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {addon.description}
                          </p>

                          {addon.benefits.length > 0 && (
                            <ul className="space-y-1 mb-3">
                              {addon.benefits.slice(0, 3).map((benefit, idx) => (
                                <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                  <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t">
                            <div>
                              <div className="text-sm text-gray-600">
                                Product: {formatCurrency(addon.retailPrice)}
                              </div>
                              {addon.installationCost > 0 && (
                                <div className="text-xs text-gray-500">
                                  + {formatCurrency(addon.installationCost)} install
                                </div>
                              )}
                            </div>
                            <div className="text-xl font-bold text-coral">
                              {formatCurrency(addon.totalCost)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Solar System:</span>
                <span className="font-semibold">{formatCurrency(systemDetails.totalInvestment)}</span>
              </div>
              {selectedAddonIds.size > 0 && (
                <div className="flex justify-between text-coral">
                  <span>Selected Add-ons ({selectedAddonIds.size}):</span>
                  <span className="font-semibold">{formatCurrency(calculateTotal())}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>New Total:</span>
                <span>{formatCurrency(systemDetails.totalInvestment + calculateTotal())}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {selectedAddonIds.size === preSelectedAddonIds.length ? 'No Thanks' : 'Maybe Later'}
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700 text-white"
            >
              {selectedAddonIds.size === 0 
                ? 'Continue Without Add-ons'
                : selectedAddonIds.size === preSelectedAddonIds.length
                ? 'Continue'
                : `Add ${selectedAddonIds.size - preSelectedAddonIds.length} More Item${selectedAddonIds.size - preSelectedAddonIds.length !== 1 ? 's' : ''}`
              }
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
