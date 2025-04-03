import { jwtVerify } from 'jose';

export async function verifyToken(token) {
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      user_id: payload.user_id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      status: payload.status
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid token');
  }
}