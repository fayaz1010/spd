/**
 * Inverter Validation API
 * Validates inverters against CEC approved list
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInverter, saveInverterSerial } from '@/lib/cec-validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, manufacturer, model, capacity, serialNumber, photoUrl } = body;

    // Validate inverter
    if (action === 'validate') {
      if (!manufacturer || !model || !capacity) {
        return NextResponse.json(
          { success: false, error: 'Manufacturer, model, and capacity are required' },
          { status: 400 }
        );
      }

      const validation = await validateInverter(manufacturer, model, capacity);

      return NextResponse.json({
        success: true,
        validation,
      });
    }

    // Save validated inverter
    if (action === 'save') {
      if (!jobId || !serialNumber || !manufacturer || !model || !capacity) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Validate inverter first
      const validation = await validateInverter(manufacturer, model, capacity);

      // Save to database
      const savedInverter = await saveInverterSerial({
        jobId,
        serialNumber,
        manufacturer,
        model,
        capacity,
        photoUrl,
        validated: validation.valid,
        as4777Compliant: validation.as4777Compliant,
        validationMessage: validation.message,
      });

      return NextResponse.json({
        success: true,
        inverter: savedInverter,
        validation,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Inverter validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate inverter' },
      { status: 500 }
    );
  }
}

// Get inverter for a job
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
    // For now, return null
    return NextResponse.json({
      success: true,
      inverter: null,
    });
  } catch (error) {
    console.error('Error fetching inverter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inverter' },
      { status: 500 }
    );
  }
}
