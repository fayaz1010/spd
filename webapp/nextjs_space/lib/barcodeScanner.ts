// Barcode & QR Code Scanner Utilities
// Uses html5-qrcode library for cross-platform scanning

export interface ScanResult {
  text: string;
  format: string; // QR_CODE, CODE_128, EAN_13, etc.
  timestamp: Date;
}

export interface ScannerConfig {
  fps?: number;
  qrbox?: { width: number; height: number };
  aspectRatio?: number;
  disableFlip?: boolean;
  formatsToSupport?: string[];
}

/**
 * Default scanner configuration
 */
export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
  disableFlip: false,
  formatsToSupport: [
    'QR_CODE',
    'CODE_128',
    'CODE_39',
    'CODE_93',
    'EAN_13',
    'EAN_8',
    'UPC_A',
    'UPC_E',
    'CODABAR',
    'ITF',
    'DATA_MATRIX'
  ]
};

/**
 * Validate serial number format
 */
export function validateSerialNumber(serial: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check length
  if (serial.length < 6) {
    errors.push('Serial number too short (minimum 6 characters)');
  }

  if (serial.length > 50) {
    errors.push('Serial number too long (maximum 50 characters)');
  }

  // Check for invalid characters
  if (!/^[A-Z0-9\-_]+$/i.test(serial)) {
    warnings.push('Serial contains unusual characters');
  }

  // Check if it's just numbers (might be barcode instead of serial)
  if (/^\d+$/.test(serial) && serial.length > 12) {
    warnings.push('This looks like a barcode, not a serial number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Extract serial number from scanned text
 * Handles cases where QR code contains additional data
 */
export function extractSerialNumber(scannedText: string): string {
  // Remove common prefixes
  let serial = scannedText.trim();
  
  // Remove "SN:", "S/N:", "Serial:", etc.
  serial = serial.replace(/^(SN|S\/N|Serial|SERIAL):\s*/i, '');
  
  // If it's a URL or contains multiple lines, try to extract serial
  if (serial.includes('\n')) {
    const lines = serial.split('\n');
    // Look for line that looks like a serial number
    for (const line of lines) {
      if (/^[A-Z0-9\-_]{6,}$/i.test(line.trim())) {
        serial = line.trim();
        break;
      }
    }
  }
  
  return serial.toUpperCase();
}

/**
 * Detect equipment type from serial number pattern
 */
export function detectEquipmentType(serial: string): {
  type: 'panel' | 'inverter' | 'battery' | 'unknown';
  confidence: number;
  reason: string;
} {
  const upper = serial.toUpperCase();

  // Panel patterns
  if (
    upper.includes('TSM') || // Trina Solar
    upper.includes('JKM') || // JinkoSolar
    upper.includes('SPR') || // SunPower
    upper.includes('LG') ||   // LG
    upper.startsWith('CS')    // Canadian Solar
  ) {
    return {
      type: 'panel',
      confidence: 0.9,
      reason: 'Matches known panel manufacturer prefix'
    };
  }

  // Inverter patterns
  if (
    upper.includes('FRONIUS') ||
    upper.includes('SMA') ||
    upper.includes('SOLAREDGE') ||
    upper.includes('ENPHASE') ||
    upper.includes('HUAWEI')
  ) {
    return {
      type: 'inverter',
      confidence: 0.9,
      reason: 'Matches known inverter manufacturer'
    };
  }

  // Battery patterns
  if (
    upper.includes('TESLA') ||
    upper.includes('POWERWALL') ||
    upper.includes('BATTERY') ||
    upper.includes('BYD') ||
    upper.includes('LG CHEM')
  ) {
    return {
      type: 'battery',
      confidence: 0.8,
      reason: 'Matches known battery manufacturer'
    };
  }

  return {
    type: 'unknown',
    confidence: 0.0,
    reason: 'Could not determine equipment type'
  };
}

/**
 * Check for duplicate serial number
 */
export function isDuplicate(
  serial: string,
  existingSerials: string[]
): boolean {
  return existingSerials.some(
    existing => existing.toUpperCase() === serial.toUpperCase()
  );
}

/**
 * Format serial number for display
 */
export function formatSerialNumber(serial: string): string {
  // Add spaces every 4 characters for readability
  return serial.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Vibrate device on successful scan (mobile)
 */
export function vibrateOnScan(duration: number = 100): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
}

/**
 * Play beep sound on successful scan
 */
export function beepOnScan(): void {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

/**
 * Get camera list for scanner
 */
export async function getCameraList(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error getting camera list:', error);
    return [];
  }
}

/**
 * Prefer back camera for scanning (mobile)
 */
export function getPreferredCamera(cameras: MediaDeviceInfo[]): string | undefined {
  // Look for back camera
  const backCamera = cameras.find(camera =>
    camera.label.toLowerCase().includes('back') ||
    camera.label.toLowerCase().includes('rear') ||
    camera.label.toLowerCase().includes('environment')
  );

  return backCamera?.deviceId || cameras[0]?.deviceId;
}

/**
 * Parse manufacturer from serial number
 */
export function parseManufacturer(serial: string): string | null {
  const upper = serial.toUpperCase();

  // Panel manufacturers
  if (upper.includes('TSM')) return 'Trina Solar';
  if (upper.includes('JKM')) return 'JinkoSolar';
  if (upper.includes('SPR')) return 'SunPower';
  if (upper.startsWith('LG')) return 'LG';
  if (upper.startsWith('CS')) return 'Canadian Solar';
  if (upper.includes('LONGI')) return 'LONGi';
  if (upper.includes('JA')) return 'JA Solar';

  // Inverter manufacturers
  if (upper.includes('FRONIUS')) return 'Fronius';
  if (upper.includes('SMA')) return 'SMA';
  if (upper.includes('SOLAREDGE')) return 'SolarEdge';
  if (upper.includes('ENPHASE')) return 'Enphase';
  if (upper.includes('HUAWEI')) return 'Huawei';
  if (upper.includes('SUNGROW')) return 'Sungrow';

  // Battery manufacturers
  if (upper.includes('TESLA')) return 'Tesla';
  if (upper.includes('BYD')) return 'BYD';
  if (upper.includes('LG CHEM')) return 'LG Chem';
  if (upper.includes('SONNEN')) return 'sonnen';

  return null;
}

/**
 * Generate scan statistics
 */
export interface ScanStats {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  duplicateScans: number;
  averageScanTime: number;
  lastScanTime: Date | null;
}

export class ScanStatistics {
  private stats: ScanStats = {
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
    duplicateScans: 0,
    averageScanTime: 0,
    lastScanTime: null
  };

  private scanTimes: number[] = [];

  recordSuccess(scanTime: number): void {
    this.stats.totalScans++;
    this.stats.successfulScans++;
    this.stats.lastScanTime = new Date();
    this.scanTimes.push(scanTime);
    this.updateAverageScanTime();
  }

  recordFailure(): void {
    this.stats.totalScans++;
    this.stats.failedScans++;
  }

  recordDuplicate(): void {
    this.stats.duplicateScans++;
  }

  private updateAverageScanTime(): void {
    if (this.scanTimes.length > 0) {
      const sum = this.scanTimes.reduce((a, b) => a + b, 0);
      this.stats.averageScanTime = sum / this.scanTimes.length;
    }
  }

  getStats(): ScanStats {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      totalScans: 0,
      successfulScans: 0,
      failedScans: 0,
      duplicateScans: 0,
      averageScanTime: 0,
      lastScanTime: null
    };
    this.scanTimes = [];
  }
}
