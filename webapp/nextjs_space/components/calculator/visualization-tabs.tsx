
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SolarHeatmap } from './solar-heatmap';
import { MonthlyProductionChart } from './monthly-production-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface VisualizationTabsProps {
  latitude: number;
  longitude: number;
  systemSizeKw: number;
  quarterlyBill: number;
  roofAnalysis?: any;
}

export function VisualizationTabs({ 
  latitude, 
  longitude, 
  systemSizeKw, 
  quarterlyBill,
  roofAnalysis 
}: VisualizationTabsProps) {
  const [layers, setLayers] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLayers = async () => {
    if (layers) return; // Already fetched

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/solar-layers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude, radius: 100 }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch solar layer data');
      }

      const data = await response.json();
      setLayers(data.layers);
    } catch (err) {
      console.error('Error fetching layers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load visualization data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Advanced Solar Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Explore detailed solar production forecasts and visualization data for your property
        </p>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">Monthly Forecast</TabsTrigger>
          <TabsTrigger value="annual" onClick={fetchLayers}>Annual Exposure</TabsTrigger>
          <TabsTrigger value="shade" onClick={fetchLayers}>Shade Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-6">
          <MonthlyProductionChart 
            systemSizeKw={systemSizeKw}
            quarterlyBill={quarterlyBill}
            roofAnalysis={roofAnalysis}
          />
        </TabsContent>

        <TabsContent value="annual" className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading visualization data...</span>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardHeader>
                <CardTitle>Annual Sun Exposure</CardTitle>
                <CardDescription>Unable to load heatmap data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-6 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Advanced visualization data may not be available for all locations
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <SolarHeatmap 
              layerUrl={layers?.annualFlux}
              type="flux"
              title="Annual Sun Exposure Heatmap"
              description="Visual representation of solar exposure across your roof throughout the year"
            />
          )}
        </TabsContent>

        <TabsContent value="shade" className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading visualization data...</span>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardHeader>
                <CardTitle>Shade Analysis</CardTitle>
                <CardDescription>Unable to load shade data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-6 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Advanced visualization data may not be available for all locations
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <SolarHeatmap 
              layerUrl={layers?.hourlyShade?.[0]}
              type="shade"
              title="Shade Pattern Analysis"
              description="Identify shaded areas on your roof that may impact solar panel performance"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
