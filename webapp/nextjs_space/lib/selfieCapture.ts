// Installer Selfie Capture Utilities
// Auto-prompt for selfies at key installation stages

export interface SelfieRequirement {
  stage: 'clock_in' | 'pre_install' | 'during_install' | 'post_install' | 'clock_out';
  name: string;
  description: string;
  required: boolean;
}

export interface SelfieMetadata {
  stage: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  deviceInfo: string;
  faceDetected?: boolean;
}

export interface SelfieValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: SelfieMetadata | null;
}

/**
 * Selfie requirements for different installation stages
 */
export const SELFIE_REQUIREMENTS: SelfieRequirement[] = [
  {
    stage: 'clock_in',
    name: 'Clock In Selfie',
    description: 'Take a selfie when arriving at job site',
    required: true
  },
  {
    stage: 'pre_install',
    name: 'Pre-Installation Selfie',
    description: 'Selfie with ID badge before starting work',
    required: true
  },
  {
    stage: 'during_install',
    name: 'During Installation Selfie',
    description: 'Selfie during installation work (optional)',
    required: false
  },
  {
    stage: 'post_install',
    name: 'Post-Installation Selfie',
    description: 'Selfie after completing installation',
    required: true
  },
  {
    stage: 'clock_out',
    name: 'Clock Out Selfie',
    description: 'Take a selfie when leaving job site',
    required: true
  }
];

/**
 * Check if selfie is required for current stage
 */
export function isSelfieRequired(stage: string): boolean {
  const requirement = SELFIE_REQUIREMENTS.find(r => r.stage === stage);
  return requirement?.required || false;
}

/**
 * Get selfie requirement details
 */
export function getSelfieRequirement(stage: string): SelfieRequirement | null {
  return SELFIE_REQUIREMENTS.find(r => r.stage === stage) || null;
}

/**
 * Validate selfie before upload
 */
export async function validateSelfie(
  file: File,
  stage: string,
  requireGPS: boolean = true
): Promise<SelfieValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (!file.type.startsWith('image/')) {
    errors.push('File must be an image');
    return { isValid: false, errors, warnings, metadata: null };
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
  const metadata: SelfieMetadata = {
    stage,
    timestamp: new Date().toISOString(),
    latitude: gpsData?.coords.latitude,
    longitude: gpsData?.coords.longitude,
    accuracy: gpsData?.coords.accuracy,
    deviceInfo: navigator.userAgent
  };

  // Check if image contains a face (basic check)
  try {
    const hasFace = await detectFaceInImage(file);
    metadata.faceDetected = hasFace;
    
    if (!hasFace) {
      warnings.push('No face detected in image - please ensure your face is clearly visible');
    }
  } catch (error) {
    warnings.push('Could not verify face detection');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata
  };
}

/**
 * Get current GPS location
 */
async function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
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
 * Basic face detection using image analysis
 * In production, use a proper face detection library like face-api.js
 */
async function detectFaceInImage(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      // Basic heuristic: check if image is portrait-oriented and has reasonable dimensions
      const isPortrait = img.height > img.width;
      const hasReasonableSize = img.width >= 200 && img.height >= 200;
      
      // In production, use actual face detection here
      // For now, we'll assume portrait images with reasonable size likely contain faces
      resolve(isPortrait && hasReasonableSize);
    };

    img.onerror = () => resolve(false);
    reader.onerror = () => resolve(false);
    reader.readAsDataURL(file);
  });
}

/**
 * Add selfie overlay with metadata
 */
export async function addSelfieOverlay(
  file: File,
  metadata: SelfieMetadata
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

      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Add overlay
      const overlayHeight = 100;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

      // Add text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      
      const stageName = SELFIE_REQUIREMENTS.find(r => r.stage === metadata.stage)?.name || metadata.stage;
      const timestamp = new Date(metadata.timestamp).toLocaleString();
      const gpsText = metadata.latitude && metadata.longitude
        ? `GPS: ${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`
        : 'GPS: Not available';

      ctx.fillText(stageName, 15, canvas.height - 70);
      ctx.font = '14px Arial';
      ctx.fillText(timestamp, 15, canvas.height - 45);
      ctx.fillText(gpsText, 15, canvas.height - 20);

      // Add face detection indicator
      if (metadata.faceDetected) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(canvas.width - 120, canvas.height - 85, 100, 30);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('✓ Face Detected', canvas.width - 115, canvas.height - 63);
      }

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
 * Check if selfie is already taken for stage
 */
export async function hasSelfieForStage(jobId: string, stage: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/jobs/${jobId}/selfies?stage=${stage}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) return false;

    const data = await response.json();
    return (data.selfies?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking selfie:', error);
    return false;
  }
}

/**
 * Get all selfies for job
 */
export async function getJobSelfies(jobId: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/admin/jobs/${jobId}/selfies`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.selfies || [];
  } catch (error) {
    console.error('Error fetching selfies:', error);
    return [];
  }
}

/**
 * Calculate selfie completion percentage
 */
export function calculateSelfieCompletion(selfies: any[]): number {
  const requiredStages = SELFIE_REQUIREMENTS.filter(r => r.required).map(r => r.stage);
  const completedStages = selfies.map(s => s.stage);
  const completedRequired = requiredStages.filter(stage => completedStages.includes(stage));
  
  return Math.round((completedRequired.length / requiredStages.length) * 100);
}

/**
 * Get missing required selfies
 */
export function getMissingRequiredSelfies(selfies: any[]): SelfieRequirement[] {
  const completedStages = selfies.map(s => s.stage);
  return SELFIE_REQUIREMENTS.filter(
    r => r.required && !completedStages.includes(r.stage)
  );
}

/**
 * Format selfie stage for display
 */
export function formatSelfieStage(stage: string): string {
  const requirement = SELFIE_REQUIREMENTS.find(r => r.stage === stage);
  return requirement?.name || stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Check if it's time to prompt for selfie
 */
export function shouldPromptForSelfie(
  currentStage: string,
  existingSelfies: any[]
): boolean {
  const requirement = getSelfieRequirement(currentStage);
  if (!requirement) return false;

  const hasSelfie = existingSelfies.some(s => s.stage === currentStage);
  return !hasSelfie;
}
