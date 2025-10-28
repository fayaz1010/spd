import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In production, save to database
    const newService = {
      ...body,
      id: Date.now().toString(),
    };
    
    console.log('Creating service:', newService);
    
    return NextResponse.json({
      success: true,
      service: newService,
    });
  } catch (error: any) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In production, update in database
    console.log('Updating service:', body);
    
    return NextResponse.json({
      success: true,
      service: body,
    });
  } catch (error: any) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
