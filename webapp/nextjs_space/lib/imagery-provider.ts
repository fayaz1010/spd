/**
 * Imagery Provider System
 * 
 * Manages aerial imagery sources with automatic fallback
 * Supports Google Maps (always available) and NearMap (optional upgrade)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ImageryResult {
  url: string;
  provider: 'google' | 'nearmap';
  resolution: number; // cm per pixel
}

export interface ImageryProvider {
  name: 'google' | 'nearmap';
  getAerialImage(lat: number, lng: number, zoom: number): Promise<string>;
  getResolution(): number;
  isAvailable(): Promise<boolean>;
}

/**
 * Google Maps Imagery Provider
 * Always available, free, 15cm resolution
 */
export class GoogleImageryProvider implements ImageryProvider {
  name: 'google' = 'google';

  async getAerialImage(lat: number, lng: number, zoom: number = 20): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    // Google Static Maps API - Satellite view
    return `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${lat},${lng}` +
      `&zoom=${zoom}` +
      `&size=1200x800` +
      `&scale=2` +  // High DPI
      `&maptype=satellite` +
      `&key=${apiKey}`;
  }

  getResolution(): number {
    return 15; // ~15cm per pixel at zoom 20
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  }
}

/**
 * NearMap Imagery Provider
 * Optional upgrade, $500-2000/month, 5-10cm resolution
 */
export class NearMapImageryProvider implements ImageryProvider {
  name: 'nearmap' = 'nearmap';

  async getAerialImage(lat: number, lng: number, zoom: number = 20): Promise<string> {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('NearMap API key not configured');
    }

    // NearMap Tile API
    // Documentation: https://docs.nearmap.com/display/ND/Tile+API
    const tileSize = 256;
    const scale = Math.pow(2, zoom);
    
    // Convert lat/lng to tile coordinates
    const x = Math.floor((lng + 180) / 360 * scale);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale);
    
    return `https://api.nearmap.com/tiles/v3/Vert/${zoom}/${x}/${y}.jpg?` +
      `apikey=${apiKey}` +
      `&tertiary=satellite`;
  }

  getResolution(): number {
    return 7; // ~5-10cm per pixel
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey();
      return !!apiKey;
    } catch {
      return false;
    }
  }

  private async getApiKey(): Promise<string | null> {
    try {
      // Check environment variable first
      if (process.env.NEARMAP_API_KEY) {
        return process.env.NEARMAP_API_KEY;
      }

      // Check database settings
      const settings = await prisma.apiSettings.findFirst({
        where: { nearmapEnabled: true },
        select: { nearmapApiKey: true }
      });

      return settings?.nearmapApiKey || null;
    } catch (error) {
      console.error('Failed to get NearMap API key:', error);
      return null;
    }
  }
}

/**
 * Imagery Manager
 * Automatically selects best available provider
 */
export class ImageryManager {
  private providers: ImageryProvider[];

  constructor() {
    // Order matters: Try NearMap first (higher quality), fallback to Google
    this.providers = [
      new NearMapImageryProvider(),
      new GoogleImageryProvider()
    ];
  }

  /**
   * Get best available imagery for a location
   * Tries providers in order of preference (NearMap -> Google)
   */
  async getBestImagery(lat: number, lng: number, zoom: number = 20): Promise<ImageryResult> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        try {
          const url = await provider.getAerialImage(lat, lng, zoom);
          
          console.log(`✅ Using ${provider.name} imagery (${provider.getResolution()}cm/pixel)`);
          
          return {
            url,
            provider: provider.name,
            resolution: provider.getResolution()
          };
        } catch (error) {
          console.warn(`⚠️ ${provider.name} failed, trying next provider:`, error);
          continue;
        }
      }
    }

    throw new Error('No imagery provider available');
  }

  /**
   * Get imagery from specific provider
   */
  async getImageryFromProvider(
    provider: 'google' | 'nearmap',
    lat: number,
    lng: number,
    zoom: number = 20
  ): Promise<ImageryResult> {
    const selectedProvider = this.providers.find(p => p.name === provider);
    
    if (!selectedProvider) {
      throw new Error(`Provider ${provider} not found`);
    }

    if (!(await selectedProvider.isAvailable())) {
      throw new Error(`Provider ${provider} not available`);
    }

    const url = await selectedProvider.getAerialImage(lat, lng, zoom);
    
    return {
      url,
      provider: selectedProvider.name,
      resolution: selectedProvider.getResolution()
    };
  }

  /**
   * Check which providers are available
   */
  async getAvailableProviders(): Promise<string[]> {
    const available: string[] = [];
    
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        available.push(provider.name);
      }
    }
    
    return available;
  }
}

// Export singleton instance
export const imageryManager = new ImageryManager();
