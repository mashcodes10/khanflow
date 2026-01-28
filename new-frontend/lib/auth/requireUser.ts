import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secert_jwt';

// Log warning in development if using default secret
if (process.env.NODE_ENV === 'development' && !process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set in environment variables. Using default secret. This will cause authentication failures if your backend uses a different secret.');
}

export interface UserPayload {
  userId: string;
  email?: string;
  provider?: string;
}

/**
 * Extracts and verifies JWT from Authorization header or cookie
 * @param request Next.js request object
 * @returns User payload with userId, email, and provider if available
 * @throws NextResponse with 401 status if authentication fails
 */
export async function requireUser(request: NextRequest): Promise<UserPayload> {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Try to get token from cookie
    token = request.cookies.get('accessToken')?.value || null;
  }

  if (!token) {
    throw new NextResponse(
      JSON.stringify({ error: 'Unauthorized', message: 'No authentication token provided' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Try to verify with audience first (backend signs with audience: ["user"])
    // If that fails, try without audience (for backward compatibility)
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        audience: ['user'], // Backend signs tokens with audience: ["user"]
      }) as jwt.JwtPayload;
    } catch (audienceError) {
      // If audience verification fails, try without it (might be an older token)
      console.warn('JWT audience verification failed, trying without audience:', audienceError instanceof Error ? audienceError.message : String(audienceError));
      decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    }

    // Extract user information
    const payload: UserPayload = {
      userId: decoded.userId || decoded.sub || '',
    };

    // Add email and provider if available in token
    if (decoded.email) {
      payload.email = decoded.email;
    }
    if (decoded.provider) {
      payload.provider = decoded.provider;
    }

    if (!payload.userId) {
      console.error('JWT verification failed: missing userId in token', { decoded });
      throw new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid token: missing userId' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return payload;
  } catch (error) {
    // If it's already a NextResponse, re-throw it
    if (error instanceof NextResponse) {
      throw error;
    }

    // Log the error for debugging
    console.error('JWT verification error:', {
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      hasJWTSecret: !!JWT_SECRET,
      jwtSecretLength: JWT_SECRET?.length || 0,
    });

    // Handle JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      throw new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: `Invalid token: ${error.message}`,
          details: process.env.NODE_ENV === 'development' ? {
            errorName: error.name,
            hint: 'Check that JWT_SECRET matches the backend secret'
          } : undefined
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Token expired' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (error instanceof jwt.NotBeforeError) {
      throw new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Token not active yet' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    throw new NextResponse(
      JSON.stringify({ 
        error: 'Unauthorized', 
        message: error instanceof Error ? error.message : 'Authentication failed' 
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
