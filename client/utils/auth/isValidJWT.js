export default async function isValidJWT(token) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables');
    return false;
  }

  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    // Verify the signature
    const data = `${headerB64}.${payloadB64}`;
    const signature = base64UrlDecode(signatureB64);
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(data)
    );

    if (!isValid) {
      return false;
    }

    // Check expiration
    const payload = JSON.parse(base64UrlDecode(payloadB64, true));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return false;
  }
}

function base64UrlDecode(str, toText = false) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = str.length % 4;
  if (padding) {
    str += '='.repeat(4 - padding);
  }
  const decoded = atob(str);
  if (toText) {
    return decoded;
  }
  const arr = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    arr[i] = decoded.charCodeAt(i);
  }
  return arr;
}

function base64UrlEncode(str) {
  return btoa(str)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}