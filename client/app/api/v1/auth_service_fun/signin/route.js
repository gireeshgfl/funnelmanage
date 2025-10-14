export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { AuthPostRequest } from '@/utils/auth/authRequests';
import { validateRequest } from '@/utils/validate';
import { extractServiceAndMethod, parseAndValidateBody } from '@/utils/requestUtils';
import { LoginSchema } from '@/utils/schema/auth_schema';
import { verifyToken } from '@/utils/auth/jwtUtils';
import logger from '@/lib/logger';
import { revalidatePath } from 'next/cache';

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const { service, method } = await extractServiceAndMethod(url);
    const { body, response } = await parseAndValidateBody(request);

    if (response) {
      return NextResponse.json({ message: 'Body not found', status: 400 }, { status: 400 });
    }

    body.role = role;
    const validation = validateRequest(body, LoginSchema);

    if (!validation.success) {
      logger.error('Validation error:', validation.errors);
      return NextResponse.json({ message: validation.errors[0].message, status: 400 }, { status: 400 });
    }

    const responseData = await AuthPostRequest(validation.data, service, method);
    logger.info('AuthPostRequest response data:', responseData);

    if (!responseData.access_token || !responseData.refresh_token) {
      logger.warn('Invalid credentials');
      return NextResponse.json({ message: 'Invalid credentials', status: 401 }, { status: 401 });
    }

    let payload = await verifyToken(responseData.access_token);
    let payload_refresh = await verifyToken(responseData.refresh_token);
    console.log(payload)
    console.log(payload_refresh)
    const roles = payload.roles[0];
    
    const result = NextResponse.json({ 
      message: 'Login successful', 
      status: 200,
      role: roles,
    }, { status: 200 });

    // Get the current timestamp in seconds
    const currentTime = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds

    // Calculate maxAge correctly
    const accessMaxAge = payload['exp'] - currentTime; // Time until expiration
    const refreshMaxAge = payload_refresh['exp'] - currentTime; // Time until expiration

    // Ensure maxAge is not negative (if exp time is in the past)
    const validAccessMaxAge = Math.max(accessMaxAge, 0);
    const validRefreshMaxAge = Math.max(refreshMaxAge, 0);

    // Set the access token in cookies
    result.cookies.set({
      name: "accessToken",
      value: responseData.access_token,
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: "/",
      maxAge: validAccessMaxAge,  // Now correctly set in seconds
    });

    // Set the refresh token in cookies with consistent 30 days expiry
    result.cookies.set({
      name: 'refreshToken',
      value: responseData.refresh_token,
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: "/",
      maxAge: validRefreshMaxAge,  // Now correctly set in seconds
    });

    logger.info('Tokens set in cookies successfully.');
    return result;
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred', status: 500 }, { status: 500 });
  }
}
