import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function handleGetRequest(service, method, queryParams = null) {
  try {
    const sessionCookie = cookies().get('accessToken');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized: No session cookie found' }, { status: 401 });
    }
    // Construct the base URL
    let url = `${process.env.API_BASE_URL}/${service}/${method}`;
    console.log(url);
    // If queryParams is provided, convert the object to a query string and append it to the URL
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

    // Check if the response is not ok and return a JSON response with the status code
    if (response.status === 401) {
      const errorData = await response.json(); // Optionally extract error data if available
      return NextResponse.json({ error: errorData.message || 'An error occurred' }, { status: response.status });
    }

    const responseData = await response.json();
    return responseData // Return the response data as JSON
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


export async function handleDeleteRequest(service, method, queryParams = null) {
  console.timeLog(queryParams)
  try {
    const sessionCookie = cookies().get('accessToken');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized: No session cookie found' }, { status: 401 });
    }
    // Construct the base URL
    let url = `${process.env.API_BASE_URL}/${service}/${method}`;
    console.log(url);
    // If queryParams is provided, convert the object to a query string and append it to the URL
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

    // Check if the response is not ok and return a JSON response with the status code
    if (response.status === 401) {
      const errorData = await response.json(); // Optionally extract error data if available
      return NextResponse.json({ error: errorData.message || 'An error occurred' }, { status: response.status });
    }

    const responseData = await response.json();
    return responseData // Return the response data as JSON
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
