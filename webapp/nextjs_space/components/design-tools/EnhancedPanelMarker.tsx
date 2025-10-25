'use client';

import { useState, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RotateCw, Trash2 } from 'lucide-react';

interface Panel {
  id: string;
  latitude: number;
  longitude: number;
  orientationDegrees: number;
  wattage: number;
  yearlyEnergyKwh: number;
  stringId?: string;
}

interface EnhancedPanelMarkerProps {
  panel: Panel;
  selected: boolean;
  onSelect: () => void;
  onMove: (lat: number, lng: number) => void;
  onRotate: (degrees: number) => void;
  onRemove: () => void;
}

export default function EnhancedPanelMarker({
  panel,
  selected,
  onSelect,
  onMove,
  onRotate,
  onRemove
}: EnhancedPanelMarkerProps) {
  const map = useMap();
  
  // Get string color
  const getStringColor = (stringId?: string) => {
    if (!stringId) return '#3b82f6';
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const index = parseInt(stringId.split('-')[1] || '1') - 1;
    return colors[index % colors.length];
  };
  
  const color = getStringColor(panel.stringId);
  
  // Create custom icon
  const createPanelIcon = () => {
    const iconHtml = `
      <div style="
        width: 40px;
        height: 40px;
        background-color: ${selected ? '#fbbf24' : color};
        border: 3px solid ${selected ? '#f59e0b' : '#ffffff'};
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: move;
        transform: rotate(${panel.orientationDegrees}deg);
      ">
        ${panel.id}
      </div>
    `;
    
    return L.divIcon({
      html: iconHtml,
      className: 'custom-panel-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };
  
  const handleRotate = () => {
    const newRotation = (panel.orientationDegrees + 90) % 360;
    onRotate(newRotation);
  };
  
  return (
    <Marker
      position={[panel.latitude, panel.longitude]}
      icon={createPanelIcon()}
      draggable={true}
      eventHandlers={{
        click: () => {
          onSelect();
        },
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          onMove(position.lat, position.lng);
        }
      }}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          <div className="font-bold text-lg mb-2">{panel.id}</div>
          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Wattage:</span>
              <span className="font-semibold">{panel.wattage}W</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Production:</span>
              <span className="font-semibold">{panel.yearlyEnergyKwh.toFixed(0)} kWh/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">String:</span>
              <span className="font-semibold">{panel.stringId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rotation:</span>
              <span className="font-semibold">{panel.orientationDegrees}°</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRotate}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
            >
              <RotateCw className="w-3 h-3" />
              Rotate
            </button>
            <button
              onClick={onRemove}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
