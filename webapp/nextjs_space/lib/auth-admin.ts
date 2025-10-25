
import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export interface AdminPayload {
  adminId: string;
  email: string;
  role: string;
}

export function signAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    console.log('[Auth] Verifying token with JWT_SECRET:', JWT_SECRET.substring(0, 20) + '...');
    const payload = jwt.verify(token, JWT_SECRET) as AdminPayload;
    console.log('[Auth] Token verified successfully for:', payload.email);
    return payload;
  } catch (error: any) {
    console.error('[Auth] Token verification failed:', error.message);
    return null;
  }
}

export function getAdminFromRequest(request: NextRequest): AdminPayload | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth] No Bearer token in header');
    return null;
  }
  
  const token = authHeader.substring(7);
  console.log('[Auth] Extracted token (first 50 chars):', token.substring(0, 50) + '...');
  console.log('[Auth] Token length:', token.length);
  return verifyAdminToken(token);
}

export function requireAdmin(request: NextRequest): AdminPayload {
  const admin = getAdminFromRequest(request);
  
  if (!admin) {
    throw new Error('Unauthorized');
  }
  
  return admin;
}
