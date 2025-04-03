import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getUserCredentials } from "./getUserCredentials";

const BACKEND_URL = process.env.API_BASE_URL;
const MAX_TIME_REFRESH = 60 * 1000; // 1 minute before expiration

export default async function fetchWithCredentials(path, init = {}) {
  const cookieStore = cookies();
  const userCredentials = getUserCredentials({ cookies: cookieStore });

  if (!userCredentials) {
    return { message: "No credentials provided", statusCode: 401 };
  }

  const requestToFetch = makeFetch(path, userCredentials.access_token, init);

  // Check if the access token is about to expire
  const tokenExpires = new Date(userCredentials.expiresAt).getTime();
  if (tokenExpires - (Date.now() + MAX_TIME_REFRESH) < 0) {
    // Attempt to refresh the tokens
    const newTokens = await refresh(userCredentials.refresh_token);

    if ("access_token" in newTokens) {
      // Update the cookie with new tokens
      cookieStore.set('tokens', JSON.stringify(newTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: "/",
        expires: new Date(newTokens.expiresAt)
      });

      return await requestToFetch(newTokens.access_token);
    }

    // If token refresh fails, return the error response
    return newTokens;
  }

  // If the access token is still valid, proceed with the original request
  return requestToFetch();
}

async function refresh(refreshToken) {
  const response = await fetch(`${BACKEND_URL}/api/auth_service/refresh_token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  if (!response.ok) {
    return { error: "Failed to refresh token", statusCode: response.status };
  }

  return response.json();
}

function makeFetch(path, accessToken, init) {
  return async function (newAccessToken) {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${newAccessToken ?? accessToken}`,
      },
    });

    if (!response.ok) {
      return { error: "Request failed", statusCode: response.status };
    }

    return response.json();
  };
}