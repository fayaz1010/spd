import { NextRequest, NextResponse } from 'next/server';

const mockData = [
  {
    id: '1',
    name: 'John Smith',
    role: 'Managing Director',
    bio: 'Over 15 years of experience in renewable energy',
    image: '/team/john.jpg',
    sortOrder: 1,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    role: 'Operations Manager',
    bio: 'Expert in project management and customer relations',
    image: '/team/sarah.jpg',
    sortOrder: 2,
  },
  {
    id: '3',
    name: 'Michael Chen',
    role: 'Lead Electrician',
    bio: 'CEC accredited with 500+ installations',
    image: '/team/michael.jpg',
    sortOrder: 3,
  },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      team: mockData,
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
    console.log('Creating team member:', body);
    
    return NextResponse.json({
      success: true,
      member: { ...body, id: Date.now().toString() },
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
    console.log('Updating team member:', body);
    
    return NextResponse.json({
      success: true,
      member: body,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
