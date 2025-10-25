'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, ImageOverlay, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}

interface Panel {
  id: string;
  latitude: number;
  longitude: number;
  orientationDegrees: number;
  segmentIndex: number;
  wattage: number;
  yearlyEnergyKwh: number;
  stringId?: string;
}

interface RoofSegment {
  pitchDegrees: number;
  azimuthDegrees: number;
  areaMeters2: number;
  centerLatitude?: number;
  centerLongitude?: number;
  boundingBox?: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  stats?: {
    sunshineQuantiles: number[];
  };
}

interface PanelMapCanvasProps {
  centerLat: number;
  centerLng: number;
  panels: Panel[];
  roofSegments: RoofSegment[];
  selectedPanel: Panel | null;
  onPanelSelect: (panel: Panel) => void;
  onPanelMove: (panelId: string, newLat: number, newLng: number) => void;
  panelWidthMeters: number;
  panelHeightMeters: number;
  rgbUrl?: string;
}

// Component to handle map zoom controls
function MapController() {
  const map = useMap();
  
  useEffect(() => {
    // Set initial zoom
    map.setZoom(20);
  }, [map]);
  
  return null;
}

// Component to render a single panel as a rectangle
function PanelRectangle({ 
  panel, 
  selected, 
  onSelect, 
  onDragEnd,
  panelWidthMeters,
  panelHeightMeters 
}: { 
  panel: Panel;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (lat: number, lng: number) => void;
  panelWidthMeters: number;
  panelHeightMeters: number;
}) {
  const map = useMap();
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<[number, number]>([panel.latitude, panel.longitude]);
  
  useEffect(() => {
    setPosition([panel.latitude, panel.longitude]);
  }, [panel.latitude, panel.longitude]);
  
  // Convert meters to degrees (approximate)
  const metersToLat = (meters: number) => meters / 111320;
  const metersToLng = (meters: number, lat: number) => meters / (111320 * Math.cos(lat * Math.PI / 180));
  
  // Calculate panel corners based on orientation
  const halfWidth = panelWidthMeters / 2;
  const halfHeight = panelHeightMeters / 2;
  
  const latOffset = metersToLat(halfHeight);
  const lngOffset = metersToLng(halfWidth, position[0]);
  
  // Create rectangle bounds
  const bounds: [number, number][] = [
    [position[0] - latOffset, position[1] - lngOffset], // SW
    [position[0] - latOffset, position[1] + lngOffset], // SE
    [position[0] + latOffset, position[1] + lngOffset], // NE
    [position[0] + latOffset, position[1] - lngOffset], // NW
  ];
  
  // Get string color
  const getStringColor = (stringId?: string) => {
    if (!stringId) return '#3b82f6';
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const index = parseInt(stringId.split('-')[1] || '1') - 1;
    return colors[index % colors.length];
  };
  
  const color = getStringColor(panel.stringId);
  
  return (
    <Polygon
      positions={bounds}
      pathOptions={{
        color: selected ? '#fbbf24' : color,
        fillColor: selected ? '#fbbf24' : color,
        fillOpacity: selected ? 0.7 : 0.5,
        weight: selected ? 3 : 2
      }}
      eventHandlers={{
        click: () => {
          onSelect();
        },
        mousedown: () => {
          setDragging(true);
        },
        mouseup: () => {
          if (dragging) {
            setDragging(false);
            onDragEnd(position[0], position[1]);
          }
        }
      }}
    >
      {/* Add popup with panel info */}
    </Polygon>
  );
}

export default function PanelMapCanvas({
  centerLat,
  centerLng,
  panels,
  roofSegments,
  selectedPanel,
  onPanelSelect,
  onPanelMove,
  panelWidthMeters,
  panelHeightMeters,
  rgbUrl
}: PanelMapCanvasProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }
  
  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={20}
      className="w-full h-full"
      zoomControl={false}
      style={{ background: '#f3f4f6' }}
    >
      <MapController />
      
      {/* Satellite Base Layer */}
      <TileLayer
        url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        attribution="Google"
        maxZoom={22}
      />
      
      {/* Roof Segments */}
      {roofSegments.map((segment, idx) => {
        if (!segment.boundingBox) return null;
        
        const bounds: [number, number][] = [
          [segment.boundingBox.sw.latitude, segment.boundingBox.sw.longitude],
          [segment.boundingBox.sw.latitude, segment.boundingBox.ne.longitude],
          [segment.boundingBox.ne.latitude, segment.boundingBox.ne.longitude],
          [segment.boundingBox.ne.latitude, segment.boundingBox.sw.longitude],
        ];
        
        return (
          <Polygon
            key={`segment-${idx}`}
            positions={bounds}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 5'
            }}
          />
        );
      })}
      
      {/* Solar Panels */}
      {panels.map((panel) => (
        <PanelRectangle
          key={panel.id}
          panel={panel}
          selected={selectedPanel?.id === panel.id}
          onSelect={() => onPanelSelect(panel)}
          onDragEnd={(lat, lng) => onPanelMove(panel.id, lat, lng)}
          panelWidthMeters={panelWidthMeters}
          panelHeightMeters={panelHeightMeters}
        />
      ))}
    </MapContainer>
  );
}
