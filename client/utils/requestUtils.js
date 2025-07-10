import { NextResponse } from 'next/server';


export async function extractServiceAndMethod(url) {
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const service = pathParts[3];
    const method = pathParts[4];
    // console.log(service,method)    
    return { service, method };
}


export function isBodyEmpty(body) {
    return !body || Object.keys(body).length === 0;
}

export async function parseAndValidateBody(request) {
    let body = null;
    let error = null;

    try {
        // Try to parse the request body
        body = await request.json();
    } catch (parseError) {
        error = 'Invalid JSON format';
    }

    if (error) {
        return { body: null, error, response: NextResponse.json({ error }, { status: 400 }) };
    }

    // Check if the body is empty
    if (isBodyEmpty(body)) {
        error = 'Request body is required';
        return { body: null, error, response: NextResponse.json({ error }, { status: 400 }) };
    }

    return { body, error: null, response: null };
}
