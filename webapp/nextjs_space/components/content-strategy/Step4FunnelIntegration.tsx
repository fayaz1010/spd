'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ArrowLeft,
  Calculator,
  Package,
  ShoppingCart,
  Wrench,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Step4Props {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export function Step4FunnelIntegration({ data, onComplete, onBack }: Step4Props) {
  const [funnelConfig, setFunnelConfig] = useState({
    calculatorEnabled: data.funnelConfig?.calculatorEnabled ?? true,
    calculatorPlacements: data.funnelConfig?.calculatorPlacements ?? ['INTRO', 'MIDDLE', 'CONCLUSION'],
    packagesEnabled: data.funnelConfig?.packagesEnabled ?? true,
    packageTypes: data.funnelConfig?.packageTypes ?? ['6.6kW', '10kW', '13.2kW'],
    productsEnabled: data.funnelConfig?.productsEnabled ?? true,
    productCategories: data.funnelConfig?.productCategories ?? ['panels', 'inverters', 'batteries'],
    servicesEnabled: data.funnelConfig?.servicesEnabled ?? true,
    serviceTypes: data.funnelConfig?.serviceTypes ?? ['installation', 'maintenance', 'design'],
  });

  const handleToggle = (field: string) => {
    setFunnelConfig({ ...funnelConfig, [field]: !funnelConfig[field] });
  };

  const handlePlacementToggle = (placement: string) => {
    const placements = funnelConfig.calculatorPlacements;
    if (placements.includes(placement)) {
      setFunnelConfig({
        ...funnelConfig,
        calculatorPlacements: placements.filter(p => p !== placement),
      });
    } else {
      setFunnelConfig({
        ...funnelConfig,
        calculatorPlacements: [...placements, placement],
      });
    }
  };

  const handleContinue = () => {
    onComplete({ funnelConfig });
  };

  const totalClusters = Object.values(data.clusters || {}).reduce((sum: number, arr: any) => sum + arr.length, 0);
  const totalArticles = (data.pillars?.length || 0) + totalClusters;

  // Estimate funnel touchpoints
  const calculatorTouchpoints = funnelConfig.calculatorEnabled 
    ? totalArticles * funnelConfig.calculatorPlacements.length 
    : 0;
  const packageTouchpoints = funnelConfig.packagesEnabled ? Math.floor(totalArticles * 0.6) : 0;
  const productTouchpoints = funnelConfig.productsEnabled ? Math.floor(totalArticles * 0.4) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Step 4: Configure Funnel Integration</h2>
        <p className="text-gray-600">
          Automatically integrate conversion funnels (calculator, packages, products) into your content.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/20 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Estimated Funnel Touchpoints</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-green-600">{totalArticles}</p>
            <p className="text-sm text-gray-600">Articles</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{calculatorTouchpoints}</p>
            <p className="text-sm text-gray-600">Calculator CTAs</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{packageTouchpoints}</p>
            <p className="text-sm text-gray-600">Package Links</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{productTouchpoints}</p>
            <p className="text-sm text-gray-600">Product Links</p>
          </div>
        </div>
      </div>

      {/* Calculator Integration */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-coral/10 rounded-lg flex items-center justify-center">
              <Calculator className="w-6 h-6 text-coral" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Solar Calculator Widget</h3>
              <p className="text-sm text-gray-600">Interactive calculator for instant quotes</p>
            </div>
          </div>
          <Button
            variant={funnelConfig.calculatorEnabled ? "default" : "outline"}
            onClick={() => handleToggle('calculatorEnabled')}
            className={funnelConfig.calculatorEnabled ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {funnelConfig.calculatorEnabled ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Enabled
              </>
            ) : (
              'Disabled'
            )}
          </Button>
        </div>

        {funnelConfig.calculatorEnabled && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700">Placement Options:</p>
            <div className="grid grid-cols-3 gap-3">
              {['INTRO', 'MIDDLE', 'CONCLUSION'].map((placement) => (
                <button
                  key={placement}
                  onClick={() => handlePlacementToggle(placement)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    funnelConfig.calculatorPlacements.includes(placement)
                      ? 'border-coral bg-coral/10 text-coral'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {placement === 'INTRO' && 'After Introduction'}
                  {placement === 'MIDDLE' && 'Middle of Article'}
                  {placement === 'CONCLUSION' && 'Before Conclusion'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 italic">
              💡 Calculator will appear {funnelConfig.calculatorPlacements.length} time(s) per article
            </p>
          </div>
        )}
      </div>

      {/* Package Links */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Solar Packages</h3>
              <p className="text-sm text-gray-600">Link to pre-configured system packages</p>
            </div>
          </div>
          <Button
            variant={funnelConfig.packagesEnabled ? "default" : "outline"}
            onClick={() => handleToggle('packagesEnabled')}
            className={funnelConfig.packagesEnabled ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {funnelConfig.packagesEnabled ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Enabled
              </>
            ) : (
              'Disabled'
            )}
          </Button>
        </div>

        {funnelConfig.packagesEnabled && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              ✅ Will link to: /shop/packages
              <br />
              ✅ Featured packages: 6.6kW, 10kW, 13.2kW systems
              <br />
              ✅ Contextual placement based on article content
            </p>
          </div>
        )}
      </div>

      {/* Product Links */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Product Catalog</h3>
              <p className="text-sm text-gray-600">Link to specific panels, inverters, batteries</p>
            </div>
          </div>
          <Button
            variant={funnelConfig.productsEnabled ? "default" : "outline"}
            onClick={() => handleToggle('productsEnabled')}
            className={funnelConfig.productsEnabled ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {funnelConfig.productsEnabled ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Enabled
              </>
            ) : (
              'Disabled'
            )}
          </Button>
        </div>

        {funnelConfig.productsEnabled && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              ✅ Will link to: /shop/panels, /shop/inverters, /shop/batteries
              <br />
              ✅ Product mentions in comparison articles
              <br />
              ✅ Spec tables with purchase links
            </p>
          </div>
        )}
      </div>

      {/* Service Links */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Service Booking</h3>
              <p className="text-sm text-gray-600">Link to installation, maintenance, design services</p>
            </div>
          </div>
          <Button
            variant={funnelConfig.servicesEnabled ? "default" : "outline"}
            onClick={() => handleToggle('servicesEnabled')}
            className={funnelConfig.servicesEnabled ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {funnelConfig.servicesEnabled ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Enabled
              </>
            ) : (
              'Disabled'
            )}
          </Button>
        </div>

        {funnelConfig.servicesEnabled && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              ✅ Will link to: /extra-services
              <br />
              ✅ Installation booking CTAs
              <br />
              ✅ Free consultation offers
            </p>
          </div>
        )}
      </div>

      {/* Funnel Strategy Summary */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-3">🎯 Funnel Strategy</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Awareness Stage:</strong> Cluster articles with calculator CTAs</p>
          <p><strong>Consideration Stage:</strong> Pillar articles with package comparisons</p>
          <p><strong>Decision Stage:</strong> Product links and service booking</p>
          <p className="pt-2 border-t text-gray-600 italic">
            AI will automatically place these elements based on article intent and user journey stage.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleContinue} className="bg-coral hover:bg-coral/90">
          Continue to Review
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
