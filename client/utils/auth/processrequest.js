import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { extractServiceAndMethod } from '../requestUtils';

export function validateRequest(reqbody, schema) {
  // console.log('Validating request body:', reqbody);
  const response = schema.safeParse(reqbody);
  if (!response.success) {
    // console.error('Validation failed:', response.error.errors);
    return { success: false, errors: response.error.errors };
  }
  return { success: true, data: response.data };
}

export async function handleRequestComprehensive(request, schema) {
  try {
     // Check if schema is provided
     if (!schema) {
      console.error("Schema is undefined!");
      return NextResponse.json({ error: "Schema is not provided" }, { status: 500 });
    }
    // Validate session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('accessToken');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized: No session cookie found' }, { status: 401 });
    }

    // Parse URL
    const { pathname } = new URL(request.url);
    const pathParts = pathname.split('/').filter(Boolean);
    const service = pathParts[2];
    const method = pathParts[3];

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log(body)
      // console.log('Parsed body:', body);
      if (!body || Object.keys(body).length === 0) {
        throw new Error('Request body is required');
      }
    } catch (error) {
      console.error('Error parsing body:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Validate schema
    const validation = validateRequest(body, schema);
    if (!validation.success) {
      console.error('Validation error:', validation.errors);
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }


    // Return success object
    return {
      success: true,
      data: validation.data,
      service,
      method
    };

  } catch (error) {
    console.error('Error in handleRequestComprehensive:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
