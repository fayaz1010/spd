/**
 * Handover Pack Generator
 * Master document combining all installation documentation
 */

interface HandoverPackData {
  // Job details
  jobNumber: string;
  customerName: string;
  installationAddress: string;
  suburb?: string;
  postcode?: string;
  completedAt: Date;
  
  // System details
  systemSize: number;
  panelCount: number;
  inverterModel: string;
  batteryCapacity?: number;
  
  // Installer details
  installerName: string;
  installerCompany: string;
  installerPhone?: string;
  installerEmail?: string;
  
  // Generated documents
  documents: {
    sld?: { generated: boolean; date?: Date };
    testResults?: { generated: boolean; date?: Date };
    electricalCert?: { generated: boolean; date?: Date; certNumber?: string };
    compliance?: { generated: boolean; date?: Date };
    customerDeclaration?: { generated: boolean; date?: Date; stcCount?: number };
    commissioningReport?: { generated: boolean; date?: Date };
  };
  
  // Warranty information
  warranties: {
    panels: string;
    inverter: string;
    battery?: string;
    installation: string;
  };
  
  // Contact information
  emergencyContact?: string;
  supportEmail?: string;
  supportPhone?: string;
  
  // Important information
  exportLimit?: number;
  monitoringUrl?: string;
  monitoringUsername?: string;
  
  // Next steps
  nextSteps?: string[];
}

export async function generateHandoverPackPDF(data: HandoverPackData): Promise<Buffer> {
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
      margin-bottom: 30px;
      padding: 30px;
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      color: white;
      border-radius: 8px;
    }
    
    .header h1 {
      font-size: 28pt;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .header .subtitle {
      font-size: 14pt;
      opacity: 0.95;
    }
    
    .welcome-box {
      background: #faf5ff;
      border: 3px solid #a855f7;
      padding: 25px;
      border-radius: 8px;
      margin: 25px 0;
      text-align: center;
    }
    
    .welcome-box h2 {
      color: #6b21a8;
      font-size: 18pt;
      margin-bottom: 15px;
    }
    
    .welcome-box p {
      color: #581c87;
      font-size: 11pt;
      line-height: 1.6;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 13pt;
      font-weight: bold;
      color: #6b21a8;
      margin-bottom: 12px;
      padding: 10px 15px;
      background: #f3e8ff;
      border-left: 4px solid #a855f7;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 15px;
    }
    
    .info-item {
      padding: 10px 12px;
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
    
    .documents-list {
      background: #ecfdf5;
      border: 2px solid #10b981;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .documents-list h3 {
      color: #065f46;
      margin-bottom: 15px;
      font-size: 13pt;
    }
    
    .document-item {
      padding: 12px 15px;
      margin-bottom: 10px;
      background: white;
      border-left: 4px solid #10b981;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .document-item .doc-name {
      font-weight: bold;
      color: #065f46;
    }
    
    .document-item .doc-status {
      color: #10b981;
      font-size: 9pt;
    }
    
    .warranty-box {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
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
      display: block;
      margin-bottom: 5px;
    }
    
    .contact-box {
      background: #dbeafe;
      border: 2px solid #3b82f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .contact-box h3 {
      color: #1e40af;
      margin-bottom: 15px;
      font-size: 13pt;
    }
    
    .contact-item {
      padding: 10px;
      margin-bottom: 8px;
      background: white;
      border-radius: 4px;
    }
    
    .contact-item strong {
      color: #1e40af;
    }
    
    .important-box {
      background: #fee2e2;
      border: 3px solid #ef4444;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .important-box h3 {
      color: #991b1b;
      margin-bottom: 15px;
      font-size: 13pt;
    }
    
    .important-item {
      padding: 10px 15px;
      margin-bottom: 8px;
      background: white;
      border-left: 4px solid #ef4444;
      border-radius: 4px;
    }
    
    .next-steps {
      background: #f0f9ff;
      border: 2px solid #0ea5e9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .next-steps h3 {
      color: #0c4a6e;
      margin-bottom: 15px;
      font-size: 13pt;
    }
    
    .next-steps ol {
      margin-left: 20px;
    }
    
    .next-steps li {
      padding: 8px 0;
      color: #0c4a6e;
      line-height: 1.6;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 3px solid #a855f7;
      text-align: center;
    }
    
    .footer .company-name {
      font-size: 16pt;
      font-weight: bold;
      color: #6b21a8;
      margin-bottom: 10px;
    }
    
    .footer p {
      font-size: 9pt;
      color: #666;
      margin: 5px 0;
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
    <h1>🏠 Handover Pack</h1>
    <div class="subtitle">Complete Solar Installation Documentation</div>
  </div>
  
  <!-- Welcome Message -->
  <div class="welcome-box">
    <h2>Congratulations on Your New Solar System!</h2>
    <p>
      Thank you for choosing ${data.installerCompany} for your solar installation. 
      This handover pack contains all the important documentation and information you need 
      to understand, maintain, and enjoy your new solar PV system.
    </p>
  </div>
  
  <!-- Installation Details -->
  <div class="section">
    <div class="section-title">📋 Installation Summary</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Job Number</div>
        <div class="info-value">${data.jobNumber}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Completion Date</div>
        <div class="info-value">${new Date(data.completedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Customer Name</div>
        <div class="info-value">${data.customerName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Installation Address</div>
        <div class="info-value">${data.installationAddress}${data.suburb ? ', ' + data.suburb : ''}${data.postcode ? ' ' + data.postcode : ''}</div>
      </div>
      <div class="info-item">
        <div class="info-label">System Size</div>
        <div class="info-value">${data.systemSize} kW</div>
      </div>
      <div class="info-item">
        <div class="info-label">Number of Panels</div>
        <div class="info-value">${data.panelCount} panels</div>
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
  
  <!-- Included Documents -->
  <div class="section">
    <div class="documents-list">
      <h3>📄 Included Documentation</h3>
      <p style="margin-bottom: 15px; color: #065f46;">
        The following compliance and technical documents have been generated for your installation:
      </p>
      
      ${data.documents.sld?.generated ? `
      <div class="document-item">
        <div>
          <div class="doc-name">Single Line Diagram (SLD)</div>
          <div class="doc-status">Generated ${data.documents.sld.date ? new Date(data.documents.sld.date).toLocaleDateString('en-AU') : ''}</div>
        </div>
        <div style="color: #10b981; font-size: 18pt;">✓</div>
      </div>
      ` : ''}
      
      ${data.documents.testResults?.generated ? `
      <div class="document-item">
        <div>
          <div class="doc-name">Test Results & Commissioning</div>
          <div class="doc-status">Generated ${data.documents.testResults.date ? new Date(data.documents.testResults.date).toLocaleDateString('en-AU') : ''}</div>
        </div>
        <div style="color: #10b981; font-size: 18pt;">✓</div>
      </div>
      ` : ''}
      
      ${data.documents.electricalCert?.generated ? `
      <div class="document-item">
        <div>
          <div class="doc-name">Electrical Certificate (COES)</div>
          <div class="doc-status">Cert #: ${data.documents.electricalCert.certNumber || 'Pending'} | Generated ${data.documents.electricalCert.date ? new Date(data.documents.electricalCert.date).toLocaleDateString('en-AU') : ''}</div>
        </div>
        <div style="color: #10b981; font-size: 18pt;">✓</div>
      </div>
      ` : ''}
      
      ${data.documents.compliance?.generated ? `
      <div class="document-item">
        <div>
          <div class="doc-name">CEC Compliance Statement</div>
          <div class="doc-status">Generated ${data.documents.compliance.date ? new Date(data.documents.compliance.date).toLocaleDateString('en-AU') : ''}</div>
        </div>
        <div style="color: #10b981; font-size: 18pt;">✓</div>
      </div>
      ` : ''}
      
      ${data.documents.customerDeclaration?.generated ? `
      <div class="document-item">
        <div>
          <div class="doc-name">Customer Declaration (STC Assignment)</div>
          <div class="doc-status">${data.documents.customerDeclaration.stcCount ? data.documents.customerDeclaration.stcCount + ' STCs | ' : ''}Generated ${data.documents.customerDeclaration.date ? new Date(data.documents.customerDeclaration.date).toLocaleDateString('en-AU') : ''}</div>
        </div>
        <div style="color: #10b981; font-size: 18pt;">✓</div>
      </div>
      ` : ''}
      
      ${data.documents.commissioningReport?.generated ? `
      <div class="document-item">
        <div>
          <div class="doc-name">Commissioning Report</div>
          <div class="doc-status">Generated ${data.documents.commissioningReport.date ? new Date(data.documents.commissioningReport.date).toLocaleDateString('en-AU') : ''}</div>
        </div>
        <div style="color: #10b981; font-size: 18pt;">✓</div>
      </div>
      ` : ''}
    </div>
  </div>
  
  <!-- Warranty Information -->
  <div class="section">
    <div class="warranty-box">
      <h3>🛡️ Warranty Information</h3>
      <p style="margin-bottom: 15px; color: #92400e;">
        Your solar system is covered by the following warranties:
      </p>
      <div class="warranty-grid">
        <div class="warranty-item">
          <strong>Solar Panels</strong>
          ${data.warranties.panels}
        </div>
        <div class="warranty-item">
          <strong>Inverter</strong>
          ${data.warranties.inverter}
        </div>
        ${data.warranties.battery ? `
        <div class="warranty-item">
          <strong>Battery Storage</strong>
          ${data.warranties.battery}
        </div>
        ` : ''}
        <div class="warranty-item">
          <strong>Installation Workmanship</strong>
          ${data.warranties.installation}
        </div>
      </div>
    </div>
  </div>
  
  <!-- Important Information -->
  <div class="section">
    <div class="important-box">
      <h3>⚠️ Important System Information</h3>
      ${data.exportLimit ? `
      <div class="important-item">
        <strong>Export Limit:</strong> ${data.exportLimit} kW<br>
        <span style="font-size: 9pt; color: #666;">Your system is limited to exporting ${data.exportLimit}kW to the grid as per Western Power requirements.</span>
      </div>
      ` : ''}
      ${data.monitoringUrl ? `
      <div class="important-item">
        <strong>Monitoring System:</strong><br>
        URL: ${data.monitoringUrl}<br>
        ${data.monitoringUsername ? `Username: ${data.monitoringUsername}<br>` : ''}
        <span style="font-size: 9pt; color: #666;">Check your system performance anytime via the monitoring portal.</span>
      </div>
      ` : ''}
      <div class="important-item">
        <strong>Maintenance:</strong><br>
        <span style="font-size: 9pt; color: #666;">Clean panels every 6-12 months. Check inverter display regularly for error messages.</span>
      </div>
    </div>
  </div>
  
  <!-- Contact Information -->
  <div class="section">
    <div class="contact-box">
      <h3>📞 Contact Information</h3>
      <div class="contact-item">
        <strong>Installer:</strong> ${data.installerName}<br>
        <strong>Company:</strong> ${data.installerCompany}
      </div>
      ${data.installerPhone ? `
      <div class="contact-item">
        <strong>Phone:</strong> ${data.installerPhone}
      </div>
      ` : ''}
      ${data.installerEmail ? `
      <div class="contact-item">
        <strong>Email:</strong> ${data.installerEmail}
      </div>
      ` : ''}
      ${data.supportPhone ? `
      <div class="contact-item">
        <strong>Support Hotline:</strong> ${data.supportPhone}
      </div>
      ` : ''}
      ${data.emergencyContact ? `
      <div class="contact-item">
        <strong>Emergency Contact:</strong> ${data.emergencyContact}
      </div>
      ` : ''}
    </div>
  </div>
  
  <!-- Next Steps -->
  ${data.nextSteps && data.nextSteps.length > 0 ? `
  <div class="section">
    <div class="next-steps">
      <h3>🎯 Next Steps</h3>
      <ol>
        ${data.nextSteps.map(step => `<li>${step}</li>`).join('')}
      </ol>
    </div>
  </div>
  ` : ''}
  
  <!-- Footer -->
  <div class="footer">
    <div class="company-name">${data.installerCompany}</div>
    <p><strong>Document Generated:</strong> ${new Date().toLocaleString('en-AU')}</p>
    <p style="margin-top: 15px;">
      Thank you for choosing ${data.installerCompany} for your solar installation.<br>
      We're here to support you throughout your solar journey!
    </p>
    <p style="margin-top: 10px; font-size: 8pt;">
      Keep this handover pack in a safe place for future reference.
    </p>
  </div>
</body>
</html>
  `;

  return Buffer.from(html, 'utf-8');
}

export function validateHandoverPack(data: Partial<HandoverPackData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.jobNumber) {
    errors.push('Job number is required');
  }

  if (!data.customerName) {
    errors.push('Customer name is required');
  }

  if (!data.installerCompany) {
    errors.push('Installer company is required');
  }

  if (!data.completedAt) {
    errors.push('Completion date is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
