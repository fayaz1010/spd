/**
 * NEM12 Parser - Australian Standard for Interval Metering Data
 * 
 * Format:
 * 100 - Header record
 * 200 - NMI Data Details
 * 300 - Interval Data (48 or 96 values per day)
 * 400 - Interval Event (optional)
 * 500 - B2B Details (optional)
 * 900 - End record
 */

export interface NEM12Interval {
  timestamp: Date;
  consumption: number; // kWh
  quality: string; // A=Actual, E=Estimate, S=Substitute
}

export interface NEM12Data {
  // File metadata
  version: string;
  creationDate: Date;
  fromParticipant: string;
  toParticipant: string;
  
  // Meter info
  nmi: string;
  meterSerial?: string;
  suffix: string; // E1, E2, etc.
  uom: string; // Unit of measure (KWH, MWH)
  intervalMinutes: number; // 15 or 30
  
  // Date range
  startDate: Date;
  endDate: Date;
  
  // Interval data
  intervals: NEM12Interval[];
  
  // Quality
  totalIntervals: number;
  missingIntervals: number;
  estimatedIntervals: number;
  qualityScore: number; // 0-100
}

export interface NEM12ValidationError {
  line: number;
  field: string;
  message: string;
}

/**
 * Validate NEM12 file format
 */
export function validateNEM12(content: string): {
  isValid: boolean;
  errors: NEM12ValidationError[];
} {
  const errors: NEM12ValidationError[] = [];
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  
  if (lines.length === 0) {
    errors.push({
      line: 0,
      field: 'file',
      message: 'File is empty',
    });
    return { isValid: false, errors };
  }
  
  // Check header (100 record)
  if (!lines[0].startsWith('100')) {
    errors.push({
      line: 1,
      field: 'header',
      message: 'File must start with 100 record (header)',
    });
  }
  
  // Check end record (900)
  if (!lines[lines.length - 1].startsWith('900')) {
    errors.push({
      line: lines.length,
      field: 'footer',
      message: 'File must end with 900 record',
    });
  }
  
  // Check for at least one 200 record (NMI)
  const has200 = lines.some(l => l.startsWith('200'));
  if (!has200) {
    errors.push({
      line: 0,
      field: 'nmi',
      message: 'File must contain at least one 200 record (NMI details)',
    });
  }
  
  // Check for at least one 300 record (interval data)
  const has300 = lines.some(l => l.startsWith('300'));
  if (!has300) {
    errors.push({
      line: 0,
      field: 'data',
      message: 'File must contain at least one 300 record (interval data)',
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse NEM12 file
 */
export function parseNEM12(content: string): NEM12Data {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  
  // Validate first
  const validation = validateNEM12(content);
  if (!validation.isValid) {
    throw new Error(`Invalid NEM12 file: ${validation.errors.map(e => e.message).join(', ')}`);
  }
  
  const intervals: NEM12Interval[] = [];
  let nmi = '';
  let suffix = '';
  let uom = 'KWH';
  let intervalMinutes = 30;
  let fromParticipant = '';
  let toParticipant = '';
  let version = 'NEM12';
  let creationDate = new Date();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fields = line.split(',');
    const recordType = fields[0];
    
    switch (recordType) {
      case '100': {
        // Header: 100,NEM12,YYYYMMDDHHMMSS,FROM,TO
        version = fields[1] || 'NEM12';
        const dateStr = fields[2];
        if (dateStr) {
          creationDate = parseNEM12DateTime(dateStr);
        }
        fromParticipant = fields[3] || '';
        toParticipant = fields[4] || '';
        break;
      }
      
      case '200': {
        // NMI Details: 200,NMI,SUFFIX,METER_SERIAL,UOM,INTERVAL_LENGTH,NEXT_SCHEDULED_READ
        nmi = fields[1];
        suffix = fields[2] || 'E1';
        uom = fields[4] || 'KWH';
        const intervalLength = parseInt(fields[5] || '30');
        intervalMinutes = intervalLength;
        break;
      }
      
      case '300': {
        // Interval Data: 300,YYYYMMDD,value1,value2,...,valueN,quality1,quality2,...,qualityN
        const dateStr = fields[1];
        const date = parseNEM12Date(dateStr);
        
        // Calculate number of intervals per day
        const intervalsPerDay = 1440 / intervalMinutes; // 1440 minutes in a day
        
        // Extract values and qualities
        const values: number[] = [];
        const qualities: string[] = [];
        
        for (let j = 2; j < 2 + intervalsPerDay; j++) {
          const value = parseFloat(fields[j]);
          values.push(isNaN(value) ? 0 : value);
        }
        
        for (let j = 2 + intervalsPerDay; j < 2 + (intervalsPerDay * 2); j++) {
          qualities.push(fields[j] || 'A');
        }
        
        // Create interval records
        for (let j = 0; j < intervalsPerDay; j++) {
          const timestamp = new Date(date);
          timestamp.setMinutes(j * intervalMinutes);
          
          intervals.push({
            timestamp,
            consumption: values[j],
            quality: qualities[j] || 'A',
          });
        }
        break;
      }
    }
  }
  
  // Calculate date range
  const timestamps = intervals.map(i => i.timestamp.getTime());
  const startDate = new Date(Math.min(...timestamps));
  const endDate = new Date(Math.max(...timestamps));
  
  // Calculate quality metrics
  const totalIntervals = intervals.length;
  const missingIntervals = intervals.filter(i => i.consumption === 0).length;
  const estimatedIntervals = intervals.filter(i => i.quality === 'E' || i.quality === 'S').length;
  const qualityScore = Math.round(((totalIntervals - estimatedIntervals - missingIntervals) / totalIntervals) * 100);
  
  return {
    version,
    creationDate,
    fromParticipant,
    toParticipant,
    nmi,
    suffix,
    uom,
    intervalMinutes,
    startDate,
    endDate,
    intervals,
    totalIntervals,
    missingIntervals,
    estimatedIntervals,
    qualityScore,
  };
}

/**
 * Parse NEM12 date format (YYYYMMDD)
 */
function parseNEM12Date(dateStr: string): Date {
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-indexed
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
}

/**
 * Parse NEM12 datetime format (YYYYMMDDHHMMSS)
 */
function parseNEM12DateTime(dateTimeStr: string): Date {
  const year = parseInt(dateTimeStr.substring(0, 4));
  const month = parseInt(dateTimeStr.substring(4, 6)) - 1;
  const day = parseInt(dateTimeStr.substring(6, 8));
  const hour = parseInt(dateTimeStr.substring(8, 10));
  const minute = parseInt(dateTimeStr.substring(10, 12));
  const second = parseInt(dateTimeStr.substring(12, 14));
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Calculate summary statistics from intervals
 */
export function calculateNEM12Statistics(intervals: NEM12Interval[]) {
  const totalConsumption = intervals.reduce((sum, i) => sum + i.consumption, 0);
  const totalDays = Math.ceil((intervals[intervals.length - 1].timestamp.getTime() - intervals[0].timestamp.getTime()) / (1000 * 60 * 60 * 24));
  const averageDaily = totalConsumption / totalDays;
  const averagePer30Min = totalConsumption / intervals.length;
  
  // Find peak demand
  let peakDemand = 0;
  let peakDemandTime: Date | null = null;
  let peakDemandDay: string | null = null;
  
  intervals.forEach(interval => {
    // Convert to kW (30-min interval in kWh * 2 = kW)
    const demand = interval.consumption * (60 / 30); // Adjust for interval length
    if (demand > peakDemand) {
      peakDemand = demand;
      peakDemandTime = interval.timestamp;
      peakDemandDay = interval.timestamp.toLocaleDateString('en-AU', { weekday: 'long' });
    }
  });
  
  return {
    totalConsumption: Math.round(totalConsumption * 100) / 100,
    totalDays,
    totalReadings: intervals.length,
    averageDaily: Math.round(averageDaily * 100) / 100,
    averagePer30Min: Math.round(averagePer30Min * 1000) / 1000,
    peakDemand: Math.round(peakDemand * 100) / 100,
    peakDemandTime,
    peakDemandDay,
  };
}

/**
 * Analyze consumption patterns
 */
export function analyzeNEM12Patterns(intervals: NEM12Interval[]) {
  // Hourly pattern (24 hours)
  const hourlyPattern = new Array(24).fill(0);
  const hourlyCounts = new Array(24).fill(0);
  
  // Daily pattern (7 days, 0=Sunday)
  const dailyPattern = new Array(7).fill(0);
  const dailyCounts = new Array(7).fill(0);
  
  intervals.forEach(interval => {
    const hour = interval.timestamp.getHours();
    const day = interval.timestamp.getDay();
    
    hourlyPattern[hour] += interval.consumption;
    hourlyCounts[hour]++;
    
    dailyPattern[day] += interval.consumption;
    dailyCounts[day]++;
  });
  
  // Calculate averages
  for (let i = 0; i < 24; i++) {
    hourlyPattern[i] = hourlyCounts[i] > 0 ? hourlyPattern[i] / hourlyCounts[i] : 0;
  }
  
  for (let i = 0; i < 7; i++) {
    dailyPattern[i] = dailyCounts[i] > 0 ? dailyPattern[i] / dailyCounts[i] : 0;
  }
  
  return {
    hourlyPattern: hourlyPattern.map(v => Math.round(v * 1000) / 1000),
    dailyPattern: dailyPattern.map(v => Math.round(v * 100) / 100),
  };
}

/**
 * Analyze time-of-use consumption
 * Australian standard times:
 * Peak: 2pm-8pm weekdays
 * Shoulder: 7am-2pm and 8pm-10pm weekdays, 7am-10pm weekends
 * Off-peak: 10pm-7am all days
 */
export function analyzeTimeOfUse(intervals: NEM12Interval[]) {
  let peakUsage = 0;
  let shoulderUsage = 0;
  let offPeakUsage = 0;
  
  intervals.forEach(interval => {
    const hour = interval.timestamp.getHours();
    const day = interval.timestamp.getDay();
    const isWeekday = day >= 1 && day <= 5;
    
    if (hour >= 22 || hour < 7) {
      // Off-peak: 10pm-7am
      offPeakUsage += interval.consumption;
    } else if (isWeekday && hour >= 14 && hour < 20) {
      // Peak: 2pm-8pm weekdays
      peakUsage += interval.consumption;
    } else {
      // Shoulder: everything else
      shoulderUsage += interval.consumption;
    }
  });
  
  return {
    peakUsage: Math.round(peakUsage * 100) / 100,
    shoulderUsage: Math.round(shoulderUsage * 100) / 100,
    offPeakUsage: Math.round(offPeakUsage * 100) / 100,
  };
}
