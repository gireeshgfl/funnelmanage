export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthSignOutRequest } from '@utils/auth/authRequests';
import { extractServiceAndMethod } from '@utils/requestUtils';

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const { service, method } = await extractServiceAndMethod(url);

    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refreshToken');  // Get the refresh token from cookies
    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token not found', status: 400 }, { status: 400 });
    }

    // Call the sign-out request with the extracted refresh token
    AuthSignOutRequest(service, method, refreshToken.value);  // No need to await this if you're not using its result here
    
    const response = NextResponse.json({
      message: 'Signed out successfully',
      status: 200
    });

    // Delete the cookies immediately by setting them to expire in the past
    response.cookies.set('accessToken', '', { expires: new Date(0) });
    response.cookies.set('refreshToken', '', { expires: new Date(0) });
    
    return response;
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred', status: 500 }, { status: 500 });
  }
}
