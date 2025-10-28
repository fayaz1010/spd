import { NextRequest, NextResponse } from 'next/server';

// Public API for fetching social links (used by Footer component)
export async function GET(request: NextRequest) {
  try {
    // In production, fetch from database
    // For now, fetch from admin API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5123'}/api/admin/social`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
    
    // Fallback data
    return NextResponse.json({
      success: true,
      links: {
        facebook: 'https://facebook.com/sundirectpower',
        instagram: 'https://instagram.com/sundirectpower',
        linkedin: 'https://linkedin.com/company/sundirectpower',
        youtube: 'https://youtube.com/@sundirectpower',
        tiktok: '',
        pinterest: '',
      },
    });
  } catch (error: any) {
    console.error('Error fetching social links:', error);
    return NextResponse.json(
      { 
        success: true,
        links: {
          facebook: 'https://facebook.com',
          instagram: 'https://instagram.com',
          linkedin: 'https://linkedin.com',
          youtube: 'https://youtube.com',
          tiktok: '',
          pinterest: '',
        }
      },
      { status: 200 }
    );
  }
}
