/**
 * Aerial View Generator
 * Creates NearMap-style solar installation plans with aerial imagery and panel overlay
 */

import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';
import sharp from 'sharp';

interface Panel {
  id: string;
  latitude: number;
  longitude: number;
  orientationDegrees: number;
  wattage: number;
  stringId?: string;
}

interface RoofSegment {
  pitchDegrees: number;
  azimuthDegrees: number;
  areaMeters2: number;
  boundingBox?: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
}

interface DrawingOptions {
  projectName: string;
  address: string;
  systemSize: number;
  totalPanels: number;
  panelWattage: number;
  panelWidthMeters: number;
  panelHeightMeters: number;
}

export class AerialViewGenerator {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;
  private imageWidth = 2400;  // High-res output
  private imageHeight = 1800;
  
  // Map bounds for coordinate conversion
  private minLat: number = 0;
  private maxLat: number = 0;
  private minLng: number = 0;
  private maxLng: number = 0;
  
  constructor() {
    this.canvas = createCanvas(this.imageWidth, this.imageHeight);
    this.ctx = this.canvas.getContext('2d');
  }
  
  async generate(
    aerialImageUrl: string,
    panels: Panel[],
    roofSegments: RoofSegment[],
    options: DrawingOptions
  ): Promise<Buffer> {
    
    // Calculate map bounds from panels and segments
    this.calculateBounds(panels, roofSegments);
    
    // 1. Load and draw aerial imagery
    await this.drawAerialImage(aerialImageUrl);
    
    // 2. Draw roof segment boundaries
    this.drawRoofSegments(roofSegments);
    
    // 3. Draw panel rectangles
    this.drawPanels(panels, options);
    
    // 4. Add annotations
    this.addAnnotations(panels, options);
    
    // 5. Add legend
    this.addLegend(panels);
    
    // 6. Add title block
    this.addTitleBlock(options);
    
    // 7. Export as PNG
    return this.canvas.toBuffer('image/png');
  }
  
  private calculateBounds(panels: Panel[], segments: RoofSegment[]) {
    const allLats: number[] = [];
    const allLngs: number[] = [];
    
    // Collect all coordinates
    panels.forEach(p => {
      allLats.push(p.latitude);
      allLngs.push(p.longitude);
    });
    
    segments.forEach(s => {
      if (s.boundingBox) {
        allLats.push(s.boundingBox.sw.latitude, s.boundingBox.ne.latitude);
        allLngs.push(s.boundingBox.sw.longitude, s.boundingBox.ne.longitude);
      }
    });
    
    // Add padding (10%)
    const latRange = Math.max(...allLats) - Math.min(...allLats);
    const lngRange = Math.max(...allLngs) - Math.min(...allLngs);
    const latPadding = latRange * 0.1;
    const lngPadding = lngRange * 0.1;
    
    this.minLat = Math.min(...allLats) - latPadding;
    this.maxLat = Math.max(...allLats) + latPadding;
    this.minLng = Math.min(...allLngs) - lngPadding;
    this.maxLng = Math.max(...allLngs) + lngPadding;
  }
  
  private async drawAerialImage(imageUrl: string) {
    try {
      // Fetch and load image
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const image = await loadImage(Buffer.from(buffer));
      
      // Draw image to fill canvas
      this.ctx.drawImage(image, 0, 0, this.imageWidth, this.imageHeight);
      
      // Add slight overlay for better contrast
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      this.ctx.fillRect(0, 0, this.imageWidth, this.imageHeight);
      
    } catch (error) {
      console.error('Failed to load aerial image:', error);
      // Draw gray background as fallback
      this.ctx.fillStyle = '#e5e7eb';
      this.ctx.fillRect(0, 0, this.imageWidth, this.imageHeight);
    }
  }
  
  private drawRoofSegments(segments: RoofSegment[]) {
    segments.forEach((segment, idx) => {
      if (!segment.boundingBox) return;
      
      // Convert lat/lng to canvas coordinates
      const points = [
        this.latLngToCanvas(segment.boundingBox.sw.latitude, segment.boundingBox.sw.longitude),
        this.latLngToCanvas(segment.boundingBox.sw.latitude, segment.boundingBox.ne.longitude),
        this.latLngToCanvas(segment.boundingBox.ne.latitude, segment.boundingBox.ne.longitude),
        this.latLngToCanvas(segment.boundingBox.ne.latitude, segment.boundingBox.sw.longitude),
      ];
      
      // Draw segment boundary
      this.ctx.strokeStyle = '#3b82f6';
      this.ctx.lineWidth = 4;
      this.ctx.setLineDash([15, 10]);
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      points.forEach(p => this.ctx.lineTo(p.x, p.y));
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      
      // Add segment label
      const centerLat = (segment.boundingBox.sw.latitude + segment.boundingBox.ne.latitude) / 2;
      const centerLng = (segment.boundingBox.sw.longitude + segment.boundingBox.ne.longitude) / 2;
      const center = this.latLngToCanvas(centerLat, centerLng);
      
      // Label background
      this.ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
      this.ctx.fillRect(center.x - 60, center.y - 25, 120, 50);
      
      // Label text
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Roof ${idx + 1}`, center.x, center.y - 5);
      this.ctx.font = '14px Arial';
      this.ctx.fillText(
        `${segment.pitchDegrees.toFixed(1)}° / ${segment.azimuthDegrees.toFixed(0)}°`,
        center.x,
        center.y + 12
      );
    });
  }
  
  private drawPanels(panels: Panel[], options: DrawingOptions) {
    // Group panels by string for color coding
    const panelsByString = this.groupPanelsByString(panels);
    
    Object.entries(panelsByString).forEach(([stringId, stringPanels]) => {
      const color = this.getStringColor(stringId);
      
      stringPanels.forEach((panel) => {
        // Convert panel position to canvas coordinates
        const center = this.latLngToCanvas(panel.latitude, panel.longitude);
        
        // Calculate panel dimensions in pixels
        const widthPx = this.metersToPixels(options.panelWidthMeters);
        const heightPx = this.metersToPixels(options.panelHeightMeters);
        
        // Draw panel rectangle
        this.ctx.save();
        this.ctx.translate(center.x, center.y);
        this.ctx.rotate((panel.orientationDegrees * Math.PI) / 180);
        
        // Panel fill
        this.ctx.fillStyle = `${color}DD`;  // Semi-transparent
        this.ctx.fillRect(-widthPx / 2, -heightPx / 2, widthPx, heightPx);
        
        // Panel border
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-widthPx / 2, -heightPx / 2, widthPx, heightPx);
        
        // Panel number
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(panel.id, 0, 0);
        
        this.ctx.restore();
      });
    });
  }
  
  private addAnnotations(panels: Panel[], options: DrawingOptions) {
    // Add north arrow
    this.drawNorthArrow(120, 120);
    
    // Add scale bar
    this.drawScaleBar(120, this.imageHeight - 120);
    
    // Add system info box
    const infoX = this.imageWidth - 350;
    const infoY = 50;
    
    // Info box background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.fillRect(infoX, infoY, 300, 140);
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(infoX, infoY, 300, 140);
    
    // Info text
    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'left';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText('System Overview', infoX + 20, infoY + 35);
    
    this.ctx.font = '18px Arial';
    this.ctx.fillText(`Total Panels: ${options.totalPanels}`, infoX + 20, infoY + 65);
    this.ctx.fillText(`System Size: ${options.systemSize.toFixed(2)}kW`, infoX + 20, infoY + 90);
    this.ctx.fillText(`Panel: ${options.panelWattage}W`, infoX + 20, infoY + 115);
  }
  
  private addLegend(panels: Panel[]) {
    const legendX = 50;
    const legendY = this.imageHeight - 350;
    
    // Get unique strings
    const strings = Array.from(new Set(panels.map(p => p.stringId).filter(Boolean)));
    const legendHeight = 80 + (strings.length * 45);
    
    // Legend background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.fillRect(legendX, legendY, 320, legendHeight);
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(legendX, legendY, 320, legendHeight);
    
    // Legend title
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 22px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('String Configuration', legendX + 20, legendY + 35);
    
    // String colors
    strings.forEach((stringId, idx) => {
      const y = legendY + 75 + (idx * 45);
      const color = this.getStringColor(stringId!);
      const stringPanels = panels.filter(p => p.stringId === stringId);
      
      // Color box
      this.ctx.fillStyle = color;
      this.ctx.fillRect(legendX + 20, y - 20, 40, 30);
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(legendX + 20, y - 20, 40, 30);
      
      // Label
      this.ctx.fillStyle = '#000000';
      this.ctx.font = '18px Arial';
      this.ctx.fillText(
        `String ${idx + 1} - ${stringPanels.length} panels`,
        legendX + 70,
        y
      );
    });
  }
  
  private addTitleBlock(options: DrawingOptions) {
    const blockX = this.imageWidth - 550;
    const blockY = this.imageHeight - 200;
    
    // Title block background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.fillRect(blockX, blockY, 500, 150);
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(blockX, blockY, 500, 150);
    
    // Company name
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Sun Direct Power', blockX + 20, blockY + 40);
    
    // Drawing details
    this.ctx.font = '18px Arial';
    this.ctx.fillText(`Project: ${options.projectName}`, blockX + 20, blockY + 70);
    this.ctx.fillText(`Address: ${options.address}`, blockX + 20, blockY + 95);
    this.ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, blockX + 20, blockY + 120);
  }
  
  private drawNorthArrow(x: number, y: number) {
    this.ctx.save();
    this.ctx.translate(x, y);
    
    // Circle background
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 50, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    // North arrow
    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -40);
    this.ctx.lineTo(-12, 5);
    this.ctx.lineTo(12, 5);
    this.ctx.closePath();
    this.ctx.fill();
    
    // South arrow
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 40);
    this.ctx.lineTo(-12, -5);
    this.ctx.lineTo(12, -5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // 'N' label
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('N', 0, -55);
    
    this.ctx.restore();
  }
  
  private drawScaleBar(x: number, y: number) {
    const barWidth = 250;
    const barHeight = 25;
    
    // Background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.fillRect(x - 20, y - 50, barWidth + 40, 80);
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - 20, y - 50, barWidth + 40, 80);
    
    // Scale bar segments
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(x, y, barWidth / 2, barHeight);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(x + barWidth / 2, y, barWidth / 2, barHeight);
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, barWidth, barHeight);
    
    // Labels
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('0', x, y + 45);
    this.ctx.fillText('5m', x + barWidth / 2, y + 45);
    this.ctx.fillText('10m', x + barWidth, y + 45);
  }
  
  private getStringColor(stringId: string): string {
    const colors = [
      '#ef4444',  // Red
      '#3b82f6',  // Blue
      '#10b981',  // Green
      '#f59e0b',  // Orange
      '#8b5cf6',  // Purple
      '#ec4899',  // Pink
    ];
    const index = parseInt(stringId.split('-')[1] || '1') - 1;
    return colors[index % colors.length];
  }
  
  private groupPanelsByString(panels: Panel[]): Record<string, Panel[]> {
    const grouped: Record<string, Panel[]> = {};
    panels.forEach(panel => {
      const stringId = panel.stringId || 'string-1';
      if (!grouped[stringId]) {
        grouped[stringId] = [];
      }
      grouped[stringId].push(panel);
    });
    return grouped;
  }
  
  private latLngToCanvas(lat: number, lng: number): { x: number; y: number } {
    // Normalize to 0-1 range
    const normalizedLat = (lat - this.minLat) / (this.maxLat - this.minLat);
    const normalizedLng = (lng - this.minLng) / (this.maxLng - this.minLng);
    
    // Convert to canvas coordinates (flip Y axis)
    const x = normalizedLng * this.imageWidth;
    const y = (1 - normalizedLat) * this.imageHeight;
    
    return { x, y };
  }
  
  private metersToPixels(meters: number): number {
    // Calculate average scale based on latitude range
    const latRange = this.maxLat - this.minLat;
    const metersPerDegree = 111320; // Approximate meters per degree latitude
    const totalMeters = latRange * metersPerDegree;
    const pixelsPerMeter = this.imageHeight / totalMeters;
    
    return meters * pixelsPerMeter;
  }
}
