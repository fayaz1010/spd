'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Gift, Check, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface Addon {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  addonCategory: string;
  benefits: string[];
  retailPrice: number;
  installationCost: number;
  totalCost: number;
  isRecommended: boolean;
}

interface AddonSelectionInlineProps {
  selectedAddonIds: string[];
  onSelectionChange: (addonIds: string[]) => void;
  onTotalChange: (total: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  solar_equipment: 'Solar Equipment',
  energy_efficiency: 'Energy Efficiency',
  protection: 'Protection & Maintenance',
  home_services: 'Home Services',
};

export default function AddonSelectionInline({
  selectedAddonIds,
  onSelectionChange,
  onTotalChange,
}: AddonSelectionInlineProps) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    loadAddons();
  }, []);

  useEffect(() => {
    // Calculate total when selection changes
    const total = addons
      .filter(addon => selectedAddonIds.includes(addon.id))
      .reduce((sum, addon) => sum + addon.totalCost, 0);
    onTotalChange(total);
  }, [selectedAddonIds, addons]);

  const loadAddons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/addons?showBeforeCheckout=true');
      const data = await response.json();

      if (data.success) {
        setAddons(data.addons);
      }
    } catch (error) {
      console.error('Error loading addons:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (addonId: string) => {
    const newSelection = selectedAddonIds.includes(addonId)
      ? selectedAddonIds.filter(id => id !== addonId)
      : [...selectedAddonIds, addonId];
    onSelectionChange(newSelection);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Group addons by category
  const addonsByCategory: Record<string, Addon[]> = {};
  addons.forEach(addon => {
    if (!addonsByCategory[addon.addonCategory]) {
      addonsByCategory[addon.addonCategory] = [];
    }
    addonsByCategory[addon.addonCategory].push(addon);
  });

  const selectedCount = selectedAddonIds.length;
  const selectedTotal = addons
    .filter(addon => selectedAddonIds.includes(addon.id))
    .reduce((sum, addon) => sum + addon.totalCost, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Recommended Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (addons.length === 0) {
    return null; // Don't show if no addons available
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Recommended Add-ons
            {selectedCount > 0 && (
              <Badge className="bg-purple-600">
                {selectedCount} selected
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-4">
            {selectedCount > 0 && (
              <span className="text-sm font-semibold text-purple-600">
                +{formatCurrency(selectedTotal)}
              </span>
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Enhance your system with these popular upgrades
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {Object.entries(addonsByCategory).map(([category, categoryAddons]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                {CATEGORY_LABELS[category] || category}
                <span className="text-xs text-gray-500">({categoryAddons.length})</span>
              </h4>
              
              <div className="space-y-3">
                {categoryAddons.map(addon => {
                  const isSelected = selectedAddonIds.includes(addon.id);
                  
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleAddon(addon.id)}
                            className="border-gray-300"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                                {addon.name}
                                {addon.isRecommended && (
                                  <Badge variant="secondary" className="text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </h5>
                              <p className="text-xs text-gray-600">{addon.manufacturer}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold text-purple-600">
                                {formatCurrency(addon.totalCost)}
                              </div>
                              {addon.installationCost > 0 && (
                                <div className="text-xs text-gray-500">
                                  +{formatCurrency(addon.installationCost)} install
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {addon.description}
                          </p>

                          {addon.benefits.length > 0 && (
                            <ul className="space-y-1">
                              {addon.benefits.slice(0, 2).map((benefit, idx) => (
                                <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                  <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {selectedCount > 0 && (
            <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedCount} add-on{selectedCount > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="text-lg font-bold text-purple-600">
                  +{formatCurrency(selectedTotal)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This will be added to your final investment
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
