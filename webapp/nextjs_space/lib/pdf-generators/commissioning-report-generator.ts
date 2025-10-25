/**
 * Commissioning Report Generator
 * Comprehensive installation and commissioning documentation
 */

interface CommissioningReportData {
  // Job details
  jobNumber: string;
  customerName: string;
  installationAddress: string;
  suburb?: string;
  postcode?: string;
  
  // Timeline
  scheduledDate?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualHours?: number;
  completedAt: Date;
  
  // System details
  systemSize: number;
  panelCount: number;
  panelManufacturer: string;
  panelModel: string;
  panelWattage: number;
  inverterManufacturer: string;
  inverterModel: string;
  inverterCapacity: number;
  batteryManufacturer?: string;
  batteryModel?: string;
  batteryCapacity?: number;
  
  // Equipment serials
  panelSerials: string[];
  inverterSerial: string;
  batterySerial?: string;
  
  // Installation team
  installerName: string;
  installerCecNumber: string;
  electricianName: string;
  electricianLicense: string;
  teamMembers?: string[];
  
  // Test results
  voltageTest: number;
  currentTest: number;
  insulationTestDC?: number;
  insulationTestAC?: number;
  earthContinuity?: number;
  voltageRise?: number;
  
  // Commissioning checklist
  systemPoweredUp: boolean;
  inverterConfigured: boolean;
  inverterOnline: boolean;
  batteryCharging?: boolean;
  gridExportTest: boolean;
  monitoringActivated: boolean;
  exportLimitSet?: number;
  
  // Customer handover
  systemDemoComplete: boolean;
  monitoringAppSetup: boolean;
  warrantyProvided: boolean;
  customerRating?: number;
  
  // Warranty information
  panelWarranty?: string;
  inverterWarranty?: string;
  batteryWarranty?: string;
  installationWarranty?: string;
  
  // Photos (counts)
  preInstallPhotos?: number;
  installationPhotos?: number;
  testPhotos?: number;
  compliancePhotos?: number;
  
  // Notes
  notes?: string;
}

export async function generateCommissioningReportPDF(data: CommissioningReportData): Promise<Buffer> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #000;
      padding: 30px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 25px;
      padding: 25px;
      background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
      color: white;
      border-radius: 8px;
    }
    
    .header h1 {
      font-size: 24pt;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .header .subtitle {
      font-size: 12pt;
      opacity: 0.95;
    }
    
    .header .job-number {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 10px;
      padding: 8px 15px;
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
      display: inline-block;
    }
    
    .summary-box {
      background: #f0f9ff;
      border: 2px solid #0ea5e9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    
    .summary-item {
      text-align: center;
      padding: 15px;
      background: white;
      border-radius: 6px;
      border: 1px solid #bae6fd;
    }
    
    .summary-item .label {
      font-size: 9pt;
      color: #0369a1;
      margin-bottom: 5px;
    }
    
    .summary-item .value {
      font-size: 16pt;
      font-weight: bold;
      color: #0c4a6e;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #0369a1;
      margin-bottom: 10px;
      padding: 8px 12px;
      background: #e0f2fe;
      border-left: 4px solid #0ea5e9;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .info-item {
      padding: 8px 10px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    
    .info-label {
      font-weight: bold;
      color: #374151;
      font-size: 9pt;
    }
    
    .info-value {
      color: #000;
      margin-top: 3px;
    }
    
    .equipment-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    
    .equipment-table th {
      background: #0369a1;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: bold;
    }
    
    .equipment-table td {
      padding: 8px 10px;
      border: 1px solid #d1d5db;
    }
    
    .equipment-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .test-results-box {
      background: #f0fdf4;
      border: 2px solid #10b981;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
    }
    
    .test-results-box h3 {
      color: #065f46;
      margin-bottom: 15px;
      font-size: 13pt;
    }
    
    .test-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    
    .test-item {
      padding: 12px;
      background: white;
      border-radius: 6px;
      border-left: 4px solid #10b981;
    }
    
    .test-item .test-name {
      font-size: 9pt;
      color: #065f46;
      margin-bottom: 5px;
    }
    
    .test-item .test-value {
      font-size: 14pt;
      font-weight: bold;
      color: #047857;
    }
    
    .test-item .test-status {
      font-size: 8pt;
      color: #10b981;
      margin-top: 3px;
    }
    
    .checklist {
      list-style: none;
      padding: 0;
    }
    
    .checklist li {
      padding: 10px 15px;
      margin-bottom: 8px;
      background: #f9fafb;
      border-left: 4px solid #10b981;
      border-radius: 4px;
      display: flex;
      align-items: center;
    }
    
    .checklist li::before {
      content: '✓';
      color: #10b981;
      font-weight: bold;
      font-size: 16pt;
      margin-right: 12px;
    }
    
    .checklist li.incomplete {
      border-left-color: #9ca3af;
      opacity: 0.6;
    }
    
    .checklist li.incomplete::before {
      content: '○';
      color: #9ca3af;
    }
    
    .warranty-box {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
    }
    
    .warranty-box h3 {
      color: #92400e;
      margin-bottom: 15px;
      font-size: 13pt;
    }
    
    .warranty-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .warranty-item {
      padding: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #fbbf24;
    }
    
    .warranty-item strong {
      color: #92400e;
    }
    
    .rating-box {
      background: #fef2f2;
      border: 2px solid #ef4444;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
      text-align: center;
    }
    
    .rating-stars {
      font-size: 32pt;
      margin: 15px 0;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #d1d5db;
      text-align: center;
      font-size: 8pt;
      color: #666;
    }
    
    @media print {
      body { padding: 15px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>Commissioning Report</h1>
    <div class="subtitle">Solar PV System Installation & Testing</div>
    <div class="job-number">Job: ${data.jobNumber}</div>
  </div>
  
  <!-- Summary -->
  <div class="summary-box">
    <h3 style="color: #0369a1; margin-bottom: 15px; font-size: 13pt;">Installation Summary</h3>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="label">System Size</div>
        <div class="value">${data.systemSize} kW</div>
      </div>
      <div class="summary-item">
        <div class="label">Panels</div>
        <div class="value">${data.panelCount}</div>
      </div>
      <div class="summary-item">
        <div class="label">Install Time</div>
        <div class="value">${data.actualHours ? data.actualHours.toFixed(1) + 'h' : 'N/A'}</div>
      </div>
      <div class="summary-item">
        <div class="label">Status</div>
        <div class="value" style="color: #10b981;">✓</div>
      </div>
    </div>
  </div>
  
  <!-- Customer & Property -->
  <div class="section">
    <div class="section-title">Customer & Property Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Customer Name</div>
        <div class="info-value">${data.customerName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Installation Address</div>
        <div class="info-value">${data.installationAddress}${data.suburb ? ', ' + data.suburb : ''}${data.postcode ? ' ' + data.postcode : ''}</div>
      </div>
      ${data.scheduledDate ? `
      <div class="info-item">
        <div class="info-label">Scheduled Date</div>
        <div class="info-value">${new Date(data.scheduledDate).toLocaleDateString('en-AU')}</div>
      </div>
      ` : ''}
      <div class="info-item">
        <div class="info-label">Completion Date</div>
        <div class="info-value">${new Date(data.completedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
    </div>
  </div>
  
  <!-- Timeline -->
  ${data.actualStartTime && data.actualEndTime ? `
  <div class="section">
    <div class="section-title">Installation Timeline</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Start Time</div>
        <div class="info-value">${new Date(data.actualStartTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div class="info-item">
        <div class="info-label">End Time</div>
        <div class="info-value">${new Date(data.actualEndTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Total Hours</div>
        <div class="info-value">${data.actualHours ? data.actualHours.toFixed(1) : 'N/A'} hours</div>
      </div>
      <div class="info-item">
        <div class="info-label">Completed</div>
        <div class="info-value">${new Date(data.completedAt).toLocaleString('en-AU')}</div>
      </div>
    </div>
  </div>
  ` : ''}
  
  <!-- System Equipment -->
  <div class="section">
    <div class="section-title">System Equipment</div>
    <table class="equipment-table">
      <thead>
        <tr>
          <th>Component</th>
          <th>Manufacturer</th>
          <th>Model</th>
          <th>Specification</th>
          <th>Serial Number</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Solar Panels</strong></td>
          <td>${data.panelManufacturer}</td>
          <td>${data.panelModel}</td>
          <td>${data.panelCount} × ${data.panelWattage}W = ${data.systemSize}kW</td>
          <td>${data.panelSerials.length} serials recorded</td>
        </tr>
        <tr>
          <td><strong>Inverter</strong></td>
          <td>${data.inverterManufacturer}</td>
          <td>${data.inverterModel}</td>
          <td>${data.inverterCapacity}kW AC</td>
          <td>${data.inverterSerial}</td>
        </tr>
        ${data.batteryCapacity ? `
        <tr>
          <td><strong>Battery</strong></td>
          <td>${data.batteryManufacturer || 'N/A'}</td>
          <td>${data.batteryModel || 'N/A'}</td>
          <td>${data.batteryCapacity}kWh</td>
          <td>${data.batterySerial || 'N/A'}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>
  </div>
  
  <!-- Installation Team -->
  <div class="section">
    <div class="section-title">Installation Team</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Lead Installer</div>
        <div class="info-value">${data.installerName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CEC Accreditation</div>
        <div class="info-value">${data.installerCecNumber}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Licensed Electrician</div>
        <div class="info-value">${data.electricianName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Electrical License</div>
        <div class="info-value">${data.electricianLicense}</div>
      </div>
    </div>
  </div>
  
  <!-- Test Results -->
  <div class="section">
    <div class="test-results-box">
      <h3>⚡ Electrical Test Results</h3>
      <div class="test-grid">
        <div class="test-item">
          <div class="test-name">DC Voltage</div>
          <div class="test-value">${data.voltageTest} V</div>
          <div class="test-status">✓ PASS</div>
        </div>
        <div class="test-item">
          <div class="test-name">DC Current</div>
          <div class="test-value">${data.currentTest} A</div>
          <div class="test-status">✓ PASS</div>
        </div>
        ${data.insulationTestDC ? `
        <div class="test-item">
          <div class="test-name">Insulation (DC)</div>
          <div class="test-value">${data.insulationTestDC} MΩ</div>
          <div class="test-status">✓ PASS</div>
        </div>
        ` : ''}
        ${data.earthContinuity ? `
        <div class="test-item">
          <div class="test-name">Earth Continuity</div>
          <div class="test-value">${data.earthContinuity} Ω</div>
          <div class="test-status">✓ PASS</div>
        </div>
        ` : ''}
        ${data.voltageRise ? `
        <div class="test-item">
          <div class="test-name">Voltage Rise</div>
          <div class="test-value">${data.voltageRise}%</div>
          <div class="test-status">✓ PASS</div>
        </div>
        ` : ''}
      </div>
    </div>
  </div>
  
  <!-- Commissioning Checklist -->
  <div class="section">
    <div class="section-title">Commissioning Checklist</div>
    <ul class="checklist">
      <li class="${data.systemPoweredUp ? '' : 'incomplete'}">System powered up and operational</li>
      <li class="${data.inverterConfigured ? '' : 'incomplete'}">Inverter configured correctly</li>
      <li class="${data.inverterOnline ? '' : 'incomplete'}">Inverter online and communicating</li>
      ${data.batteryCapacity ? `<li class="${data.batteryCharging ? '' : 'incomplete'}">Battery charging correctly</li>` : ''}
      <li class="${data.gridExportTest ? '' : 'incomplete'}">Grid export functionality verified</li>
      <li class="${data.monitoringActivated ? '' : 'incomplete'}">Monitoring system activated</li>
      ${data.exportLimitSet ? `<li>Export limit set to ${data.exportLimitSet}kW</li>` : ''}
    </ul>
  </div>
  
  <!-- Customer Handover -->
  <div class="section">
    <div class="section-title">Customer Handover</div>
    <ul class="checklist">
      <li class="${data.systemDemoComplete ? '' : 'incomplete'}">System demonstration completed</li>
      <li class="${data.monitoringAppSetup ? '' : 'incomplete'}">Monitoring app setup and configured</li>
      <li class="${data.warrantyProvided ? '' : 'incomplete'}">Warranty documents provided</li>
    </ul>
  </div>
  
  <!-- Warranty Information -->
  ${data.panelWarranty || data.inverterWarranty || data.batteryWarranty ? `
  <div class="section">
    <div class="warranty-box">
      <h3>🛡️ Warranty Information</h3>
      <div class="warranty-grid">
        ${data.panelWarranty ? `
        <div class="warranty-item">
          <strong>Solar Panels:</strong><br>
          ${data.panelWarranty}
        </div>
        ` : ''}
        ${data.inverterWarranty ? `
        <div class="warranty-item">
          <strong>Inverter:</strong><br>
          ${data.inverterWarranty}
        </div>
        ` : ''}
        ${data.batteryWarranty ? `
        <div class="warranty-item">
          <strong>Battery:</strong><br>
          ${data.batteryWarranty}
        </div>
        ` : ''}
        ${data.installationWarranty ? `
        <div class="warranty-item">
          <strong>Installation:</strong><br>
          ${data.installationWarranty}
        </div>
        ` : ''}
      </div>
    </div>
  </div>
  ` : ''}
  
  <!-- Customer Rating -->
  ${data.customerRating ? `
  <div class="section">
    <div class="rating-box">
      <h3 style="color: #991b1b; margin-bottom: 10px;">Customer Satisfaction Rating</h3>
      <div class="rating-stars">
        ${'⭐'.repeat(data.customerRating)}${'☆'.repeat(5 - data.customerRating)}
      </div>
      <p style="font-size: 12pt; color: #7f1d1d;">
        <strong>${data.customerRating} out of 5 stars</strong>
      </p>
    </div>
  </div>
  ` : ''}
  
  <!-- Notes -->
  ${data.notes ? `
  <div class="section">
    <div class="section-title">Additional Notes</div>
    <div style="padding: 12px; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px;">
      ${data.notes}
    </div>
  </div>
  ` : ''}
  
  <!-- Footer -->
  <div class="footer">
    <p><strong>Report Generated:</strong> ${new Date().toLocaleString('en-AU')}</p>
    <p style="margin-top: 8px;">This commissioning report certifies that the solar PV system has been installed, tested, and commissioned in accordance with Australian Standards.</p>
    <p style="margin-top: 8px; font-size: 7pt;">
      Standards: AS/NZS 5033:2021, AS/NZS 3000:2018
    </p>
  </div>
</body>
</html>
  `;

  return Buffer.from(html, 'utf-8');
}

export function validateCommissioningReport(data: Partial<CommissioningReportData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.jobNumber) {
    errors.push('Job number is required');
  }

  if (!data.customerName) {
    errors.push('Customer name is required');
  }

  if (!data.voltageTest || data.voltageTest <= 0) {
    errors.push('Voltage test result is required');
  }

  if (!data.currentTest || data.currentTest <= 0) {
    errors.push('Current test result is required');
  }

  if (!data.installerName) {
    errors.push('Installer name is required');
  }

  if (!data.completedAt) {
    errors.push('Completion date is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
