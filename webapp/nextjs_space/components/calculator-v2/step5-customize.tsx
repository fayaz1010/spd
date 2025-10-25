'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Loader2, Zap, Battery, Settings, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';
import { CalculatorData } from './calculator-flow-v2';

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

export function Step5Customize({ data, updateData, nextStep, prevStep }: Step5Props) {
  // Package data - load from local state or database
  const [selectedPackage, setSelectedPackage] = useState<any>((data as any).selectedPackage);
  const [loadingPackage, setLoadingPackage] = useState(!selectedPackage);

  // Products
  const [panels, setPanels] = useState<Product[]>([]);
  const [batteries, setBatteries] = useState<Product[]>([]);
  const [inverters, setInverters] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Selected products
  const [selectedPanelId, setSelectedPanelId] = useState<string>('');
  const [panelCount, setPanelCount] = useState<number>(0);
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>('');
  const [selectedInverterId, setSelectedInverterId] = useState<string>('');

  // Calculation
  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Contact form
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    preferredTime: '',
    notes: '',
    agreedToTerms: false,
  });

  const [submitting, setSubmitting] = useState(false);

  // Load selected package from database if not in local state
  useEffect(() => {
    if (selectedPackage || !data.sessionId) return;

    async function loadPackageFromDB() {
      try {
        setLoadingPackage(true);
        const response = await fetch(`/api/quotes/session/${data.sessionId}`);
        
        if (response.ok) {
          const result = await response.json();
          const quote = result.quote;
          
          // Reconstruct package from saved data
          if (quote.selectedPackageId) {
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
            updateData({ selectedPackage: packageData });
            console.log('✅ Loaded package from database:', packageData.displayName);
          }
        }
      } catch (error) {
        console.error('Error loading package from database:', error);
      } finally {
        setLoadingPackage(false);
      }
    }

    loadPackageFromDB();
  }, [data.sessionId, selectedPackage, updateData]);

  // Load products on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/products/active');
        const result = await response.json();
        
        if (result.success) {
          setPanels(result.products.panels);
          setBatteries(result.products.batteries);
          setInverters(result.products.inverters);
          
          // Set initial selections from package
          if (selectedPackage && result.products.panels.length > 0) {
            // Select first panel of appropriate tier
            const defaultPanel = result.products.panels[0];
            setSelectedPanelId(defaultPanel.id);
            setPanelCount(selectedPackage.panelCount || 20);
            
            // Select battery if package includes one
            if (selectedPackage.batteryKwh > 0 && result.products.batteries.length > 0) {
              const closestBattery = result.products.batteries.reduce((prev: Product, curr: Product) => {
                const prevDiff = Math.abs((prev.specifications.capacityKwh || 0) - selectedPackage.batteryKwh);
                const currDiff = Math.abs((curr.specifications.capacityKwh || 0) - selectedPackage.batteryKwh);
                return currDiff < prevDiff ? curr : prev;
              });
              setSelectedBatteryId(closestBattery.id);
            }
            
            // Select first inverter
            if (result.products.inverters.length > 0) {
              setSelectedInverterId(result.products.inverters[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, [selectedPackage]);

  // Recalculate when selections change
  useEffect(() => {
    if (!selectedPanelId || !selectedInverterId || !data.sessionId) return;

    async function calculate() {
      try {
        setCalculating(true);
        const response = await fetch('/api/quotes/calculate-custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data.sessionId,
            panelProductId: selectedPanelId,
            panelCount,
            batteryProductId: selectedBatteryId || null,
            inverterProductId: selectedInverterId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setCalculation(result);
        }
      } catch (error) {
        console.error('Error calculating:', error);
      } finally {
        setCalculating(false);
      }
    }

    calculate();
  }, [selectedPanelId, panelCount, selectedBatteryId, selectedInverterId, data.sessionId]);

  const handleSubmit = async () => {
    if (!calculation || !contactInfo.agreedToTerms) return;

    try {
      setSubmitting(true);

      const response = await fetch('/api/quotes/save-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data.sessionId,
          selectedProducts: {
            panelId: selectedPanelId,
            panelCount,
            batteryId: selectedBatteryId || null,
            inverterId: selectedInverterId,
          },
          calculation,
          contactInfo,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        updateData({
          quoteId: result.quoteId,
          leadId: result.leadId,
          finalCalculation: calculation,
        });
        nextStep();
      } else {
        alert('Failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting:', error);
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

  const isFormValid = contactInfo.name && 
                      contactInfo.email && 
                      contactInfo.phone && 
                      contactInfo.agreedToTerms &&
                      calculation;

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
          {loadingPackage ? 'Loading your selected package...' : 'Loading products...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Customize Your {selectedPackage.displayName}
        </h2>
        <p className="text-lg text-gray-600">
          Fine-tune your system and see real-time pricing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Solar Panels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span>Solar Panels</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="panel-brand">Panel Brand & Model</Label>
                <Select value={selectedPanelId} onValueChange={setSelectedPanelId}>
                  <SelectTrigger id="panel-brand">
                    <SelectValue placeholder="Select panel" />
                  </SelectTrigger>
                  <SelectContent>
                    {panels.map((panel) => (
                      <SelectItem key={panel.id} value={panel.id}>
                        {panel.manufacturer} {panel.model} - {panel.specifications.wattage}W ({formatCurrency(panel.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="panel-count">Number of Panels</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="panel-count"
                    type="number"
                    value={panelCount}
                    onChange={(e) => setPanelCount(parseInt(e.target.value) || 0)}
                    min={10}
                    max={100}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600">
                    {calculation?.systemSpecs.solarKw}kW system
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Battery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Battery className="w-5 h-5 text-green-600" />
                <span>Battery Storage</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="battery">Battery Model (Optional)</Label>
                <Select value={selectedBatteryId || 'none'} onValueChange={(val) => setSelectedBatteryId(val === 'none' ? '' : val)}>
                  <SelectTrigger id="battery">
                    <SelectValue placeholder="No battery" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Battery</SelectItem>
                    {batteries.map((battery) => (
                      <SelectItem key={battery.id} value={battery.id}>
                        {battery.manufacturer} {battery.model} - {battery.specifications.capacityKwh}kWh ({formatCurrency(battery.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Inverter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-orange-600" />
                <span>Inverter</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="inverter">Inverter Brand & Model</Label>
                <Select value={selectedInverterId} onValueChange={setSelectedInverterId}>
                  <SelectTrigger id="inverter">
                    <SelectValue placeholder="Select inverter" />
                  </SelectTrigger>
                  <SelectContent>
                    {inverters.map((inverter) => (
                      <SelectItem key={inverter.id} value={inverter.id}>
                        {inverter.manufacturer} {inverter.model} - {inverter.specifications.capacityKw}kW ({formatCurrency(inverter.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Your Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    placeholder="0400 000 000"
                  />
                </div>
                <div>
                  <Label htmlFor="preferred-time">Preferred Contact Time</Label>
                  <Select
                    value={contactInfo.preferredTime}
                    onValueChange={(value) => setContactInfo({ ...contactInfo, preferredTime: value })}
                  >
                    <SelectTrigger id="preferred-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (9am-12pm)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                      <SelectItem value="evening">Evening (5pm-7pm)</SelectItem>
                      <SelectItem value="anytime">Anytime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={contactInfo.notes}
                  onChange={(e) => setContactInfo({ ...contactInfo, notes: e.target.value })}
                  placeholder="Any special requirements or questions?"
                  rows={3}
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={contactInfo.agreedToTerms}
                  onCheckedChange={(checked) => 
                    setContactInfo({ ...contactInfo, agreedToTerms: checked as boolean })
                  }
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to be contacted about my solar quote and accept the terms and conditions
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Calculator (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <Card className="border-2 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span>Your Custom System</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {calculating ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <p className="text-sm text-gray-600">Calculating...</p>
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
                        <div className="flex justify-between">
                          <span>Installation:</span>
                          <span>{formatCurrency(calculation.costs.installation)}</span>
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
                        {calculation.rebates.federalBattery > 0 && (
                          <div className="flex justify-between">
                            <span>Federal Battery:</span>
                            <span>-{formatCurrency(calculation.rebates.federalBattery)}</span>
                          </div>
                        )}
                        {calculation.rebates.stateBattery > 0 && (
                          <div className="flex justify-between">
                            <span>State Battery:</span>
                            <span>-{formatCurrency(calculation.rebates.stateBattery)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total Rebates:</span>
                          <span>-{formatCurrency(calculation.rebates.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Final Investment */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Final Investment</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {formatCurrency(calculation.finalInvestment)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">After all rebates</div>
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

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        <Button onClick={prevStep} variant="outline" size="lg">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || submitting}
          size="lg"
          className="min-w-[200px]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Get My Quote
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
