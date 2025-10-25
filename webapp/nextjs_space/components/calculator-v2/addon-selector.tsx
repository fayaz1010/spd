'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Zap, Shield, Activity, Smartphone, Home, Power, 
  ShieldCheck, Wrench, TrendingUp, BarChart, AlertTriangle,
  Package, Check, Droplet, Wind
} from 'lucide-react';

interface Addon {
  id: string;
  addonId: string;
  name: string;
  description: string;
  cost: number;
  benefits: string[];
  category: string;
  iconName: string;
}

interface AddonSelectorProps {
  selectedAddonIds: string[];
  onSelectionChange: (addonIds: string[]) => void;
  systemSizeKw?: number;
  hasBattery?: boolean;
}

const ICON_MAP: Record<string, any> = {
  activity: Activity,
  smartphone: Smartphone,
  zap: Zap,
  shield: Shield,
  'alert-triangle': AlertTriangle,
  power: Power,
  home: Home,
  'shield-check': ShieldCheck,
  tool: Wrench,
  'trending-up': TrendingUp,
  'bar-chart': BarChart,
  package: Package,
  droplet: Droplet,
  wind: Wind,
};

const CATEGORY_LABELS: Record<string, string> = {
  installation: 'Installation Upgrades & Services',
  monitoring: 'Monitoring & Smart Home',
  ev_charging: 'EV Charging',
  protection: 'Protection & Safety',
  battery: 'Battery Backup',
  warranty: 'Warranty',
  maintenance: 'Maintenance',
  efficiency: 'Efficiency Upgrades',
  hot_water: 'Solar Hot Water Systems',
};

export function AddonSelector({ 
  selectedAddonIds, 
  onSelectionChange,
  systemSizeKw,
  hasBattery 
}: AddonSelectorProps) {
  const [addons, setAddons] = useState<Record<string, Addon[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['monitoring', 'protection']));

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      // Fetch product add-ons
      const response = await fetch('/api/addons/active?groupByCategory=true');
      const data = await response.json();
      
      // Fetch installation cost add-ons (CUSTOMER_ADDON)
      const installCostResponse = await fetch('/api/admin/installation-costing?isActive=true');
      const installCostData = await installCostResponse.json();
      
      const customerAddons = installCostData.items?.filter((item: any) => 
        item.applicationTiming === 'CUSTOMER_ADDON' && item.showInCalculator
      ) || [];
      
      // Convert installation cost items to addon format
      const installationAddons = customerAddons.map((item: any) => ({
        id: `install_${item.id}`,
        addonId: item.id,
        name: item.name,
        description: item.description || '',
        cost: item.baseRate,
        benefits: item.description ? [item.description] : [],
        category: 'installation',
        iconName: 'wrench',
        calculationType: item.calculationType,
      }));
      
      if (data.success) {
        const allAddons = { ...data.addons };
        
        // Add installation add-ons as a new category
        if (installationAddons.length > 0) {
          allAddons['installation'] = installationAddons;
        }
        
        setAddons(allAddons);
      }
    } catch (error) {
      console.error('Error fetching addons:', error);
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

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalAddonCost = () => {
    let total = 0;
    Object.values(addons).flat().forEach(addon => {
      if (selectedAddonIds.includes(addon.addonId)) {
        total += addon.cost;
      }
    });
    return total;
  };

  const isRecommended = (addon: Addon) => {
    // Recommend monitoring for all
    if (addon.category === 'monitoring') return true;
    
    // Recommend battery addons if they have a battery
    if (addon.category === 'battery' && hasBattery) return true;
    
    // Recommend EV charger for larger systems
    if (addon.category === 'ev_charging' && systemSizeKw && systemSizeKw >= 6.6) return true;
    
    // Recommend protection for all
    if (addon.category === 'protection') return true;
    
    return false;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Loading addons...</div>
        </CardContent>
      </Card>
    );
  }

  const totalAddonCost = getTotalAddonCost();

  return (
    <div className="space-y-4">
      {/* Summary */}
      {selectedAddonIds.length > 0 && (
        <Card className="border-2 border-blue-500 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Selected Addons</div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedAddonIds.length} item{selectedAddonIds.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalAddonCost)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Addon Categories */}
      {Object.entries(addons).map(([category, categoryAddons]) => {
        const isExpanded = expandedCategories.has(category);
        const selectedInCategory = categoryAddons.filter(a => 
          selectedAddonIds.includes(a.addonId)
        ).length;

        return (
          <Card key={category}>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span>{CATEGORY_LABELS[category] || category}</span>
                  {selectedInCategory > 0 && (
                    <Badge variant="secondary">{selectedInCategory} selected</Badge>
                  )}
                </CardTitle>
                <Button variant="ghost" size="sm">
                  {isExpanded ? '−' : '+'}
                </Button>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-3">
                {categoryAddons.map(addon => {
                  const Icon = ICON_MAP[addon.iconName] || Package;
                  const isSelected = selectedAddonIds.includes(addon.addonId);
                  const recommended = isRecommended(addon);

                  return (
                    <div
                      key={addon.id}
                      className={`
                        p-4 rounded-lg border-2 transition-all cursor-pointer
                        ${isSelected 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={() => toggleAddon(addon.addonId)}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleAddon(addon.addonId)}
                          className="mt-1"
                        />
                        
                        <div className="flex-shrink-0">
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center
                            ${isSelected ? 'bg-blue-600' : 'bg-gray-100'}
                          `}>
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{addon.name}</h4>
                            {recommended && (
                              <Badge variant="default" className="bg-green-600">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{addon.description}</p>
                          
                          {addon.benefits && addon.benefits.length > 0 && (
                            <ul className="space-y-1 mb-2">
                              {addon.benefits.slice(0, 3).map((benefit, idx) => (
                                <li key={idx} className="text-xs text-gray-500 flex items-start space-x-1">
                                  <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(addon.cost)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
