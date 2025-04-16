export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { extractServiceAndMethod } from '@utils/requestUtils';
import { handleDeleteRequest } from '@/utils/Gethandler';

export async function DELETE(request) {
    try {
        const url = new URL(request.url);
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const params = {}
        params.id= id

        const { service, method } = await extractServiceAndMethod(url);
                
        // Call the async function to handle the post request
        const result = await handleDeleteRequest(service, method,params);

        // Assuming successful handling, respond with a 201 Created status
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}