export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { handleGetRequest } from '@utils/Gethandler';
import { extractServiceAndMethod } from '@utils/requestUtils';

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
        if (result.status === 200 || result.status === 201) { // Assuming 200 or 201 for success
            return NextResponse.json(result, { status: result.status });
        } else if (result.status === 404) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        } else if (result.status === 401) {
            return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
        } else {
            return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}