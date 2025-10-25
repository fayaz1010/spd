/**
 * Customer Declaration Generator
 * STC (Small-scale Technology Certificate) Assignment Declaration
 */

interface CustomerDeclarationData {
  // Job details
  jobNumber: string;
  installationDate: Date;
  
  // Customer details
  customerName: string;
  customerAddress: string;
  suburb?: string;
  postcode?: string;
  customerEmail: string;
  customerPhone: string;
  
  // Property details
  propertyOwner: boolean;
  ownerName?: string; // If different from customer
  
  // System details
  systemSize: number;
  panelCount: number;
  panelWattage: number;
  inverterModel: string;
  batteryCapacity?: number;
  
  // STC details
  stcCount: number;
  stcValue: number;
  stcAssignedTo: string; // Company name
  stcAssignedToABN: string;
  
  // Declarations
  declarations: {
    systemOwnership: boolean;
    newInstallation: boolean;
    notPreviouslyClaimed: boolean;
    accurateInformation: boolean;
    authorizeAssignment: boolean;
  };
  
  // Signature
  customerSignature?: string; // Base64 or "Signed electronically"
  signedAt?: Date;
  
  // Installer details
  installerName: string;
  installerCompany: string;
  installerCecNumber: string;
}

export async function generateCustomerDeclarationPDF(data: CustomerDeclarationData): Promise<Buffer> {
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
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
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
    
    .important-notice {
      background: #fef2f2;
      border: 3px solid #dc2626;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .important-notice h2 {
      color: #991b1b;
      margin-bottom: 12px;
      font-size: 13pt;
    }
    
    .important-notice p {
      color: #7f1d1d;
      line-height: 1.6;
      margin-bottom: 8px;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #dc2626;
      margin-bottom: 10px;
      padding: 8px 12px;
      background: #fee2e2;
      border-left: 4px solid #dc2626;
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
    
    .stc-box {
      background: #fef3c7;
      border: 3px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .stc-box h3 {
      color: #92400e;
      margin-bottom: 15px;
      font-size: 13pt;
    }
    
    .stc-details {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    
    .stc-item {
      text-align: center;
      padding: 15px;
      background: white;
      border: 2px solid #fbbf24;
      border-radius: 6px;
    }
    
    .stc-item .label {
      font-size: 9pt;
      color: #92400e;
      margin-bottom: 5px;
    }
    
    .stc-item .value {
      font-size: 18pt;
      font-weight: bold;
      color: #78350f;
    }
    
    .declarations-box {
      background: #f0fdf4;
      border: 2px solid #10b981;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .declarations-box h3 {
      color: #065f46;
      margin-bottom: 15px;
      font-size: 13pt;
    }
    
    .declaration-item {
      padding: 12px 15px;
      margin-bottom: 10px;
      background: white;
      border-left: 4px solid #10b981;
      border-radius: 4px;
      display: flex;
      align-items: flex-start;
    }
    
    .declaration-item::before {
      content: '☑';
      color: #10b981;
      font-size: 18pt;
      font-weight: bold;
      margin-right: 12px;
      line-height: 1;
    }
    
    .declaration-item p {
      flex: 1;
      line-height: 1.5;
    }
    
    .signature-section {
      margin-top: 40px;
      padding: 25px;
      background: #f9fafb;
      border: 2px solid #d1d5db;
      border-radius: 8px;
    }
    
    .signature-section h3 {
      color: #1f2937;
      margin-bottom: 20px;
      font-size: 13pt;
    }
    
    .signature-box {
      border-top: 2px solid #000;
      padding-top: 8px;
      margin-top: 50px;
      min-width: 300px;
    }
    
    .signature-details {
      margin-top: 15px;
      line-height: 1.8;
    }
    
    .warning-box {
      background: #fffbeb;
      border: 2px solid #f59e0b;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }
    
    .warning-box strong {
      color: #92400e;
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
    <h1>Customer Declaration</h1>
    <div class="subtitle">Small-scale Technology Certificate (STC) Assignment</div>
  </div>
  
  <!-- Important Notice -->
  <div class="important-notice">
    <h2>⚠️ IMPORTANT LEGAL DOCUMENT</h2>
    <p>This declaration assigns your right to create Small-scale Technology Certificates (STCs) to the installer. By signing this document, you authorize the installer to claim the STC rebate on your behalf.</p>
    <p><strong>Please read carefully before signing.</strong></p>
  </div>
  
  <!-- Customer Details -->
  <div class="section">
    <div class="section-title">Customer Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Full Name</div>
        <div class="info-value">${data.customerName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${data.customerEmail}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Phone</div>
        <div class="info-value">${data.customerPhone}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Installation Address</div>
        <div class="info-value">${data.customerAddress}${data.suburb ? ', ' + data.suburb : ''}${data.postcode ? ' ' + data.postcode : ''}</div>
      </div>
      ${!data.propertyOwner && data.ownerName ? `
      <div class="info-item" style="grid-column: 1 / -1;">
        <div class="info-label">Property Owner</div>
        <div class="info-value">${data.ownerName}</div>
      </div>
      ` : ''}
    </div>
  </div>
  
  <!-- System Details -->
  <div class="section">
    <div class="section-title">Solar PV System Details</div>
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
        <div class="info-label">System Size</div>
        <div class="info-value">${data.systemSize} kW</div>
      </div>
      <div class="info-item">
        <div class="info-label">Number of Panels</div>
        <div class="info-value">${data.panelCount} × ${data.panelWattage}W</div>
      </div>
      <div class="info-item">
        <div class="info-label">Inverter Model</div>
        <div class="info-value">${data.inverterModel}</div>
      </div>
      ${data.batteryCapacity ? `
      <div class="info-item">
        <div class="info-label">Battery Storage</div>
        <div class="info-value">${data.batteryCapacity} kWh</div>
      </div>
      ` : ''}
    </div>
  </div>
  
  <!-- STC Information -->
  <div class="section">
    <div class="stc-box">
      <h3>💰 Small-scale Technology Certificate (STC) Information</h3>
      <p style="margin-bottom: 15px; color: #78350f;">
        STCs are a form of renewable energy rebate. Your system is eligible for ${data.stcCount} certificates, which have been assigned to the installer as part of your purchase agreement.
      </p>
      
      <div class="stc-details">
        <div class="stc-item">
          <div class="label">Number of STCs</div>
          <div class="value">${data.stcCount}</div>
        </div>
        <div class="stc-item">
          <div class="label">Estimated Value</div>
          <div class="value">$${data.stcValue.toLocaleString()}</div>
        </div>
        <div class="stc-item">
          <div class="label">Discount Applied</div>
          <div class="value">$${data.stcValue.toLocaleString()}</div>
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 4px;">
        <strong style="color: #92400e;">STCs Assigned To:</strong><br>
        <div style="margin-top: 8px; font-size: 11pt;">
          <strong>${data.stcAssignedTo}</strong><br>
          ABN: ${data.stcAssignedToABN}
        </div>
      </div>
    </div>
  </div>
  
  <!-- Declarations -->
  <div class="section">
    <div class="declarations-box">
      <h3>✓ Customer Declarations</h3>
      <p style="margin-bottom: 15px; color: #065f46;">
        I, <strong>${data.customerName}</strong>, declare that:
      </p>
      
      <div class="declaration-item">
        <p>I am the owner of the property where the solar PV system has been installed, or I have the authority to make this declaration on behalf of the property owner.</p>
      </div>
      
      <div class="declaration-item">
        <p>This is a new solar PV system installation and has not been previously installed or commissioned at any other location.</p>
      </div>
      
      <div class="declaration-item">
        <p>STCs have not been previously created or claimed for this solar PV system.</p>
      </div>
      
      <div class="declaration-item">
        <p>All information provided in this declaration is true, accurate, and complete to the best of my knowledge.</p>
      </div>
      
      <div class="declaration-item">
        <p>I authorize <strong>${data.stcAssignedTo}</strong> (ABN: ${data.stcAssignedToABN}) to create and claim the STCs on my behalf, and I assign all rights to these certificates to them.</p>
      </div>
      
      <div class="declaration-item">
        <p>I understand that the STC rebate value has been deducted from my system purchase price as per the sales agreement.</p>
      </div>
    </div>
  </div>
  
  <!-- Warning -->
  <div class="warning-box">
    <p><strong>⚠️ WARNING:</strong> Providing false or misleading information in this declaration is a serious offence under the Renewable Energy (Electricity) Act 2000 and may result in penalties.</p>
  </div>
  
  <!-- Installer Information -->
  <div class="section">
    <div class="section-title">Installer Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Installer Name</div>
        <div class="info-value">${data.installerName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Company</div>
        <div class="info-value">${data.installerCompany}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CEC Accreditation</div>
        <div class="info-value">${data.installerCecNumber}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Installation Date</div>
        <div class="info-value">${new Date(data.installationDate).toLocaleDateString('en-AU')}</div>
      </div>
    </div>
  </div>
  
  <!-- Signature Section -->
  <div class="signature-section">
    <h3>Customer Signature</h3>
    <p style="margin-bottom: 20px; color: #4b5563;">
      By signing below, I confirm that I have read, understood, and agree to all declarations stated in this document.
    </p>
    
    <div class="signature-box">
      ${data.customerSignature ? `
        <div style="font-style: italic; color: #6b7280;">Signed electronically</div>
      ` : ''}
    </div>
    
    <div class="signature-details">
      <strong>Customer Name:</strong> ${data.customerName}<br>
      <strong>Date:</strong> ${data.signedAt ? new Date(data.signedAt).toLocaleDateString('en-AU') : '___________________'}<br>
      <strong>Signature:</strong> ${data.customerSignature ? 'Signed electronically' : '___________________'}
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <p><strong>Document Generated:</strong> ${new Date().toLocaleString('en-AU')}</p>
    <p style="margin-top: 8px;">This declaration is required for STC creation under the Renewable Energy (Electricity) Act 2000.</p>
    <p style="margin-top: 8px; font-size: 7pt;">
      For more information about STCs, visit the Clean Energy Regulator website: www.cleanenergyregulator.gov.au
    </p>
  </div>
</body>
</html>
  `;

  return Buffer.from(html, 'utf-8');
}

export function validateCustomerDeclaration(data: Partial<CustomerDeclarationData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.customerName) {
    errors.push('Customer name is required');
  }

  if (!data.customerEmail) {
    errors.push('Customer email is required');
  }

  if (!data.customerPhone) {
    errors.push('Customer phone is required');
  }

  if (!data.stcCount || data.stcCount <= 0) {
    errors.push('STC count must be greater than 0');
  }

  if (!data.stcValue || data.stcValue <= 0) {
    errors.push('STC value must be greater than 0');
  }

  if (!data.stcAssignedTo) {
    errors.push('STC assigned company name is required');
  }

  if (!data.stcAssignedToABN) {
    errors.push('Company ABN is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function calculateSTCs(systemSize: number, zone: string = 'Zone 3'): { count: number; estimatedValue: number } {
  // Simplified STC calculation (actual calculation is more complex)
  // Zone 3 (Perth) has a deeming period and multiplier
  const deemingPeriod = 12; // years remaining
  const zoneRating = 1.382; // Zone 3 rating
  
  const stcCount = Math.floor(systemSize * zoneRating * deemingPeriod);
  const stcPrice = 38; // Approximate market price per STC
  const estimatedValue = stcCount * stcPrice;
  
  return {
    count: stcCount,
    estimatedValue: Math.round(estimatedValue),
  };
}
