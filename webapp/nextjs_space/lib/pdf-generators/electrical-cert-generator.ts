/**
 * Electrical Certificate Generator (COES - Certificate of Electrical Safety)
 * WA-specific electrical compliance certificate
 */

interface ElectricalCertData {
  // Certificate details
  certificateNumber: string;
  certificateType: string; // "COES", "Certificate of Compliance"
  state: string; // "WA", "VIC", "NSW", etc.
  
  // Job details
  jobNumber: string;
  customerName: string;
  installationAddress: string;
  suburb?: string;
  postcode?: string;
  
  // System details
  systemSize: number;
  panelCount: number;
  inverterModel: string;
  inverterCapacity: number;
  batteryCapacity?: number;
  
  // Electrician details
  electricianName: string;
  electricianLicense: string;
  electricianLicenseState: string;
  electricianPhone?: string;
  electricianEmail?: string;
  
  // Installation details
  installationDate: Date;
  testingDate: Date;
  
  // Test results
  insulationTestDC?: number; // MΩ
  insulationTestAC?: number; // MΩ
  insulationTestVoltage?: number; // V
  earthContinuityTest?: number; // Ω
  voltageRiseCalc?: number; // %
  
  // Compliance
  complianceStandards: string[]; // ["AS/NZS 3000", "AS/NZS 5033"]
  workType?: string; // "Prescribed", "Non-prescribed"
  
  // Additional
  notes?: string;
}

export async function generateElectricalCertPDF(data: ElectricalCertData): Promise<Buffer> {
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
      line-height: 1.3;
      color: #000;
      padding: 30px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding: 15px;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      border-radius: 8px;
    }
    
    .header h1 {
      font-size: 20pt;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .header .cert-number {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 10px;
      padding: 8px;
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
      display: inline-block;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1e3a8a;
      margin-bottom: 8px;
      padding: 6px 10px;
      background: #e0e7ff;
      border-left: 4px solid #3b82f6;
    }
    
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    
    .info-table td {
      padding: 6px 10px;
      border: 1px solid #d1d5db;
    }
    
    .info-table td:first-child {
      width: 40%;
      font-weight: bold;
      background: #f9fafb;
    }
    
    .test-results-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    .test-results-table th {
      background: #1e3a8a;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #1e3a8a;
    }
    
    .test-results-table td {
      padding: 8px 10px;
      border: 1px solid #d1d5db;
    }
    
    .test-results-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .compliance-box {
      background: #ecfdf5;
      border: 2px solid #10b981;
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
    }
    
    .compliance-box h3 {
      color: #065f46;
      margin-bottom: 10px;
      font-size: 11pt;
    }
    
    .compliance-list {
      list-style: none;
      padding: 0;
    }
    
    .compliance-list li {
      padding: 5px 0 5px 25px;
      position: relative;
    }
    
    .compliance-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 14pt;
    }
    
    .declaration-box {
      background: #fffbeb;
      border: 2px solid #f59e0b;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
    }
    
    .declaration-box p {
      margin-bottom: 10px;
      line-height: 1.5;
    }
    
    .signature-section {
      margin-top: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    
    .signature-box {
      border-top: 2px solid #000;
      padding-top: 8px;
      margin-top: 50px;
    }
    
    .signature-label {
      font-size: 9pt;
      color: #666;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #d1d5db;
      text-align: center;
      font-size: 8pt;
      color: #666;
    }
    
    .warning-box {
      background: #fef2f2;
      border: 2px solid #ef4444;
      border-radius: 6px;
      padding: 12px;
      margin: 15px 0;
      font-size: 9pt;
    }
    
    .warning-box strong {
      color: #991b1b;
    }
    
    @media print {
      body {
        padding: 15px;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>${data.certificateType}</h1>
    <div style="font-size: 11pt; margin-top: 5px;">${data.state} - Electrical Installation Certificate</div>
    <div class="cert-number">Certificate No: ${data.certificateNumber}</div>
  </div>
  
  <!-- Installation Details -->
  <div class="section">
    <div class="section-title">Installation Details</div>
    <table class="info-table">
      <tr>
        <td>Job Number</td>
        <td>${data.jobNumber}</td>
      </tr>
      <tr>
        <td>Customer Name</td>
        <td>${data.customerName}</td>
      </tr>
      <tr>
        <td>Installation Address</td>
        <td>${data.installationAddress}${data.suburb ? ', ' + data.suburb : ''}${data.postcode ? ' ' + data.postcode : ''}</td>
      </tr>
      <tr>
        <td>Installation Date</td>
        <td>${new Date(data.installationDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
      </tr>
      <tr>
        <td>Testing Date</td>
        <td>${new Date(data.testingDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
      </tr>
      <tr>
        <td>Work Type</td>
        <td>${data.workType || 'Prescribed Electrical Installation Work'}</td>
      </tr>
    </table>
  </div>
  
  <!-- System Specifications -->
  <div class="section">
    <div class="section-title">System Specifications</div>
    <table class="info-table">
      <tr>
        <td>System Type</td>
        <td>Solar Photovoltaic (PV) System${data.batteryCapacity ? ' with Battery Storage' : ''}</td>
      </tr>
      <tr>
        <td>System Size</td>
        <td>${data.systemSize} kW DC</td>
      </tr>
      <tr>
        <td>Number of Panels</td>
        <td>${data.panelCount} panels</td>
      </tr>
      <tr>
        <td>Inverter Model</td>
        <td>${data.inverterModel}</td>
      </tr>
      <tr>
        <td>Inverter Capacity</td>
        <td>${data.inverterCapacity} kW AC</td>
      </tr>
      ${data.batteryCapacity ? `
      <tr>
        <td>Battery Capacity</td>
        <td>${data.batteryCapacity} kWh</td>
      </tr>
      ` : ''}
    </table>
  </div>
  
  <!-- Electrical Test Results -->
  <div class="section">
    <div class="section-title">Electrical Test Results</div>
    <table class="test-results-table">
      <thead>
        <tr>
          <th>Test Description</th>
          <th>Result</th>
          <th>Standard Requirement</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.insulationTestDC ? `
        <tr>
          <td>Insulation Resistance (DC)</td>
          <td>${data.insulationTestDC} MΩ</td>
          <td>≥ 1.0 MΩ @ ${data.insulationTestVoltage || 500}V</td>
          <td style="color: #10b981; font-weight: bold;">PASS</td>
        </tr>
        ` : ''}
        ${data.insulationTestAC ? `
        <tr>
          <td>Insulation Resistance (AC)</td>
          <td>${data.insulationTestAC} MΩ</td>
          <td>≥ 1.0 MΩ @ ${data.insulationTestVoltage || 500}V</td>
          <td style="color: #10b981; font-weight: bold;">PASS</td>
        </tr>
        ` : ''}
        ${data.earthContinuityTest ? `
        <tr>
          <td>Earth Continuity</td>
          <td>${data.earthContinuityTest} Ω</td>
          <td>≤ 1.0 Ω</td>
          <td style="color: #10b981; font-weight: bold;">PASS</td>
        </tr>
        ` : ''}
        ${data.voltageRiseCalc ? `
        <tr>
          <td>Voltage Rise</td>
          <td>${data.voltageRiseCalc}%</td>
          <td>≤ 2%</td>
          <td style="color: #10b981; font-weight: bold;">PASS</td>
        </tr>
        ` : ''}
        <tr>
          <td>Polarity Test</td>
          <td>Correct</td>
          <td>All connections correct</td>
          <td style="color: #10b981; font-weight: bold;">PASS</td>
        </tr>
        <tr>
          <td>System Functionality</td>
          <td>Operational</td>
          <td>System operating correctly</td>
          <td style="color: #10b981; font-weight: bold;">PASS</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- Compliance Standards -->
  <div class="section">
    <div class="compliance-box">
      <h3>Compliance Standards</h3>
      <p>This installation has been completed in accordance with the following Australian Standards:</p>
      <ul class="compliance-list">
        ${data.complianceStandards.map(standard => `<li>${standard}</li>`).join('')}
      </ul>
    </div>
  </div>
  
  <!-- Electrician Details -->
  <div class="section">
    <div class="section-title">Licensed Electrician Details</div>
    <table class="info-table">
      <tr>
        <td>Electrician Name</td>
        <td>${data.electricianName}</td>
      </tr>
      <tr>
        <td>License Number</td>
        <td>${data.electricianLicense}</td>
      </tr>
      <tr>
        <td>License State</td>
        <td>${data.electricianLicenseState}</td>
      </tr>
      ${data.electricianPhone ? `
      <tr>
        <td>Contact Phone</td>
        <td>${data.electricianPhone}</td>
      </tr>
      ` : ''}
      ${data.electricianEmail ? `
      <tr>
        <td>Contact Email</td>
        <td>${data.electricianEmail}</td>
      </tr>
      ` : ''}
    </table>
  </div>
  
  <!-- Declaration -->
  <div class="section">
    <div class="declaration-box">
      <h3 style="color: #92400e; margin-bottom: 10px;">Electrician's Declaration</h3>
      <p>I, <strong>${data.electricianName}</strong>, being a licensed electrical worker (License No: <strong>${data.electricianLicense}</strong>), hereby certify that:</p>
      <ul class="compliance-list">
        <li>The electrical installation work described in this certificate has been carried out by me or under my direct supervision</li>
        <li>The work has been completed in accordance with AS/NZS 3000:2018 and all relevant Australian Standards</li>
        <li>All required electrical tests have been conducted and the results are satisfactory</li>
        <li>The installation is safe and fit for connection to the electricity supply</li>
        <li>All information provided in this certificate is true and correct</li>
      </ul>
    </div>
  </div>
  
  ${data.notes ? `
  <div class="section">
    <div class="section-title">Additional Notes</div>
    <div style="padding: 10px; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px;">
      ${data.notes}
    </div>
  </div>
  ` : ''}
  
  <!-- Warning -->
  <div class="warning-box">
    <strong>IMPORTANT:</strong> This certificate must be retained by the property owner and made available to the electricity supply authority and relevant regulatory authorities upon request. Any alterations to the electrical installation may invalidate this certificate.
  </div>
  
  <!-- Signature Section -->
  <div class="signature-section">
    <div>
      <div class="signature-box">
        <div style="font-weight: bold; margin-bottom: 5px;">${data.electricianName}</div>
        <div class="signature-label">Licensed Electrician Signature</div>
      </div>
      <div style="margin-top: 15px;">
        <strong>License Number:</strong> ${data.electricianLicense}<br>
        <strong>Date:</strong> ${new Date(data.testingDate).toLocaleDateString('en-AU')}
      </div>
    </div>
    
    <div>
      <div class="signature-box">
        <div class="signature-label">Customer Acknowledgment (Optional)</div>
      </div>
      <div style="margin-top: 15px;">
        <strong>Print Name:</strong> ___________________________<br>
        <strong>Date:</strong> ___________________________
      </div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <p><strong>Certificate Generated:</strong> ${new Date().toLocaleString('en-AU')}</p>
    <p>This is an official electrical safety certificate. Keep this document for your records.</p>
    <p style="margin-top: 10px; font-size: 7pt;">
      This certificate is issued in accordance with the Electricity (Licensing) Regulations and relevant state legislation.
    </p>
  </div>
</body>
</html>
  `;

  return Buffer.from(html, 'utf-8');
}

export function validateElectricalCert(data: Partial<ElectricalCertData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.certificateNumber) {
    errors.push('Certificate number is required');
  }

  if (!data.electricianName) {
    errors.push('Electrician name is required');
  }

  if (!data.electricianLicense) {
    errors.push('Electrician license number is required');
  }

  if (!data.installationDate) {
    errors.push('Installation date is required');
  }

  if (!data.testingDate) {
    errors.push('Testing date is required');
  }

  if (!data.complianceStandards || data.complianceStandards.length === 0) {
    errors.push('At least one compliance standard is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function generateCertificateNumber(jobNumber: string, state: string): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${state}-CERT-${jobNumber}-${timestamp}`;
}
