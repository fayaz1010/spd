/**
 * PDF Package Generator
 * Assembles complete solar installation documentation package
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Panel {
  id: string;
  latitude: number;
  longitude: number;
  orientationDegrees: number;
  wattage: number;
  yearlyEnergyKwh: number;
  stringId?: string;
}

interface PDFOptions {
  projectName: string;
  address: string;
  customerName: string;
  systemSize: number;
  totalPanels: number;
  panelWattage: number;
  totalProduction: number;
  installationDate?: string;
}

export class PDFPackageGenerator {
  private pdfDoc!: PDFDocument;
  
  async generate(
    aerialViewImage: Buffer,
    panels: Panel[],
    options: PDFOptions
  ): Promise<Buffer> {
    
    // Create new PDF document
    this.pdfDoc = await PDFDocument.create();
    
    // Add pages
    await this.addCoverPage(options);
    await this.addAerialViewPage(aerialViewImage, options);
    await this.addSpecificationsPage(panels, options);
    await this.addInstallationGuidePage(panels, options);
    
    // Save and return PDF
    const pdfBytes = await this.pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
  
  private async addCoverPage(options: PDFOptions) {
    const page = this.pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    const font = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Title
    page.drawText('Solar Installation Plan', {
      x: 50,
      y: height - 100,
      size: 36,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Subtitle
    page.drawText('Professional Design Documentation', {
      x: 50,
      y: height - 140,
      size: 18,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Divider line
    page.drawLine({
      start: { x: 50, y: height - 160 },
      end: { x: width - 50, y: height - 160 },
      thickness: 2,
      color: rgb(0, 0, 0),
    });
    
    // Project details
    const detailsY = height - 220;
    const lineHeight = 30;
    
    page.drawText('Project Details', {
      x: 50,
      y: detailsY,
      size: 20,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    const details = [
      `Customer: ${options.customerName}`,
      `Address: ${options.address}`,
      `System Size: ${options.systemSize.toFixed(2)}kW`,
      `Total Panels: ${options.totalPanels}`,
      `Panel Wattage: ${options.panelWattage}W`,
      `Annual Production: ${options.totalProduction.toFixed(0)} kWh`,
      `Date: ${new Date().toLocaleDateString()}`,
    ];
    
    details.forEach((detail, idx) => {
      page.drawText(detail, {
        x: 70,
        y: detailsY - ((idx + 1) * lineHeight),
        size: 14,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
    });
    
    // Company info at bottom
    page.drawText('Sun Direct Power', {
      x: 50,
      y: 100,
      size: 24,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Professional Solar Installation Services', {
      x: 50,
      y: 75,
      size: 12,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    page.drawText('www.sundirectpower.com.au', {
      x: 50,
      y: 55,
      size: 12,
      font: fontRegular,
      color: rgb(0, 0.4, 0.8),
    });
  }
  
  private async addAerialViewPage(aerialViewImage: Buffer, options: PDFOptions) {
    const page = this.pdfDoc.addPage([792, 612]); // Landscape
    const { width, height } = page.getSize();
    const font = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Page title
    page.drawText('Aerial View - Panel Layout', {
      x: 50,
      y: height - 40,
      size: 18,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Embed aerial view image
    try {
      const image = await this.pdfDoc.embedPng(aerialViewImage);
      const imageDims = image.scale(0.3); // Scale to fit page
      
      page.drawImage(image, {
        x: (width - imageDims.width) / 2,
        y: (height - imageDims.height) / 2 - 20,
        width: imageDims.width,
        height: imageDims.height,
      });
    } catch (error) {
      console.error('Failed to embed aerial view image:', error);
    }
  }
  
  private async addSpecificationsPage(panels: Panel[], options: PDFOptions) {
    const page = this.pdfDoc.addPage([612, 792]); // Portrait
    const { width, height } = page.getSize();
    const font = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Page title
    page.drawText('System Specifications', {
      x: 50,
      y: height - 50,
      size: 24,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // System overview
    let currentY = height - 100;
    const lineHeight = 25;
    
    page.drawText('System Overview', {
      x: 50,
      y: currentY,
      size: 18,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight + 10;
    
    const systemSpecs = [
      `Total System Capacity: ${options.systemSize.toFixed(2)}kW`,
      `Number of Panels: ${options.totalPanels}`,
      `Panel Model: ${options.panelWattage}W Solar Panel`,
      `Estimated Annual Production: ${options.totalProduction.toFixed(0)} kWh`,
      `Estimated Daily Production: ${(options.totalProduction / 365).toFixed(1)} kWh`,
    ];
    
    systemSpecs.forEach(spec => {
      page.drawText(spec, {
        x: 70,
        y: currentY,
        size: 12,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    });
    
    // String configuration
    currentY -= 20;
    page.drawText('String Configuration', {
      x: 50,
      y: currentY,
      size: 18,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight + 10;
    
    // Group panels by string
    const panelsByString: Record<string, Panel[]> = {};
    panels.forEach(panel => {
      const stringId = panel.stringId || 'string-1';
      if (!panelsByString[stringId]) {
        panelsByString[stringId] = [];
      }
      panelsByString[stringId].push(panel);
    });
    
    Object.entries(panelsByString).forEach(([stringId, stringPanels], idx) => {
      const stringProduction = stringPanels.reduce((sum, p) => sum + p.yearlyEnergyKwh, 0);
      const stringVoltage = stringPanels.length * 40; // Approximate
      
      page.drawText(`String ${idx + 1}:`, {
        x: 70,
        y: currentY,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`${stringPanels.length} panels, ~${stringVoltage}V DC, ${stringProduction.toFixed(0)} kWh/year`, {
        x: 150,
        y: currentY,
        size: 12,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      
      currentY -= lineHeight;
    });
    
    // Panel list
    currentY -= 20;
    page.drawText('Panel List', {
      x: 50,
      y: currentY,
      size: 18,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight + 10;
    
    // Table header
    page.drawText('ID', {
      x: 70,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('String', {
      x: 130,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Wattage', {
      x: 210,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Production (kWh/yr)', {
      x: 300,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    currentY -= 5;
    
    // Draw line under header
    page.drawLine({
      start: { x: 70, y: currentY },
      end: { x: width - 70, y: currentY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    currentY -= 15;
    
    // Panel rows (limit to fit page)
    panels.slice(0, 20).forEach(panel => {
      if (currentY < 100) return; // Stop if running out of space
      
      page.drawText(panel.id, {
        x: 70,
        y: currentY,
        size: 9,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(panel.stringId || 'N/A', {
        x: 130,
        y: currentY,
        size: 9,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`${panel.wattage}W`, {
        x: 210,
        y: currentY,
        size: 9,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(panel.yearlyEnergyKwh.toFixed(0), {
        x: 320,
        y: currentY,
        size: 9,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      
      currentY -= 18;
    });
    
    if (panels.length > 20) {
      page.drawText(`... and ${panels.length - 20} more panels`, {
        x: 70,
        y: currentY,
        size: 9,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  }
  
  private async addInstallationGuidePage(panels: Panel[], options: PDFOptions) {
    const page = this.pdfDoc.addPage([612, 792]); // Portrait
    const { width, height } = page.getSize();
    const font = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Page title
    page.drawText('Installation Guide', {
      x: 50,
      y: height - 50,
      size: 24,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    let currentY = height - 100;
    const lineHeight = 25;
    
    // Installation sequence
    page.drawText('Installation Sequence', {
      x: 50,
      y: currentY,
      size: 18,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight + 10;
    
    const steps = [
      '1. Verify roof structure and load capacity',
      '2. Install mounting rails according to layout',
      '3. Install panels in numerical order (P1, P2, P3...)',
      '4. Connect panels in string configuration as specified',
      '5. Route DC cables to inverter location',
      '6. Install inverter and AC disconnect',
      '7. Complete electrical connections',
      '8. Test system operation',
      '9. Commission system and verify production',
    ];
    
    steps.forEach(step => {
      page.drawText(step, {
        x: 70,
        y: currentY,
        size: 12,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    });
    
    // Safety notes
    currentY -= 20;
    page.drawText('Safety Notes', {
      x: 50,
      y: currentY,
      size: 18,
      font: font,
      color: rgb(0.8, 0, 0),
    });
    
    currentY -= lineHeight + 10;
    
    const safetyNotes = [
      '• All work must be performed by licensed electricians',
      '• Follow AS/NZS 5033:2021 solar installation standards',
      '• Use appropriate fall protection equipment',
      '• Verify all electrical connections before energizing',
      '• Test system grounding and bonding',
      '• Obtain required electrical permits and inspections',
    ];
    
    safetyNotes.forEach(note => {
      page.drawText(note, {
        x: 70,
        y: currentY,
        size: 12,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    });
    
    // Compliance
    currentY -= 20;
    page.drawText('Compliance & Standards', {
      x: 50,
      y: currentY,
      size: 18,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    currentY -= lineHeight + 10;
    
    const compliance = [
      'AS/NZS 5033:2021 - Installation and safety requirements',
      'AS/NZS 3000:2018 - Electrical installations',
      'AS/NZS 4777:2020 - Grid connection requirements',
      'Clean Energy Council guidelines',
    ];
    
    compliance.forEach(item => {
      page.drawText(`• ${item}`, {
        x: 70,
        y: currentY,
        size: 11,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    });
    
    // Footer
    page.drawText('This document is for installation planning purposes only.', {
      x: 50,
      y: 50,
      size: 10,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    page.drawText('Final installation must be verified by licensed electrician.', {
      x: 50,
      y: 35,
      size: 10,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
}
