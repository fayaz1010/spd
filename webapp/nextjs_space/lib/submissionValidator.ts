// Pre-Submission Validation
// Validates ALL compliance requirements before STC/rebate submission

export interface ValidationRule {
  id: string;
  category: string;
  name: string;
  required: boolean;
  check: (data: any) => Promise<boolean>;
  errorMessage: string;
  warningMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  canSubmit: boolean;
  completionPercentage: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  ruleId: string;
  category: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  ruleId: string;
  category: string;
  message: string;
  field?: string;
}

export interface ValidationSummary {
  totalRules: number;
  passedRules: number;
  failedRules: number;
  requiredPassed: number;
  requiredTotal: number;
  optionalPassed: number;
  optionalTotal: number;
}

/**
 * Comprehensive validation before STC/rebate submission
 */
export async function validateForSubmission(jobId: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Fetch all job data
  const jobData = await fetchJobData(jobId);
  
  // Define validation rules
  const rules = getValidationRules();
  
  let passedRules = 0;
  let requiredPassed = 0;
  let requiredTotal = 0;
  let optionalPassed = 0;
  let optionalTotal = 0;
  
  // Run all validation rules
  for (const rule of rules) {
    try {
      const passed = await rule.check(jobData);
      
      if (rule.required) {
        requiredTotal++;
        if (passed) {
          requiredPassed++;
          passedRules++;
        } else {
          errors.push({
            ruleId: rule.id,
            category: rule.category,
            message: rule.errorMessage
          });
        }
      } else {
        optionalTotal++;
        if (passed) {
          optionalPassed++;
          passedRules++;
        } else if (rule.warningMessage) {
          warnings.push({
            ruleId: rule.id,
            category: rule.category,
            message: rule.warningMessage
          });
        }
      }
    } catch (error) {
      console.error(`Validation rule ${rule.id} failed:`, error);
      errors.push({
        ruleId: rule.id,
        category: rule.category,
        message: `Validation check failed: ${error}`
      });
    }
  }
  
  const totalRules = rules.length;
  const failedRules = totalRules - passedRules;
  const completionPercentage = Math.round((passedRules / totalRules) * 100);
  const canSubmit = requiredPassed === requiredTotal;
  
  return {
    isValid: canSubmit,
    canSubmit,
    completionPercentage,
    errors,
    warnings,
    summary: {
      totalRules,
      passedRules,
      failedRules,
      requiredPassed,
      requiredTotal,
      optionalPassed,
      optionalTotal
    }
  };
}

/**
 * Get all validation rules
 */
function getValidationRules(): ValidationRule[] {
  return [
    // EQUIPMENT SERIAL NUMBERS (Required for CER)
    {
      id: 'serials_all_panels',
      category: 'Equipment',
      name: 'All panel serial numbers recorded',
      required: true,
      check: async (data) => {
        const panelCount = data.lead?.numPanels || 0;
        const recordedSerials = data.serials?.filter((s: any) => s.equipmentType === 'panel').length || 0;
        return recordedSerials >= panelCount;
      },
      errorMessage: 'Not all panel serial numbers have been recorded'
    },
    {
      id: 'serials_inverter',
      category: 'Equipment',
      name: 'Inverter serial number recorded',
      required: true,
      check: async (data) => {
        return data.serials?.some((s: any) => s.equipmentType === 'inverter') || false;
      },
      errorMessage: 'Inverter serial number is missing'
    },
    {
      id: 'serials_battery',
      category: 'Equipment',
      name: 'Battery serial number recorded (if applicable)',
      required: true,
      check: async (data) => {
        const hasBattery = (data.lead?.batterySizeKwh || 0) > 0;
        if (!hasBattery) return true;
        return data.serials?.some((s: any) => s.equipmentType === 'battery') || false;
      },
      errorMessage: 'Battery serial number is missing'
    },
    
    // CEC APPROVAL (Required for CER)
    {
      id: 'cec_panels_approved',
      category: 'CEC Compliance',
      name: 'All panels are CEC approved',
      required: true,
      check: async (data) => {
        const panels = data.serials?.filter((s: any) => s.equipmentType === 'panel') || [];
        return panels.every((p: any) => p.cecApproved);
      },
      errorMessage: 'One or more panels are not CEC approved'
    },
    {
      id: 'cec_inverter_approved',
      category: 'CEC Compliance',
      name: 'Inverter is CEC approved',
      required: true,
      check: async (data) => {
        const inverter = data.serials?.find((s: any) => s.equipmentType === 'inverter');
        return inverter?.cecApproved || false;
      },
      errorMessage: 'Inverter is not CEC approved'
    },
    {
      id: 'cec_battery_approved',
      category: 'CEC Compliance',
      name: 'Battery is CEC approved (if applicable)',
      required: true,
      check: async (data) => {
        const hasBattery = (data.lead?.batterySizeKwh || 0) > 0;
        if (!hasBattery) return true;
        const battery = data.serials?.find((s: any) => s.equipmentType === 'battery');
        return battery?.cecApproved || false;
      },
      errorMessage: 'Battery is not CEC approved'
    },
    
    // PHOTOS (Required for CER)
    {
      id: 'photos_minimum_count',
      category: 'Photos',
      name: 'Minimum 30 photos uploaded',
      required: true,
      check: async (data) => {
        return (data.photos?.length || 0) >= 30;
      },
      errorMessage: 'Minimum 30 photos required (currently have {count})'
    },
    {
      id: 'photos_equipment',
      category: 'Photos',
      name: 'Equipment photos uploaded',
      required: true,
      check: async (data) => {
        return (data.photos?.filter((p: any) => p.category === 'equipment').length || 0) >= 10;
      },
      errorMessage: 'Minimum 10 equipment photos required'
    },
    {
      id: 'photos_progress',
      category: 'Photos',
      name: 'Installation progress photos uploaded',
      required: true,
      check: async (data) => {
        return (data.photos?.filter((p: any) => p.category === 'progress').length || 0) >= 15;
      },
      errorMessage: 'Minimum 15 progress photos required'
    },
    {
      id: 'photos_safety',
      category: 'Photos',
      name: 'Safety compliance photos uploaded',
      required: true,
      check: async (data) => {
        return (data.photos?.filter((p: any) => p.category === 'safety').length || 0) >= 3;
      },
      errorMessage: 'Minimum 3 safety photos required (installer selfie, ID, license)'
    },
    {
      id: 'photos_final',
      category: 'Photos',
      name: 'Final completion photos uploaded',
      required: true,
      check: async (data) => {
        return (data.photos?.filter((p: any) => p.category === 'final').length || 0) >= 5;
      },
      errorMessage: 'Minimum 5 final photos required'
    },
    
    // GPS METADATA (Required for CER)
    {
      id: 'photos_gps_metadata',
      category: 'Photo Metadata',
      name: 'All photos have GPS metadata',
      required: true,
      check: async (data) => {
        const photos = data.photos || [];
        if (photos.length === 0) return false;
        return photos.every((p: any) => p.gpsLatitude && p.gpsLongitude);
      },
      errorMessage: 'Some photos are missing GPS metadata'
    },
    {
      id: 'photos_timestamp',
      category: 'Photo Metadata',
      name: 'All photos have timestamps',
      required: true,
      check: async (data) => {
        const photos = data.photos || [];
        if (photos.length === 0) return false;
        return photos.every((p: any) => p.timestamp);
      },
      errorMessage: 'Some photos are missing timestamps'
    },
    
    // INSTALLER ATTENDANCE (Required for CER)
    {
      id: 'installer_selfie',
      category: 'Installer Verification',
      name: 'Installer selfie with face visible',
      required: true,
      check: async (data) => {
        const safetyPhotos = data.photos?.filter((p: any) => p.category === 'safety') || [];
        return safetyPhotos.length >= 1; // At least one safety photo (selfie)
      },
      errorMessage: 'Installer selfie is required for on-site attendance proof'
    },
    
    // DOCUMENTS (Required for CER)
    {
      id: 'doc_coes',
      category: 'Documents',
      name: 'COES (Certificate of Electrical Safety) uploaded',
      required: true,
      check: async (data) => {
        return data.documents?.some((d: any) => d.documentType === 'coes') || false;
      },
      errorMessage: 'COES certificate is required'
    },
    {
      id: 'doc_compliance_cert',
      category: 'Documents',
      name: 'Certificate of Compliance uploaded',
      required: true,
      check: async (data) => {
        return data.documents?.some((d: any) => d.documentType === 'compliance_cert') || false;
      },
      errorMessage: 'Certificate of Compliance is required'
    },
    {
      id: 'doc_commissioning',
      category: 'Documents',
      name: 'Commissioning report uploaded',
      required: false,
      check: async (data) => {
        return data.documents?.some((d: any) => d.documentType === 'commissioning') || false;
      },
      warningMessage: 'Commissioning report recommended but not required'
    },
    
    // CHECKLIST (Required for quality)
    {
      id: 'checklist_pre_install',
      category: 'Checklist',
      name: 'Pre-installation checklist complete',
      required: true,
      check: async (data) => {
        const preItems = data.checklistItems?.filter((i: any) => i.checklistType === 'pre_install') || [];
        const requiredItems = preItems.filter((i: any) => i.required);
        const completedRequired = requiredItems.filter((i: any) => i.completed);
        return requiredItems.length > 0 && completedRequired.length === requiredItems.length;
      },
      errorMessage: 'Pre-installation checklist is not complete'
    },
    {
      id: 'checklist_during_install',
      category: 'Checklist',
      name: 'During-installation checklist complete',
      required: true,
      check: async (data) => {
        const duringItems = data.checklistItems?.filter((i: any) => i.checklistType === 'during_install') || [];
        const requiredItems = duringItems.filter((i: any) => i.required);
        const completedRequired = requiredItems.filter((i: any) => i.completed);
        return requiredItems.length > 0 && completedRequired.length === requiredItems.length;
      },
      errorMessage: 'During-installation checklist is not complete'
    },
    {
      id: 'checklist_post_install',
      category: 'Checklist',
      name: 'Post-installation checklist complete',
      required: true,
      check: async (data) => {
        const postItems = data.checklistItems?.filter((i: any) => i.checklistType === 'post_install') || [];
        const requiredItems = postItems.filter((i: any) => i.required);
        const completedRequired = requiredItems.filter((i: any) => i.completed);
        return requiredItems.length > 0 && completedRequired.length === requiredItems.length;
      },
      errorMessage: 'Post-installation checklist is not complete'
    },
    
    // REGULATORY APPROVALS (Required for installation)
    {
      id: 'approval_synergy',
      category: 'Approvals',
      name: 'Synergy DES approval received',
      required: true,
      check: async (data) => {
        return data.lead?.regulatoryApplication?.synergyApproved || false;
      },
      errorMessage: 'Synergy DES approval is required'
    },
    {
      id: 'approval_western_power',
      category: 'Approvals',
      name: 'Western Power approval received',
      required: true,
      check: async (data) => {
        return data.lead?.regulatoryApplication?.wpApproved || false;
      },
      errorMessage: 'Western Power approval is required'
    },
    
    // PAYMENT (Required for installation)
    {
      id: 'payment_deposit',
      category: 'Payment',
      name: 'Deposit payment received',
      required: true,
      check: async (data) => {
        return data.lead?.depositPaid || false;
      },
      errorMessage: 'Deposit payment must be received before submission'
    }
  ];
}

/**
 * Fetch all job data for validation
 */
async function fetchJobData(jobId: string): Promise<any> {
  try {
    const response = await fetch(`/api/admin/jobs/${jobId}/validation-data`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch job data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching job data:', error);
    throw error;
  }
}

/**
 * Get validation status badge
 */
export function getValidationBadge(result: ValidationResult): {
  color: 'green' | 'red' | 'yellow';
  text: string;
  icon: string;
} {
  if (result.canSubmit) {
    return {
      color: 'green',
      text: 'Ready to Submit',
      icon: '✓'
    };
  }

  if (result.completionPercentage >= 80) {
    return {
      color: 'yellow',
      text: 'Almost Ready',
      icon: '⚠'
    };
  }

  return {
    color: 'red',
    text: 'Not Ready',
    icon: '✗'
  };
}
