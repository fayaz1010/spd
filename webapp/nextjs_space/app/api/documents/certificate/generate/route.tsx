import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { VictoriaCOES } from '@/lib/documents/certificates/vic-coes';
import { NSWCompliance } from '@/lib/documents/certificates/nsw-compliance';
import { WASafety } from '@/lib/documents/certificates/wa-safety';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, state, testResults } = body;

    if (!jobId || !state) {
      return NextResponse.json(
        { success: false, error: 'Job ID and state are required' },
        { status: 400 }
      );
    }

    // Fetch job and related data
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        lead: true,
        testResults: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Fetch company settings for license details
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
    });

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Company settings not found. Please configure license details in settings.' },
        { status: 400 }
      );
    }

    // Use provided test results or fetch from database
    const tests = testResults || job.testResults;
    
    if (!tests) {
      return NextResponse.json(
        { success: false, error: 'Test results not found. Please complete testing first.' },
        { status: 400 }
      );
    }

    // Generate certificate number
    const certificateNumber = `${state.toUpperCase()}-${job.jobNumber}-${Date.now().toString().slice(-6)}`;

    // Get state-specific license details from settings
    const statePrefix = state.toLowerCase();
    const electricianName = (settings as any)[`${statePrefix}ElectricianName`] || tests.testedBy || 'Licensed Electrician';
    const electricianLicense = (settings as any)[`${statePrefix}ElectricianLicense`] || 'LIC-XXXXX';
    const contractorName = (settings as any)[`${statePrefix}ContractorName`] || settings.businessName;
    const contractorLicense = (settings as any)[`${statePrefix}ContractorLicense`];

    // Prepare common certificate data
    const commonData = {
      certificateNumber,
      installationAddress: job.lead?.address || 'N/A',
      installationDate: job.scheduledDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      testingDate: tests.testedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      electricianName,
      electricianLicense,
      contractorName,
      contractorLicense,
      systemSize: job.systemSize,
      systemDescription: `${job.systemSize}kW Solar PV System with ${job.panelCount} panels`,
      insulationTestDC: tests.insulationTestDC,
      insulationTestAC: tests.insulationTestAC,
      insulationTestVoltage: tests.insulationTestVoltage,
      earthContinuityTest: tests.earthContinuity,
      voltageRiseCalc: tests.voltageRisePercent,
      customerName: job.lead?.name || 'Customer',
      customerPhone: job.lead?.phone,
      complianceStandards: [
        'AS/NZS 3000:2018 - Electrical installations (Wiring Rules)',
        'AS/NZS 5033:2021 - Installation and safety requirements for photovoltaic (PV) arrays',
        'AS/NZS 4777.2:2020 - Grid connection of energy systems via inverters',
      ],
    };

    // Generate appropriate certificate based on state
    let pdfBuffer: Buffer;
    let certificateType: string;

    switch (state.toUpperCase()) {
      case 'VIC':
      case 'VICTORIA':
        const vicData = {
          ...commonData,
          workType: 'Prescribed' as const, // Solar installations are typically prescribed work
        };
        pdfBuffer = await renderToBuffer(<VictoriaCOES data={vicData} />);
        certificateType = 'Certificate of Electrical Safety (COES)';
        break;

      case 'NSW':
      case 'NEW SOUTH WALES':
        pdfBuffer = await renderToBuffer(<NSWCompliance data={commonData} />);
        certificateType = 'Certificate of Compliance for Electrical Work';
        break;

      case 'WA':
      case 'WESTERN AUSTRALIA':
        const waData = {
          ...commonData,
          noticeOfCompletionNumber: `NOC-${job.jobNumber}-${Date.now().toString().slice(-6)}`,
          batterySchemeEligible: job.batteryCapacity ? job.batteryCapacity >= 4.8 : undefined,
          batteryCapacity: job.batteryCapacity || undefined,
        };
        pdfBuffer = await renderToBuffer(<WASafety data={waData} />);
        certificateType = 'Certificate of Electrical Safety (WA)';
        break;

      // TODO: Add other states
      case 'QLD':
      case 'QUEENSLAND':
        return NextResponse.json(
          { success: false, error: 'Queensland certificate template coming soon' },
          { status: 501 }
        );

      case 'SA':
      case 'SOUTH AUSTRALIA':
        return NextResponse.json(
          { success: false, error: 'South Australia certificate template coming soon' },
          { status: 501 }
        );

      case 'TAS':
      case 'TASMANIA':
        return NextResponse.json(
          { success: false, error: 'Tasmania certificate template coming soon' },
          { status: 501 }
        );

      case 'NT':
      case 'NORTHERN TERRITORY':
        return NextResponse.json(
          { success: false, error: 'Northern Territory certificate template coming soon' },
          { status: 501 }
        );

      case 'ACT':
      case 'AUSTRALIAN CAPITAL TERRITORY':
        return NextResponse.json(
          { success: false, error: 'ACT certificate template coming soon' },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { success: false, error: `Unknown state: ${state}` },
          { status: 400 }
        );
    }

    // Save certificate record to database
    const certificate = await prisma.electricalCertificate.upsert({
      where: { jobId },
      update: {
        certificateType,
        state: state.toUpperCase(),
        certificateNumber,
        electricianName: commonData.electricianName,
        electricianLicense: commonData.electricianLicense,
        installationAddress: commonData.installationAddress,
        installationDate: new Date(commonData.installationDate),
        testingDate: new Date(commonData.testingDate),
        insulationTestDC: commonData.insulationTestDC,
        insulationTestAC: commonData.insulationTestAC,
        insulationTestVoltage: commonData.insulationTestVoltage,
        earthContinuityTest: commonData.earthContinuityTest,
        voltageRiseCalc: commonData.voltageRiseCalc,
        complianceStandards: commonData.complianceStandards,
        updatedAt: new Date(),
      },
      create: {
        jobId,
        certificateType,
        state: state.toUpperCase(),
        certificateNumber,
        electricianName: commonData.electricianName,
        electricianLicense: commonData.electricianLicense,
        installationAddress: commonData.installationAddress,
        installationDate: new Date(commonData.installationDate),
        testingDate: new Date(commonData.testingDate),
        insulationTestDC: commonData.insulationTestDC,
        insulationTestAC: commonData.insulationTestAC,
        insulationTestVoltage: commonData.insulationTestVoltage,
        earthContinuityTest: commonData.earthContinuityTest,
        voltageRiseCalc: commonData.voltageRiseCalc,
        complianceStandards: commonData.complianceStandards,
      },
    });

    // TODO: Upload PDF to cloud storage and save URL

    // Return PDF as downloadable file
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Certificate-${state}-${job.jobNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing certificate
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const certificate = await prisma.electricalCertificate.findUnique({
      where: { jobId },
    });

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found for this job' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}
