/**
 * CEC Compliance Statement Generator
 * Clean Energy Council compliance documentation
 */

interface ComplianceStatementData {
  // Job details
  jobNumber: string;
  customerName: string;
  installationAddress: string;
  suburb?: string;
  postcode?: string;
  
  // System details
  systemSize: number;
  panelCount: number;
  panelManufacturer: string;
  panelModel: string;
  inverterManufacturer: string;
  inverterModel: string;
  batteryManufacturer?: string;
  batteryModel?: string;
  batteryCapacity?: number;
  
  // Installer details
  installerName: string;
  installerCecNumber: string;
  installerCecExpiry: Date;
  installerCompany?: string;
  
  // Designer details (if different)
  designerName?: string;
  designerCecNumber?: string;
  designerCecExpiry?: Date;
  
  // Electrician details
  electricianName: string;
  electricianLicense: string;
  electricianLicenseState: string;
  
  // Equipment serials
  panelSerials: string[];
  inverterSerial: string;
  batterySerial?: string;
  
  // Installation date
  installationDate: Date;
  
  // Compliance confirmations
  confirmations: {
    cecApprovedEquipment: boolean;
    correctInstallation: boolean;
    safetyCompliance: boolean;
    gridCompliance: boolean;
    documentationComplete: boolean;
  };
  
  // Photos (URLs or base64)
  onSitePhotos?: string[];
  
  // Notes
  notes?: string;
}

export async function generateComplianceStatementPDF(data: ComplianceStatementData): Promise<Buffer> {
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
      padding: 20px;
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: white;
      border-radius: 8px;
    }
    
    .header h1 {
      font-size: 22pt;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    
    .header .subtitle {
      font-size: 12pt;
      opacity: 0.95;
    }
    
    .cec-logo {
      text-align: center;
      margin: 20px 0;
      padding: 15px;
      background: #f0fdf4;
      border: 2px solid #10b981;
      border-radius: 6px;
    }
    
    .cec-logo h2 {
      color: #059669;
      font-size: 14pt;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #059669;
      margin-bottom: 10px;
      padding: 8px 12px;
      background: #ecfdf5;
      border-left: 4px solid #10b981;
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
      background: #059669;
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
    
    .serials-box {
      background: #fffbeb;
      border: 2px solid #f59e0b;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    
    .serials-box h4 {
      color: #92400e;
      margin-bottom: 10px;
    }
    
    .serial-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 8px;
      margin-top: 10px;
    }
    
    .serial-item {
      background: white;
      padding: 6px 10px;
      border: 1px solid #fbbf24;
      border-radius: 4px;
      font-size: 9pt;
      font-family: monospace;
    }
    
    .compliance-checklist {
      background: #ecfdf5;
      border: 2px solid #10b981;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    
    .compliance-checklist h3 {
      color: #065f46;
      margin-bottom: 15px;
      font-size: 13pt;
    }
    
    .checklist {
      list-style: none;
      padding: 0;
    }
    
    .checklist li {
      padding: 10px 15px;
      margin-bottom: 8px;
      background: white;
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
    
    .declaration-box {
      background: #fef3c7;
      border: 3px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    
    .declaration-box h3 {
      color: #92400e;
      margin-bottom: 12px;
      font-size: 13pt;
    }
    
    .declaration-box p {
      margin-bottom: 10px;
      line-height: 1.6;
    }
    
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 30px;
    }
    
    .signature-box {
      border-top: 2px solid #000;
      padding-top: 8px;
      margin-top: 50px;
    }
    
    .signature-details {
      margin-top: 10px;
      font-size: 9pt;
      line-height: 1.6;
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
    <h1>CEC Compliance Statement</h1>
    <div class="subtitle">Clean Energy Council Installation Compliance</div>
  </div>
  
  <!-- CEC Logo/Badge -->
  <div class="cec-logo">
    <h2>✓ CEC Accredited Installation</h2>
    <p style="margin-top: 8px; font-size: 10pt;">This installation complies with Clean Energy Council guidelines</p>
  </div>
  
  <!-- Installation Details -->
  <div class="section">
    <div class="section-title">Installation Details</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Job Number</div>
        <div class="info-value">${data.jobNumber}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Installation Date</div>
        <div class="info-value">${new Date(data.installationDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Customer Name</div>
        <div class="info-value">${data.customerName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Installation Address</div>
        <div class="info-value">${data.installationAddress}${data.suburb ? ', ' + data.suburb : ''}${data.postcode ? ' ' + data.postcode : ''}</div>
      </div>
    </div>
  </div>
  
  <!-- System Specifications -->
  <div class="section">
    <div class="section-title">System Specifications</div>
    <table class="equipment-table">
      <thead>
        <tr>
          <th>Component</th>
          <th>Manufacturer</th>
          <th>Model</th>
          <th>Specification</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Solar Panels</strong></td>
          <td>${data.panelManufacturer}</td>
          <td>${data.panelModel}</td>
          <td>${data.panelCount} panels × ${(data.systemSize / data.panelCount * 1000).toFixed(0)}W = ${data.systemSize}kW</td>
        </tr>
        <tr>
          <td><strong>Inverter</strong></td>
          <td>${data.inverterManufacturer}</td>
          <td>${data.inverterModel}</td>
          <td>${(data.systemSize * 0.8).toFixed(1)}kW AC</td>
        </tr>
        ${data.batteryCapacity ? `
        <tr>
          <td><strong>Battery</strong></td>
          <td>${data.batteryManufacturer || 'N/A'}</td>
          <td>${data.batteryModel || 'N/A'}</td>
          <td>${data.batteryCapacity}kWh</td>
        </tr>
        ` : ''}
      </tbody>
    </table>
  </div>
  
  <!-- Equipment Serial Numbers -->
  <div class="section">
    <div class="serials-box">
      <h4>📋 Equipment Serial Numbers (CEC Verification)</h4>
      
      <div style="margin-top: 15px;">
        <strong style="color: #92400e;">Solar Panel Serials (${data.panelSerials.length} panels):</strong>
        <div class="serial-list">
          ${data.panelSerials.slice(0, 20).map(serial => `<div class="serial-item">${serial}</div>`).join('')}
          ${data.panelSerials.length > 20 ? `<div class="serial-item">...and ${data.panelSerials.length - 20} more</div>` : ''}
        </div>
      </div>
      
      <div style="margin-top: 15px;">
        <strong style="color: #92400e;">Inverter Serial:</strong>
        <div class="serial-item" style="display: inline-block; margin-left: 10px;">${data.inverterSerial}</div>
      </div>
      
      ${data.batterySerial ? `
      <div style="margin-top: 15px;">
        <strong style="color: #92400e;">Battery Serial:</strong>
        <div class="serial-item" style="display: inline-block; margin-left: 10px;">${data.batterySerial}</div>
      </div>
      ` : ''}
    </div>
  </div>
  
  <!-- Accredited Personnel -->
  <div class="section">
    <div class="section-title">CEC Accredited Personnel</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Installer Name</div>
        <div class="info-value">${data.installerName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CEC Accreditation Number</div>
        <div class="info-value">${data.installerCecNumber}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CEC Expiry Date</div>
        <div class="info-value">${new Date(data.installerCecExpiry).toLocaleDateString('en-AU')}</div>
      </div>
      ${data.installerCompany ? `
      <div class="info-item">
        <div class="info-label">Company</div>
        <div class="info-value">${data.installerCompany}</div>
      </div>
      ` : ''}
      ${data.designerName ? `
      <div class="info-item">
        <div class="info-label">Designer Name</div>
        <div class="info-value">${data.designerName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Designer CEC Number</div>
        <div class="info-value">${data.designerCecNumber || 'N/A'}</div>
      </div>
      ` : ''}
      <div class="info-item">
        <div class="info-label">Licensed Electrician</div>
        <div class="info-value">${data.electricianName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Electrical License</div>
        <div class="info-value">${data.electricianLicense} (${data.electricianLicenseState})</div>
      </div>
    </div>
  </div>
  
  <!-- Compliance Checklist -->
  <div class="section">
    <div class="compliance-checklist">
      <h3>✓ CEC Compliance Checklist</h3>
      <ul class="checklist">
        <li>All equipment is CEC approved and listed on the current CEC approved products list</li>
        <li>Installation has been completed in accordance with AS/NZS 5033:2021</li>
        <li>All safety requirements and regulations have been met</li>
        <li>System is compliant with grid connection requirements</li>
        <li>All required documentation and photos have been collected</li>
        <li>Equipment serial numbers have been verified and recorded</li>
        <li>System has been tested and is operating correctly</li>
        <li>Customer has been provided with all required information</li>
      </ul>
    </div>
  </div>
  
  <!-- Declaration -->
  <div class="section">
    <div class="declaration-box">
      <h3>Installer's Declaration</h3>
      <p>I, <strong>${data.installerName}</strong>, CEC Accreditation Number <strong>${data.installerCecNumber}</strong>, hereby declare that:</p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li style="margin-bottom: 8px;">This solar PV system installation has been completed by me or under my direct supervision</li>
        <li style="margin-bottom: 8px;">All equipment used is CEC approved and suitable for the application</li>
        <li style="margin-bottom: 8px;">The installation complies with all relevant Australian Standards and CEC guidelines</li>
        <li style="margin-bottom: 8px;">All information provided in this statement is true and correct</li>
        <li style="margin-bottom: 8px;">The system is safe and fit for operation</li>
      </ul>
    </div>
  </div>
  
  ${data.notes ? `
  <div class="section">
    <div class="section-title">Additional Notes</div>
    <div style="padding: 12px; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px;">
      ${data.notes}
    </div>
  </div>
  ` : ''}
  
  <!-- Signatures -->
  <div class="signature-grid">
    <div>
      <div class="signature-box">
        <strong>${data.installerName}</strong>
      </div>
      <div class="signature-details">
        <strong>CEC Accredited Installer</strong><br>
        CEC Number: ${data.installerCecNumber}<br>
        Date: ${new Date(data.installationDate).toLocaleDateString('en-AU')}
      </div>
    </div>
    
    <div>
      <div class="signature-box">
        <strong>${data.electricianName}</strong>
      </div>
      <div class="signature-details">
        <strong>Licensed Electrician</strong><br>
        License: ${data.electricianLicense}<br>
        Date: ${new Date(data.installationDate).toLocaleDateString('en-AU')}
      </div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <p><strong>Document Generated:</strong> ${new Date().toLocaleString('en-AU')}</p>
    <p style="margin-top: 8px;">This compliance statement is required for STC (Small-scale Technology Certificate) claims and regulatory submissions.</p>
    <p style="margin-top: 8px; font-size: 7pt;">
      Clean Energy Council (CEC) accreditation ensures installers meet national standards for solar PV installation.
    </p>
  </div>
</body>
</html>
  `;

  return Buffer.from(html, 'utf-8');
}

export function validateComplianceStatement(data: Partial<ComplianceStatementData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.installerName) {
    errors.push('Installer name is required');
  }

  if (!data.installerCecNumber) {
    errors.push('Installer CEC number is required');
  }

  if (!data.installerCecExpiry) {
    errors.push('Installer CEC expiry date is required');
  }

  if (!data.electricianName) {
    errors.push('Electrician name is required');
  }

  if (!data.electricianLicense) {
    errors.push('Electrician license is required');
  }

  if (!data.panelSerials || data.panelSerials.length === 0) {
    errors.push('At least one panel serial number is required');
  }

  if (!data.inverterSerial) {
    errors.push('Inverter serial number is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
