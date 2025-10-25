
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import { CalculatorData } from './calculator-flow';
import { formatCurrency } from '@/lib/calculations';

interface Step5Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

interface Addon {
  id: string;
  addonId: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  iconName: string;
  benefits: string[];
  sortOrder: number;
  active: boolean;
}

export function Step5Addons({ data, updateData, nextStep, prevStep }: Step5Props) {
  const [selectedAddons, setSelectedAddons] = useState<string[]>(data?.selectedAddons ?? []);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      const response = await fetch('/api/addons');
      if (!response.ok) throw new Error('Failed to fetch add-ons');
      
      const data = await response.json();
      setAddons(data.addons);
    } catch (error) {
      console.error('Error fetching add-ons:', error);
      // If fetch fails, continue with empty array - don't block user
      setAddons([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev?.includes?.(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...(prev ?? []), addonId]
    );
  };

  const totalAddonsCost = selectedAddons?.reduce?.((sum, addonId) => {
    const addon = addons.find(a => a.addonId === addonId);
    return sum + (addon?.cost ?? 0);
  }, 0) ?? 0;

  const handleContinue = () => {
    updateData({ selectedAddons });
    nextStep();
  };

  // Group addons by category
  const groupedAddons = addons.reduce((acc, addon) => {
    if (!acc[addon.category]) {
      acc[addon.category] = [];
    }
    acc[addon.category].push(addon);
    return acc;
  }, {} as Record<string, Addon[]>);

  const categoryLabels: Record<string, string> = {
    'efficiency': 'Efficiency',
    'convenience': 'Convenience',
    'protection': 'Protection',
    'energy_management': 'Energy Management',
    'general': 'General',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading add-ons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-3">
          Enhance Your Solar System
        </h2>
        <p className="text-gray-600">
          Optional add-ons to maximize the value and convenience of your solar installation.
        </p>
      </div>

      {addons.length === 0 ? (
        <div className="text-center py-12 mb-8">
          <p className="text-gray-500 mb-4">No add-ons are currently available.</p>
          <p className="text-sm text-gray-400">You can continue without selecting any add-ons.</p>
        </div>
      ) : (
        <>
          {/* Add-ons Grid - Grouped by Category */}
          {Object.entries(groupedAddons).map(([category, categoryAddons]) => (
            <div key={category} className="mb-8">
              {Object.keys(groupedAddons).length > 1 && (
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  {categoryLabels[category] || category}
                </h3>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                {categoryAddons.map((addon) => {
                  const isSelected = selectedAddons?.includes?.(addon.addonId);
                  const IconComponent = (Icons as any)[addon.iconName] || Icons.Package;

                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon.addonId)}
                      className={`
                        text-left border-2 rounded-xl p-6 transition-all relative
                        ${isSelected 
                          ? 'border-coral bg-coral-50 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-coral rounded-full p-1">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      )}

                      <div className="flex items-start mb-4">
                        <div className={`
                          rounded-full p-3 mr-4
                          ${isSelected ? 'bg-coral' : 'bg-gray-100'}
                        `}>
                          <IconComponent className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-primary mb-1">{addon.name}</h3>
                          <p className="text-2xl font-bold text-coral">{formatCurrency(addon.cost)}</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">{addon.description}</p>

                      {addon.benefits.length > 0 && (
                        <div className="space-y-2">
                          {addon.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center text-sm text-gray-700">
                              <Check className="h-4 w-4 text-emerald mr-2 flex-shrink-0" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Selected Add-ons Summary */}
      {selectedAddons?.length > 0 && (
        <div className="bg-gradient-primary rounded-xl p-6 text-white mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/70 text-sm mb-1">Selected Add-ons</p>
              <p className="text-2xl font-bold">
                {selectedAddons.length} {selectedAddons.length === 1 ? 'item' : 'items'} selected
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm mb-1">Total Add-ons Cost</p>
              <p className="text-3xl font-bold text-gold">{formatCurrency(totalAddonsCost)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Skip Message */}
      {selectedAddons?.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-6 text-center mb-8">
          <p className="text-gray-600">
            No add-ons selected. You can always add these later during installation.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          type="button"
          variant="outline"
          size="lg"
          onClick={prevStep}
          className="px-8"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        
        <Button 
          type="button"
          size="lg"
          onClick={handleContinue}
          className="bg-coral hover:bg-coral-600 text-white px-8"
        >
          View Savings Report
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
