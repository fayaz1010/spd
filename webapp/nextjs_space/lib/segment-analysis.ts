
/**
 * Roof Segment Analysis Utilities
 * Analyzes individual roof segments from Google Solar API data
 */

export interface RoofSegment {
  segmentIndex: number;
  pitchDegrees: number;
  azimuthDegrees: number;
  areaMeters2: number;
  
  // Sun exposure
  sunshineQuantiles: number[];
  avgSunshineHours: number;
  minSunshineHours: number;
  maxSunshineHours: number;
  
  // Panel capacity
  maxPanels: number;
  panelCapacityKw: number;
  
  // Classifications
  orientation: string;
  orientationRating: 'excellent' | 'good' | 'fair' | 'poor';
  pitchClassification: string;
  pitchRating: 'optimal' | 'good' | 'acceptable' | 'poor';
  
  // Production potential
  productionRating: 'excellent' | 'good' | 'fair' | 'poor';
  relativeProduction: number; // percentage compared to ideal conditions
  
  // Recommendations
  recommended: boolean;
  priority: 'high' | 'medium' | 'low';
  notes: string[];
}

export function analyzeRoofSegments(
  roofSegmentStats: any[],
  panelWattage: number = 440
): RoofSegment[] {
  if (!roofSegmentStats || roofSegmentStats.length === 0) {
    return [];
  }
  
  return roofSegmentStats.map((segment, index) => {
    // Extract data from Google Solar API format
    const pitchDegrees = segment.pitchDegrees || 0;
    const azimuthDegrees = segment.azimuthDegrees || 0;
    const stats = segment.stats || {};
    const areaMeters2 = stats.areaMeters2 || 0;
    const sunshineQuantiles = stats.sunshineQuantiles || [];
    
    // Calculate sunshine metrics
    const avgSunshineHours = sunshineQuantiles[50] || 5.5; // Median (50th percentile)
    const minSunshineHours = sunshineQuantiles[10] || 4.0; // 10th percentile
    const maxSunshineHours = sunshineQuantiles[90] || 7.0; // 90th percentile
    
    // Calculate panel capacity
    const panelArea = 1.7; // Typical panel ~1.7m² (440W panel is about 2.1m x 1.1m = 2.31m², but allow spacing)
    const maxPanels = Math.floor(areaMeters2 / panelArea);
    const panelCapacityKw = (maxPanels * panelWattage) / 1000;
    
    // Classify orientation
    const { classification: orientation, rating: orientationRating } = classifyOrientation(azimuthDegrees);
    
    // Classify pitch
    const { classification: pitchClassification, rating: pitchRating } = classifyPitch(pitchDegrees);
    
    // Calculate production rating
    const { rating: productionRating, relativeProduction } = calculateProductionRating(
      avgSunshineHours,
      orientationRating,
      pitchRating
    );
    
    // Determine if segment is recommended
    const recommended = productionRating === 'excellent' || productionRating === 'good';
    const priority = productionRating === 'excellent' ? 'high' : 
                     productionRating === 'good' ? 'medium' : 'low';
    
    // Generate recommendations and notes
    const notes = generateSegmentNotes(
      orientation,
      pitchClassification,
      avgSunshineHours,
      maxPanels,
      recommended
    );
    
    return {
      segmentIndex: index + 1,
      pitchDegrees,
      azimuthDegrees,
      areaMeters2,
      sunshineQuantiles,
      avgSunshineHours,
      minSunshineHours,
      maxSunshineHours,
      maxPanels,
      panelCapacityKw,
      orientation,
      orientationRating,
      pitchClassification,
      pitchRating,
      productionRating,
      relativeProduction,
      recommended,
      priority,
      notes
    };
  });
}

export function classifyOrientation(azimuth: number): { 
  classification: string; 
  rating: 'excellent' | 'good' | 'fair' | 'poor';
} {
  /**
   * In Southern Hemisphere (Australia):
   * North = 0° or 360° = Best (faces equator, maximum sun exposure)
   * Northeast = 45° = Good (morning sun)
   * East = 90° = Fair (morning production)
   * Southeast = 135° = Poor (limited sun)
   * South = 180° = Worst (faces away from sun)
   * Southwest = 225° = Poor (limited sun)
   * West = 270° = Fair (afternoon production)
   * Northwest = 315° = Good (afternoon sun)
   */
  
  // Normalize azimuth to 0-360
  const normalizedAzimuth = ((azimuth % 360) + 360) % 360;
  
  if (normalizedAzimuth < 22.5 || normalizedAzimuth >= 337.5) {
    return { classification: 'North-facing (Optimal) ⭐', rating: 'excellent' };
  } else if (normalizedAzimuth < 67.5) {
    return { classification: 'Northeast-facing (Excellent Morning Sun) ☀️', rating: 'excellent' };
  } else if (normalizedAzimuth < 112.5) {
    return { classification: 'East-facing (Good Morning Production) 🌅', rating: 'good' };
  } else if (normalizedAzimuth < 157.5) {
    return { classification: 'Southeast-facing (Limited Sun) ⛅', rating: 'poor' };
  } else if (normalizedAzimuth < 202.5) {
    return { classification: 'South-facing (Minimal Sun) ☁️', rating: 'poor' };
  } else if (normalizedAzimuth < 247.5) {
    return { classification: 'Southwest-facing (Limited Sun) ⛅', rating: 'poor' };
  } else if (normalizedAzimuth < 292.5) {
    return { classification: 'West-facing (Good Afternoon Production) 🌇', rating: 'good' };
  } else {
    return { classification: 'Northwest-facing (Excellent Afternoon Sun) 🌅', rating: 'excellent' };
  }
}

export function classifyPitch(pitchDegrees: number): {
  classification: string;
  rating: 'optimal' | 'good' | 'acceptable' | 'poor';
} {
  /**
   * Optimal pitch for Perth, WA (latitude ~32°S) is around 25-32°
   * - Flat (0-10°): Poor drainage, cleaning issues
   * - Low (10-20°): Acceptable but not ideal
   * - Optimal (20-35°): Best for year-round production
   * - Steep (35-45°): Good but slightly reduced summer production
   * - Very Steep (>45°): Installation challenges, reduced efficiency
   */
  
  if (pitchDegrees < 5) {
    return { classification: 'Nearly Flat', rating: 'poor' };
  } else if (pitchDegrees < 15) {
    return { classification: 'Low Pitch (10-15°)', rating: 'acceptable' };
  } else if (pitchDegrees < 20) {
    return { classification: 'Moderate Pitch (15-20°)', rating: 'good' };
  } else if (pitchDegrees <= 35) {
    return { classification: 'Optimal Pitch (20-35°) ⭐', rating: 'optimal' };
  } else if (pitchDegrees <= 45) {
    return { classification: 'Steep Pitch (35-45°)', rating: 'good' };
  } else {
    return { classification: 'Very Steep (>45°)', rating: 'acceptable' };
  }
}

function calculateProductionRating(
  avgSunshineHours: number,
  orientationRating: string,
  pitchRating: string
): {
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  relativeProduction: number;
} {
  // Base production score (0-100)
  let score = 50;
  
  // Sunshine hours factor (0-30 points)
  if (avgSunshineHours >= 6.5) score += 30;
  else if (avgSunshineHours >= 5.5) score += 20;
  else if (avgSunshineHours >= 4.5) score += 10;
  
  // Orientation factor (0-35 points)
  if (orientationRating === 'excellent') score += 35;
  else if (orientationRating === 'good') score += 25;
  else if (orientationRating === 'fair') score += 10;
  
  // Pitch factor (0-35 points)
  if (pitchRating === 'optimal') score += 35;
  else if (pitchRating === 'good') score += 25;
  else if (pitchRating === 'acceptable') score += 15;
  else score += 5;
  
  // Determine rating
  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 85) rating = 'excellent';
  else if (score >= 65) rating = 'good';
  else if (score >= 45) rating = 'fair';
  else rating = 'poor';
  
  return {
    rating,
    relativeProduction: Math.min(score, 100)
  };
}

function generateSegmentNotes(
  orientation: string,
  pitchClassification: string,
  avgSunshineHours: number,
  maxPanels: number,
  recommended: boolean
): string[] {
  const notes: string[] = [];
  
  if (recommended) {
    notes.push('✅ Excellent location for solar panels');
    notes.push(`Can accommodate up to ${maxPanels} panels`);
  } else {
    notes.push('⚠️ Sub-optimal location for solar panels');
  }
  
  if (avgSunshineHours >= 6.5) {
    notes.push('☀️ Exceptional sun exposure year-round');
  } else if (avgSunshineHours >= 5.5) {
    notes.push('☀️ Good sun exposure for most of the day');
  } else if (avgSunshineHours < 4.5) {
    notes.push('⛅ Limited sun exposure, may have shading issues');
  }
  
  if (orientation.includes('North')) {
    notes.push('🎯 North-facing is ideal for Australian solar installations');
  } else if (orientation.includes('East')) {
    notes.push('🌅 East-facing produces most energy in the morning');
  } else if (orientation.includes('West')) {
    notes.push('🌇 West-facing produces most energy in the afternoon');
  } else if (orientation.includes('South')) {
    notes.push('Consider prioritizing other roof sections if available');
  }
  
  if (pitchClassification.includes('Optimal')) {
    notes.push('📐 Perfect roof angle for maximum year-round production');
  } else if (pitchClassification.includes('Flat') || pitchClassification.includes('Low')) {
    notes.push('📐 Low pitch may require special mounting or tilted frames');
  } else if (pitchClassification.includes('Steep')) {
    notes.push('📐 Steep pitch may require additional installation considerations');
  }
  
  return notes;
}

export function summarizeRoofAnalysis(segments: RoofSegment[]): {
  totalArea: number;
  totalMaxPanels: number;
  totalCapacityKw: number;
  avgSunshineHours: number;
  recommendedSegments: number;
  excellentSegments: number;
  goodSegments: number;
  overallRating: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
} {
  const totalArea = segments.reduce((sum, seg) => sum + seg.areaMeters2, 0);
  const totalMaxPanels = segments.reduce((sum, seg) => sum + seg.maxPanels, 0);
  const totalCapacityKw = segments.reduce((sum, seg) => sum + seg.panelCapacityKw, 0);
  const avgSunshineHours = segments.reduce((sum, seg) => sum + seg.avgSunshineHours, 0) / segments.length;
  
  const recommendedSegments = segments.filter(s => s.recommended).length;
  const excellentSegments = segments.filter(s => s.productionRating === 'excellent').length;
  const goodSegments = segments.filter(s => s.productionRating === 'good').length;
  
  let overallRating: 'excellent' | 'good' | 'fair' | 'poor';
  if (excellentSegments >= segments.length * 0.6) overallRating = 'excellent';
  else if ((excellentSegments + goodSegments) >= segments.length * 0.6) overallRating = 'good';
  else if (recommendedSegments > 0) overallRating = 'fair';
  else overallRating = 'poor';
  
  const recommendations: string[] = [];
  
  if (overallRating === 'excellent' || overallRating === 'good') {
    recommendations.push('Your roof is excellent for solar! Multiple segments have optimal conditions.');
    recommendations.push(`Consider a ${totalCapacityKw.toFixed(1)}kW system to maximize your roof's potential.`);
  } else if (overallRating === 'fair') {
    recommendations.push('Your roof has some good areas for solar panels.');
    recommendations.push('Focus installation on the highest-rated segments for best performance.');
  } else {
    recommendations.push('Your roof may have shading or orientation challenges.');
    recommendations.push('Consider tree trimming or alternative mounting strategies.');
  }
  
  if (avgSunshineHours >= 6.5) {
    recommendations.push('Exceptional sun exposure means faster payback and higher savings!');
  }
  
  return {
    totalArea,
    totalMaxPanels,
    totalCapacityKw,
    avgSunshineHours,
    recommendedSegments,
    excellentSegments,
    goodSegments,
    overallRating,
    recommendations
  };
}
