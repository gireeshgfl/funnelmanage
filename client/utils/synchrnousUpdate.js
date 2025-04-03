import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import logger from '@lib/logger'; // Adjust the path as necessary

/**
 * Handles an UPDATE request using the HTTP PUT method.
 *
 * @param {Object|null} body - The JSON payload to send with the PUT request.
 * @param {string} service - The service name (e.g., 'user', 'course').
 * @param {string} method - The endpoint method name within the service.
 * @param {Object|null} queryParams - Optional query parameters to append to the URL.
 * @returns {Promise<Object|NextResponse>} - The parsed JSON response from the backend service,
 *                                           or a NextResponse error if something goes wrong.
 */
export async function handleUpdate(body = null, service, method, queryParams = null) {
  try {
    // 1. Retrieve the session cookie for authorization.
    const sessionCookie = cookies().get('accessToken');
    if (!sessionCookie) {
      logger.error('Unauthorized: No session cookie found');
      return NextResponse.json(
        { error: 'Unauthorized: No session cookie found' },
        { status: 401 }
      );
    }

    // 2. Build the URL using the base API URL, service, and method.
    let url = `${process.env.API_BASE_URL}/${service}/${method}`;
    if (queryParams) {
      // Convert query parameters to a query string and append to the URL.
      const queryString = new URLSearchParams(queryParams).toString();
      url += `?${queryString}`;
    }

    // 3. Log the details of the PUT request.
    logger.info(`PUT Request URL: ${url}`);
    logger.debug('PUT Request Body:', JSON.stringify(body));

    // 4. Perform the PUT request.
    const response = await fetch(url, {
      method: 'PUT', // Using the PUT method for update operations.
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
      // Stringify the body if provided.
      body: body ? JSON.stringify(body) : null,
    });

    // 5. Log the response details.
    logger.info(`Response Status: ${response.status}`);
    logger.debug(`Response OK: ${response.ok}`);

    // 6. Parse the JSON response data.
    const responseData = await response.json();
    logger.debug('Response Data:', JSON.stringify(responseData));

    // 7. Return the response data.
    return responseData;
  } catch (error) {
    // 8. Catch and log any errors, then return an error response.
    logger.error('Error in handleUpdate:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}