import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

// Xero OAuth 2.0 Configuration
const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID || '';
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET || '';
const XERO_REDIRECT_URI = process.env.XERO_REDIRECT_URI || 'http://localhost:3000/api/integrations/xero/callback';
const XERO_SCOPES = 'offline_access accounting.transactions accounting.contacts accounting.settings';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate authorization URL
    const authUrl = `https://login.xero.com/identity/connect/authorize?` +
      `response_type=code&` +
      `client_id=${XERO_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(XERO_REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(XERO_SCOPES)}&` +
      `state=${admin.id}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Xero auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
