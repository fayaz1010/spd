/**
 * Panel Validation API
 * Validates solar panels against CEC approved list
 */

import { NextRequest, NextResponse } from 'next/server';
import { validatePanel, validatePanelBatch, checkSerialNumberFraud, savePanelSerial } from '@/lib/cec-validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, manufacturer, model, wattage, serialNumber, panels, photoUrl } = body;

    // Single panel validation
    if (action === 'validate') {
      if (!manufacturer || !model || !wattage) {
        return NextResponse.json(
          { success: false, error: 'Manufacturer, model, and wattage are required' },
          { status: 400 }
        );
      }

      const validation = await validatePanel(manufacturer, model, wattage);

      // Check for fraud if serial number provided
      let fraudCheck = null;
      if (serialNumber && jobId) {
        fraudCheck = await checkSerialNumberFraud(serialNumber, jobId);
      }

      return NextResponse.json({
        success: true,
        validation,
        fraudCheck,
      });
    }

    // Batch validation
    if (action === 'batch-validate') {
      if (!panels || !Array.isArray(panels)) {
        return NextResponse.json(
          { success: false, error: 'Panels array is required' },
          { status: 400 }
        );
      }

      const batchResult = await validatePanelBatch(panels);

      return NextResponse.json({
        success: true,
        batchResult,
      });
    }

    // Save validated panel
    if (action === 'save') {
      if (!jobId || !serialNumber || !manufacturer || !model || !wattage) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Validate panel first
      const validation = await validatePanel(manufacturer, model, wattage);

      // Check for fraud
      const fraudCheck = await checkSerialNumberFraud(serialNumber, jobId);

      if (fraudCheck.fraudDetected) {
        return NextResponse.json(
          {
            success: false,
            error: 'Fraud detected',
            fraudCheck,
          },
          { status: 400 }
        );
      }

      // Save to database
      const savedPanel = await savePanelSerial({
        jobId,
        serialNumber,
        manufacturer,
        model,
        wattage,
        photoUrl,
        validated: validation.valid,
        validationMessage: validation.message,
      });

      return NextResponse.json({
        success: true,
        panel: savedPanel,
        validation,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Panel validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate panel' },
      { status: 500 }
    );
  }
}

// Get all panels for a job
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

    // In production, fetch from database
    // For now, return empty array
    return NextResponse.json({
      success: true,
      panels: [],
    });
  } catch (error) {
    console.error('Error fetching panels:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch panels' },
      { status: 500 }
    );
  }
}
