'use server'
import { jwtVerify} from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.SECRET_KEY);

export async function verifyToken(token) {
  console.log(token)
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}