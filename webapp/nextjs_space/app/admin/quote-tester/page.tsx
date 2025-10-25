'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calculator, 
  ArrowLeft, 
  Zap, 
  Battery, 
  Package,
  DollarSign,
  TrendingUp,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  Save,
  Send,
  Wrench,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MonthlyProductionChart } from '@/components/charts/MonthlyProductionChart';
import { EnergyFlowChart } from '@/components/charts/EnergyFlowChart';
import { FinancialProjectionChart } from '@/components/charts/FinancialProjectionChart';
import { calculateAnnualProduction } from '@/lib/production-calculator';
import { calculateSelfConsumption } from '@/lib/self-consumption-calculator';

interface Product {
  id: string;
  name: string;
  manufacturer: string;
  productType: string;
  specifications: any;
  tier: string;
  sku?: string;
  warrantyYears?: number;
  supplierInfo?: {
    supplierName: string;
    supplierSKU: string;
    unitCost: number;
    retailPrice: number;
    markupPercent: number;
    leadTime: number | null;
    stockStatus: string;
  };
}

interface SupplierProduct {
  id: string;
  unitCost: number;
  retailPrice: number;
  markupPercent: number;
  supplier: {
    name: string;
  };
}

interface ExtraCost {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  active: boolean;
  optional: boolean;
  defaultOn: boolean;
  sortOrder: number;
}

interface QuoteResult {
  // System Configuration
  systemSizeKw: number;
  panelCount: number;
  batterySizeKwh: number;
  batteryUnitsNeeded?: number;
  
  // Selected Products
  selectedPanel: Product;
  selectedInverter: Product;
  selectedBattery: Product | null;
  
  // Costs
  panelCost: number;
  inverterCost: number;
  batteryCost: number;
  installationCost: number;
  extraCosts?: { [key: string]: number };
  installationBreakdown?: {
    method?: string;
    solarAllin?: number;
    solarTeamName?: string;
    solarHours?: number;
    solarTeamCost?: number;
    teamMembers?: Array<{name: string; role: string; hours: number; hourlyRate: number; trueCostPerHour: number; totalCost: number}>;
    batteryTeamName?: string | null;
    batteryHours?: number;
    batteryTeamCost?: number;
    batteryTeamMembers?: Array<{name: string; role: string; hours: number; hourlyRate: number; trueCostPerHour: number; totalCost: number}>;
    panelInstall: number;
    inverterInstall: number;
    batteryInstall: number;
    railing: number;
    dcCable: number;
    acCable: number;
    commissioning: number;
    callout: number;
    railingMeters: number;
    dcCableMeters: number;
    acCableMeters: number;
  } | null;
  subtotal: number;
  
  // Rebates
  stcRebate: number;
  federalBatteryRebate: number;
  stateBatteryRebate: number;
  batteryRebate: number;
  totalRebates: number;
  
  // Final Pricing
  totalAfterRebates: number;
  gst: number;
  finalPrice: number;
  
  // Profit Analysis
  totalWholesaleCost: number;
  totalRetailPrice: number;
  grossProfit: number;
  profitMargin: number;
}

export default function QuoteTesterPage() {
  const router = useRouter();
  
  // Input State
  const [systemSizeKw, setSystemSizeKw] = useState<string>('6.6');
  const [batterySizeKwh, setBatterySizeKwh] = useState<string>('0');
  const [postcode, setPostcode] = useState<string>('6000');
  const [dailyConsumption, setDailyConsumption] = useState<string>('25'); // Default 25 kWh/day
  const [includeInstallation, setIncludeInstallation] = useState(true);
  const [installationMethod, setInstallationMethod] = useState<'allin' | 'detailed' | 'inhouse'>('allin');
  const [installationMarginPercent, setInstallationMarginPercent] = useState<string>('15'); // Default 15% for subbie
  
  // Product Lists
  const [panels, setPanels] = useState<Product[]>([]);
  const [inverters, setInverters] = useState<Product[]>([]);
  const [batteries, setBatteries] = useState<Product[]>([]);
  
  // Extra Costs
  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([]);
  const [selectedExtraCosts, setSelectedExtraCosts] = useState<{ [key: string]: boolean }>({});
  
  // Installation Cost Items
  const [installationCostItems, setInstallationCostItems] = useState<any[]>([]);
  const [selectedInstallationCosts, setSelectedInstallationCosts] = useState<string[]>([]);
  const [showAdditionalCosts, setShowAdditionalCosts] = useState(false);
  const [activeInstallTab, setActiveInstallTab] = useState<'site_inspection' | 'customer_addon' | 'manual'>('site_inspection');
  const [showInstallationBreakdown, setShowInstallationBreakdown] = useState(false);
  
  // Selected Products (auto-selected but changeable)
  const [selectedPanelId, setSelectedPanelId] = useState<string>('');
  const [selectedInverterId, setSelectedInverterId] = useState<string>('');
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>('');
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  // Results
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Modal States
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Customer Details for Quote Generation
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [monthlyBill, setMonthlyBill] = useState('');
  
  // Package Details
  const [packageName, setPackageName] = useState('');
  const [packageDisplayName, setPackageDisplayName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageSuitability, setPackageSuitability] = useState('');
  const [packageDailyUsage, setPackageDailyUsage] = useState('');
  const [packageBadge, setPackageBadge] = useState('');
  const [packageSortOrder, setPackageSortOrder] = useState('0');
  const [packageHeroImageUrl, setPackageHeroImageUrl] = useState('');
  const [packageInfographicUrl, setPackageInfographicUrl] = useState('');
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [uploadingInfographic, setUploadingInfographic] = useState(false);
  const [packageHookText, setPackageHookText] = useState('');
  const [packageCtaText, setPackageCtaText] = useState('Get This Package Now');
  const [packageFeatures, setPackageFeatures] = useState<string[]>([
    '25-year panel warranty',
    'CEC certified installer',
    'Tier 1 panels',
    'Professional installation',
    'Monitoring included',
    'Full rebate assistance',
  ]);

  useEffect(() => {
    fetchProducts();
    fetchExtraCosts();
    fetchInstallationCostItems();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch all products at once
      const response = await fetch('/api/admin/products?available=true');
      const data = await response.json();
      const allProducts = data.products || [];
      
      // Filter by product type and sort
      const panelsList = allProducts.filter((p: Product) => p.productType === 'PANEL');
      const invertersList = allProducts.filter((p: Product) => p.productType === 'INVERTER');
      const batteriesList = allProducts.filter((p: Product) => p.productType === 'BATTERY');
      
      // Sort panels by wattage (descending)
      panelsList.sort((a: Product, b: Product) => {
        const wattageA = a.specifications?.wattage || 0;
        const wattageB = b.specifications?.wattage || 0;
        return wattageB - wattageA;
      });
      
      // Sort inverters by capacity (ascending)
      invertersList.sort((a: Product, b: Product) => {
        const capacityA = a.specifications?.capacity || 0;
        const capacityB = b.specifications?.capacity || 0;
        return capacityA - capacityB;
      });
      
      // Sort batteries by capacity (ascending) - EASIER TO FIND
      batteriesList.sort((a: Product, b: Product) => {
        const capacityA = a.specifications?.capacity || a.specifications?.capacityKwh || 0;
        const capacityB = b.specifications?.capacity || b.specifications?.capacityKwh || 0;
        return capacityA - capacityB;
      });
      
      setPanels(panelsList);
      setInverters(invertersList);
      setBatteries(batteriesList);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
      setLoading(false);
    }
  };

  const fetchExtraCosts = async () => {
    try {
      const response = await fetch('/api/admin/extra-costs');
      const data = await response.json();
      
      if (data.success) {
        const costs = data.extraCosts || [];
        setExtraCosts(costs);
        
        // Set default selected costs
        const defaults: { [key: string]: boolean } = {};
        costs.forEach((cost: ExtraCost) => {
          defaults[cost.id] = cost.defaultOn;
        });
        setSelectedExtraCosts(defaults);
      }
    } catch (err) {
      console.error('Error fetching extra costs:', err);
    }
  };

  const fetchInstallationCostItems = async () => {
    try {
      const response = await fetch('/api/admin/installation-costing?isActive=true');
      const data = await response.json();
      
      if (data.items) {
        console.log('📦 Installation cost items loaded:', data.items.length);
        setInstallationCostItems(data.items);
      }
    } catch (err) {
      console.error('Error fetching installation cost items:', err);
    }
  };

  const calculateQuote = async () => {
    try {
      setCalculating(true);
      setError(null);
      
      const sizeKw = parseFloat(systemSizeKw);
      const batteryKwh = parseFloat(batterySizeKwh);
      
      if (isNaN(sizeKw) || sizeKw <= 0) {
        setError('Please enter a valid system size');
        setCalculating(false);
        return;
      }
      
      // Prepare extra costs
      const enabledExtraCosts: string[] = [];
      Object.keys(selectedExtraCosts).forEach(key => {
        if (selectedExtraCosts[key]) {
          enabledExtraCosts.push(key);
        }
      });

      // Call quote tester API
      const response = await fetch('/api/admin/quote-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemSizeKw: sizeKw,
          batterySizeKwh: batteryKwh > 0 ? batteryKwh : null,
          postcode: postcode || '6000',
          region: 'WA',
          includeInstallation,
          installationMethod,
          installationMarginPercent: parseFloat(installationMarginPercent) || 15,
          selectedPanelId: selectedPanelId || null,
          selectedInverterId: selectedInverterId || null,
          selectedBatteryId: selectedBatteryId || null,
          extraCostIds: enabledExtraCosts,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate quote');
      }
      
      const result = await response.json();
      setQuote(result);
      
      // Auto-select products if not already selected
      if (!selectedPanelId && result.selectedPanel) {
        setSelectedPanelId(result.selectedPanel.id);
      }
      if (!selectedInverterId && result.selectedInverter) {
        setSelectedInverterId(result.selectedInverter.id);
      }
      if (!selectedBatteryId && result.selectedBattery) {
        setSelectedBatteryId(result.selectedBattery.id);
      }
      
      setCalculating(false);
    } catch (err) {
      console.error('Error calculating quote:', err);
      setError('Failed to calculate quote. Please try again.');
      setCalculating(false);
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleGenerateQuote = async () => {
    if (!customerName || !customerEmail || !customerPhone || !customerAddress) {
      alert('Please fill in all required customer details (name, email, phone, and address)');
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch('/api/admin/quotes/generate-from-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote,
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address: customerAddress,
            monthlyBill: monthlyBill ? parseFloat(monthlyBill) : null,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate quote');

      const result = await response.json();
      alert(`Quote generated successfully! Reference: ${result.quoteReference}\nEmail sent to ${customerEmail}`);
      setShowQuoteModal(false);
      
      // Reset form
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerAddress('');
      setMonthlyBill('');
    } catch (err) {
      console.error('Error generating quote:', err);
      alert('Failed to generate quote. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'hero' | 'infographic') => {
    try {
      if (type === 'hero') {
        setUploadingHeroImage(true);
      } else {
        setUploadingInfographic(true);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'packages');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      
      if (type === 'hero') {
        setPackageHeroImageUrl(result.url);
      } else {
        setPackageInfographicUrl(result.url);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      if (type === 'hero') {
        setUploadingHeroImage(false);
      } else {
        setUploadingInfographic(false);
      }
    }
  };

  const handleSavePackage = async () => {
    if (!packageName || !packageDisplayName) {
      alert('Please fill in package name and display name');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/packages/create-from-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote,
          package: {
            name: packageName,
            displayName: packageDisplayName,
            description: packageDescription,
            suitability: packageSuitability,
            dailyUsage: packageDailyUsage,
            badge: packageBadge,
            sortOrder: parseInt(packageSortOrder) || 0,
            heroImageUrl: packageHeroImageUrl || null,
            infographicUrl: packageInfographicUrl || null,
            hookText: packageHookText || null,
            ctaText: packageCtaText || 'Get This Package Now',
            featureList: packageFeatures.filter(f => f.trim() !== ''),
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save package');

      const result = await response.json();
      alert(`Package saved successfully! It will now appear on the homepage.`);
      setShowPackageModal(false);
      
      // Reset form
      setPackageName('');
      setPackageDisplayName('');
      setPackageDescription('');
      setPackageSuitability('');
      setPackageDailyUsage('');
      setPackageBadge('');
      setPackageSortOrder('0');
      setPackageHeroImageUrl('');
      setPackageInfographicUrl('');
      setPackageHookText('');
      setPackageCtaText('Get This Package Now');
      setPackageFeatures([
        '25-year panel warranty',
        'CEC certified installer',
        'Tier 1 panels',
        'Professional installation',
        'Monitoring included',
        'Full rebate assistance',
      ]);
    } catch (err) {
      console.error('Error saving package:', err);
      alert('Failed to save package. Please try again.');
    } finally {
      setSaving(false);
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
            onClick={() => router.push('/admin/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Calculator className="w-8 h-8 mr-3 text-blue-600" />
                Quote Tester
              </h1>
              <p className="text-gray-600 mt-2">
                Test pricing with automatic product selection, installation costs, rebates, and profit analysis
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* System Size */}
                <div>
                  <Label htmlFor="systemSize">System Size (kW)</Label>
                  <Input
                    id="systemSize"
                    type="number"
                    step="0.1"
                    value={systemSizeKw}
                    onChange={(e) => setSystemSizeKw(e.target.value)}
                    placeholder="6.6"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Common sizes: 6.6kW, 10kW, 13.2kW
                  </p>
                </div>

                {/* Battery Size */}
                <div>
                  <Label htmlFor="batterySize">Battery Size (kWh)</Label>
                  <Input
                    id="batterySize"
                    type="number"
                    step="0.5"
                    value={batterySizeKwh}
                    onChange={(e) => setBatterySizeKwh(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    0 = No battery, 13.5 = Powerwall 3
                  </p>
                </div>

                {/* Postcode */}
                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="6000"
                    maxLength={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Affects STC zone rating (Perth = 6000)
                  </p>
                </div>

                {/* Daily Consumption */}
                <div>
                  <Label htmlFor="dailyConsumption">Daily Consumption (kWh)</Label>
                  <Input
                    id="dailyConsumption"
                    type="number"
                    step="1"
                    value={dailyConsumption}
                    onChange={(e) => setDailyConsumption(e.target.value)}
                    placeholder="25"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For charts: Average daily usage (default: 25 kWh)
                  </p>
                </div>

                {/* Product Selection */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm text-gray-900 mb-3">Product Selection</h4>
                  
                  {/* Panel Selection */}
                  <div className="mb-3">
                    <Label htmlFor="panelSelect" className="text-xs">Solar Panel</Label>
                    <select
                      id="panelSelect"
                      value={selectedPanelId}
                      onChange={(e) => setSelectedPanelId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    >
                      <option value="">Auto-select (Most Profitable)</option>
                      {panels.map(panel => {
                        const wattage = panel.specifications?.wattage || 0;
                        const wattageStr = wattage.toString().padStart(4, ' ');
                        const tierBadge = panel.tier === 'premium' ? '⭐' : panel.tier === 'mid' ? '●' : '○';
                        return (
                          <option key={panel.id} value={panel.id}>
                            {wattageStr}W {tierBadge} {panel.manufacturer} - {panel.name}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Sorted by wattage (⭐ Premium, ● Mid, ○ Budget)
                    </p>
                  </div>

                  {/* Inverter Selection */}
                  <div className="mb-3">
                    <Label htmlFor="inverterSelect" className="text-xs">Inverter</Label>
                    <select
                      id="inverterSelect"
                      value={selectedInverterId}
                      onChange={(e) => setSelectedInverterId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    >
                      <option value="">Auto-select (Most Profitable)</option>
                      {inverters.map(inverter => {
                        const capacity = inverter.specifications?.capacity || 0;
                        const capacityStr = capacity.toString().padStart(4, ' ');
                        const tierBadge = inverter.tier === 'premium' ? '⭐' : inverter.tier === 'mid' ? '●' : '○';
                        return (
                          <option key={inverter.id} value={inverter.id}>
                            {capacityStr}kW {tierBadge} {inverter.manufacturer} - {inverter.name}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Sorted by capacity (⭐ Premium, ● Mid, ○ Budget)
                    </p>
                  </div>

                  {/* Battery Selection */}
                  {parseFloat(batterySizeKwh) > 0 && (
                    <div className="mb-3">
                      <Label htmlFor="batterySelect" className="text-xs flex items-center justify-between">
                        <span>Battery</span>
                        <span className="text-gray-400 font-normal">Available: {batteries.length}</span>
                      </Label>
                      <select
                        id="batterySelect"
                        value={selectedBatteryId}
                        onChange={(e) => setSelectedBatteryId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      >
                        <option value="">Auto-select (Most Profitable)</option>
                        {batteries.map(battery => {
                          const capacity = battery.specifications?.capacity || battery.specifications?.capacityKwh || 0;
                          const capacityStr = capacity.toFixed(1).padStart(6, ' '); // Right-align with decimal
                          const tierBadge = battery.tier === 'premium' ? '⭐' : battery.tier === 'mid' ? '●' : '○';
                          return (
                            <option key={battery.id} value={battery.id}>
                              {capacityStr}kWh {tierBadge} {battery.manufacturer} - {battery.name}
                            </option>
                          );
                        })}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Tip: Type to search (e.g., "Sungrow" or "9.6")
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Costs - MANDATORY & MANUAL items */}
                {(extraCosts.length > 0 || installationCostItems.filter(i => i.applicationTiming === 'MANDATORY' || i.applicationTiming === 'MANUAL').length > 0) && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-sm text-gray-900 mb-3">Additional Costs</h4>
                    <div className="space-y-2">
                      {/* MANDATORY Installation Cost Items (Auto-checked) */}
                      {installationCostItems
                        .filter(item => item.applicationTiming === 'MANDATORY')
                        .map(item => (
                          <div key={item.id} className="flex items-start space-x-2">
                            <input
                              type="checkbox"
                              id={`mandatory-${item.id}`}
                              checked={true}
                              disabled
                              className="rounded border-gray-300 mt-0.5 opacity-50"
                            />
                            <div className="flex-1">
                              <Label htmlFor={`mandatory-${item.id}`} className="text-xs font-medium text-gray-700">
                                {item.name} (+${item.baseRate.toFixed(2)})
                                <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                              </Label>
                              {item.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      
                      {/* Extra Costs (legacy) */}
                      {extraCosts
                        .filter(cost => cost.active)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map(cost => (
                          <div key={cost.id} className="flex items-start space-x-2">
                            <input
                              type="checkbox"
                              id={cost.id}
                              checked={selectedExtraCosts[cost.id] || false}
                              onChange={(e) => setSelectedExtraCosts(prev => ({
                                ...prev,
                                [cost.id]: e.target.checked
                              }))}
                              className="rounded border-gray-300 mt-0.5"
                            />
                            <div className="flex-1">
                              <Label htmlFor={cost.id} className="cursor-pointer text-xs font-medium">
                                {cost.name} (+${cost.cost.toFixed(2)})
                              </Label>
                              <p className="text-xs text-gray-500 mt-0.5">{cost.description}</p>
                            </div>
                          </div>
                        ))}
                      
                      {/* Manual Installation Cost Items */}
                      {installationCostItems
                        .filter(item => item.applicationTiming === 'MANUAL')
                        .map(item => (
                          <div key={item.id} className="flex items-start space-x-2">
                            <input
                              type="checkbox"
                              id={`manual-${item.id}`}
                              checked={selectedInstallationCosts.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedInstallationCosts(prev => [...prev, item.id]);
                                } else {
                                  setSelectedInstallationCosts(prev => prev.filter(id => id !== item.id));
                                }
                              }}
                              className="rounded border-gray-300 mt-0.5"
                            />
                            <div className="flex-1">
                              <Label htmlFor={`manual-${item.id}`} className="cursor-pointer text-xs font-medium">
                                {item.name} (+${item.baseRate.toFixed(2)})
                              </Label>
                              {item.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Include Installation */}
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeInstallation"
                      checked={includeInstallation}
                      onChange={(e) => setIncludeInstallation(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="includeInstallation" className="cursor-pointer">
                      Include Installation Costs
                    </Label>
                  </div>

                  {/* Installation Commission */}
                  {includeInstallation && (
                    <div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Label htmlFor="installMargin" className="text-sm font-semibold text-blue-900 mb-3 block">
                          🤝 Installation Commission
                        </Label>
                        <p className="text-xs text-blue-700 mb-3">
                          Customer always pays: <strong>Subcontractor Rate + Commission%</strong>
                        </p>
                        <div className="flex items-center gap-3">
                          <Input
                            id="installMargin"
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={installationMarginPercent}
                            onChange={(e) => setInstallationMarginPercent(e.target.value)}
                            className="w-24 text-center font-semibold text-lg"
                          />
                          <span className="text-lg text-blue-900 font-bold">%</span>
                          <div className="flex-1">
                            <p className="text-xs text-blue-600">
                              Default: 15% • Adjust for special pricing
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                          <p className="text-xs text-gray-700 font-medium mb-1">💡 Profit Strategy:</p>
                          <p className="text-xs text-gray-600">
                            • Customer pays subbie price regardless of who installs<br/>
                            • If internal team is used, company saves on labor costs<br/>
                            • Lower cost = Higher profit margin
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculate Button */}
                <Button
                  onClick={calculateQuote}
                  disabled={calculating}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {calculating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate Quote
                    </>
                  )}
                </Button>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Product Counts */}
                <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
                  <p>Available Products:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• {panels.length} Solar Panels</li>
                    <li>• {inverters.length} Inverters</li>
                    <li>• {batteries.length} Batteries</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {quote ? (
              <div className="space-y-6">
                {/* System Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                      System Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Zap className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-600">Solar System</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{quote.systemSizeKw}kW</p>
                        <p className="text-sm text-gray-600">{quote.panelCount} panels</p>
                      </div>
                      
                      {quote.batterySizeKwh > 0 && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Battery className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-600">Battery</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{quote.batterySizeKwh}kWh</p>
                          <p className="text-sm text-gray-600">
                            {quote.selectedBattery?.name}
                            {quote.batteryUnitsNeeded && quote.batteryUnitsNeeded > 1 && (
                              <span className="text-xs text-green-700"> × {quote.batteryUnitsNeeded} units</span>
                            )}
                          </p>
                        </div>
                      )}
                      
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Package className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-600">Inverter</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{quote.selectedInverter.name}</p>
                        <p className="text-sm text-gray-600">{quote.selectedInverter.manufacturer}</p>
                      </div>
                    </div>

                    {/* Selected Products - Detailed Catalog View */}
                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold text-gray-900">Selected Products - Full Details:</h4>
                      <div className="space-y-4">
                        {/* Solar Panel Details */}
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="font-bold text-lg text-gray-900">{quote.selectedPanel.name}</p>
                              <p className="text-sm text-gray-600">{quote.selectedPanel.manufacturer} • {quote.selectedPanel.tier} tier</p>
                              <p className="text-xs text-gray-500 mt-1">SKU: {quote.selectedPanel.sku}</p>
                            </div>
                            <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded">
                              × {quote.panelCount}
                            </span>
                          </div>
                          
                          {/* Specifications */}
                          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                            <div className="bg-white p-2 rounded">
                              <span className="text-gray-600">Wattage:</span>
                              <span className="font-semibold ml-2">{quote.selectedPanel.specifications?.wattage}W</span>
                            </div>
                            <div className="bg-white p-2 rounded">
                              <span className="text-gray-600">Warranty:</span>
                              <span className="font-semibold ml-2">{quote.selectedPanel.warrantyYears} years</span>
                            </div>
                          </div>
                          
                          {/* Supplier & Pricing Info */}
                          {quote.selectedPanel.supplierInfo && (
                            <div className="border-t border-blue-300 pt-3 mt-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2">📦 Supplier: {quote.selectedPanel.supplierInfo.supplierName}</p>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="bg-white p-2 rounded">
                                  <p className="text-gray-500">Unit Cost</p>
                                  <p className="font-bold text-green-700">{formatCurrency(quote.selectedPanel.supplierInfo.unitCost)}</p>
                                </div>
                                <div className="bg-white p-2 rounded">
                                  <p className="text-gray-500">Retail Price</p>
                                  <p className="font-bold text-blue-700">{formatCurrency(quote.selectedPanel.supplierInfo.retailPrice)}</p>
                                </div>
                                <div className="bg-white p-2 rounded">
                                  <p className="text-gray-500">Markup</p>
                                  <p className="font-bold text-purple-700">{quote.selectedPanel.supplierInfo.markupPercent.toFixed(1)}%</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                <div className="bg-white p-2 rounded">
                                  <p className="text-gray-500">Stock Status</p>
                                  <p className="font-semibold">{quote.selectedPanel.supplierInfo.stockStatus}</p>
                                </div>
                                <div className="bg-white p-2 rounded">
                                  <p className="text-gray-500">Lead Time</p>
                                  <p className="font-semibold">{quote.selectedPanel.supplierInfo.leadTime || 'N/A'} days</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Inverter Details */}
                        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="font-bold text-lg text-gray-900">{quote.selectedInverter.name}</p>
                              <p className="text-sm text-gray-600">{quote.selectedInverter.manufacturer} • {quote.selectedInverter.tier} tier</p>
                              <p className="text-xs text-gray-500 mt-1">SKU: {quote.selectedInverter.sku}</p>
                            </div>
                            <span className="text-sm font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded">
                              × 1
                            </span>
                          </div>
                          
                          {/* Specifications */}
                          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                            <div className="bg-white p-2 rounded">
                              <span className="text-gray-600">Capacity:</span>
                              <span className="font-semibold ml-2">{quote.selectedInverter.specifications?.capacity}kW</span>
                            </div>
                            <div className="bg-white p-2 rounded">
                              <span className="text-gray-600">Warranty:</span>
                              <span className="font-semibold ml-2">{quote.selectedInverter.warrantyYears} years</span>
                            </div>
                          </div>
                          
                          {/* Supplier & Pricing Info */}
                          {quote.selectedInverter.supplierInfo && (
                            <div className="border-t border-purple-300 pt-3 mt-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2">📦 Supplier: {quote.selectedInverter.supplierInfo.supplierName}</p>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="bg-white p-2 rounded">
                                  <p className="text-gray-500">Unit Cost</p>
                                  <p className="font-bold text-green-700">{formatCurrency(quote.selectedInverter.supplierInfo.unitCost)}</p>
                                </div>
                                <div className="bg-white p-2 rounded">
                                  <p className="text-gray-500">Retail Price</p>
                                  <p className="font-bold text-blue-700">{formatCurrency(quote.selectedInverter.supplierInfo.retailPrice)}</p>
                                </div>
                                <div className="bg-white p-2 rounded">
                                  <p className="text-gray-500">Markup</p>
                                  <p className="font-bold text-purple-700">{quote.selectedInverter.supplierInfo.markupPercent.toFixed(1)}%</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                <div className="bg-white p-2 rounded">
                                  <p className="text-gray-500">Stock Status</p>
                                  <p className="font-semibold">{quote.selectedInverter.supplierInfo.stockStatus}</p>
                                </div>
                                <div className="bg-white p-2 rounded">
                                  <p className="text-gray-500">Lead Time</p>
                                  <p className="font-semibold">{quote.selectedInverter.supplierInfo.leadTime || 'N/A'} days</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Battery Details */}
                        {quote.selectedBattery && (
                          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <p className="font-bold text-lg text-gray-900">{quote.selectedBattery.name}</p>
                                <p className="text-sm text-gray-600">
                                  {quote.selectedBattery.manufacturer} • {quote.selectedBattery.tier} tier
                                  {quote.batteryUnitsNeeded && quote.batteryUnitsNeeded > 1 && (
                                    <span className="text-green-700"> • Stacked Configuration</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">SKU: {quote.selectedBattery.sku}</p>
                              </div>
                              <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded">
                                × {quote.batteryUnitsNeeded || 1}
                              </span>
                            </div>
                            
                            {/* Specifications */}
                            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                              <div className="bg-white p-2 rounded">
                                <span className="text-gray-600">Capacity:</span>
                                <span className="font-semibold ml-2">{quote.selectedBattery.specifications?.capacity || quote.selectedBattery.specifications?.capacityKwh}kWh per unit</span>
                              </div>
                              <div className="bg-white p-2 rounded">
                                <span className="text-gray-600">Warranty:</span>
                                <span className="font-semibold ml-2">{quote.selectedBattery.warrantyYears} years</span>
                              </div>
                            </div>
                            
                            {quote.batteryUnitsNeeded && quote.batteryUnitsNeeded > 1 && (
                              <div className="bg-green-100 p-2 rounded mb-3 text-sm">
                                <p className="font-semibold text-green-800">
                                  Total System: {quote.batterySizeKwh}kWh ({quote.batteryUnitsNeeded} units stacked)
                                </p>
                              </div>
                            )}
                            
                            {/* Supplier & Pricing Info */}
                            {quote.selectedBattery.supplierInfo && (
                              <div className="border-t border-green-300 pt-3 mt-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">📦 Supplier: {quote.selectedBattery.supplierInfo.supplierName}</p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="bg-white p-2 rounded">
                                    <p className="text-gray-500">Unit Cost</p>
                                    <p className="font-bold text-green-700">{formatCurrency(quote.selectedBattery.supplierInfo.unitCost)}</p>
                                  </div>
                                  <div className="bg-white p-2 rounded">
                                    <p className="text-gray-500">Retail Price</p>
                                    <p className="font-bold text-blue-700">{formatCurrency(quote.selectedBattery.supplierInfo.retailPrice)}</p>
                                  </div>
                                  <div className="bg-white p-2 rounded">
                                    <p className="text-gray-500">Markup</p>
                                    <p className="font-bold text-purple-700">{quote.selectedBattery.supplierInfo.markupPercent.toFixed(1)}%</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                  <div className="bg-white p-2 rounded">
                                    <p className="text-gray-500">Stock Status</p>
                                    <p className="font-semibold">{quote.selectedBattery.supplierInfo.stockStatus}</p>
                                  </div>
                                  <div className="bg-white p-2 rounded">
                                    <p className="text-gray-500">Lead Time</p>
                                    <p className="font-semibold">{quote.selectedBattery.supplierInfo.leadTime || 'N/A'} days</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                      Cost Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2">
                        <span className="text-gray-600">Solar Panels ({quote.panelCount}×)</span>
                        <span className="font-medium">{formatCurrency(quote.panelCost)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-2">
                        <span className="text-gray-600">Inverter</span>
                        <span className="font-medium">{formatCurrency(quote.inverterCost)}</span>
                      </div>
                      
                      {quote.batteryCost > 0 && (
                        <div className="flex justify-between items-center pb-2">
                          <span className="text-gray-600">Battery</span>
                          <span className="font-medium">{formatCurrency(quote.batteryCost)}</span>
                        </div>
                      )}
                      
                      {quote.installationCost > 0 && (
                        <>
                          <div 
                            className="flex justify-between items-center pb-2 border-t pt-2 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                            onClick={() => {
                              console.log('Installation clicked, current state:', showInstallationBreakdown);
                              setShowInstallationBreakdown(!showInstallationBreakdown);
                            }}
                          >
                            <span className="font-semibold text-gray-700 flex items-center gap-2">
                              <ChevronDown className={`w-4 h-4 transition-transform ${showInstallationBreakdown ? 'rotate-180' : ''}`} />
                              Installation
                              {quote.installationBreakdown?.method && (
                                <span className="text-xs text-gray-500">
                                  ({quote.installationBreakdown.method === 'allin' ? 'All-In Rate' : 'Detailed'})
                                </span>
                              )}
                            </span>
                            <span className="font-semibold">{formatCurrency(quote.installationCost)}</span>
                          </div>
                          
                          {showInstallationBreakdown && (
                            <div className="ml-4 space-y-1 text-sm pb-2 bg-blue-50 p-3 rounded">
                              {!quote.installationBreakdown && (
                                <p className="text-gray-500 text-xs">No breakdown data available</p>
                              )}
                              {quote.installationBreakdown && (
                                <>
                                  {/* New breakdown format from installation-cost-calculator */}
                                  {quote.installationBreakdown.base > 0 && (
                                    <div className="flex justify-between text-gray-700">
                                      <span>• Base Installation</span>
                                      <span>{formatCurrency(quote.installationBreakdown.base)}</span>
                                    </div>
                                  )}
                                  {quote.installationBreakdown.complexity > 0 && (
                                    <div className="flex justify-between text-gray-700">
                                      <span>• Complexity Factors</span>
                                      <span>{formatCurrency(quote.installationBreakdown.complexity)}</span>
                                    </div>
                                  )}
                                  {quote.installationBreakdown.labor > 0 && (
                                    <div className="flex justify-between text-gray-700">
                                      <span>• Labor Costs</span>
                                      <span>{formatCurrency(quote.installationBreakdown.labor)}</span>
                                    </div>
                                  )}
                                  {quote.installationBreakdown.equipment > 0 && (
                                    <div className="flex justify-between text-gray-700">
                                      <span>• Equipment</span>
                                      <span>{formatCurrency(quote.installationBreakdown.equipment)}</span>
                                    </div>
                                  )}
                                  {quote.installationBreakdown.rental > 0 && (
                                    <div className="flex justify-between text-gray-700">
                                      <span>• Rental & Scaffolding</span>
                                      <span>{formatCurrency(quote.installationBreakdown.rental)}</span>
                                    </div>
                                  )}
                                  {quote.installationBreakdown.regulatory > 0 && (
                                    <div className="flex justify-between text-gray-700">
                                      <span>• Regulatory & Compliance</span>
                                      <span>{formatCurrency(quote.installationBreakdown.regulatory)}</span>
                                    </div>
                                  )}
                                  
                                  {/* Legacy format support */}
                              {quote.installationBreakdown.method === 'allin' && quote.installationBreakdown.solarAllin && (
                                <div className="flex justify-between text-blue-700 font-medium">
                                  <span>• Solar All-In ({quote.systemSizeKw}kW × $0.25/W)</span>
                                  <span>{formatCurrency(quote.installationBreakdown.solarAllin)}</span>
                                </div>
                              )}
                              
                              {quote.installationBreakdown.method === 'allin' && (
                                <div className="ml-4 text-xs text-gray-500 space-y-0.5 mb-1">
                                  <div className="flex justify-between">
                                    <span>  ↳ Panel mounting (~8c/W)</span>
                                    <span>{formatCurrency(quote.installationBreakdown.panelInstall)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>  ↳ Inverter install (~3c/W)</span>
                                    <span>{formatCurrency(quote.installationBreakdown.inverterInstall)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>  ↳ Railing (~6c/W)</span>
                                    <span>{formatCurrency(quote.installationBreakdown.railing)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>  ↳ Cables (~5c/W)</span>
                                    <span>{formatCurrency(quote.installationBreakdown.dcCable + quote.installationBreakdown.acCable)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>  ↳ Commissioning (~3c/W)</span>
                                    <span>{formatCurrency(quote.installationBreakdown.commissioning)}</span>
                                  </div>
                                </div>
                              )}
                              
                              {quote.installationBreakdown.method === 'detailed' && (
                                <>
                                  <div className="flex justify-between text-gray-600">
                                    <span>• Panel Installation ({quote.systemSizeKw}kW × $0.08/W)</span>
                                    <span>{formatCurrency(quote.installationBreakdown.panelInstall)}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-600">
                                    <span>• Inverter Installation</span>
                                    <span>{formatCurrency(quote.installationBreakdown.inverterInstall)}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-600">
                                    <span>• Railing ({quote.installationBreakdown.railingMeters}m × $15/m)</span>
                                    <span>{formatCurrency(quote.installationBreakdown.railing)}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-600">
                                    <span>• DC Cable ({quote.installationBreakdown.dcCableMeters}m × $5/m)</span>
                                    <span>{formatCurrency(quote.installationBreakdown.dcCable)}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-600">
                                    <span>• AC Cable ({quote.installationBreakdown.acCableMeters}m × $10/m)</span>
                                    <span>{formatCurrency(quote.installationBreakdown.acCable)}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-600">
                                    <span>• Commissioning</span>
                                    <span>{formatCurrency(quote.installationBreakdown.commissioning)}</span>
                                  </div>
                                </>
                              )}
                              
                              {quote.installationBreakdown.batteryInstall > 0 && (
                                <div className="flex justify-between text-gray-600">
                                  <span>• Battery Installation</span>
                                  <span>{formatCurrency(quote.installationBreakdown.batteryInstall)}</span>
                                </div>
                              )}
                              
                              {/* IN-HOUSE TEAMS METHOD */}
                              {quote.installationBreakdown.method === 'inhouse' && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="flex justify-between text-blue-700 font-medium mb-2">
                                    <span>• {quote.installationBreakdown.solarTeamName} ({quote.installationBreakdown.solarHours}hrs)</span>
                                    <span>{formatCurrency(quote.installationBreakdown.solarTeamCost || 0)}</span>
                                  </div>
                                  {quote.installationBreakdown.teamMembers?.map((member, idx) => (
                                    <div key={idx} className="ml-4 text-xs text-gray-600 flex justify-between">
                                      <span>  ↳ {member.name} ({member.role}) - ${member.hourlyRate}/hr (${member.trueCostPerHour}/hr true cost)</span>
                                      <span>{formatCurrency(member.totalCost)}</span>
                                    </div>
                                  ))}
                                  
                                  {quote.installationBreakdown.batteryTeamName && quote.installationBreakdown.batteryTeamCost && quote.installationBreakdown.batteryTeamCost > 0 && (
                                    <>
                                      <div className="flex justify-between text-green-700 font-medium mt-2 mb-2">
                                        <span>• {quote.installationBreakdown.batteryTeamName} ({quote.installationBreakdown.batteryHours}hrs)</span>
                                        <span>{formatCurrency(quote.installationBreakdown.batteryTeamCost)}</span>
                                      </div>
                                      {quote.installationBreakdown.batteryTeamMembers?.map((member, idx) => (
                                        <div key={idx} className="ml-4 text-xs text-gray-600 flex justify-between">
                                          <span>  ↳ {member.name} ({member.role}) - ${member.hourlyRate}/hr (${member.trueCostPerHour}/hr true cost)</span>
                                          <span>{formatCurrency(member.totalCost)}</span>
                                        </div>
                                      ))}
                                    </>
                                  )}
                                </div>
                              )}
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="border-t pt-3 flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Subtotal</span>
                        <span className="font-semibold text-lg">{formatCurrency(quote.subtotal)}</span>
                      </div>
                      
                      {/* Rebates */}
                      {quote.stcRebate > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>STC Rebate ({quote.systemSizeKw}kW)</span>
                          <span className="font-medium">-{formatCurrency(quote.stcRebate)}</span>
                        </div>
                      )}
                      
                      {quote.federalBatteryRebate > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Federal Battery Rebate ({quote.batterySizeKwh}kWh)</span>
                          <span className="font-medium">-{formatCurrency(quote.federalBatteryRebate)}</span>
                        </div>
                      )}
                      
                      {quote.stateBatteryRebate > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>WA State Battery Rebate</span>
                          <span className="font-medium">-{formatCurrency(quote.stateBatteryRebate)}</span>
                        </div>
                      )}
                      
                      {quote.totalRebates > 0 && (
                        <div className="border-t pt-3 flex justify-between items-center">
                          <span className="font-semibold text-gray-900">After Rebates</span>
                          <span className="font-semibold text-lg">{formatCurrency(quote.totalAfterRebates)}</span>
                        </div>
                      )}
                      
                      {/* GST */}
                      <div className="flex justify-between items-center text-gray-600">
                        <span>GST (10%)</span>
                        <span className="font-medium">{formatCurrency(quote.gst)}</span>
                      </div>
                      
                      {/* Final Price */}
                      <div className="border-t-2 border-blue-600 pt-3 flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-lg">Final Price</span>
                        <span className="font-bold text-2xl text-blue-600">{formatCurrency(quote.finalPrice)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Installation Costs */}
                <Card className="border-2 border-purple-200">
                  <CardHeader 
                    className="cursor-pointer hover:bg-purple-50 transition-colors"
                    onClick={() => setShowAdditionalCosts(!showAdditionalCosts)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Wrench className="w-5 h-5 mr-2 text-purple-600" />
                        Additional Installation Costs
                        {selectedInstallationCosts.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {selectedInstallationCosts.length} selected
                          </Badge>
                        )}
                      </div>
                      <ChevronDown className={`w-5 h-5 text-purple-600 transition-transform ${showAdditionalCosts ? 'rotate-180' : ''}`} />
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Add site-specific costs discovered during inspection or requested by customer
                    </p>
                  </CardHeader>
                  
                  {showAdditionalCosts && (
                    <CardContent>
                      {/* Tabs */}
                      <div className="flex gap-2 mb-4 border-b">
                        <button
                          onClick={() => setActiveInstallTab('site_inspection')}
                          className={`px-4 py-2 font-medium transition-colors ${
                            activeInstallTab === 'site_inspection'
                              ? 'border-b-2 border-purple-600 text-purple-600'
                              : 'text-gray-600 hover:text-purple-600'
                          }`}
                        >
                          Site Inspection
                          <Badge variant="outline" className="ml-2">
                            {installationCostItems.filter(i => i.applicationTiming === 'SITE_INSPECTION').length}
                          </Badge>
                        </button>
                        <button
                          onClick={() => setActiveInstallTab('customer_addon')}
                          className={`px-4 py-2 font-medium transition-colors ${
                            activeInstallTab === 'customer_addon'
                              ? 'border-b-2 border-purple-600 text-purple-600'
                              : 'text-gray-600 hover:text-purple-600'
                          }`}
                        >
                          Customer Add-ons
                          <Badge variant="outline" className="ml-2">
                            {installationCostItems.filter(i => i.applicationTiming === 'CUSTOMER_ADDON').length}
                          </Badge>
                        </button>
                        <button
                          onClick={() => setActiveInstallTab('manual')}
                          className={`px-4 py-2 font-medium transition-colors ${
                            activeInstallTab === 'manual'
                              ? 'border-b-2 border-purple-600 text-purple-600'
                              : 'text-gray-600 hover:text-purple-600'
                          }`}
                        >
                          Manual Charges
                          <Badge variant="outline" className="ml-2">
                            {installationCostItems.filter(i => i.applicationTiming === 'MANUAL').length}
                          </Badge>
                        </button>
                      </div>

                      {/* Items Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        {installationCostItems
                          .filter(item => item.applicationTiming === activeInstallTab.toUpperCase())
                          .map((item) => {
                            const isSelected = selectedInstallationCosts.includes(item.id);
                            return (
                              <div
                                key={item.id}
                                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-purple-300'
                                }`}
                                onClick={() => {
                                  setSelectedInstallationCosts(prev =>
                                    prev.includes(item.id)
                                      ? prev.filter(id => id !== item.id)
                                      : [...prev, item.id]
                                  );
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="rounded"
                                      />
                                      <span className="font-medium text-sm">{item.name}</span>
                                    </div>
                                    {item.description && (
                                      <p className="text-xs text-gray-600 mt-1 ml-6">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="ml-2 shrink-0">
                                    ${item.baseRate}
                                    {item.calculationType !== 'FIXED' && (
                                      <span className="text-xs ml-1">
                                        /{item.calculationType.replace('PER_', '').toLowerCase()}
                                      </span>
                                    )}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Selected Summary */}
                      {selectedInstallationCosts.length > 0 && (
                        <div className="mt-4 bg-purple-50 border border-purple-200 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-purple-900">
                              {selectedInstallationCosts.length} additional item(s) selected
                            </span>
                            <button
                              onClick={() => setSelectedInstallationCosts([])}
                              className="text-sm text-purple-600 hover:text-purple-800"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="space-y-1">
                            {selectedInstallationCosts.map(id => {
                              const item = installationCostItems.find(i => i.id === id);
                              if (!item) return null;
                              return (
                                <div key={id} className="flex justify-between text-sm text-purple-800">
                                  <span>• {item.name}</span>
                                  <span className="font-medium">
                                    ${item.baseRate}
                                    {item.calculationType !== 'FIXED' && (
                                      <span className="text-xs ml-1">
                                        /{item.calculationType.replace('PER_', '').toLowerCase()}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-purple-700 mt-2">
                            These costs will be added to the quote manually. Recalculate to see updated totals.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Profit Analysis */}
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-900">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                      Profit Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Wholesale Cost</p>
                          <p className="text-xl font-bold text-gray-900">{formatCurrency(quote.totalWholesaleCost)}</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Retail Price</p>
                          <p className="text-xl font-bold text-gray-900">{formatCurrency(quote.totalRetailPrice)}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-600">Gross Profit</span>
                          <span className="text-2xl font-bold text-green-600">{formatCurrency(quote.grossProfit)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Profit Margin</span>
                          <span className="text-lg font-semibold text-green-700">{formatPercent(quote.profitMargin)}</span>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 text-sm text-gray-600">
                        <p className="font-medium mb-1">Breakdown:</p>
                        <ul className="space-y-1 ml-4">
                          <li>• Wholesale cost includes supplier unit costs</li>
                          <li>• Retail price includes markups from supplier products</li>
                          <li>• Installation costs added at retail rates</li>
                          <li>• Rebates reduce customer price, not profit</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Charts Section */}
                {(() => {
                  // Calculate production data
                  const productionData = calculateAnnualProduction({
                    systemSizeKw: quote.systemSizeKw,
                    tilt: 20,
                    azimuth: 0,
                    systemEfficiency: 0.87,
                    shadingLoss: 0.05,
                    soilingLoss: 0.03,
                  });

                  // Debug logging
                  console.log('🔍 Production Data:', productionData);
                  console.log('📊 Monthly Data:', productionData.monthlyData);
                  console.log('📏 Monthly Data Length:', productionData.monthlyData?.length);

                  // Calculate self-consumption
                  const dailyProd = quote.systemSizeKw * 4.5;
                  const dailyCons = parseFloat(dailyConsumption) || 25;
                  const selfConsumptionData = calculateSelfConsumption({
                    dailyProduction: dailyProd,
                    dailyConsumption: dailyCons,
                    hasBattery: quote.batterySizeKwh > 0,
                    batteryCapacityKwh: quote.batterySizeKwh,
                    batteryEfficiency: 0.95,
                    depthOfDischarge: 0.90,
                  });

                  // Calculate feed-in revenue
                  const feedInTariff = 0.07;
                  const annualExport = selfConsumptionData.exportedKwh * 365;
                  const feedInRevenue = annualExport * feedInTariff;

                  // Estimate annual savings (simplified)
                  const annualSavings = (selfConsumptionData.selfConsumedKwh * 365 * 0.27) + feedInRevenue;

                  // Safety check
                  if (!productionData || !productionData.monthlyData || productionData.monthlyData.length === 0) {
                    console.error('❌ No production data available');
                    return (
                      <Card className="border-2 border-red-200 bg-red-50">
                        <CardContent className="p-6">
                          <p className="text-red-800">Unable to calculate production data. Please check system size.</p>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                        <CardHeader>
                          <CardTitle className="flex items-center text-purple-900">
                            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                            Solar Performance Charts
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                          {/* Monthly Production Chart */}
                          <MonthlyProductionChart
                            monthlyData={productionData.monthlyData}
                            systemSizeKw={quote.systemSizeKw}
                            annualTotalKwh={productionData.totalKwh}
                          />

                          {/* Energy Flow Chart */}
                          <EnergyFlowChart
                            dailyProduction={dailyProd}
                            dailyConsumption={dailyCons}
                            selfConsumedKwh={selfConsumptionData.selfConsumedKwh}
                            exportedKwh={selfConsumptionData.exportedKwh}
                            gridImportKwh={selfConsumptionData.gridImportKwh}
                            hasBattery={quote.batterySizeKwh > 0}
                            batteryChargedKwh={selfConsumptionData.batteryChargedKwh || 0}
                            batteryDischargedKwh={selfConsumptionData.batteryDischargedKwh || 0}
                          />

                          {/* Financial Projection Chart */}
                          <FinancialProjectionChart
                            systemCost={quote.finalPrice}
                            annualSavings={annualSavings}
                            feedInRevenue={feedInRevenue}
                            electricityRateIncrease={0.03}
                            systemDegradation={0.005}
                            inverterReplacementYear={12}
                            inverterReplacementCost={2000}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Send className="w-5 h-5 mr-2 text-blue-600" />
                      Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => setShowQuoteModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-20 flex-col space-y-2"
                        size="lg"
                      >
                        <Mail className="w-6 h-6" />
                        <span>Generate Real Quote & Email</span>
                      </Button>
                      
                      <Button
                        onClick={() => {
                          // Pre-fill with quote data
                          if (quote) {
                            setPackageName(`${quote.systemSizeKw}kW Solar${quote.batterySizeKwh > 0 ? ` + ${quote.batterySizeKwh}kWh Battery` : ''}`);
                            setPackageDisplayName(`${quote.systemSizeKw}kW ${quote.batterySizeKwh > 0 ? 'Solar + Battery' : 'Solar'} Package`);
                            setPackageDescription(`Perfect for ${quote.batterySizeKwh > 0 ? 'homes with battery backup' : 'solar-only installations'} with moderate energy usage`);
                            setPackageSuitability('4-5 people');
                            setPackageDailyUsage('30-40kWh');
                          }
                          setShowPackageModal(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white h-20 flex-col space-y-2"
                        size="lg"
                      >
                        <Save className="w-6 h-6" />
                        <span>Save as Package Template</span>
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-4 text-center">
                      Generate a real quote for a customer or save this configuration as a package template for the homepage
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to Calculate
                  </h3>
                  <p className="text-gray-600">
                    Enter system size and battery capacity, then click Calculate Quote
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Generate Quote Modal */}
        <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Real Quote</DialogTitle>
              <DialogDescription>
                Enter customer details to generate and email a quote
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              
              <div>
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="customerPhone">Phone *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0400 000 000"
                />
              </div>
              
              <div>
                <Label htmlFor="customerAddress">Address *</Label>
                <Input
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="123 Main St, Perth WA 6000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for roof analysis and satellite imagery
                </p>
              </div>
              
              <div>
                <Label htmlFor="monthlyBill">Monthly Electricity Bill (Optional)</Label>
                <Input
                  id="monthlyBill"
                  type="number"
                  value={monthlyBill}
                  onChange={(e) => setMonthlyBill(e.target.value)}
                  placeholder="250"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide for savings calculations. Leave empty to skip.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowQuoteModal(false)}
                disabled={generating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateQuote}
                disabled={generating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Generate & Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Save Package Modal */}
        <Dialog open={showPackageModal} onOpenChange={setShowPackageModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Save as Package Template</DialogTitle>
              <DialogDescription>
                This package will appear on the homepage and auto-update when prices change
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 max-h-[70vh] overflow-y-auto">
              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="packageName">Package Name (Internal) *</Label>
                    <Input
                      id="packageName"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      placeholder="6.6kW Solar + 13.5kWh Battery"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="packageDisplayName">Display Name *</Label>
                    <Input
                      id="packageDisplayName"
                      value={packageDisplayName}
                      onChange={(e) => setPackageDisplayName(e.target.value)}
                      placeholder="Medium Family Package"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="packageDescription">Description</Label>
                    <Textarea
                      id="packageDescription"
                      value={packageDescription}
                      onChange={(e) => setPackageDescription(e.target.value)}
                      placeholder="Perfect for medium-sized families with moderate energy usage"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="packageSuitability">Suitability</Label>
                    <Input
                      id="packageSuitability"
                      value={packageSuitability}
                      onChange={(e) => setPackageSuitability(e.target.value)}
                      placeholder="4-5 people"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="packageDailyUsage">Daily Usage</Label>
                    <Input
                      id="packageDailyUsage"
                      value={packageDailyUsage}
                      onChange={(e) => setPackageDailyUsage(e.target.value)}
                      placeholder="30-40kWh"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="packageBadge">Badge (Optional)</Label>
                    <Input
                      id="packageBadge"
                      value={packageBadge}
                      onChange={(e) => setPackageBadge(e.target.value)}
                      placeholder="Most Popular"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="packageSortOrder">Sort Order</Label>
                    <Input
                      id="packageSortOrder"
                      type="number"
                      value={packageSortOrder}
                      onChange={(e) => setPackageSortOrder(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                
                {/* Right Column - Marketing & Features */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm mb-3">Marketing & Graphics</h4>
                  
                  <div>
                    <Label htmlFor="packageHookText">Hook Text (Savings Badge)</Label>
                    <Input
                      id="packageHookText"
                      value={packageHookText}
                      onChange={(e) => setPackageHookText(e.target.value)}
                      placeholder="SAVE $9,927 IN REBATES!"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from rebates</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="packageCtaText">Call-to-Action Button Text</Label>
                    <Input
                      id="packageCtaText"
                      value={packageCtaText}
                      onChange={(e) => setPackageCtaText(e.target.value)}
                      placeholder="Get This Package Now"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="packageHeroImageUrl">Hero Image URL (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="packageHeroImageUrl"
                        value={packageHeroImageUrl}
                        onChange={(e) => setPackageHeroImageUrl(e.target.value)}
                        placeholder="https://example.com/solar-panel.jpg"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('heroImageUpload')?.click()}
                        disabled={uploadingHeroImage}
                        className="shrink-0"
                      >
                        {uploadingHeroImage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Upload'
                        )}
                      </Button>
                      <input
                        id="heroImageUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'hero');
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Upload to /public/packages/ or use external URL</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="packageInfographicUrl">Infographic URL (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="packageInfographicUrl"
                        value={packageInfographicUrl}
                        onChange={(e) => setPackageInfographicUrl(e.target.value)}
                        placeholder="https://example.com/infographic.jpg"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('infographicUpload')?.click()}
                        disabled={uploadingInfographic}
                        className="shrink-0"
                      >
                        {uploadingInfographic ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Upload'
                        )}
                      </Button>
                      <input
                        id="infographicUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'infographic');
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Feature List Editor */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold text-sm mb-3">Feature List</h4>
                <div className="space-y-2">
                  {packageFeatures.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...packageFeatures];
                          newFeatures[index] = e.target.value;
                          setPackageFeatures(newFeatures);
                        }}
                        placeholder="Feature description"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFeatures = packageFeatures.filter((_, i) => i !== index);
                          setPackageFeatures(newFeatures);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPackageFeatures([...packageFeatures, ''])}
                    className="w-full"
                  >
                    + Add Feature
                  </Button>
                </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPackageModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePackage}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Package
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
