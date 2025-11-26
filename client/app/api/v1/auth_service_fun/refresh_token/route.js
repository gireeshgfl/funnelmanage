// app/api/auth_service/refresh_token/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthRefreshRequest } from '@/utils/auth/authRequests';
import { extractServiceAndMethod } from '@/utils/requestUtils';
import logger from '@/lib/logger';
import { verifyToken } from '@/utils/auth/jwtUtils';

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const { service, method } = await extractServiceAndMethod(url);

    // Extract refresh token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const refreshToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!refreshToken) {
      logger.warn('Refresh token not found');
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    // Optionally verify the refresh token is still valid
    try {
      await verifyToken(refreshToken);
    } catch (err) {
      logger.warn('Refresh token invalid/expired:', err);
      return NextResponse.json(
        { error: 'Refresh token invalid or expired' },
        { status: 401 }
      );
    }

    // Call your backend or local logic to get a new pair of tokens
    const responseData = await AuthRefreshRequest(service, method, refreshToken);
    logger.info('Refresh response data:', responseData);

    if (!responseData.access_token || !responseData.refresh_token) {
      logger.error('Failed to refresh tokens');
      return NextResponse.json(
        { error: 'Failed to refresh tokens' },
        { status: 500 }
      );
    }

    // (Optional) decode the new access token to find its new expiry
    const payload = await verifyToken(responseData.access_token);

    // 15 minutes from now
    const accessTokenExpiry = 15 * 60;
    // 7 days
    const refreshTokenExpiry = 7 * 24 * 60 * 60;

    const cookieStore = await cookies();

    cookieStore.set('accessToken', responseData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTokenExpiry,
      path: '/',
    });

    if (responseData.refresh_token) {
      cookieStore.set('refreshToken', responseData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: refreshTokenExpiry,
        path: '/',
      });
    }

    // Return new tokens & expiration in JSON
    return NextResponse.json({
      access_token: responseData.access_token,
      refresh_token: responseData.refresh_token,
      access_token_expiry: accessTokenExpiry,
      refresh_token_expiry: refreshTokenExpiry
    });
  } catch (error) {
    logger.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional Next.js config
export const dynamic = 'force-dynamic';
