/**
 * Western Power Compliant SLD Data Types
 * Phase 2: Complete type definitions for 100% WP compliance
 */

// ============================================
// DOCUMENT CONTROL
// ============================================

export interface DocumentControl {
  drawingNumber: string;      // e.g., "SLD-2025-001"
  revision: string;            // "A", "B", "C"
  revisionDate: string;        // ISO date string
  revisionNotes?: string;
  sheetNumber: string;         // "1 of 1"
  scale: string;               // "NTS" (Not To Scale)
  dateDesigned: string;        // ISO date string
}

// ============================================
// PROJECT INFORMATION
// ============================================

export interface ProjectInfo {
  jobNumber: string;
  jobId: string;
  customerName: string;
  installationAddress: string;
  systemSize: number;          // kW
  panelCount: number;
  batteryCapacity?: number;    // kWh (if applicable)
}

// ============================================
// DESIGNER & APPROVER
// ============================================

export interface DesignerInfo {
  name: string;
  cecAccreditation: string;
  electricalLicense?: string;
  signatureDate?: string;
  signatureUrl?: string;       // Base64 or URL
}

export interface ApproverInfo {
  name?: string;
  license?: string;
  signatureDate?: string;
  stampUrl?: string;           // Base64 or URL (Western Power stamp)
}

// ============================================
// COMPANY INFORMATION
// ============================================

export interface CompanyInfo {
  name: string;
  abn: string;
  electricalLicense: string;
  cecAccreditation: string;
  phone: string;
  email: string;
  address?: string;
}

// ============================================
// SOLAR PANEL SPECIFICATIONS
// ============================================

export interface PanelSpecification {
  manufacturer: string;
  model: string;
  cecApproval: string;         // CEC approval number
  wattage: number;             // Watts per panel
  voc: number;                 // Open circuit voltage (V)
  isc: number;                 // Short circuit current (A)
  vmp: number;                 // Max power voltage (V)
  imp: number;                 // Max power current (A)
}

// ============================================
// STRING CONFIGURATION
// ============================================

export interface StringConfig {
  id: number;                  // String number (1, 2, 3...)
  panelCount: number;          // Panels in this string
  totalVoc: number;            // Total open circuit voltage
  totalIsc: number;            // Total short circuit current
}

// ============================================
// INVERTER SPECIFICATIONS
// ============================================

export interface InverterSpecification {
  manufacturer: string;
  model: string;
  cecApproval: string;
  capacity: number;            // kW
  efficiency: number;          // %
  maxDcInput: number;          // V
  acVoltage: number;           // 230V or 400V
  maxAcCurrent: number;        // A
  phases: number;              // 1 or 3
}

// ============================================
// BATTERY SPECIFICATIONS
// ============================================

export interface BatterySpecification {
  manufacturer: string;
  model: string;
  cecApproval: string;
  capacity: number;            // kWh
  usableCapacity: number;      // kWh
  voltage: number;             // V (typically 48V or 51.2V)
  chemistry: string;           // "LFP", "NMC", etc.
  bmsModel: string;            // Battery Management System
  vppEnrollment: string;       // "Synergy VPP" or "Plico VPP"
}

// ============================================
// CABLE SPECIFICATIONS
// ============================================

export interface CableSpecification {
  size: string;                // "6mm²", "10mm²"
  material: string;            // "Cu" (Copper)
  insulation?: string;         // "V-90", "XLPE" (DC only)
  type?: string;               // "TPS", "Singles in conduit" (AC only)
  voltageRating?: string;      // "1000V DC" (DC only)
  length: number;              // meters
  installMethod: string;       // "Conduit", "Cable tray", "Clipped direct"
  conduitType?: string;        // "PVC", "Metal"
  conduitSize?: string;        // "25mm", "32mm"
}

// ============================================
// PROTECTION DEVICES
// ============================================

export interface DCProtection {
  breakerRating: string;       // "32A", "40A"
  voltageRating: string;       // "1000V DC"
  breakingCapacity: string;    // "10kA", "15kA"
  type: string;                // "MCB", "Fuse"
  manufacturer?: string;
  model?: string;
}

export interface ACProtection {
  breakerRating: string;       // "40A", "50A"
  poles: number;               // 1, 2, or 3
  type: string;                // "MCB C40", "MCB D50"
  manufacturer?: string;
  model?: string;
  
  // RCD/RCBO
  rcdRating: string;           // "30mA", "300mA"
  rcdType: string;             // "Type A", "Type B" (Type B required for inverters)
  rcdPoles: number;            // 2 or 4
  rcdManufacturer?: string;
  rcdModel?: string;
  
  // Surge Protection
  surgeProtection?: boolean;
  surgeProtectionType?: string;    // "Type 1", "Type 2", "Type 1+2"
  surgeProtectionRating?: string;  // "40kA", "60kA"
}

// ============================================
// ISOLATORS
// ============================================

export interface IsolatorSpecification {
  rating: string;              // "1000V, 32A" or "250V, 40A"
  poles?: number;              // 2 or 4 (AC only)
  ipRating: string;            // "IP65", "IP66"
  standard?: string;           // "AS/NZS 5033" (DC only)
  manufacturer?: string;
  model?: string;
  location?: string;           // "Roof", "Wall-mounted", "Near inverter"
}

export interface IsolatorsConfig {
  dc: IsolatorSpecification;
  ac: IsolatorSpecification;
  battery?: IsolatorSpecification;  // If battery system
}

// ============================================
// EARTHING SYSTEM
// ============================================

export interface EarthingSystem {
  system: string;              // "TN-S", "TN-C-S", "TT"
  electrodeType: string;       // "Rod", "Plate", "Grid"
  electrodeLocation: string;   // "Front yard", "Side of house"
  conductorSize: string;       // "6mm² Cu", "10mm² Cu"
  menLink: boolean;            // Main Earthing Neutral link present
  notes?: string;
}

// ============================================
// METERING
// ============================================

export interface MeteringInfo {
  type: string;                // "AMI", "Smart Meter", "Bi-directional"
  location: string;            // "External wall", "Meter box"
  bidirectional: boolean;
  ctRating?: string;           // "100A/5A" (if CT meter)
}

// ============================================
// MAIN SWITCHBOARD
// ============================================

export interface MainSwitchboard {
  mainSwitchRating: string;    // "63A", "80A", "100A"
  poles: number;               // 1, 2, or 3
  busbarRating: string;        // "100A", "200A"
  affectedCircuits: string[];  // List of circuits affected
  spareWays?: number;          // Number of spare positions
}

// ============================================
// WA-SPECIFIC REQUIREMENTS
// ============================================

export interface WASpecific {
  exportLimitKw: number;       // 5.0 or 1.5
  exportLimitReason: string;   // Explanation of limit
  exportLimitDevice?: string;  // Device details if >5kVA
  phaseConfiguration: string;  // "Single Phase" or "3-Phase"
  supplyType: string;          // "Overhead" or "Underground"
  synergyDesRequired: boolean;
  westernPowerAppRequired: boolean;
}

// ============================================
// COMPLIANCE
// ============================================

export interface ComplianceInfo {
  standards: string[];         // ["AS/NZS 5033:2021", "AS/NZS 3000:2018", ...]
  cecApproved: boolean;
  notes: string[];             // Compliance notes
}

// ============================================
// MAIN SLD DATA INTERFACE
// ============================================

export interface WesternPowerSldData {
  // Document Control
  documentControl: DocumentControl;
  
  // Project Information
  project: ProjectInfo;
  
  // Designer & Approver
  designer: DesignerInfo;
  approver?: ApproverInfo;
  
  // Company Information
  company: CompanyInfo;
  
  // Equipment Specifications
  panels: PanelSpecification;
  strings: StringConfig[];
  inverter: InverterSpecification;
  battery?: BatterySpecification;
  
  // Cables
  dcCables: CableSpecification;
  acCables: CableSpecification;
  
  // Protection
  dcProtection: DCProtection;
  acProtection: ACProtection;
  
  // Isolators
  isolators: IsolatorsConfig;
  
  // Earthing
  earthing: EarthingSystem;
  
  // Metering
  metering: MeteringInfo;
  
  // Main Switchboard
  mainSwitchboard: MainSwitchboard;
  
  // WA-Specific
  waSpecific: WASpecific;
  
  // Compliance
  compliance: ComplianceInfo;
}

// ============================================
// VALIDATION RESULT
// ============================================

export interface SldValidationResult {
  isValid: boolean;
  completionPercentage: number;
  missingFields: string[];
  warnings: string[];
  errors: string[];
}

// ============================================
// HELPER TYPES
// ============================================

export type SldSection = 
  | 'documentControl'
  | 'project'
  | 'designer'
  | 'company'
  | 'panels'
  | 'inverter'
  | 'battery'
  | 'cables'
  | 'protection'
  | 'isolators'
  | 'earthing'
  | 'metering'
  | 'switchboard'
  | 'waSpecific'
  | 'compliance';

export interface SldSectionStatus {
  section: SldSection;
  complete: boolean;
  completionPercentage: number;
  missingFields: string[];
}
