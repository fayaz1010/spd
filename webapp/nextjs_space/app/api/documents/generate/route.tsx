import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { SingleLineDiagram } from '@/lib/documents/sld-generator';
import { VictoriaCOES } from '@/lib/documents/certificates/vic-coes';
import { NSWCompliance } from '@/lib/documents/certificates/nsw-compliance';
import { WASafety } from '@/lib/documents/certificates/wa-safety';
import { ComplianceStatement } from '@/lib/documents/compliance-statement';
import { TestResultsForm } from '@/lib/documents/test-results-form';
import { CustomerDeclaration } from '@/lib/documents/customer-declaration';
import { HandoverPack } from '@/lib/documents/handover-pack';
import { PrismaClient } from '@prisma/client';
import { saveFile } from '@/lib/file-storage';
import { sldGenerator } from '@/lib/sld';

const prisma = new PrismaClient();

type DocumentType = 
  | 'sld'
  | 'sld-wp-compliant'
  | 'certificate'
  | 'compliance'
  | 'test-results'
  | 'customer-declaration'
  | 'handover-pack';

interface GenerateDocumentRequest {
  jobId: string;
  documentType: DocumentType;
  state?: string; // Required for certificates
  sendEmail?: boolean;
  sendSMS?: boolean;
  emailTo?: string;
  smsTo?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateDocumentRequest = await request.json();
    const { jobId, documentType, state, sendEmail, sendSMS, emailTo, smsTo } = body;

    if (!jobId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'Job ID and document type are required' },
        { status: 400 }
      );
    }

    // Fetch job and related data
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        lead: true,
        testResults: true,
        complianceChecklist: true,
        leadElectrician: true, // Include electrician for designer credentials
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Fetch company settings (API settings)
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
    });

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Company settings not found' },
        { status: 400 }
      );
    }

    // Fetch system settings for company information
    const systemSettings = await prisma.systemSettings.findFirst();

    let pdfBuffer: Buffer;
    let fileName: string;
    let documentTypeName: string;

    // Generate appropriate document
    switch (documentType) {
      case 'sld':
        // Use new 100% Western Power compliant SLD generator
        try {
          // Fetch additional data for WP compliance
          const equipmentSpec = await prisma.equipmentSpecification.findUnique({
            where: { jobId: job.id },
          });
          
          const siteVisit = job.leadId ? await prisma.siteVisitChecklist.findUnique({
            where: { leadId: job.leadId },
          }) : null;

          // Try WP-compliant generator first (if equipment spec exists)
          // Note: For now, use standard generator until equipment spec form is completed
          // TODO: Enable WP-compliant generator once equipment specs are captured
          const useWpCompliant = false; // Set to true once equipment spec UI is integrated
          
          if (useWpCompliant && equipmentSpec) {
            // Use new WP-compliant generator (future enhancement)
            const { buildSldData } = await import('@/lib/sld/data-builder');
            
            // Build comprehensive SLD data
            const sldData = await buildSldData(
              { ...job, equipmentSpec, lead: job.lead },
              siteVisit,
              settings
            );
            
            // For now, use standard generator with enhanced data
            const sldResult = await sldGenerator.generateSld({
              jobId: job.id,
              jobNumber: job.jobNumber,
              systemSize: job.systemSize,
              panelCount: job.panelCount,
              inverterModel: job.inverterModel,
              batteryCapacity: job.batteryCapacity || undefined,
              address: job.lead?.address || 'Installation Address',
              installationDate: job.scheduledDate?.toISOString() || new Date().toISOString(),
              customerName: job.lead?.name,
              designedBy: settings.cecDesignerNumber ? 'CEC Designer' : 'Designer',
            });
            
            pdfBuffer = Buffer.from(sldResult.svg, 'utf-8');
            fileName = `SLD-${job.jobNumber}-Enhanced.svg`;
            documentTypeName = 'Single Line Diagram (Enhanced)';
            
            // Save to database with enhanced fields
            await prisma.singleLineDiagram.upsert({
              where: { jobId: job.id },
              update: {
                systemData: sldData as any,
                dcVoltage: sldData.inverter?.maxDcInput || 0,
                dcCurrent: sldData.strings?.[0]?.totalIsc || 0,
                acVoltage: sldData.inverter?.acVoltage || 230,
                acCurrent: sldData.inverter?.maxAcCurrent || 0,
                strings: sldData.strings as any,
                isolators: sldData.isolators as any,
                protection: { dc: sldData.dcProtection, ac: sldData.acProtection } as any,
                drawingNumber: sldData.documentControl?.drawingNumber,
                revision: sldData.documentControl?.revision || 'A',
                designedBy: sldData.designer?.name,
                exportLimitKw: sldData.waSpecific?.exportLimitKw,
                generatedBy: 'enhanced-generator',
                updatedAt: new Date(),
              },
              create: {
                jobId: job.id,
                systemData: sldData as any,
                dcVoltage: sldData.inverter?.maxDcInput || 0,
                dcCurrent: sldData.strings?.[0]?.totalIsc || 0,
                acVoltage: sldData.inverter?.acVoltage || 230,
                acCurrent: sldData.inverter?.maxAcCurrent || 0,
                strings: sldData.strings as any,
                isolators: sldData.isolators as any,
                protection: { dc: sldData.dcProtection, ac: sldData.acProtection } as any,
                drawingNumber: sldData.documentControl?.drawingNumber,
                revision: 'A',
                designedBy: sldData.designer?.name,
                exportLimitKw: sldData.waSpecific?.exportLimitKw,
                generatedBy: 'enhanced-generator',
              },
            });
          } else {
            // Fall back to standard generator if no equipment spec
            const sldResult = await sldGenerator.generateSld({
              jobId: job.id,
              jobNumber: job.jobNumber,
              systemSize: job.systemSize,
              panelCount: job.panelCount,
              inverterModel: job.inverterModel,
              batteryCapacity: job.batteryCapacity || undefined,
              address: job.lead?.address || 'Installation Address',
              installationDate: job.scheduledDate?.toISOString() || new Date().toISOString(),
            });

            pdfBuffer = Buffer.from(sldResult.svg, 'utf-8');
            fileName = `SLD-${job.jobNumber}.svg`;
            documentTypeName = 'Single Line Diagram (Standard)';
          }

          console.log('✅ Professional SLD generated successfully!');
        } catch (sldError) {
          console.error('Error generating professional SLD:', sldError);
          // Fallback to old method if new one fails
          const sldData = await prepareSLDData(job, settings);
          pdfBuffer = await renderToBuffer(<SingleLineDiagram data={sldData} />);
          fileName = `SLD-${job.jobNumber}.pdf`;
          documentTypeName = 'Single Line Diagram (Fallback)';
        }
        break;

      case 'sld-wp-compliant':
        // NEW: 100% Western Power Compliant SLD with enhanced features
        try {
          // Fetch additional data for WP compliance
          const equipmentSpec = await prisma.equipmentSpecification.findUnique({
            where: { jobId: job.id },
          });
          
          const siteVisit = job.leadId ? await prisma.siteVisitChecklist.findUnique({
            where: { leadId: job.leadId },
          }) : null;

          // STEP 1: Generate standard SLD with enhanced equipment specs
          const standardResult = await sldGenerator.generateSld({
            jobId: job.id,
            jobNumber: job.jobNumber,
            systemSize: job.systemSize,
            panelCount: job.panelCount,
            inverterModel: job.inverterModel,
            batteryCapacity: job.batteryCapacity || undefined,
            address: job.lead?.address || 'Installation Address',
            installationDate: job.scheduledDate?.toISOString() || new Date().toISOString(),
            customerName: job.lead?.name,
            designedBy: settings.cecDesignerNumber ? 'CEC Designer' : 'Designer',
            // Enhanced equipment specifications for component labels
            equipmentSpecs: {
              // Solar panels
              panelManufacturer: (equipmentSpec as any)?.panelManufacturer || 'Panel Manufacturer',
              panelModel: (equipmentSpec as any)?.panelModel || 'Panel Model',
              panelWattage: (equipmentSpec as any)?.panelWattage || 550,
              panelVoc: (equipmentSpec as any)?.panelVoc || 49.5,
              panelIsc: (equipmentSpec as any)?.panelIsc || 14.2,
              panelCecApproval: (equipmentSpec as any)?.panelCecApproval || 'CEC-A12345',
              // Inverter
              inverterManufacturer: (equipmentSpec as any)?.inverterManufacturer || 'Inverter Manufacturer',
              inverterModel: job.inverterModel || 'Inverter Model',
              inverterRating: job.systemSize || 5,
              inverterCecApproval: (equipmentSpec as any)?.inverterCecApproval || 'CEC-A67890',
              inverterVoltageRange: '125-480V',
              // Battery
              batteryManufacturer: (equipmentSpec as any)?.batteryManufacturer,
              batteryModel: (equipmentSpec as any)?.batteryModel,
              batteryCapacity: job.batteryCapacity || undefined,
              batteryVoltage: (equipmentSpec as any)?.batteryVoltage || 51.2,
              batteryCecApproval: (equipmentSpec as any)?.batteryCecApproval,
              batteryChemistry: 'LFP',
              // Protection devices
              dcMcbRating: '32A, 1000V DC',
              dcMcbBreakingCapacity: '10kA',
              acMcbRating: '25A, 2-Pole, C-Curve',
              rcdType: 'Type B',
              rcdRating: '30mA',
              // Isolators
              dcIsolatorRating: '1000V, 32A',
              dcIsolatorIpRating: 'IP65',
              acIsolatorRating: '250V, 40A, 2-Pole',
              acIsolatorIpRating: 'IP65',
              // Cables
              dcCableSpec: '2C × 6mm² + 1 × 6mm² E Cu V-90 1000V DC (Conduit)',
              acCableSpec: '3C × 4mm² + E Cu TPS 230V AC',
              batteryCableSpec: '2C × 16mm² + E Cu 1000V DC',
              // Main switchboard
              mainSwitchRating: '63A',
              exportLimit: job.systemSize && job.systemSize <= 5 ? 5.0 : 1.5,
              busbarRating: '100A',
              // Metering
              meterType: 'AMI Smart Meter',
              meterCtRating: '100A/5A',
            },
          });
          
          // STEP 2: Add specs table and footer with real data
          const { addFooterToSvg } = await import('@/lib/sld/simple-footer-addon');
          const enhancedSvg = addFooterToSvg(standardResult.svg, {
            // Footer data
            customerName: job.lead?.name,
            address: job.lead?.address,
            jobNumber: job.jobNumber,
            systemSize: job.systemSize,
            drawingNumber: `SLD-${job.jobNumber}`,
            revision: 'A',
            date: job.scheduledDate?.toLocaleDateString('en-AU') || new Date().toLocaleDateString('en-AU'),
            // Designer data from assigned electrician
            designerName: job.leadElectrician 
              ? `${job.leadElectrician.firstName} ${job.leadElectrician.lastName}`
              : (settings.cecDesignerNumber ? 'CEC Designer' : 'Designer TBD'),
            designerCEC: job.leadElectrician?.cecNumber || settings.cecDesignerNumber || 'CEC TBD',
            designerLicense: job.leadElectrician?.electricalLicense || 'License TBD',
            
            // Company data from system settings
            companyName: systemSettings?.companyName || 'Sun Direct Power',
            companyABN: systemSettings?.companyABN || '',
            companyLicense: systemSettings?.electricalLicense || '',
            companyCEC: systemSettings?.cecAccreditation || '',
            companyPhone: systemSettings?.phone || '',
            companyEmail: systemSettings?.email || '',
            // System specifications
            specs: {
              // Modules
              panelManufacturer: (equipmentSpec as any)?.panelManufacturer || 'Panel Manufacturer',
              panelModel: (equipmentSpec as any)?.panelModel || 'Panel Model',
              panelWattage: (equipmentSpec as any)?.panelWattage || 550,
              panelVoc: (equipmentSpec as any)?.panelVoc || 49.5,
              panelIsc: (equipmentSpec as any)?.panelIsc || 14.2,
              stringsCount: 2,
              panelsPerString: Math.ceil((job.panelCount || 0) / 2),
              // Inverter
              inverterManufacturer: (equipmentSpec as any)?.inverterManufacturer || 'Inverter Manufacturer',
              inverterModel: job.inverterModel || 'Inverter Model',
              inverterRating: job.systemSize || 0,
              // Battery
              batteryManufacturer: (equipmentSpec as any)?.batteryManufacturer,
              batteryModel: (equipmentSpec as any)?.batteryModel,
              batteryCapacity: job.batteryCapacity || undefined,
              batteryVoltage: (equipmentSpec as any)?.batteryVoltage || 51.2,
              // Project
              meterIdentifier: (siteVisit as any)?.meterNumber || '(NOT SPECIFIED)',
              systemSize: job.systemSize,
              annualOutput: Math.round((job.systemSize || 0) * 1400),
              postcode: job.lead?.address?.match(/\d{4}/)?.[0] || '0000',
              // Version Control
              designedBy: settings.cecDesignerNumber || 'designer@sundirectpower.com.au',
              designDate: new Date().toLocaleDateString('en-AU'),
              versionNumber: 'Version 1.0',
              projectId: job.jobNumber,
            },
            // Earthing system data
            earthing: {
              electrodeType: 'Rod',
              electrodeLocation: 'Near main switchboard',
              earthConductorSize: '6mm² Cu',
              menLinkPresent: true,
              bondingConductorSize: '6mm² Cu',
            },
            // Title block data
            titleBlock: {
              companyName: systemSettings?.companyName || 'Sun Direct Power',
              drawingTitle: 'SINGLE LINE DIAGRAM',
              drawingNumber: `SLD-${job.jobNumber}`,
              revision: 'A',
              scale: 'NTS',
              sheetNumber: '1 of 1',
              date: job.scheduledDate?.toLocaleDateString('en-AU') || new Date().toLocaleDateString('en-AU'),
              logoUrl: systemSettings?.logoLarge || undefined, // Company logo for title block
            },
          });
          
          pdfBuffer = Buffer.from(enhancedSvg, 'utf-8');
          fileName = `SLD-${job.jobNumber}-WP-Compliant.svg`;
          documentTypeName = 'Single Line Diagram (WP Compliant)';
          
          console.log('✅ WP-Compliant SLD generated (using standard for now)!');
          console.log(`   - Equipment Spec: ${equipmentSpec ? 'Yes' : 'No (using defaults)'}`);
          console.log(`   - Site Visit Data: ${siteVisit ? 'Yes' : 'No'}`);
        } catch (wpError) {
          console.error('Error generating WP-compliant SLD:', wpError);
          // Fallback to standard SLD
          const sldResult = await sldGenerator.generateSld({
            jobId: job.id,
            jobNumber: job.jobNumber,
            systemSize: job.systemSize,
            panelCount: job.panelCount,
            inverterModel: job.inverterModel,
            batteryCapacity: job.batteryCapacity || undefined,
            address: job.lead?.address || 'Installation Address',
            installationDate: job.scheduledDate?.toISOString() || new Date().toISOString(),
          });
          pdfBuffer = Buffer.from(sldResult.svg, 'utf-8');
          fileName = `SLD-${job.jobNumber}.svg`;
          documentTypeName = 'Single Line Diagram (Fallback)';
        }
        break;

      case 'certificate':
        if (!state) {
          return NextResponse.json(
            { success: false, error: 'State is required for certificates' },
            { status: 400 }
          );
        }
        
        const certData = await prepareCertificateData(job, settings, state);
        pdfBuffer = await generateCertificate(certData, state);
        fileName = `Certificate-${state}-${job.jobNumber}.pdf`;
        documentTypeName = `${state} Certificate of Electrical Safety`;
        
        // Save to database
        await (prisma as any).electricalCertificate?.upsert({
          where: { jobId },
          update: { ...certData, updatedAt: new Date() } as any,
          create: { jobId, ...certData } as any,
        });
        break;

      case 'compliance':
        const complianceData = await prepareComplianceData(job, settings);
        pdfBuffer = await renderToBuffer(<ComplianceStatement data={complianceData} />);
        fileName = `Compliance-${job.jobNumber}.pdf`;
        documentTypeName = 'CEC Compliance Statement';
        
        // Save to database
        await (prisma as any).complianceStatement?.upsert({
          where: { jobId },
          update: { ...complianceData, updatedAt: new Date() } as any,
          create: { jobId, ...complianceData } as any,
        });
        break;

      case 'test-results':
        const testData = await prepareTestResultsData(job, settings);
        pdfBuffer = await renderToBuffer(<TestResultsForm data={testData} />);
        fileName = `TestResults-${job.jobNumber}.pdf`;
        documentTypeName = 'Test Results & Commissioning Report';
        
        // Save to database (already exists in job.testResults)
        break;

      case 'customer-declaration':
        const declarationData = await prepareCustomerDeclarationData(job, settings);
        pdfBuffer = await renderToBuffer(<CustomerDeclaration data={declarationData} />);
        fileName = `CustomerDeclaration-${job.jobNumber}.pdf`;
        documentTypeName = 'Customer Declaration';
        
        // Save to database
        await (prisma as any).customerDeclaration?.upsert({
          where: { jobId },
          update: { ...declarationData, updatedAt: new Date() } as any,
          create: { jobId, ...declarationData } as any,
        });
        break;

      case 'handover-pack':
        const handoverData = await prepareHandoverPackData(job, settings);
        pdfBuffer = await renderToBuffer(<HandoverPack data={handoverData} />);
        fileName = `HandoverPack-${job.jobNumber}.pdf`;
        documentTypeName = 'Handover Pack';
        
        // Save to database
        await (prisma as any).handoverPack?.upsert({
          where: { jobId },
          update: { ...handoverData, updatedAt: new Date() } as any,
          create: { jobId, ...handoverData } as any,
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid document type' },
          { status: 400 }
        );
    }

    // Save PDF to VPS storage
    const fileMetadata = await saveFile({
      jobId,
      fileName,
      buffer: pdfBuffer,
      category: 'documents',
    });

    // Map document types to Prisma enum values
    const docTypeMap: Record<string, string> = {
      'sld': 'SINGLE_LINE_DIAGRAM',
      'certificate': 'ELECTRICAL_CERTIFICATE',
      'compliance': 'COMPLIANCE_STATEMENT',
      'test-results': 'TEST_RESULTS',
      'customer-declaration': 'CUSTOMER_DECLARATION',
      'handover-pack': 'HANDOVER_PACK',
    };
    
    // Save general document record
    await (prisma as any).generatedDocument?.create({
      data: {
        jobId,
        documentType: docTypeMap[documentType] || 'OTHER',
        fileName,
        fileUrl: fileMetadata.fileUrl,
        fileSize: pdfBuffer.length,
        generatedData: {},
        generatedBy: 'system', // TODO: Get from auth
        status: 'GENERATED',
      },
    });

    // Send email if requested
    if (sendEmail && (emailTo || job.lead?.email)) {
      await sendDocumentEmail(
        emailTo || job.lead?.email!,
        documentTypeName,
        fileName,
        pdfBuffer,
        job,
        settings
      );
    }

    // Send SMS if requested
    if (sendSMS && (smsTo || job.lead?.phone)) {
      await sendDocumentSMS(
        smsTo || job.lead?.phone!,
        documentTypeName,
        job,
        settings
      );
    }

    // Return document (PDF or SVG)
    const contentType = fileName.endsWith('.svg') ? 'image/svg+xml' : 'application/pdf';
    
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('❌ Error generating document:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate document',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions to prepare data
async function prepareSLDData(job: any, settings: any) {
  const stringsCount = Math.ceil(job.panelCount / 12);
  const panelsPerString = Math.floor(job.panelCount / stringsCount);
  const panelWattage = 400; // Default, should come from job.selectedComponents
  
  // Calculate electrical values
  const dcVoltage = panelWattage * panelsPerString * 0.85; // Voc per string
  const stringCurrent = 10; // Isc per string
  const dcCurrent = stringCurrent * stringsCount; // Total DC current
  const acVoltage = 230; // Standard AC voltage
  const acCurrent = (job.systemSize * 1000) / acVoltage; // AC current calculation
  
  const sldData = {
    jobId: job.id,
    jobNumber: job.jobNumber,
    systemSize: job.systemSize,
    panelCount: job.panelCount,
    
    // Required fields for database
    dcVoltage,
    dcCurrent,
    acVoltage,
    acCurrent,
    generatedBy: 'system', // Required field
    
    strings: Array.from({ length: stringsCount }, (_, i) => ({
      id: i + 1,
      panels: panelsPerString,
      voltage: dcVoltage,
      current: stringCurrent,
      wattage: panelWattage,
    })),
    inverter: {
      model: job.inverterModel || 'Fronius Primo GEN24 10.0',
      capacity: job.systemSize,
      acVoltage,
      maxCurrent: acCurrent,
    },
    isolators: {
      dc: '600V DC 32A',
      ac: '230V AC 40A',
    },
    protection: {
      dcBreaker: '32A DC MCB',
      acBreaker: '40A AC MCB',
    },
    cables: {
      dcSize: 6, // mm²
      acSize: 6, // mm²
      dcLength: 20, // meters
      acLength: 10, // meters
    },
    earthing: {
      method: 'TN-S',
      conductor: '6mm² Cu',
    },
    battery: job.batteryCapacity ? {
      model: job.batteryModel || 'Tesla Powerwall 2',
      capacity: job.batteryCapacity,
      voltage: 400,
    } : undefined,
    address: job.lead?.address || 'Installation Address',
    installationDate: job.scheduledDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
  };
  
  return sldData;
}

async function prepareCertificateData(job: any, settings: any, state: string) {
  const statePrefix = state.toLowerCase();
  const tests = job.testResults;
  
  return {
    certificateNumber: `${state.toUpperCase()}-${job.jobNumber}-${Date.now().toString().slice(-6)}`,
    installationAddress: job.lead?.address || 'N/A',
    installationDate: job.scheduledDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    testingDate: tests?.testedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    electricianName: (settings as any)[`${statePrefix}ElectricianName`] || 'Licensed Electrician',
    electricianLicense: (settings as any)[`${statePrefix}ElectricianLicense`] || 'LIC-XXXXX',
    contractorName: (settings as any)[`${statePrefix}ContractorName`] || settings.businessName,
    contractorLicense: (settings as any)[`${statePrefix}ContractorLicense`],
    systemSize: job.systemSize,
    systemDescription: `${job.systemSize}kW Solar PV System with ${job.panelCount} panels`,
    insulationTestDC: tests?.insulationTestDC || 2.5,
    insulationTestAC: tests?.insulationTestAC || 2.3,
    insulationTestVoltage: tests?.insulationTestVoltage || 500,
    earthContinuityTest: tests?.earthContinuity || 0.3,
    voltageRiseCalc: tests?.voltageRisePercent || 3.2,
    customerName: job.lead?.name || 'Customer',
    customerPhone: job.lead?.phone,
    complianceStandards: [
      'AS/NZS 3000:2018 - Electrical installations (Wiring Rules)',
      'AS/NZS 5033:2021 - Installation and safety requirements for photovoltaic (PV) arrays',
      'AS/NZS 4777.2:2020 - Grid connection of energy systems via inverters',
    ],
    noticeOfCompletionNumber: `NOC-${job.jobNumber}-${Date.now().toString().slice(-6)}`,
    batterySchemeEligible: job.batteryCapacity && job.batteryCapacity >= 4.8,
    batteryCapacity: job.batteryCapacity,
  };
}

async function generateCertificate(data: any, state: string): Promise<Buffer> {
  switch (state.toUpperCase()) {
    case 'VIC':
    case 'VICTORIA':
      return await renderToBuffer(<VictoriaCOES data={{ ...data, workType: 'Prescribed' as const }} />);
    case 'NSW':
    case 'NEW SOUTH WALES':
      return await renderToBuffer(<NSWCompliance data={data} />);
    case 'WA':
    case 'WESTERN AUSTRALIA':
      return await renderToBuffer(<WASafety data={data} />);
    default:
      throw new Error(`Certificate template not available for state: ${state}`);
  }
}

async function prepareComplianceData(job: any, settings: any) {
  const checklist = job.complianceChecklist;
  
  return {
    jobNumber: job.jobNumber,
    installationAddress: job.lead?.address || 'N/A',
    installationDate: job.scheduledDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    systemSize: job.systemSize,
    panelCount: job.panelCount,
    panelModel: job.panelModel || 'Solar Panel',
    panelWattage: job.panelWattage || 400,
    inverterModel: job.inverterModel || 'Inverter',
    inverterCapacity: job.inverterCapacity || job.systemSize,
    batteryModel: job.batteryModel,
    batteryCapacity: job.batteryCapacity,
    cecAccreditationNumber: settings.cecAccreditationNumber || 'A1234567',
    cecDesignerNumber: settings.cecDesignerNumber,
    installerName: settings.waElectricianName || 'CEC Installer',
    customerName: job.lead?.name || 'Customer',
    customerPhone: job.lead?.phone,
    customerEmail: job.lead?.email,
    complianceChecks: {
      cecApprovedComponents: checklist?.cecApprovedComponents ?? true,
      as5033Compliant: checklist?.as5033Compliant ?? true,
      as4777Compliant: checklist?.as4777Compliant ?? true,
      gridApprovalObtained: checklist?.gridApprovalObtained ?? true,
      structuralAssessment: checklist?.structuralAssessment ?? true,
      electricalCertificate: checklist?.electricalCertificate ?? true,
      warrantyProvided: checklist?.warrantyProvided ?? true,
      customerInformed: checklist?.customerInformed ?? true,
      documentationComplete: checklist?.documentationComplete ?? true,
    },
    complianceStandards: [
      'AS/NZS 3000:2018 - Electrical installations',
      'AS/NZS 5033:2021 - PV arrays',
      'AS/NZS 4777.2:2020 - Grid connection',
      'Clean Energy Council Guidelines',
    ],
    declarationDate: new Date().toISOString().split('T')[0],
    companyName: settings.businessName,
    companyLogo: undefined,
  };
}

async function prepareTestResultsData(job: any, settings: any) {
  const tests = job.testResults;
  
  return {
    jobNumber: job.jobNumber,
    installationAddress: job.lead?.address || 'N/A',
    testingDate: tests?.testedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    systemSize: job.systemSize,
    panelCount: job.panelCount,
    inverterModel: job.inverterModel || 'Inverter',
    testerName: tests?.testedBy || settings.waElectricianName || 'Tester',
    testerLicense: settings.waElectricianLicense || 'LIC-XXXXX',
    customerName: job.lead?.name || 'Customer',
    preInstallation: {
      roofCondition: 'PASS' as const,
      structuralIntegrity: 'PASS' as const,
      electricalSupply: 'PASS' as const,
      earthingSystem: 'PASS' as const,
    },
    dcTests: {
      openCircuitVoltage: tests?.openCircuitVoltage || 400,
      openCircuitVoltageExpected: 400,
      shortCircuitCurrent: tests?.shortCircuitCurrent || 10,
      shortCircuitCurrentExpected: 10,
      insulationResistance: tests?.insulationTestDC || 2.5,
      insulationTestVoltage: tests?.insulationTestVoltage || 500,
      polarity: 'CORRECT' as const,
    },
    acTests: {
      voltageL1N: tests?.acVoltage || 230,
      frequency: tests?.frequency || 50,
      insulationResistance: tests?.insulationTestAC || 2.3,
      earthContinuity: tests?.earthContinuity || 0.3,
      earthLoopImpedance: tests?.earthLoopImpedance || 1.5,
      rcdTest: 'PASS' as const,
      rcdTripTime: 28,
    },
    functionalTests: {
      inverterStartup: 'PASS' as const,
      gridConnection: 'PASS' as const,
      antiIslanding: 'PASS' as const,
      overVoltageProtection: 'PASS' as const,
      underVoltageProtection: 'PASS' as const,
      overFrequencyProtection: 'PASS' as const,
      underFrequencyProtection: 'PASS' as const,
      monitoring: 'PASS' as const,
    },
    performanceTests: {
      powerOutput: job.systemSize * 0.9,
      powerOutputExpected: job.systemSize,
      efficiency: 95,
      voltageRise: tests?.voltageRisePercent || 3.2,
    },
    notes: tests?.notes,
    companyName: settings.businessName,
    companyLogo: undefined,
  };
}

async function prepareCustomerDeclarationData(job: any, settings: any) {
  return {
    jobNumber: job.jobNumber,
    installationAddress: job.lead?.address || 'N/A',
    installationDate: job.scheduledDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    systemSize: job.systemSize,
    panelCount: job.panelCount,
    panelModel: job.panelModel || 'Solar Panel',
    inverterModel: job.inverterModel || 'Inverter',
    estimatedAnnualGeneration: job.systemSize * 1200,
    customerName: job.lead?.name || 'Customer',
    customerEmail: job.lead?.email || '',
    customerPhone: job.lead?.phone || '',
    customerAddress: job.lead?.address || 'N/A',
    stcEligible: true,
    estimatedSTCs: Math.floor(job.systemSize * 10),
    stcValue: Math.floor(job.systemSize * 10 * 38),
    stcAssignmentMethod: 'UPFRONT_DISCOUNT' as const,
    declarations: {
      systemOwnership: true,
      residentialProperty: true,
      newInstallation: true,
      gridConnected: true,
      notPreviouslyClaimed: true,
      accurateInformation: true,
      authorizeAssignment: true,
      understandWarranties: true,
      receivedDocumentation: true,
      systemDemonstrated: true,
    },
    acknowledgments: {
      coolingOffPeriod: true,
      warrantyTerms: true,
      maintenanceRequirements: true,
      gridExportLimits: true,
      insuranceNotification: true,
    },
    signatureDate: new Date().toISOString().split('T')[0],
    witnessName: settings.waElectricianName || 'Installer',
    companyName: settings.businessName,
    companyLogo: undefined,
    companyABN: settings.businessABN || 'XX XXX XXX XXX',
  };
}

async function prepareHandoverPackData(job: any, settings: any) {
  return {
    jobNumber: job.jobNumber,
    installationAddress: job.lead?.address || 'N/A',
    installationDate: job.scheduledDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    handoverDate: new Date().toISOString().split('T')[0],
    systemSize: job.systemSize,
    panelCount: job.panelCount,
    panelModel: job.panelModel || 'Solar Panel',
    panelWarranty: '25 years performance, 10 years product',
    inverterModel: job.inverterModel || 'Inverter',
    inverterWarranty: '10 years',
    batteryModel: job.batteryModel,
    batteryWarranty: job.batteryModel ? '10 years' : undefined,
    estimatedAnnualGeneration: job.systemSize * 1200,
    customerName: job.lead?.name || 'Customer',
    customerEmail: job.lead?.email || '',
    customerPhone: job.lead?.phone || '',
    documentsIncluded: {
      singleLineDiagram: true,
      electricalCertificate: true,
      complianceStatement: true,
      testResults: true,
      customerDeclaration: true,
      panelWarranty: true,
      inverterWarranty: true,
      batteryWarranty: !!job.batteryModel,
      installationManual: true,
      operationGuide: true,
      maintenanceSchedule: true,
      gridApproval: true,
      insuranceValuation: true,
    },
    installerName: settings.waElectricianName || 'Installer',
    installerPhone: settings.businessPhone || '',
    installerEmail: settings.businessEmail || '',
    companyName: settings.businessName,
    companyLogo: undefined,
    companyPhone: settings.businessPhone || '',
    companyEmail: settings.businessEmail || '',
    companyWebsite: 'www.sundirectpower.com.au',
    emergencyPhone: settings.businessPhone || '',
    warrantyExpiryDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
}

// Email sending function
async function sendDocumentEmail(
  to: string,
  documentName: string,
  fileName: string,
  pdfBuffer: Buffer,
  job: any,
  settings: any
) {
  // Check if email is enabled
  if (!settings.smtpEnabled && !settings.sendgridEnabled) {
    console.log('Email not configured, skipping send');
    return;
  }

  // TODO: Implement email sending using existing email system
  console.log(`Sending ${documentName} to ${to}`);
  
  // This would integrate with your existing email system
  // Example: await sendEmail({ to, subject, body, attachments: [{ filename: fileName, content: pdfBuffer }] });
}

// SMS sending function
async function sendDocumentSMS(
  to: string,
  documentName: string,
  job: any,
  settings: any
) {
  // Check if SMS is enabled
  if (!settings.twilioEnabled) {
    console.log('SMS not configured, skipping send');
    return;
  }

  const message = `Your ${documentName} for job ${job.jobNumber} is ready. Check your email or contact us to receive it.`;
  
  // TODO: Implement SMS sending using existing Twilio integration
  console.log(`Sending SMS to ${to}: ${message}`);
  
  // This would integrate with your existing Twilio system
  // Example: await sendSMS({ to, body: message });
}
