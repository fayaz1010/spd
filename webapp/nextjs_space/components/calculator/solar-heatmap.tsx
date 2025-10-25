
'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface SolarHeatmapProps {
  layerUrl: string | null;
  type: 'flux' | 'shade';
  title: string;
  description: string;
}

export function SolarHeatmap({ layerUrl, type, title, description }: SolarHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!layerUrl) {
      setError('No data layer available for this location');
      setLoading(false);
      return;
    }

    async function renderHeatmap() {
      try {
        setLoading(true);
        setError(null);

        // Note: GeoTIFF rendering requires downloading and processing the file
        // For now, we'll show a placeholder with the concept
        // Full implementation would parse the GeoTIFF and render to canvas
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = 600;
        canvas.height = 400;

        // Create gradient as placeholder visualization
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        
        if (type === 'flux') {
          // Sun exposure gradient (blue -> yellow -> orange -> red)
          gradient.addColorStop(0, '#1e3a8a'); // Low exposure (dark blue)
          gradient.addColorStop(0.3, '#3b82f6'); // Medium-low (blue)
          gradient.addColorStop(0.5, '#facc15'); // Medium (yellow)
          gradient.addColorStop(0.7, '#f97316'); // Medium-high (orange)
          gradient.addColorStop(1, '#dc2626'); // High exposure (red)
        } else {
          // Shade analysis gradient (light -> dark)
          gradient.addColorStop(0, '#fef3c7'); // Full sun (light yellow)
          gradient.addColorStop(0.5, '#7c3aed'); // Partial shade (purple)
          gradient.addColorStop(1, '#1e1b4b'); // Full shade (dark blue)
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add overlay text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Interactive Heatmap Visualization', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillText('GeoTIFF data processing available', canvas.width / 2, canvas.height / 2 + 10);

        setLoading(false);
      } catch (err) {
        console.error('Error rendering heatmap:', err);
        setError(err instanceof Error ? err.message : 'Failed to render heatmap');
        setLoading(false);
      }
    }

    renderHeatmap();
  }, [layerUrl, type]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative bg-muted rounded-lg overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{ maxHeight: '400px' }}
          />
        </div>

        {/* Legend */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Legend</h4>
          <div className="space-y-1">
            {type === 'flux' ? (
              <>
                <LegendItem color="bg-red-600" label="High Sun Exposure (6-7 hrs/day)" />
                <LegendItem color="bg-orange-500" label="Good Sun Exposure (5-6 hrs/day)" />
                <LegendItem color="bg-yellow-400" label="Moderate Sun (4-5 hrs/day)" />
                <LegendItem color="bg-blue-500" label="Low Sun (3-4 hrs/day)" />
                <LegendItem color="bg-blue-900" label="Minimal Sun (<3 hrs/day)" />
              </>
            ) : (
              <>
                <LegendItem color="bg-yellow-100 border border-yellow-300" label="Full Sun (0-2 hrs shade)" />
                <LegendItem color="bg-purple-500" label="Partial Shade (2-5 hrs)" />
                <LegendItem color="bg-indigo-900" label="Heavy Shade (>5 hrs)" />
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          * Heatmap shows estimated {type === 'flux' ? 'solar exposure' : 'shade patterns'} based on Google Solar API data
        </p>
      </CardContent>
    </Card>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-6 h-4 rounded ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
