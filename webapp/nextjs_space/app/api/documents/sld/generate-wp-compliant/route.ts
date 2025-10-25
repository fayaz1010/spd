/**
 * Western Power Compliant SLD Generation API
 * Phase 4: Enhanced API route with comprehensive data collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { buildSldData } from '@/lib/sld/data-builder';
import { WPCompliantSldGenerator } from '@/lib/sld/wp-compliant-generator';
import { sldGenerator } from '@/lib/sld/sld-generator';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * POST: Generate Western Power compliant SLD
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Fetch comprehensive job data
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        lead: true,
        equipmentSpec: true, // NEW: Equipment specifications
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Fetch site visit data
    const siteVisit = job.leadId ? await prisma.siteVisitChecklist.findUnique({
      where: { leadId: job.leadId },
    }) : null;

    // Fetch company settings
    const companySettings = await prisma.apiSettings.findFirst({
      where: { active: true },
    });

    if (!companySettings) {
      return NextResponse.json(
        { success: false, error: 'Company settings not configured' },
        { status: 500 }
      );
    }

    // Build comprehensive SLD data
    const sldData = await buildSldData(job, siteVisit, companySettings);

    // Check if data is complete enough
    const completionPercentage = calculateCompletionPercentage(sldData);
    
    if (completionPercentage < 70) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient data for SLD generation',
        completionPercentage,
        message: 'Please complete equipment specifications and site visit details',
      }, { status: 400 });
    }

    // Generate SVG using professional generator
    const result = await sldGenerator.generateSld({
      jobId: job.id,
      jobNumber: job.jobNumber,
      systemSize: job.systemSize,
      panelCount: job.panelCount,
      batteryCapacity: job.batteryCapacity || undefined,
      inverterModel: job.inverterModel,
      customerName: job.lead?.name || 'Customer',
      customerAddress: job.lead?.address || 'Installation Address',
      panelModel: job.equipmentSpec?.panelModel,
      designedBy: companySettings.cecDesignerNumber ? 'CEC Designer' : 'Designer',
    });

    // Save to database with enhanced fields
    const sld = await prisma.singleLineDiagram.upsert({
      where: { jobId },
      update: {
        systemData: sldData as any,
        dcVoltage: sldData.inverter?.maxDcInput || 0,
        dcCurrent: sldData.strings?.[0]?.totalIsc || 0,
        acVoltage: sldData.inverter?.acVoltage || 230,
        acCurrent: sldData.inverter?.maxAcCurrent || 0,
        strings: sldData.strings as any,
        isolators: sldData.isolators as any,
        protection: {
          dc: sldData.dcProtection,
          ac: sldData.acProtection,
        } as any,
        
        // NEW: Document control fields
        drawingNumber: sldData.documentControl?.drawingNumber,
        revision: sldData.documentControl?.revision || 'A',
        revisionDate: sldData.documentControl?.revisionDate ? new Date(sldData.documentControl.revisionDate) : new Date(),
        sheetNumber: sldData.documentControl?.sheetNumber || '1 of 1',
        scale: sldData.documentControl?.scale || 'NTS',
        
        // NEW: Designer info
        designedBy: sldData.designer?.name,
        designerCecNumber: sldData.designer?.cecAccreditation,
        designerLicense: sldData.designer?.electricalLicense,
        designedDate: sldData.documentControl?.dateDesigned ? new Date(sldData.documentControl.dateDesigned) : new Date(),
        
        // NEW: WA-specific
        exportLimitKw: sldData.waSpecific?.exportLimitKw,
        
        // Store SVG
        svgUrl: result.svg, // Store SVG content (or upload to storage)
        
        generatedBy: 'wp-compliant-generator',
        updatedAt: new Date(),
      },
      create: {
        jobId,
        systemData: sldData as any,
        dcVoltage: sldData.inverter?.maxDcInput || 0,
        dcCurrent: sldData.strings?.[0]?.totalIsc || 0,
        acVoltage: sldData.inverter?.acVoltage || 230,
        acCurrent: sldData.inverter?.maxAcCurrent || 0,
        strings: sldData.strings as any,
        isolators: sldData.isolators as any,
        protection: {
          dc: sldData.dcProtection,
          ac: sldData.acProtection,
        } as any,
        
        // Document control
        drawingNumber: sldData.documentControl?.drawingNumber,
        revision: 'A',
        revisionDate: new Date(),
        sheetNumber: '1 of 1',
        scale: 'NTS',
        
        // Designer info
        designedBy: sldData.designer?.name,
        designerCecNumber: sldData.designer?.cecAccreditation,
        designerLicense: sldData.designer?.electricalLicense,
        designedDate: new Date(),
        
        // WA-specific
        exportLimitKw: sldData.waSpecific?.exportLimitKw,
        
        svgUrl: result.svg,
        generatedBy: 'wp-compliant-generator',
      },
    });

    // Return SVG
    return new NextResponse(result.svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="SLD-${job.jobNumber}.svg"`,
      },
    });

  } catch (error) {
    console.error('Error generating WP-compliant SLD:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate Single Line Diagram',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate completion percentage
 */
function calculateCompletionPercentage(data: any): number {
  const requiredFields = [
    'documentControl',
    'project',
    'designer',
    'company',
    'panels',
    'strings',
    'inverter',
    'dcCables',
    'acCables',
    'dcProtection',
    'acProtection',
    'isolators',
    'earthing',
    'metering',
    'mainSwitchboard',
    'waSpecific',
    'compliance',
  ];
  
  let completedFields = 0;
  
  for (const field of requiredFields) {
    if (data[field] && Object.keys(data[field]).length > 0) {
      completedFields++;
    }
  }
  
  return Math.round((completedFields / requiredFields.length) * 100);
}

/**
 * GET: Retrieve existing SLD with validation status
 */
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

    const sld = await prisma.singleLineDiagram.findUnique({
      where: { jobId },
    });

    if (!sld) {
      return NextResponse.json(
        { success: false, error: 'SLD not found for this job' },
        { status: 404 }
      );
    }

    // Calculate completion percentage
    const completionPercentage = calculateCompletionPercentage(sld.systemData);

    return NextResponse.json({
      success: true,
      data: sld,
      completionPercentage,
      isWpCompliant: completionPercentage >= 90,
    });
  } catch (error) {
    console.error('Error fetching SLD:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SLD' },
      { status: 500 }
    );
  }
}
