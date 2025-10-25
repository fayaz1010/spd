
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Layers, Info, ZoomIn, ZoomOut } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PanelOverlayControlsProps {
  showPanelOverlay: boolean;
  onToggleOverlay: (show: boolean) => void;
  showHeatmap?: boolean;
  onToggleHeatmap?: (show: boolean) => void;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function PanelOverlayControls({
  showPanelOverlay,
  onToggleOverlay,
  showHeatmap = false,
  onToggleHeatmap,
  zoomLevel = 20,
  onZoomIn,
  onZoomOut
}: PanelOverlayControlsProps) {
  return (
    <Card className="absolute top-4 right-4 z-10 shadow-xl border-2 border-white/80">
      <CardContent className="p-3 space-y-3">
        {/* Panel Overlay Toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <Label htmlFor="panel-overlay" className="text-sm font-medium cursor-pointer">
              Panel Layout
            </Label>
          </div>
          <Switch
            id="panel-overlay"
            checked={showPanelOverlay}
            onCheckedChange={onToggleOverlay}
          />
        </div>

        {/* Heatmap Toggle */}
        {onToggleHeatmap && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-gold" />
              <Label htmlFor="heatmap" className="text-sm font-medium cursor-pointer">
                Sun Heatmap
              </Label>
            </div>
            <Switch
              id="heatmap"
              checked={showHeatmap}
              onCheckedChange={onToggleHeatmap}
            />
          </div>
        )}

        {/* Zoom Controls */}
        {onZoomIn && onZoomOut && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onZoomOut}
                disabled={zoomLevel <= 18}
                className="flex-1"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs font-medium text-gray-600 px-2">
                {zoomLevel}x
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={onZoomIn}
                disabled={zoomLevel >= 22}
                className="flex-1"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Info Text */}
        <div className="flex items-start gap-2 pt-2 border-t">
          <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600 leading-tight">
            Toggle layers to see your actual roof with proposed panel placement
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Sun({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}
