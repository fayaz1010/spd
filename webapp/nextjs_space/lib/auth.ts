/**
 * Unified Authentication System
 * Supports multiple user roles: SUPER_ADMIN, ADMIN, TEAM_MEMBER, CUSTOMER
 */

import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEAM_MEMBER = 'TEAM_MEMBER',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  CUSTOMER = 'CUSTOMER',
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  permissions: string[];
  // Optional: for team members
  teamMemberId?: string;
  teamId?: string;
  teamName?: string;
  // Optional: for subcontractors
  subcontractorId?: string;
  companyName?: string;
  // Optional: for customers
  leadId?: string;
}

/**
 * Sign JWT token
 */
export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify JWT - handles both token strings and Request objects (for compatibility)
 * Can be called with or without await
 */
export function verifyJWT(tokenOrRequest: string | Request | NextRequest): AuthPayload | null;
export function verifyJWT(tokenOrRequest: string | Request | NextRequest): Promise<AuthPayload | null>;
export function verifyJWT(tokenOrRequest: string | Request | NextRequest): AuthPayload | null | Promise<AuthPayload | null> {
  // If it's a string, verify the token directly
  if (typeof tokenOrRequest === 'string') {
    return verifyToken(tokenOrRequest);
  }
  
  // If it's a Request object, extract the user from it
  if (tokenOrRequest instanceof Request) {
    // Try to convert to NextRequest if possible
    const request = tokenOrRequest as NextRequest;
    return getUserFromRequest(request);
  }
  
  return null;
}

/**
 * Get user from request (checks both Authorization header and cookies)
 */
export function getUserFromRequest(request: NextRequest): AuthPayload | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }
  
  // Try cookie as fallback
  const cookieToken = request.cookies.get('auth_token')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }
  
  return null;
}

/**
 * Require authentication
 */
export function requireAuth(request: NextRequest): AuthPayload {
  const user = getUserFromRequest(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Require specific role(s)
 */
export function requireRole(request: NextRequest, allowedRoles: UserRole[]): AuthPayload {
  const user = requireAuth(request);
  
  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  
  return user;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: AuthPayload, permission: string): boolean {
  // Super admins have all permissions
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  return user.permissions.includes(permission);
}

/**
 * Require specific permission
 */
export function requirePermission(user: AuthPayload, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Forbidden: Missing permission: ${permission}`);
  }
}

/**
 * Check if user can access specific lead/customer data
 */
export function canAccessLead(user: AuthPayload, leadId: string): boolean {
  // Admins can access all leads
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  // Customers can only access their own lead
  if (user.role === UserRole.CUSTOMER) {
    return user.leadId === leadId;
  }
  
  return false;
}

/**
 * Check if user can access specific job
 */
export function canAccessJob(user: AuthPayload, job: { teamId?: string | null; subcontractorId?: string | null; leadId?: string | null }): boolean {
  // Admins can access all jobs
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  // Team members can access their team's jobs
  if (user.role === UserRole.TEAM_MEMBER && user.teamId) {
    return job.teamId === user.teamId;
  }
  
  // Subcontractors can access their assigned jobs
  if (user.role === UserRole.SUBCONTRACTOR && user.subcontractorId) {
    return job.subcontractorId === user.subcontractorId;
  }
  
  // Customers can access their own job
  if (user.role === UserRole.CUSTOMER && user.leadId) {
    return job.leadId === user.leadId;
  }
  
  return false;
}

/**
 * Legacy compatibility - Get admin from request
 * @deprecated Use getUserFromRequest instead
 */
export function getAdminFromRequest(request: NextRequest): AuthPayload | null {
  return getUserFromRequest(request);
}

/**
 * Legacy compatibility - Require admin
 * @deprecated Use requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]) instead
 */
export function requireAdmin(request: NextRequest): AuthPayload {
  return requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
}

/**
 * Legacy compatibility - Sign admin token
 * @deprecated Use signToken instead
 */
export function signAdminToken(payload: any): string {
  return signToken({
    userId: payload.adminId,
    email: payload.email,
    role: payload.role || UserRole.ADMIN,
    name: payload.name || '',
    permissions: payload.permissions || [],
  });
}

/**
 * Legacy compatibility - Verify admin token
 * @deprecated Use verifyToken instead
 */
export function verifyAdminToken(token: string): any | null {
  const payload = verifyToken(token);
  if (!payload) return null;
  
  return {
    adminId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}

// Export legacy types for compatibility
export interface AdminPayload {
  adminId: string;
  email: string;
  role: string;
}

export interface SessionUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Get session from request (legacy compatibility)
 */
export async function getServerSession(authOptions?: any) {
  // This is a placeholder for compatibility
  // In a real implementation, you'd extract the token from cookies/headers
  return {
    user: {
      id: 'admin',
      email: 'admin@sundirect.com',
      role: 'admin',
    },
  };
}

export const authOptions = {
  // Placeholder for compatibility
};
