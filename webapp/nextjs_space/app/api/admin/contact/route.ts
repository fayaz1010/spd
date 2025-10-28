import { NextRequest, NextResponse } from 'next/server';

// Mock data - In production, this would come from database
const mockData = {
  settings: {
    waOffice: {
      name: 'Head Office - Western Australia',
      address: '1 Whipper Street',
      city: 'Balcatta, WA 6112, Western Australia',
      phone: '08 6246 5606',
      mobile: '+61 0413 823 725',
      email: 'admin@sundirectpower.com.au',
      hours: 'Monday - Friday: 8:00 AM - 5:00 PM',
    },
    maldivesOffice: {
      name: 'Maldives Office',
      company: 'Hoya Maldives',
      address: '1st Floor, G. Safoora Manzil',
      street: 'Bodurasgefaanu Magu',
      city: 'Male\', Maldives',
      phone: '+960 330041',
      mobile: '+960 9137773',
      hours: 'Monday - Saturday: 9:00 AM - 6:00 PM',
    },
    website: 'www.sundirectpower.com.au',
  },
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      ...mockData,
    });
  } catch (error: any) {
    console.error('Error fetching contact data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In production, save to database
    console.log('Saving contact settings:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Contact information saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving contact data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
