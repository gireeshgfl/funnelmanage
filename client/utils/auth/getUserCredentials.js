import { cookies } from 'next/headers';

export function getUserCredentials() {
  try {
    const cookieStore = cookies();
    
    const accessToken = cookieStore.get('accessToken');
    const refreshToken = cookieStore.get('refreshToken');

    if (!accessToken) {
      console.log('No access token cookie found');
      return null;
    }

    const credentials = {
      access_token: accessToken.value,
      refresh_token: refreshToken ? refreshToken.value : null,
      expiresAt: accessToken.expires ? new Date(accessToken.expires).toISOString() : null
    };

    // Validate the shape of the credentials object
    if (!credentials.access_token) {
      console.error('Invalid credentials structure in cookies');
      return null;
    }

    return credentials;
  } catch (error) {
    console.error('Error parsing user credentials from cookies:', error);
    return null;
  }
}