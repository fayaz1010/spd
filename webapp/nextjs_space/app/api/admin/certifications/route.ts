import { NextRequest, NextResponse } from 'next/server';

const mockData = [
  {
    id: '1',
    name: 'Clean Energy Council Accreditation',
    description: 'Certified solar installers and designers',
    image: '/certificates/cec.png',
    sortOrder: 1,
  },
  {
    id: '2',
    name: 'Electrical License',
    description: 'Licensed electrical contractors in WA',
    image: '/certificates/electrical.png',
    sortOrder: 2,
  },
  {
    id: '3',
    name: 'ISO 9001 Certified',
    description: 'Quality management systems',
    image: '/certificates/iso.png',
    sortOrder: 3,
  },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      certificates: mockData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating certificate:', body);
    
    return NextResponse.json({
      success: true,
      certificate: { ...body, id: Date.now().toString() },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Updating certificate:', body);
    
    return NextResponse.json({
      success: true,
      certificate: body,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
