
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, Zap, DollarSign, TrendingUp, Leaf } from 'lucide-react';
import { SystemConfiguration } from '@/lib/recommendation-engine';
import { formatCurrency, formatNumber } from '@/lib/calculations';

interface ConfigurationCardProps {
  config: SystemConfiguration;
  selected: boolean;
  onSelect: () => void;
}

export function ConfigurationCard({ config, selected, onSelect }: ConfigurationCardProps) {
  const priorityColors = {
    recommended: 'bg-green-500',
    high: 'bg-blue-500',
    medium: 'bg-yellow-500',
    low: 'bg-gray-500'
  };

  const priorityLabels = {
    recommended: 'Recommended',
    high: 'Popular Choice',
    medium: 'Good Option',
    low: 'Alternative'
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg ${
        selected ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''
      }`}
      onClick={onSelect}
    >
      {/* Priority Badge */}
      <div className="absolute top-4 right-4">
        <Badge className={`${priorityColors[config.priority]} text-white border-none`}>
          {priorityLabels[config.priority]}
        </Badge>
      </div>

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-2xl font-bold">{config.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
            </div>
          </div>
          
          <div className="bg-primary/10 rounded-lg p-3 mt-3">
            <p className="text-sm font-medium text-primary">{config.useCase}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>System Size</span>
            </div>
            <p className="text-2xl font-bold">{config.systemKw.toFixed(1)} kW</p>
            <p className="text-xs text-muted-foreground">{config.numPanels} × {config.panelWattage}W panels</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Investment</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(config.estimatedCost)}</p>
            <p className="text-xs text-green-600">After rebates</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Annual Savings</span>
            </div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(config.annualSavings)}</p>
            <p className="text-xs text-muted-foreground">Payback: {config.paybackYears.toFixed(1)} years</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4" />
              <span>CO₂ Offset</span>
            </div>
            <p className="text-xl font-bold text-green-600">{config.co2SavedPerYear.toFixed(1)}t</p>
            <p className="text-xs text-muted-foreground">{config.equivalentTrees} trees/year</p>
          </div>
        </div>

        {/* Financial Highlight */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">25-Year Savings</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(config.savings25Years)}</p>
          <p className="text-xs text-muted-foreground mt-1">After all costs</p>
        </div>

        {/* Battery Recommendation */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
          <p className="text-sm font-medium mb-1">Recommended Battery</p>
          <p className="text-lg font-bold">{config.recommendedBatteryKwh} kWh</p>
          <p className="text-xs text-muted-foreground">
            Range: {config.minBatteryKwh}-{config.maxBatteryKwh} kWh
          </p>
        </div>

        {/* Roof Utilization */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Roof Space Used</span>
            <span className="font-semibold">{config.roofUtilization}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${config.roofUtilization}%` }}
            />
          </div>
        </div>

        {/* Pros and Cons */}
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-green-600">Advantages</p>
            <ul className="space-y-1">
              {config.pros.slice(0, 3).map((pro, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Select Button */}
        <Button 
          className="w-full"
          variant={selected ? "default" : "outline"}
          size="lg"
        >
          {selected ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Selected Configuration
            </>
          ) : (
            <>
              Select This Configuration
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
