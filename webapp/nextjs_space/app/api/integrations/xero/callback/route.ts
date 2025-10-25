import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID || '';
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET || '';
const XERO_REDIRECT_URI = process.env.XERO_REDIRECT_URI || 'http://localhost:3000/api/integrations/xero/callback';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // admin ID

    if (!code || !state) {
      return NextResponse.redirect('/admin/settings/integrations?error=missing_params');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: XERO_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get tenant/organization info
    const connectionsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    const connections = await connectionsResponse.json();
    const tenantId = connections[0]?.tenantId;

    // Store tokens in database
    await prisma.integration.upsert({
      where: {
        provider_type: {
          provider: 'XERO',
          type: 'ACCOUNTING',
        },
      },
      create: {
        provider: 'XERO',
        type: 'ACCOUNTING',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        tenantId,
        enabled: true,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        tenantId,
        enabled: true,
      },
    });

    return NextResponse.redirect('/admin/settings/integrations?success=xero_connected');
  } catch (error) {
    console.error('Xero callback error:', error);
    return NextResponse.redirect('/admin/settings/integrations?error=connection_failed');
  }
}
