// handlePost.js

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import logger from '@lib/logger'; // Adjust the path as necessary

/**
 * Handles a POST request to a specified service and method with optional query parameters and request body.
 *
 * @param {string} service - The service name (e.g., 'user', 'course').
 * @param {string} method - The specific method or endpoint within the service.
 * @param {Object} [body=null] - The JSON body to send with the POST request.
 * @param {Object} [queryParams=null] - Optional query parameters to append to the URL.
 * @returns {Promise<NextResponse>} - The JSON response from the backend service.
 */
export async function handlePost(body = null,service, method,queryParams = null) {
  try {
    const cookieStore = await cookies(); 
    const sessionCookie = cookieStore().get('accessToken');
    if (!sessionCookie) {
      logger.error('Unauthorized: No session cookie found');
      return NextResponse.json(
        { error: 'Unauthorized: No session cookie found' },
        { status: 401 }
      );
    }

    let url = `${process.env.API_BASE_URL}/${service}/${method}`;
    if (queryParams) {
      const queryString = new URLSearchParams(queryParams).toString();
      url += `?${queryString}`;
    }

    logger.info(`POST Request URL: ${url}`);
    logger.debug('POST Request Body:', JSON.stringify(body));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : null,
    });

    logger.info(`Response Status: ${response.status}`);
    logger.debug(`Response OK: ${response.ok}`);

    const responseData = await response.json();
    logger.debug('Response Data:', JSON.stringify(responseData));

    return responseData
  } catch (error) {
    logger.error('Error in handlePost:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
