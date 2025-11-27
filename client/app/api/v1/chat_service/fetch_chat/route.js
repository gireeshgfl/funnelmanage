export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { extractServiceAndMethod } from '@utils/requestUtils';
import { handleGetRequest } from '@/utils/Gethandler';

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const params = {}
        params.id = id

        const { service, method } = await extractServiceAndMethod(url);

        // Call the async function to handle the post request
        const result = await handleGetRequest(service, method, params);

        // Assuming successful handling, respond with a 201 Created status
        if (result.status === 404) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        } else if (result.status === 401) {
            return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
        } else if (result.status && result.status >= 400) { // Catch other client errors
            return NextResponse.json({ error: result.error || 'Bad Request' }, { status: result.status });
        } else if (result.status && result.status >= 500) { // Catch server errors
            return NextResponse.json({ error: result.error || 'Internal Server Error' }, { status: result.status });
        } else {
            // Default success case, or if result doesn't have a status property
            return NextResponse.json(result, { status: 201 });
        }
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}