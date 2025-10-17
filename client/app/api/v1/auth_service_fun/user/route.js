import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth/jwtUtils';
export async function GET(request) {
  const token = request.cookies.get('accessToken')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const decoded = await verifyToken(token);
    return NextResponse.json({
      user_id: decoded.user_id,
      username: decoded.sub,
      email: decoded.email,
      role: decoded.roles[0],
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
}