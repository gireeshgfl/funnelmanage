// app/api/auth_service/refresh_token/route.js
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
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
    let refreshToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    console.log('Initial Refresh Token from Header:', refreshToken);

    // If not in header, check cookies
    if (!refreshToken) {
      const cookieStore = await cookies();
      const refreshTokenCookie = cookieStore.get('refreshToken');
      console.log('Refresh Token Cookie:', refreshTokenCookie);
      if (refreshTokenCookie) {
        refreshToken = refreshTokenCookie.value;
      }
    }

    console.log('Final Refresh Token:', refreshToken);

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

    // Check if the backend returned an error or if the status is not 200
    if (responseData.error || (responseData.status && responseData.status !== 200)) {
      const status = responseData.status || 401;
      const message = responseData.error || 'Failed to refresh tokens';
      logger.warn(`Refresh failed with status ${status}: ${message}`);
      return NextResponse.json(
        { error: message },
        { status: status }
      );
    }

    if (!responseData.access_token || !responseData.refresh_token) {
      logger.error('Failed to refresh tokens: Missing tokens in response');
      return NextResponse.json(
        { error: 'Failed to refresh tokens' },
        { status: 500 }
      );
    }

    // (Optional) decode the new access token to find its new expiry
    const payload = await verifyToken(responseData.access_token);

    // 60 minutes from now
    const accessTokenExpiry = 60 * 60;
    // 7 days
    const refreshTokenExpiry = 7 * 24 * 60 * 60;

    // Return new tokens & expiration in JSON
    const response = NextResponse.json({
      access_token: responseData.access_token,
      refresh_token: responseData.refresh_token,
      access_token_expiry: accessTokenExpiry,
      refresh_token_expiry: refreshTokenExpiry
    });

    // Set the access token in cookies
    response.cookies.set({
      name: "accessToken",
      value: responseData.access_token,
      httpOnly: true,
      secure: false, // Matching signin route
      sameSite: 'strict',
      path: "/",
      maxAge: accessTokenExpiry,
    });

    // Set the refresh token in cookies
    response.cookies.set({
      name: 'refreshToken',
      value: responseData.refresh_token,
      httpOnly: true,
      secure: false, // Matching signin route
      sameSite: 'strict',
      path: "/",
      maxAge: refreshTokenExpiry,
    });

    return response;
  } catch (error) {
    logger.error('Error refreshing token:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: status }
    );
  }
}

// Optional Next.js config
export const dynamic = 'force-dynamic';
