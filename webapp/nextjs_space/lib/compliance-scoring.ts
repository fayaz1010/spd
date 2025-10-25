// Compliance Scoring Engine
// Calculates real-time compliance score (0-100) based on checklist completion

export interface ComplianceChecklistData {
  // Pre-Installation (20 points)
  cecAccreditationVerified: boolean;
  electricalLicenseVerified: boolean;
  councilPermitObtained: boolean;
  networkApprovalObtained: boolean;
  
  // Installation (40 points)
  panelsValidated: boolean;
  inverterValidated: boolean;
  batteryValidated: boolean;
  isolatorsInstalled: boolean;
  labelsAffixed: boolean;
  earthingCompleted: boolean;
  
  // Testing (20 points)
  insulationTested: boolean;
  earthContinuityTested: boolean;
  voltageRiseCalculated: boolean;
  systemCommissioned: boolean;
  
  // Documentation (20 points)
  sldCompleted: boolean;
  complianceCertIssued: boolean;
  customerHandoverComplete: boolean;
  photosUploaded: boolean;
  
  // Rebate (bonus, not counted in score)
  stcDocumentationComplete: boolean;
  customerDeclarationSigned: boolean;
}

export interface ComplianceScore {
  totalScore: number;
  preInstallationScore: number;
  installationScore: number;
  testingScore: number;
  documentationScore: number;
  missingItems: string[];
  criticalIssues: string[];
  isFullyCompliant: boolean;
}

const POINTS = {
  // Pre-Installation (20 points total)
  preInstallation: {
    cecAccreditationVerified: 5,
    electricalLicenseVerified: 5,
    councilPermitObtained: 5,
    networkApprovalObtained: 5,
  },
  
  // Installation (40 points total)
  installation: {
    panelsValidated: 15,
    inverterValidated: 10,
    batteryValidated: 5,
    isolatorsInstalled: 3,
    labelsAffixed: 3,
    earthingCompleted: 4,
  },
  
  // Testing (20 points total)
  testing: {
    insulationTested: 7,
    earthContinuityTested: 7,
    voltageRiseCalculated: 6,
    systemCommissioned: 0, // Bonus, doesn't count
  },
  
  // Documentation (20 points total)
  documentation: {
    sldCompleted: 5,
    complianceCertIssued: 5,
    customerHandoverComplete: 5,
    photosUploaded: 5,
  },
};

const LABELS = {
  cecAccreditationVerified: 'CEC Accreditation Verified',
  electricalLicenseVerified: 'Electrical License Verified',
  councilPermitObtained: 'Council Permit Obtained',
  networkApprovalObtained: 'Network Approval Obtained',
  panelsValidated: 'All Panels Validated',
  inverterValidated: 'Inverter Validated',
  batteryValidated: 'Battery Validated',
  isolatorsInstalled: 'Isolators Installed',
  labelsAffixed: 'Warning Labels Affixed',
  earthingCompleted: 'Earthing Completed',
  insulationTested: 'Insulation Test Passed',
  earthContinuityTested: 'Earth Continuity Test Passed',
  voltageRiseCalculated: 'Voltage Rise Calculated',
  systemCommissioned: 'System Commissioned',
  sldCompleted: 'Single Line Diagram Completed',
  complianceCertIssued: 'Compliance Certificate Issued',
  customerHandoverComplete: 'Customer Handover Complete',
  photosUploaded: 'Photos Uploaded',
  stcDocumentationComplete: 'STC Documentation Complete',
  customerDeclarationSigned: 'Customer Declaration Signed',
};

const CRITICAL_ITEMS = [
  'cecAccreditationVerified',
  'electricalLicenseVerified',
  'panelsValidated',
  'inverterValidated',
  'insulationTested',
  'earthContinuityTested',
  'complianceCertIssued',
];

export function calculateComplianceScore(checklist: ComplianceChecklistData): ComplianceScore {
  let preInstallationScore = 0;
  let installationScore = 0;
  let testingScore = 0;
  let documentationScore = 0;
  const missingItems: string[] = [];
  const criticalIssues: string[] = [];
  
  // Pre-Installation (20 points)
  Object.entries(POINTS.preInstallation).forEach(([key, points]) => {
    if (checklist[key as keyof ComplianceChecklistData]) {
      preInstallationScore += points;
    } else {
      missingItems.push(LABELS[key as keyof typeof LABELS]);
      if (CRITICAL_ITEMS.includes(key)) {
        criticalIssues.push(LABELS[key as keyof typeof LABELS]);
      }
    }
  });
  
  // Installation (40 points)
  Object.entries(POINTS.installation).forEach(([key, points]) => {
    if (checklist[key as keyof ComplianceChecklistData]) {
      installationScore += points;
    } else {
      missingItems.push(LABELS[key as keyof typeof LABELS]);
      if (CRITICAL_ITEMS.includes(key)) {
        criticalIssues.push(LABELS[key as keyof typeof LABELS]);
      }
    }
  });
  
  // Testing (20 points)
  Object.entries(POINTS.testing).forEach(([key, points]) => {
    if (checklist[key as keyof ComplianceChecklistData]) {
      testingScore += points;
    } else {
      if (key !== 'systemCommissioned') { // systemCommissioned is bonus
        missingItems.push(LABELS[key as keyof typeof LABELS]);
        if (CRITICAL_ITEMS.includes(key)) {
          criticalIssues.push(LABELS[key as keyof typeof LABELS]);
        }
      }
    }
  });
  
  // Documentation (20 points)
  Object.entries(POINTS.documentation).forEach(([key, points]) => {
    if (checklist[key as keyof ComplianceChecklistData]) {
      documentationScore += points;
    } else {
      missingItems.push(LABELS[key as keyof typeof LABELS]);
      if (CRITICAL_ITEMS.includes(key)) {
        criticalIssues.push(LABELS[key as keyof typeof LABELS]);
      }
    }
  });
  
  const totalScore = preInstallationScore + installationScore + testingScore + documentationScore;
  const isFullyCompliant = totalScore === 100 && criticalIssues.length === 0;
  
  return {
    totalScore,
    preInstallationScore,
    installationScore,
    testingScore,
    documentationScore,
    missingItems,
    criticalIssues,
    isFullyCompliant,
  };
}

export function getComplianceStatus(score: number): {
  status: 'critical' | 'warning' | 'good' | 'excellent';
  color: string;
  message: string;
} {
  if (score < 50) {
    return {
      status: 'critical',
      color: 'red',
      message: 'Critical compliance issues - cannot complete job',
    };
  } else if (score < 75) {
    return {
      status: 'warning',
      color: 'orange',
      message: 'Compliance issues need attention',
    };
  } else if (score < 100) {
    return {
      status: 'good',
      color: 'yellow',
      message: 'Nearly compliant - few items remaining',
    };
  } else {
    return {
      status: 'excellent',
      color: 'green',
      message: 'Fully compliant - ready to complete',
    };
  }
}

// Calculate STCs (Small-scale Technology Certificates)
export function calculateSTCs(
  systemSizeKw: number,
  postcode: string,
  installDate: Date = new Date()
): number {
  // Zone rating based on postcode (simplified - in production, use full database)
  const getZoneRating = (postcode: string): number => {
    const code = parseInt(postcode);
    if (code >= 6000 && code <= 6999) return 1.622; // WA
    if (code >= 5000 && code <= 5999) return 1.536; // SA
    if (code >= 3000 && code <= 3999) return 1.382; // VIC
    if (code >= 2000 && code <= 2999) return 1.382; // NSW
    if (code >= 4000 && code <= 4999) return 1.536; // QLD
    return 1.382; // Default
  };
  
  // Deeming period (years remaining until 2030)
  const getDeemingPeriod = (date: Date): number => {
    const year = date.getFullYear();
    const deemingEndYear = 2030;
    return Math.max(0, deemingEndYear - year);
  };
  
  const zone = getZoneRating(postcode);
  const deemingPeriod = getDeemingPeriod(installDate);
  
  // STC = System size × Zone × Deeming × 1.0 (for simplicity)
  const stcs = systemSizeKw * zone * deemingPeriod;
  
  return Math.floor(stcs);
}

// Voltage rise calculation (simplified)
export function calculateVoltageRise(
  systemSizeKw: number,
  cableLength: number,
  cableSize: number,
  voltage: number = 230
): {
  voltageRise: number;
  voltageRisePercent: number;
  isCompliant: boolean;
  recommendation: string;
} {
  // Simplified calculation - in production, use full AS/NZS 5033 formula
  const current = (systemSizeKw * 1000) / voltage;
  const resistance = (0.0175 * cableLength) / cableSize; // Simplified
  const voltageRise = current * resistance * 2; // 2 for return path
  const voltageRisePercent = (voltageRise / voltage) * 100;
  
  const isCompliant = voltageRisePercent <= 5; // AS/NZS 5033 limit
  
  let recommendation = '';
  if (!isCompliant) {
    recommendation = `Voltage rise ${voltageRisePercent.toFixed(2)}% exceeds 5% limit. Consider: 1) Larger cable size, 2) Shorter cable run, 3) Reduce system size`;
  } else {
    recommendation = `Voltage rise ${voltageRisePercent.toFixed(2)}% is compliant (< 5%)`;
  }
  
  return {
    voltageRise,
    voltageRisePercent,
    isCompliant,
    recommendation,
  };
}
