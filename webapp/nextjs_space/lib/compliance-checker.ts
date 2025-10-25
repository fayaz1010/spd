/**
 * Compliance Checker
 * Calculates compliance scores and identifies missing requirements
 */

export interface ComplianceRequirement {
  id: string;
  category: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedDate?: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ComplianceScore {
  overall: number; // 0-100
  critical: number; // 0-100
  categories: {
    documents: number;
    validation: number;
    photos: number;
    signatures: number;
    network: number;
  };
  readyForRebate: boolean;
  readyForHandover: boolean;
  auditReady: boolean;
}

export interface ComplianceReport {
  score: ComplianceScore;
  requirements: ComplianceRequirement[];
  missingCritical: ComplianceRequirement[];
  missingHigh: ComplianceRequirement[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Check job compliance status
 */
export function checkJobCompliance(jobData: {
  // Documents
  hasSLD: boolean;
  hasElectricalCertificate: boolean;
  hasComplianceStatement: boolean;
  hasTestResults: boolean;
  hasCustomerDeclaration: boolean;
  hasHandoverPack: boolean;

  // Validation
  panelCount: number;
  panelsValidated: number;
  hasInverterValidation: boolean;

  // Photos
  photoCount: number;
  hasBeforePhotos: boolean;
  hasDuringPhotos: boolean;
  hasAfterPhotos: boolean;
  hasSerialPhotos: boolean;

  // Signatures
  hasCustomerSignature: boolean;
  hasInstallerSignature: boolean;

  // Network
  hasNetworkApproval: boolean;
  networkApprovalStatus?: string;

  // System details
  systemSize: number;
  state: string;
}): ComplianceReport {
  const requirements: ComplianceRequirement[] = [];

  // CRITICAL REQUIREMENTS (Must have for rebate)
  
  // Documents
  requirements.push({
    id: 'doc-sld',
    category: 'Documents',
    name: 'Single Line Diagram',
    description: 'Electrical schematic showing system layout',
    required: true,
    completed: jobData.hasSLD,
    priority: 'critical',
  });

  requirements.push({
    id: 'doc-cert',
    category: 'Documents',
    name: 'Certificate of Electrical Safety',
    description: `${jobData.state} electrical compliance certificate`,
    required: true,
    completed: jobData.hasElectricalCertificate,
    priority: 'critical',
  });

  requirements.push({
    id: 'doc-compliance',
    category: 'Documents',
    name: 'Written Compliance Statement',
    description: 'CEC accredited installer statement',
    required: true,
    completed: jobData.hasComplianceStatement,
    priority: 'critical',
  });

  requirements.push({
    id: 'doc-test',
    category: 'Documents',
    name: 'Test Results & Commissioning',
    description: 'Insulation, earth, and voltage tests',
    required: true,
    completed: jobData.hasTestResults,
    priority: 'critical',
  });

  requirements.push({
    id: 'doc-declaration',
    category: 'Documents',
    name: 'Customer Declaration',
    description: 'STC assignment and customer acknowledgment',
    required: true,
    completed: jobData.hasCustomerDeclaration,
    priority: 'critical',
  });

  // Validation
  const allPanelsValidated = jobData.panelCount > 0 && jobData.panelsValidated === jobData.panelCount;
  
  requirements.push({
    id: 'val-panels',
    category: 'Validation',
    name: 'Panel Serial Validation',
    description: `All ${jobData.panelCount} panels validated against CEC list`,
    required: true,
    completed: allPanelsValidated,
    priority: 'critical',
  });

  requirements.push({
    id: 'val-inverter',
    category: 'Validation',
    name: 'Inverter Serial Validation',
    description: 'Inverter validated against CEC list and AS4777 compliant',
    required: true,
    completed: jobData.hasInverterValidation,
    priority: 'critical',
  });

  // Photos
  requirements.push({
    id: 'photo-serial',
    category: 'Photos',
    name: 'Serial Number Photos',
    description: 'Clear photos of all panel and inverter serial numbers',
    required: true,
    completed: jobData.hasSerialPhotos,
    priority: 'critical',
  });

  requirements.push({
    id: 'photo-installation',
    category: 'Photos',
    name: 'Installation Photos',
    description: 'Before, during, and after installation photos',
    required: true,
    completed: jobData.hasBeforePhotos && jobData.hasDuringPhotos && jobData.hasAfterPhotos,
    priority: 'high',
  });

  // Signatures
  requirements.push({
    id: 'sig-customer',
    category: 'Signatures',
    name: 'Customer Signature',
    description: 'Customer signature on declaration and handover',
    required: true,
    completed: jobData.hasCustomerSignature,
    priority: 'critical',
  });

  requirements.push({
    id: 'sig-installer',
    category: 'Signatures',
    name: 'Installer Signature',
    description: 'Installer signature on compliance statement',
    required: true,
    completed: jobData.hasInstallerSignature,
    priority: 'critical',
  });

  // Network
  requirements.push({
    id: 'net-approval',
    category: 'Network',
    name: 'Network Connection Approval',
    description: 'Grid connection approved by network provider',
    required: true,
    completed: jobData.hasNetworkApproval && jobData.networkApprovalStatus === 'APPROVED',
    priority: 'high',
  });

  // HIGH PRIORITY (Should have)
  requirements.push({
    id: 'doc-handover',
    category: 'Documents',
    name: 'Customer Handover Pack',
    description: 'Complete documentation package for customer',
    required: false,
    completed: jobData.hasHandoverPack,
    priority: 'high',
  });

  // Calculate scores
  const criticalReqs = requirements.filter(r => r.priority === 'critical');
  const criticalCompleted = criticalReqs.filter(r => r.completed).length;
  const criticalScore = criticalReqs.length > 0 ? (criticalCompleted / criticalReqs.length) * 100 : 0;

  const highReqs = requirements.filter(r => r.priority === 'high');
  const highCompleted = highReqs.filter(r => r.completed).length;

  const allRequired = requirements.filter(r => r.required);
  const allRequiredCompleted = allRequired.filter(r => r.completed).length;
  const overallScore = allRequired.length > 0 ? (allRequiredCompleted / allRequired.length) * 100 : 0;

  // Category scores
  const docReqs = requirements.filter(r => r.category === 'Documents');
  const docCompleted = docReqs.filter(r => r.completed).length;
  const docScore = docReqs.length > 0 ? (docCompleted / docReqs.length) * 100 : 0;

  const valReqs = requirements.filter(r => r.category === 'Validation');
  const valCompleted = valReqs.filter(r => r.completed).length;
  const valScore = valReqs.length > 0 ? (valCompleted / valReqs.length) * 100 : 0;

  const photoReqs = requirements.filter(r => r.category === 'Photos');
  const photoCompleted = photoReqs.filter(r => r.completed).length;
  const photoScore = photoReqs.length > 0 ? (photoCompleted / photoReqs.length) * 100 : 0;

  const sigReqs = requirements.filter(r => r.category === 'Signatures');
  const sigCompleted = sigReqs.filter(r => r.completed).length;
  const sigScore = sigReqs.length > 0 ? (sigCompleted / sigReqs.length) * 100 : 0;

  const netReqs = requirements.filter(r => r.category === 'Network');
  const netCompleted = netReqs.filter(r => r.completed).length;
  const netScore = netReqs.length > 0 ? (netCompleted / netReqs.length) * 100 : 0;

  const score: ComplianceScore = {
    overall: Math.round(overallScore),
    critical: Math.round(criticalScore),
    categories: {
      documents: Math.round(docScore),
      validation: Math.round(valScore),
      photos: Math.round(photoScore),
      signatures: Math.round(sigScore),
      network: Math.round(netScore),
    },
    readyForRebate: criticalScore === 100,
    readyForHandover: overallScore >= 90,
    auditReady: overallScore === 100,
  };

  // Missing requirements
  const missingCritical = requirements.filter(r => r.priority === 'critical' && !r.completed);
  const missingHigh = requirements.filter(r => r.priority === 'high' && !r.completed);

  // Warnings
  const warnings: string[] = [];
  
  if (jobData.panelCount > 0 && jobData.panelsValidated < jobData.panelCount) {
    warnings.push(`Only ${jobData.panelsValidated} of ${jobData.panelCount} panels validated`);
  }

  if (jobData.photoCount < 10) {
    warnings.push('Less than 10 photos uploaded - ensure all required photos are captured');
  }

  if (jobData.hasNetworkApproval && jobData.networkApprovalStatus !== 'APPROVED') {
    warnings.push(`Network approval status: ${jobData.networkApprovalStatus}`);
  }

  // Recommendations
  const recommendations: string[] = [];

  if (missingCritical.length > 0) {
    recommendations.push('Complete all critical requirements before submitting for rebate');
  }

  if (score.overall < 100) {
    recommendations.push('Complete all requirements for full audit readiness');
  }

  if (!jobData.hasHandoverPack) {
    recommendations.push('Generate handover pack for professional customer experience');
  }

  return {
    score,
    requirements,
    missingCritical,
    missingHigh,
    warnings,
    recommendations,
  };
}

/**
 * Get compliance status color
 */
export function getComplianceColor(score: number): string {
  if (score >= 90) return 'green';
  if (score >= 70) return 'yellow';
  if (score >= 50) return 'orange';
  return 'red';
}

/**
 * Get compliance status text
 */
export function getComplianceStatus(score: number): string {
  if (score === 100) return 'Fully Compliant';
  if (score >= 90) return 'Nearly Complete';
  if (score >= 70) return 'In Progress';
  if (score >= 50) return 'Needs Attention';
  return 'Critical Issues';
}

/**
 * Format compliance percentage
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}
