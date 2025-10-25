// Photo Metadata Utilities - GPS, EXIF, Validation

export interface PhotoMetadata {
  latitude?: number;
  longitude?: number;
  timestamp: string;
  accuracy?: number;
  deviceInfo?: string;
  hasGPS: boolean;
  hasTimestamp: boolean;
}

export interface PhotoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: PhotoMetadata | null;
}

/**
 * Get current GPS location
 */
export async function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Extract EXIF data from image file
 */
export async function extractEXIF(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        // Simple EXIF extraction (you can use a library like exif-js for full support)
        // For now, we'll just check if the file has EXIF data
        const view = new DataView(arrayBuffer);
        
        // Check for JPEG marker
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve({ hasEXIF: false });
          return;
        }

        // Basic EXIF detection
        resolve({ hasEXIF: true, raw: arrayBuffer });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate photo before upload
 */
export async function validatePhoto(
  file: File,
  requireGPS: boolean = true
): Promise<PhotoValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let metadata: PhotoMetadata | null = null;

  // Check file type
  if (!file.type.startsWith('image/')) {
    errors.push('File must be an image');
    return { isValid: false, errors, warnings, metadata };
  }

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    errors.push('File size must be less than 10MB');
  }

  // Get GPS location
  let gpsData: GeolocationPosition | null = null;
  try {
    gpsData = await getCurrentLocation();
  } catch (error: any) {
    if (requireGPS) {
      errors.push(`GPS required: ${error.message}`);
    } else {
      warnings.push('GPS location not available');
    }
  }

  // Build metadata
  metadata = {
    latitude: gpsData?.coords.latitude,
    longitude: gpsData?.coords.longitude,
    accuracy: gpsData?.coords.accuracy,
    timestamp: new Date().toISOString(),
    deviceInfo: navigator.userAgent,
    hasGPS: !!gpsData,
    hasTimestamp: true
  };

  // Extract EXIF (optional, for future enhancement)
  try {
    const exif = await extractEXIF(file);
    if (!exif.hasEXIF) {
      warnings.push('Photo has no EXIF data');
    }
  } catch (error) {
    warnings.push('Could not read EXIF data');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata
  };
}

/**
 * Add metadata watermark to image (canvas-based)
 */
export async function addMetadataWatermark(
  file: File,
  metadata: PhotoMetadata
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Add watermark
      const watermarkHeight = 60;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, canvas.height - watermarkHeight, canvas.width, watermarkHeight);

      // Add text
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      
      const timestamp = new Date(metadata.timestamp).toLocaleString();
      const gpsText = metadata.hasGPS 
        ? `GPS: ${metadata.latitude?.toFixed(6)}, ${metadata.longitude?.toFixed(6)}`
        : 'GPS: Not available';

      ctx.fillText(timestamp, 10, canvas.height - 35);
      ctx.fillText(gpsText, 10, canvas.height - 15);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, file.type, 0.95);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Check if device supports geolocation
 */
export function supportsGeolocation(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Request geolocation permission
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  if (!supportsGeolocation()) {
    return false;
  }

  try {
    await getCurrentLocation();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Format GPS coordinates for display
 */
export function formatGPS(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lon).toFixed(6)}°${lonDir}`;
}

/**
 * Calculate distance between two GPS points (in meters)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Verify photo was taken at job site (within 100m)
 */
export function verifyLocationMatch(
  photoLat: number,
  photoLon: number,
  siteLat: number,
  siteLon: number,
  maxDistance: number = 100
): { isMatch: boolean; distance: number } {
  const distance = calculateDistance(photoLat, photoLon, siteLat, siteLon);
  return {
    isMatch: distance <= maxDistance,
    distance: Math.round(distance)
  };
}
