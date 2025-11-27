import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function handleGetRequest(service, method, queryParams = null) {
  try {
    const cookieStore = await cookies(); // ✅ FIX: await cookies()
    const sessionCookie = cookieStore.get('accessToken');

    if (!sessionCookie) {
      return { error: 'Unauthorized: No session cookie found', status: 401 };
    }

    // Construct the base URL
    let url = `${process.env.API_BASE_URL}/${service}/${method}`;
    console.log(url);

    // If queryParams is provided, convert to query string
    if (queryParams) {
      const queryString = new URLSearchParams(queryParams).toString();
      url += `?${queryString}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionCookie.value}`,
      },
    });

    if (response.status === 401) {
      const errorData = await response.json();
      return { error: errorData.message || 'An error occurred', status: 401 };
    }

    if (response.status === 204) {
      return { status: 204 };
    }

    const responseData = await response.json();
    return responseData;

  } catch (error) {
    console.error('Error:', error);
    return { error: error.message || 'Internal Server Error', status: 500 };
  }
}

export async function handleDeleteRequest(service, method, queryParams = null) {
  try {
    const cookieStore = await cookies(); // ✅ FIX: await cookies()
    const sessionCookie = cookieStore.get('accessToken');

    if (!sessionCookie) {
      return { error: 'Unauthorized: No session cookie found', status: 401 };
    }

    // Construct the base URL
    let url = `${process.env.API_BASE_URL}/${service}/${method}`;
    console.log(url);

    if (queryParams) {
      const queryString = new URLSearchParams(queryParams).toString();
      url += `?${queryString}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionCookie.value}`,
      },
    });

    if (response.status === 401) {
      const errorData = await response.json();
      return { error: errorData.message || 'An error occurred', status: 401 };
    }

    if (response.status === 204) {
      return { status: 204 };
    }

    const responseData = await response.json();
    return responseData;

  } catch (error) {
    console.error('Error:', error);
    return { error: error.message || 'Internal Server Error', status: 500 };
  }
}
