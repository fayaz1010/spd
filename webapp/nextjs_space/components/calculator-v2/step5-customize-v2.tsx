'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Zap,
  Battery,
  Cpu,
  DollarSign,
  CheckCircle2,
  Edit3,
  Check,
  Package,
  RotateCcw,
  Info,
  Settings,
  ChevronDown,
  ChevronUp,
  Wrench,
} from 'lucide-react';
import { CalculatorData } from './calculator-flow-v2';
import AddonSelectionInline from './addon-selection-inline';
import { ChartsSection, getChartDataForDatabase } from './ChartsSection';

interface Step5Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

interface Product {
  id: string;
  manufacturer: string;
  model: string;
  price: number;
  specifications: any;
  tier: string;
  description?: string;
}

interface Calculation {
  systemSpecs: {
    solarKw: number;
    panelCount: number;
    panelWattage: number;
    batteryKwh: number;
    dailyGeneration: number;
    coveragePercent: number;
  };
  costs: {
    panels: number;
    battery: number;
    inverter: number;
    installation: number;
    subtotal: number;
  };
  rebates: {
    federalSolar: number;
    federalBattery: number;
    stateBattery: number;
    total: number;
  };
  finalInvestment: number;
  savings: {
    annual: number;
    paybackYears: number;
    year10: number;
    year25: number;
  };
  products: {
    panel: any;
    battery: any;
    inverter: any;
  };
}

export function Step5CustomizeV2({ data, updateData, nextStep, prevStep }: Step5Props) {
  const [selectedPackage, setSelectedPackage] = useState<any>((data as any).selectedPackage);
  const [loadingPackage, setLoadingPackage] = useState(!selectedPackage);

  // Products
  const [panels, setPanels] = useState<Product[]>([]);
  const [batteries, setBatteries] = useState<Product[]>([]);
  const [inverters, setInverters] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Customization mode
  const [customizing, setCustomizing] = useState(false);

  // Selected products
  const [selectedPanelId, setSelectedPanelId] = useState<string>('');
  const [panelCount, setPanelCount] = useState<number>(0);
  const [selectedBatteryId, setSelectedBatteryId] = useState<string | null>(null);
  
  // Track user changes for real-time calculation
  const [hasUserChanges, setHasUserChanges] = useState(false);

  // Pagination state
  const [visiblePanelCount, setVisiblePanelCount] = useState(3);
  const [visibleBatteryCount, setVisibleBatteryCount] = useState(3);
  const [visibleInverterCount, setVisibleInverterCount] = useState(3);

  // Addons
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [addonTotal, setAddonTotal] = useState<number>(0);
  const [addonDetails, setAddonDetails] = useState<any[]>([]);
  const [selectedInverterId, setSelectedInverterId] = useState<string>('');

  // Calculation
  const [calculating, setCalculating] = useState(false);
  const [calculation, setCalculation] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showInstallationDetails, setShowInstallationDetails] = useState(false);

  // Load quote and saved products from database (DATABASE-FIRST PRINCIPLE)
  useEffect(() => {
    if (!data.sessionId) return;

    async function loadQuoteFromDB() {
      try {
        setLoadingPackage(true);
        const response = await fetch(`/api/quotes/get-quote?sessionId=${data.sessionId}`);
        
        if (response.ok) {
          const result = await response.json();
          const quote = result.quote;
          
          if (quote) {
            // Load package info
            const packageData = {
              templateId: quote.selectedPackageId,
              tier: quote.selectedPackageTier,
              displayName: quote.selectedPackageName,
              solarKw: quote.systemSizeKw,
              panelCount: quote.panelCount,
              batteryKwh: quote.batterySizeKwh,
              totalAfterRebates: quote.totalCostAfterRebates,
              annualSavings: quote.annualSavings,
            };
            setSelectedPackage(packageData);
            
            // Load saved product selections (if any)
            console.log('📦 Loading saved products from database:');
            console.log('   Panel ID:', quote.finalPanelProductId);
            console.log('   Battery ID:', quote.finalBatteryProductId);
            console.log('   Inverter ID:', quote.finalInverterProductId);
            
            if (quote.finalPanelProductId) {
              setSelectedPanelId(quote.finalPanelProductId);
              setPanelCount(quote.finalPanelCount || quote.panelCount);
              console.log('   ✅ Set panel:', quote.finalPanelProductId);
            }
            if (quote.finalBatteryProductId) {
              setSelectedBatteryId(quote.finalBatteryProductId);
              console.log('   ✅ Set battery:', quote.finalBatteryProductId);
            } else {
              console.log('   ⚠️  No battery product ID saved');
            }
            if (quote.finalInverterProductId) {
              setSelectedInverterId(quote.finalInverterProductId);
              console.log('   ✅ Set inverter:', quote.finalInverterProductId);
            }
            
            // Load saved calculation (DATABASE VALUES - no recalculation)
            if (quote.panelSystemCost) {
              const savedCalculation = {
                systemSpecs: {
                  solarKw: quote.systemSizeKw,
                  panelCount: quote.finalPanelCount || quote.panelCount,
                  batteryKwh: quote.batterySizeKwh,
                  panelWattage: quote.panelBrandWattage,
                  dailyGeneration: quote.systemSizeKw * 4.4,
                  coveragePercent: 100,
                },
                costs: {
                  panels: quote.panelSystemCost,
                  battery: quote.batteryCost || 0,
                  inverter: quote.inverterCost || 0,
                  installation: quote.installationCost || 0,
                  subtotal: quote.totalCostBeforeRebates,
                },
                rebates: {
                  federalSolar: quote.federalSolarRebate,
                  federalBattery: quote.federalBatteryRebate || 0,
                  stateBattery: quote.stateBatteryRebate || 0,
                  total: quote.totalRebates,
                },
                finalInvestment: quote.totalCostAfterRebates,
                savings: {
                  annual: quote.annualSavings,
                  paybackYears: quote.paybackYears,
                  year10: quote.year10Savings,
                  year25: quote.year25Savings,
                },
              };
              setCalculation(savedCalculation);
              
              // If installation cost is missing, trigger recalculation
              if (!quote.installationCost || quote.installationCost === 0) {
                console.log('⚠️ Installation cost missing - will recalculate on mount');
                setHasUserChanges(true); // Force recalculation
              } else {
                console.log('✅ Loaded saved calculation from database (no recalculation)');
              }
            }
            
            console.log('✅ Loaded quote from database:', packageData.displayName);
          }
        }
      } catch (error) {
        console.error('Error loading quote from database:', error);
      } finally {
        setLoadingPackage(false);
      }
    }

    loadQuoteFromDB();
  }, [data.sessionId]);

  // Load products list (for customization dropdown)
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/products/active');
        const result = await response.json();
        
        if (result.success) {
          setPanels(result.products.panels);
          setBatteries(result.products.batteries);
          setInverters(result.products.inverters);
          
          // DON'T auto-select - products are already loaded from database
          // Only set defaults if nothing is selected yet
          if (!selectedPanelId && result.products.panels.length > 0) {
            setSelectedPanelId(result.products.panels[0].id);
            setPanelCount(selectedPackage?.panelCount || 20);
          }
          if (!selectedInverterId && result.products.inverters.length > 0) {
            setSelectedInverterId(result.products.inverters[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  // Calculate when selections change - REAL-TIME UPDATES
  useEffect(() => {
    if (!selectedPanelId || !selectedInverterId || !data.sessionId) return;
    
    // On initial load, if we have saved calculation and user hasn't made changes, skip
    // This prevents unnecessary API call when loading from database
    const isInitialLoad = calculation !== null && !hasUserChanges;
    if (isInitialLoad) {
      console.log('📊 Using saved calculation from database (initial load)');
      return;
    }

    // For all other cases (user is customizing or no calculation exists), recalculate
    async function calculate() {
      try {
        setCalculating(true);
        console.log('🔄 Recalculating with:', {
          panel: selectedPanelId,
          battery: selectedBatteryId,
          inverter: selectedInverterId,
          count: panelCount,
        });

        // Use unified calculator via adapter (ensures consistency across all calculators)
        const response = await fetch('/api/quotes/calculate-custom-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemSizeKw: (panelCount * (selectedPanel?.specifications?.wattage || 440)) / 1000,
            panelCount,
            panelProductId: selectedPanelId,
            inverterProductId: selectedInverterId,
            batteryProductId: selectedBatteryId || undefined,
            batterySizeKwh: selectedBattery?.specifications?.capacityKwh || 0,
            postcode: data.postcode || '6000',
            dailyConsumption: data.dailyConsumption || 25,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setCalculation(result);
          console.log('✅ Calculation updated:', {
            solarKw: result.systemSpecs.solarKw,
            batteryKwh: result.systemSpecs.batteryKwh,
            finalInvestment: result.finalInvestment,
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Calculation failed:', response.status);
          console.error('Error details:', errorData);
        }
      } catch (error) {
        console.error('❌ Error calculating:', error);
      } finally {
        setCalculating(false);
      }
    }

    // Debounce to prevent excessive API calls (300ms delay)
    const timeoutId = setTimeout(() => {
      calculate();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedPanelId, panelCount, selectedBatteryId, selectedInverterId, data.sessionId]);

  // Fetch addon details for summary display
  useEffect(() => {
    if (selectedAddonIds.length === 0) {
      setAddonDetails([]);
      return;
    }

    async function fetchAddonDetails() {
      try {
        const response = await fetch('/api/addons?showBeforeCheckout=true');
        const data = await response.json();
        
        if (data.success) {
          const selected = data.addons.filter((addon: any) => 
            selectedAddonIds.includes(addon.id)
          );
          setAddonDetails(selected);
        }
      } catch (error) {
        console.error('Error fetching addon details:', error);
      }
    }

    fetchAddonDetails();
  }, [selectedAddonIds]);

  const handleContinue = async () => {
    if (!calculation) return;

    try {
      setSubmitting(true);

      // Save selected addons to data
      updateData({
        selectedAddonIds,
        addonTotal,
      });

      // Calculate chart data for database
      const chartData = data.dailyConsumption ? getChartDataForDatabase(
        calculation.systemSpecs.solarKw,
        calculation.systemSpecs.batteryKwh,
        data.dailyConsumption,
        0.07 // feedInTariff
      ) : null;

      // Save selected products to quote
      const response = await fetch('/api/quotes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data.sessionId,
          quoteId: data.quoteId, // Include quoteId if updating existing
          
          // Final product selections
          finalPanelProductId: selectedPanelId,
          finalPanelCount: panelCount,
          finalBatteryProductId: selectedBatteryId || null,
          finalInverterProductId: selectedInverterId,
          
          // System specifications
          systemSizeKw: calculation.systemSpecs.solarKw,
          panelCount: calculation.systemSpecs.panelCount,
          batterySizeKwh: calculation.systemSpecs.batteryKwh,
          dailyGeneration: calculation.systemSpecs.dailyGeneration,
          coveragePercent: calculation.systemSpecs.coveragePercent,
          
          // Costs breakdown
          panelSystemCost: calculation.costs.panels,
          batteryCost: calculation.costs.battery,
          inverterCost: calculation.costs.inverter,
          installationCost: calculation.costs.installation,
          totalCostBeforeRebates: calculation.costs.subtotal,
          
          // Rebates
          federalSolarRebate: calculation.rebates.federalSolar,
          federalBatteryRebate: calculation.rebates.federalBattery,
          stateBatteryRebate: calculation.rebates.stateBattery,
          totalRebates: calculation.rebates.total,
          
          // Final investment (before addons)
          totalCostAfterRebates: calculation.finalInvestment,
          
          // Addons
          selectedAddonIds: selectedAddonIds,
          addonTotal: addonTotal,
          addonDetails: addonDetails.map(addon => ({
            id: addon.id,
            name: addon.name,
            manufacturer: addon.manufacturer,
            cost: addon.totalCost,
            installationCost: addon.installationCost || 0,
          })),
          
          // Final total (including addons)
          finalTotalCost: calculation.finalInvestment + addonTotal,
          
          // Savings calculations
          annualSavings: calculation.savings.annual,
          year10Savings: calculation.savings.year10,
          year25Savings: calculation.savings.year25,
          paybackYears: calculation.savings.paybackYears,
          
          // Installation breakdown (for transparency)
          installationBreakdown: calculation.installationBreakdown,
          
          // Complete calculation object (for reference)
          fullCalculation: calculation,
          
          // Chart data (NEW - for production charts and energy flow)
          ...(chartData && {
            monthlyProductionData: JSON.stringify(chartData.monthlyProductionData),
            annualProductionKwh: chartData.annualProductionKwh,
            selfConsumptionPercent: chartData.selfConsumptionPercent,
            selfSufficiencyPercent: chartData.selfSufficiencyPercent,
            selfConsumedKwh: chartData.selfConsumedKwh,
            exportedKwh: chartData.exportedKwh,
            gridImportKwh: chartData.gridImportKwh,
            exportPercent: chartData.exportPercent,
            batteryChargedKwh: chartData.batteryChargedKwh,
            batteryDischargedKwh: chartData.batteryDischargedKwh,
            batteryUsagePercent: chartData.batteryUsagePercent,
          }),
        }),
      });

      if (response.ok) {
        // Store calculation for Step 6
        updateData({
          finalCalculation: calculation,
          selectedProducts: {
            panelId: selectedPanelId,
            panelCount,
            batteryId: selectedBatteryId,
            inverterId: selectedInverterId,
          },
        });
        nextStep();
      } else {
        alert('Failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
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

  const isFormValid = calculation !== null;

  const getSelectedPanel = () => panels.find(p => p.id === selectedPanelId);
  const getSelectedBattery = () => batteries.find(b => b.id === selectedBatteryId);
  const getSelectedInverter = () => inverters.find(i => i.id === selectedInverterId);

  // Sort and paginate products
  const sortedPanels = [...panels].sort((a, b) => {
    const wattageA = a.specifications?.wattage || 0;
    const wattageB = b.specifications?.wattage || 0;
    return wattageB - wattageA; // Descending order
  });

  const sortedBatteries = [...batteries].sort((a, b) => {
    const capacityA = a.specifications?.capacityKwh || 0;
    const capacityB = b.specifications?.capacityKwh || 0;
    return capacityB - capacityA; // Descending order
  });

  const sortedInverters = [...inverters].sort((a, b) => {
    const capacityA = a.specifications?.capacityKw || 0;
    const capacityB = b.specifications?.capacityKw || 0;
    return capacityB - capacityA; // Descending order
  });

  const visiblePanels = sortedPanels.slice(0, visiblePanelCount);
  const visibleBatteries = sortedBatteries.slice(0, visibleBatteryCount);
  const visibleInverters = sortedInverters.slice(0, visibleInverterCount);

  const hasMorePanels = visiblePanelCount < sortedPanels.length;
  const hasMoreBatteries = visibleBatteryCount < sortedBatteries.length;
  const hasMoreInverters = visibleInverterCount < sortedInverters.length;

  if (!selectedPackage) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No package selected. Please go back and choose a system.</p>
        <Button onClick={prevStep} className="mt-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  if (loadingPackage || loadingProducts) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="text-gray-600">
          {loadingPackage ? 'Loading your selected package...' : 'Loading smart product selections...'}
        </p>
      </div>
    );
  }

  const selectedPanel = getSelectedPanel();
  const selectedBattery = getSelectedBattery();
  const selectedInverter = getSelectedInverter();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Your {selectedPackage.displayName}
        </h2>
        <p className="text-lg text-gray-600">
          We've selected premium products that match your package. Review or customize below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column - Product Selection */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Package Info & Customization Status */}
          <Card className={`border-2 ${
            calculation && (
              calculation.systemSpecs.solarKw !== selectedPackage.solarKw ||
              calculation.systemSpecs.batteryKwh !== selectedPackage.batteryKwh
            ) ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <CardContent className="pt-4 lg:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-start sm:items-center space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">Your {selectedPackage.displayName}</h3>
                      {calculation && (
                        calculation.systemSpecs.solarKw !== selectedPackage.solarKw ||
                        calculation.systemSpecs.batteryKwh !== selectedPackage.batteryKwh
                      ) && (
                        <Badge variant="secondary" className="bg-orange-500 text-white">
                          Customized
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Original: {selectedPackage.solarKw}kW Solar + {selectedPackage.batteryKwh}kWh Battery
                    </p>
                    {calculation && (
                      calculation.systemSpecs.solarKw !== selectedPackage.solarKw ||
                      calculation.systemSpecs.batteryKwh !== selectedPackage.batteryKwh
                    ) && (
                      <p className="text-sm text-orange-600 font-medium mt-1">
                        Current: {calculation.systemSpecs.solarKw}kW Solar + {calculation.systemSpecs.batteryKwh}kWh Battery
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  {calculation && (
                    calculation.systemSpecs.solarKw !== selectedPackage.solarKw ||
                    calculation.systemSpecs.batteryKwh !== selectedPackage.batteryKwh
                  ) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Reset to package defaults
                        const tierPanel = panels.find(p => p.tier === selectedPackage.tier) || panels[0];
                        setSelectedPanelId(tierPanel.id);
                        setPanelCount(selectedPackage.panelCount);
                        
                        if (selectedPackage.batteryKwh > 0) {
                          const closestBattery = batteries.reduce((prev, curr) => {
                            const prevDiff = Math.abs((prev.specifications.capacityKwh || 0) - selectedPackage.batteryKwh);
                            const currDiff = Math.abs((curr.specifications.capacityKwh || 0) - selectedPackage.batteryKwh);
                            return currDiff < prevDiff ? curr : prev;
                          });
                          setSelectedBatteryId(closestBattery.id);
                        } else {
                          setSelectedBatteryId(null);
                        }
                        
                        const tierInverter = inverters.find(i => i.tier === selectedPackage.tier) || inverters[0];
                        setSelectedInverterId(tierInverter.id);
                        
                        setCustomizing(false);
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset to Package
                    </Button>
                  )}
                  <Button
                    variant={customizing ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCustomizing(!customizing)}
                  >
                    {customizing ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Done Customizing
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Customize Products
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Solar Panels */}
          <Card className={customizing ? 'border-blue-500 border-2' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span>Solar Panels</span>
                {!customizing && <Badge variant="secondary">Smart Choice</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!customizing && selectedPanel ? (
                // Show selected product card
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{selectedPanel.manufacturer} {selectedPanel.model}</h4>
                      <p className="text-sm text-gray-600">{selectedPanel.tier.toUpperCase()} Tier</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{formatCurrency(selectedPanel.price)}</div>
                      <div className="text-xs text-gray-500">per panel</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Wattage:</span>
                      <span className="font-semibold ml-2">{selectedPanel.specifications.wattage}W</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Warranty:</span>
                      <span className="font-semibold ml-2">{selectedPanel.specifications.warrantyYears} years</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-semibold ml-2">{panelCount} panels</span>
                    </div>
                    <div>
                      <span className="text-gray-600">System Size:</span>
                      <span className="font-semibold ml-2">{calculation?.systemSpecs.solarKw}kW</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Show customization options
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Panel Brand & Model</Label>
                    <div className="text-xs text-gray-500 mb-2">Sorted by wattage (highest first)</div>
                    <div className="space-y-2">
                      {visiblePanels.map((panel) => (
                        <div
                          key={panel.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            selectedPanelId === panel.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => { setSelectedPanelId(panel.id); setHasUserChanges(true); }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h5 className="font-semibold">{panel.manufacturer} {panel.model}</h5>
                                <Badge variant="outline" className="text-xs">{panel.tier}</Badge>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {panel.specifications.wattage}W • {panel.specifications.warrantyYears}yr warranty
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-blue-600">{formatCurrency(panel.price)}</div>
                              <div className="text-xs text-gray-500">per panel</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {hasMorePanels && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setVisiblePanelCount(prev => prev + 5)}
                        >
                          Load More ({sortedPanels.length - visiblePanelCount} remaining)
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="panel-count">Number of Panels</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Input
                        id="panel-count"
                        type="number"
                        value={panelCount}
                        onChange={(e) => {
                          setPanelCount(parseInt(e.target.value) || 0);
                          setHasUserChanges(true);
                        }}
                        min={10}
                        max={100}
                        className="w-32"
                      />
                      <span className="text-sm text-gray-600">
                        = {calculation?.systemSpecs.solarKw}kW system
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Battery */}
          <Card className={customizing ? 'border-blue-500 border-2' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Battery className="w-5 h-5 text-green-600" />
                <span>Battery Storage</span>
                {!customizing && selectedBattery && <Badge variant="secondary">Smart Choice</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!customizing && selectedBattery ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{selectedBattery.manufacturer} {selectedBattery.model}</h4>
                      <p className="text-sm text-gray-600">{selectedBattery.specifications.capacityKwh}kWh Capacity</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatCurrency(selectedBattery.price)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-semibold ml-2">{selectedBattery.specifications.capacityKwh}kWh</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Warranty:</span>
                      <span className="font-semibold ml-2">{selectedBattery.specifications.warrantyYears} years</span>
                    </div>
                  </div>
                </div>
              ) : !customizing && !selectedBattery ? (
                <div className="text-center py-4 text-gray-500">
                  <Battery className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No battery included in this package</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select Battery (Optional)</Label>
                  <div className="text-xs text-gray-500 mb-2">Sorted by capacity (highest first)</div>
                  <div className="space-y-2">
                    <div
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        !selectedBatteryId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedBatteryId('')}
                    >
                      <div className="font-semibold">No Battery</div>
                      <div className="text-sm text-gray-600">Solar only system</div>
                    </div>
                    {visibleBatteries.map((battery) => (
                      <div
                        key={battery.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedBatteryId === battery.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => { setSelectedBatteryId(battery.id); setHasUserChanges(true); }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-semibold">{battery.manufacturer} {battery.model}</h5>
                            <div className="text-sm text-gray-600 mt-1">
                              {battery.specifications.capacityKwh}kWh • {battery.specifications.warrantyYears}yr warranty
                            </div>
                          </div>
                          <div className="font-bold text-green-600">{formatCurrency(battery.price)}</div>
                        </div>
                      </div>
                    ))}
                    {hasMoreBatteries && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setVisibleBatteryCount(prev => prev + 5)}
                      >
                        Load More ({sortedBatteries.length - visibleBatteryCount} remaining)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inverter */}
          <Card className={customizing ? 'border-blue-500 border-2' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-orange-600" />
                <span>Inverter</span>
                {!customizing && <Badge variant="secondary">Smart Choice</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!customizing && selectedInverter ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{selectedInverter.manufacturer} {selectedInverter.model}</h4>
                      <p className="text-sm text-gray-600">{selectedInverter.tier.toUpperCase()} Tier</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">{formatCurrency(selectedInverter.price)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-semibold ml-2">
                        {calculation?.products?.inverter?.capacityKw || 
                         selectedInverter.specifications?.capacityKw || 
                         selectedInverter.specifications.capacityKw || 
                         'N/A'}kW
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Warranty:</span>
                      <span className="font-semibold ml-2">{selectedInverter.specifications.warrantyYears} years</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select Inverter</Label>
                  <div className="text-xs text-gray-500 mb-2">Sorted by capacity (highest first)</div>
                  <div className="space-y-2">
                    {visibleInverters.map((inverter) => (
                      <div
                        key={inverter.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedInverterId === inverter.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => { setSelectedInverterId(inverter.id); setHasUserChanges(true); }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h5 className="font-semibold">{inverter.manufacturer} {inverter.model}</h5>
                              <Badge variant="outline" className="text-xs">{inverter.tier}</Badge>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {inverter.specifications.capacityKw}kW • {inverter.specifications.warrantyYears}yr warranty
                            </div>
                          </div>
                          <div className="font-bold text-orange-600">{formatCurrency(inverter.price)}</div>
                        </div>
                      </div>
                    ))}
                    {hasMoreInverters && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setVisibleInverterCount(prev => prev + 5)}
                      >
                        Load More ({sortedInverters.length - visibleInverterCount} remaining)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add-ons Section */}
          <div id="addon-section">
            <AddonSelectionInline
              selectedAddonIds={selectedAddonIds}
              onSelectionChange={setSelectedAddonIds}
              onTotalChange={setAddonTotal}
            />
          </div>

        </div>

        {/* Right Column - Calculator (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <Card className="border-2 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span>Your Investment</span>
                  </div>
                  {!calculating && calculation && (
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Live</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className={`pt-6 transition-opacity duration-200 ${calculating ? 'opacity-50' : 'opacity-100'}`}>
                {calculating ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <p className="text-sm text-gray-600">Updating prices...</p>
                  </div>
                ) : calculation ? (
                  <div className="space-y-4">
                    {/* System Specs */}
                    <div className="pb-4 border-b">
                      <div className="text-sm text-gray-600 mb-2">System Configuration</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Solar:</span>
                          <span className="font-semibold">{calculation.systemSpecs.solarKw}kW ({calculation.systemSpecs.panelCount} panels)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Battery:</span>
                          <span className="font-semibold">{calculation.systemSpecs.batteryKwh}kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Coverage:</span>
                          <span className="font-semibold text-green-600">{calculation.systemSpecs.coveragePercent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Costs */}
                    <div className="pb-4 border-b">
                      <div className="text-sm text-gray-600 mb-2">Costs</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Panels:</span>
                          <span>{formatCurrency(calculation.costs.panels)}</span>
                        </div>
                        {calculation.costs.battery > 0 && (
                          <div className="flex justify-between">
                            <span>Battery:</span>
                            <span>{formatCurrency(calculation.costs.battery)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Inverter:</span>
                          <span>{formatCurrency(calculation.costs.inverter)}</span>
                        </div>
                        
                        {/* Installation with expandable breakdown */}
                        <div className="pt-2 border-t">
                          <button
                            onClick={() => setShowInstallationDetails(!showInstallationDetails)}
                            className="flex justify-between items-center w-full hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
                          >
                            <div className="flex items-center space-x-1">
                              <Wrench className="w-3 h-3 text-gray-500" />
                              <span>Installation:</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>{formatCurrency(calculation.costs.installation)}</span>
                              {showInstallationDetails ? (
                                <ChevronUp className="w-3 h-3 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                          </button>
                          
                          {/* Installation Breakdown - ENHANCED */}
                          {showInstallationDetails && calculation.installationBreakdown && (
                            <div className="mt-2 space-y-2 text-xs bg-gray-50 p-3 rounded border border-gray-200">
                              {/* Base Components */}
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-700 mb-1">Base Installation</div>
                                <div className="flex justify-between pl-2">
                                  <span>Callout & Setup:</span>
                                  <span>{formatCurrency(calculation.installationBreakdown.baseCalloutFee)}</span>
                                </div>
                                {calculation.installationBreakdown.panelInstallation && (
                                  <div className="flex justify-between pl-2">
                                    <span>Panel Install ({calculation.systemSpecs.panelCount} panels):</span>
                                    <span>{formatCurrency(calculation.installationBreakdown.panelInstallation)}</span>
                                  </div>
                                )}
                                {calculation.installationBreakdown.railingInstallation && (
                                  <div className="flex justify-between pl-2">
                                    <span>Railing & Mounting:</span>
                                    <span>{formatCurrency(calculation.installationBreakdown.railingInstallation)}</span>
                                  </div>
                                )}
                                {calculation.installationBreakdown.inverterInstallation && (
                                  <div className="flex justify-between pl-2">
                                    <span>Inverter Install:</span>
                                    <span>{formatCurrency(calculation.installationBreakdown.inverterInstallation)}</span>
                                  </div>
                                )}
                                {calculation.installationBreakdown.batteryInstallation > 0 && (
                                  <div className="flex justify-between pl-2">
                                    <span>Battery Install:</span>
                                    <span>{formatCurrency(calculation.installationBreakdown.batteryInstallation)}</span>
                                  </div>
                                )}
                                {calculation.installationBreakdown.cablingInstallation && (
                                  <div className="flex justify-between pl-2">
                                    <span>Cabling & Wiring:</span>
                                    <span>{formatCurrency(calculation.installationBreakdown.cablingInstallation)}</span>
                                  </div>
                                )}
                                {calculation.installationBreakdown.commissioning && (
                                  <div className="flex justify-between pl-2">
                                    <span>Commissioning:</span>
                                    <span>{formatCurrency(calculation.installationBreakdown.commissioning)}</span>
                                  </div>
                                )}
                              </div>

                              {/* Addon Installations */}
                              {calculation.installationBreakdown.addonInstallations?.length > 0 && (
                                <div className="space-y-1 pt-2 border-t border-gray-300">
                                  <div className="font-semibold text-gray-700 mb-1">Addon Installations</div>
                                  {calculation.installationBreakdown.addonInstallations.map((addon: any, idx: number) => (
                                    <div key={idx} className="flex justify-between pl-2 text-purple-700">
                                      <span>{addon.name}:</span>
                                      <span>+{formatCurrency(addon.cost)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Complexity Adjustments */}
                              {(calculation.installationBreakdown.roofTypeAdjustment > 0 ||
                                calculation.installationBreakdown.storyAdjustment > 0 ||
                                calculation.installationBreakdown.accessAdjustment > 0) && (
                                <div className="space-y-1 pt-2 border-t border-gray-300">
                                  <div className="font-semibold text-orange-700 mb-1">Complexity Adjustments</div>
                                  {calculation.installationBreakdown.roofTypeAdjustment > 0 && (
                                    <div className="flex justify-between pl-2 text-orange-600">
                                      <span>Roof Type ({Math.round((calculation.installationBreakdown.roofTypeMultiplier - 1) * 100)}%):</span>
                                      <span>+{formatCurrency(calculation.installationBreakdown.roofTypeAdjustment)}</span>
                                    </div>
                                  )}
                                  {calculation.installationBreakdown.storyAdjustment > 0 && (
                                    <div className="flex justify-between pl-2 text-orange-600">
                                      <span>Two-Story ({Math.round((calculation.installationBreakdown.storyMultiplier - 1) * 100)}%):</span>
                                      <span>+{formatCurrency(calculation.installationBreakdown.storyAdjustment)}</span>
                                    </div>
                                  )}
                                  {calculation.installationBreakdown.accessAdjustment > 0 && (
                                    <div className="flex justify-between pl-2 text-orange-600">
                                      <span>Difficult Access ({Math.round((calculation.installationBreakdown.accessMultiplier - 1) * 100)}%):</span>
                                      <span>+{formatCurrency(calculation.installationBreakdown.accessAdjustment)}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Fixed Additions */}
                              {(calculation.installationBreakdown.scaffoldingCost > 0 ||
                                calculation.installationBreakdown.asbestosCost > 0) && (
                                <div className="space-y-1 pt-2 border-t border-gray-300">
                                  <div className="font-semibold text-red-700 mb-1">Additional Requirements</div>
                                  {calculation.installationBreakdown.scaffoldingCost > 0 && (
                                    <div className="flex justify-between pl-2 text-red-600">
                                      <span>Scaffolding Required:</span>
                                      <span>+{formatCurrency(calculation.installationBreakdown.scaffoldingCost)}</span>
                                    </div>
                                  )}
                                  {calculation.installationBreakdown.asbestosCost > 0 && (
                                    <div className="flex justify-between pl-2 text-red-600">
                                      <span>Asbestos Removal:</span>
                                      <span>+{formatCurrency(calculation.installationBreakdown.asbestosCost)}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Total */}
                              <div className="flex justify-between pt-2 border-t-2 border-gray-400 font-semibold text-gray-900">
                                <span>Total Installation:</span>
                                <span>{formatCurrency(calculation.costs.installation)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(calculation.costs.subtotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rebates */}
                    <div className="pb-4 border-b">
                      <div className="text-sm text-gray-600 mb-2">Rebates</div>
                      <div className="space-y-1 text-sm text-green-700">
                        <div className="flex justify-between">
                          <span>Federal Solar:</span>
                          <span>-{formatCurrency(calculation.rebates.federalSolar)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1">
                            <span>Federal Battery:</span>
                            {calculation.rebates.federalBattery >= 5000 && (
                              <span className="text-xs text-orange-500" title="WA combined cap applied">ⓘ</span>
                            )}
                          </div>
                          <span>-{formatCurrency(calculation.rebates.federalBattery)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1">
                            <span>WA State Battery:</span>
                            {calculation.rebates.stateBattery === 0 && calculation.rebates.federalBattery >= 5000 && (
                              <span className="text-xs text-gray-400" title="Combined cap reached">ⓘ</span>
                            )}
                          </div>
                          <span>
                            {calculation.rebates.stateBattery > 0 
                              ? `-${formatCurrency(calculation.rebates.stateBattery)}`
                              : '$0'}
                          </span>
                        </div>
                        {(calculation.rebates.federalBattery + calculation.rebates.stateBattery > 5000) && (
                          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">
                            <Info className="w-3 h-3 inline mr-1" />
                            WA cap applied: When total battery rebates exceed $5,000, WA state rebate is capped at $1,300. Federal rebate shows actual amount for battery (up to 50kWh max).
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total Rebates:</span>
                          <span>-{formatCurrency(calculation.rebates.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Add-ons (if selected) - ENHANCED */}
                    {addonTotal > 0 && (
                      <div className="pb-4 border-b">
                        <div className="text-sm text-gray-600 mb-2 flex items-center justify-between">
                          <span>Add-ons ({selectedAddonIds.length})</span>
                          <button
                            onClick={() => {
                              document.getElementById('addon-section')?.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center' 
                              });
                            }}
                            className="text-xs text-purple-600 hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="space-y-1 text-sm">
                          {addonDetails.map((addon) => (
                            <div key={addon.id} className="flex justify-between items-start">
                              <span className="text-gray-700 text-xs leading-tight flex-1">
                                {addon.name}
                              </span>
                              <span className="text-purple-600 font-medium ml-2">
                                +{formatCurrency(addon.totalCost)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                            <span>Add-ons Total:</span>
                            <span className="text-purple-600">+{formatCurrency(addonTotal)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Final Investment */}
                    <div className="bg-blue-50 rounded-lg p-4 relative">
                      {!calculating && calculation && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      <div className="text-sm text-gray-600 mb-1">Final Investment</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {formatCurrency(calculation.finalInvestment + addonTotal)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {addonTotal > 0 ? 'After rebates + add-ons' : 'After all rebates'}
                      </div>
                    </div>

                    {/* Savings */}
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600 mb-2">Savings</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Annual:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(calculation.savings.annual)}/year</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payback:</span>
                          <span className="font-semibold">{calculation.savings.paybackYears} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span>25-Year Savings:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(calculation.savings.year25)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select products to see pricing
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Charts Section - Show after calculation is complete */}
      {calculation && calculation.systemSpecs && data.dailyConsumption && (
        <div className="mt-12">
          <ChartsSection
            systemSizeKw={calculation.systemSpecs.solarKw}
            batterySizeKwh={calculation.systemSpecs.batteryKwh}
            dailyConsumption={data.dailyConsumption}
            totalCostAfterRebates={calculation.finalInvestment + addonTotal}
            annualSavings={calculation.savings.annual}
            electricityRate={0.27}
            feedInTariff={0.07}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-8">
        <Button onClick={prevStep} variant="outline" size="lg" className="w-full sm:w-auto">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!isFormValid || submitting}
          size="lg"
          className="w-full sm:w-auto sm:min-w-[200px]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to Contact
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
