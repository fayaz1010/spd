import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In production, save to database
    const newProject = {
      ...body,
      id: Date.now().toString(),
    };
    
    console.log('Creating project:', newProject);
    
    return NextResponse.json({
      success: true,
      project: newProject,
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
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
    console.log('Updating project:', body);
    
    return NextResponse.json({
      success: true,
      project: body,
    });
  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
