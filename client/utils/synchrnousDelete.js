// synchrnousDelete.js
// handleDelete.js

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import logger from '@lib/logger';

/**
 * Handles a DELETE request to a specified service and method with optional query parameters.
 *
 * @param {string} service - The service name (e.g., 'user', 'course').
 * @param {string} method - The specific method or endpoint within the service.
 * @param {Object|null} [queryParams=null] - Optional query parameters to append to the URL.
 * @returns {Promise<NextResponse|Object>} - The parsed JSON response from the backend service,
 *                                           or a NextResponse error if something goes wrong.
 */
export async function handleDelete(service, method, body = null) {
  try {
    const sessionCookie = cookies().get('accessToken');
    if (!sessionCookie) {
      logger.error('Unauthorized: No session cookie found');
      return NextResponse.json(
        { error: 'Unauthorized: No session cookie found' },
        { status: 401 }
      );
    }

    // Assuming 'body' contains an '_id' property
    const _id = body?._id;
    if (!_id) {
      logger.error('Error: No ID provided for deletion');
      return NextResponse.json(
        { error: 'No ID provided for deletion' },
        { status: 400 }
      );
    }

    // Construct the URL by appending _id as a URL parameter
    let url = `${process.env.API_BASE_URL}/${service}/${method}?_id=${_id}`;
    logger.info(`DELETE Request URL: ${url}`);

    // Perform the DELETE request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    logger.error('Error in handleDelete:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
