export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { handleGetRequest } from '@utils/Gethandler';
import { extractServiceAndMethod } from '@utils/requestUtils';


export async function GET(request, { params }) {
    try {
        const url = new URL(request.url);
        const { service, method } = await extractServiceAndMethod(url);

        const result = await handleGetRequest(service, method);
        if (result.status === 200) {

            return NextResponse.json(result);
        } else if (result.status === 400) {
            return NextResponse.json({ error: result.error }, { status: 400 });
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