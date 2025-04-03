import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function AuthPostRequest(data, service, method) {
  try {
    // console.log('Type of data:', typeof data);
    // console.log('Data:', data);
    data.service = service;
    data.method = method;
    // Proceed with normal synchronous call
    const response = await fetch(`${process.env.API_BASE_URL}/get/${service}/${method}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function AuthGetRequest(service, method, token) {
  try {
    // console.log('Service:', service);
    // console.log('Method:', method);

    const sessionCookie = cookies().get('accessToken');
        
    if (!sessionCookie) {
        return NextResponse.json({ error: 'Unauthorized: No session cookie found' }, { status: 401 });
    }

    const sessionToken = sessionCookie.value;

    // Fetch data from the service
    const response = await fetch(`${process.env.API_BASE_URL}/get/${service}/${method}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json(); // Optionally extract error data if available
      return NextResponse.json({ error: errorData.message || 'An error occurred' }, { status: response.status });    }

    const responseData = await response.json();
    // console.log('Data from service:', responseData);

    return responseData;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function AuthRefreshRequest(service, method,refresh_token) {
  try {
    // Fetch data from the service
    const response = await fetch(`${process.env.API_BASE_URL}/get/${service}/${method}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${refresh_token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json(); // Optionally extract error data if available
      return NextResponse.json({ error: errorData.message || 'An error occurred' }, { status: response.status });      
    }

    const responseData = await response.json();
    console.log('Data from service:', responseData);

    return responseData;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}


export async function AuthSignOutRequest(service,method,refresh_token) {
  try {
    console.log(typeof(refresh_token),'ameen')
    // Send a POST request to sign out
    const response = await fetch(`${process.env.API_BASE_URL}/get/${service}/${method}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refresh_token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || 'An error occurred during sign-out' }, { status: response.status });
    }

    // If sign-out is successful, return a success response
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}


