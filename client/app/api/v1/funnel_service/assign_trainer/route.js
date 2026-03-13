export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { handleRequestComprehensive } from '@utils/auth/processrequest';
import { AssignTrainerSchema } from '@utils/schema/session_schema';
import { handlePost } from '@utils/synchrnousPost';

export async function POST(request) {
    try {
        const result = await handleRequestComprehensive(request, AssignTrainerSchema);

        if (result instanceof NextResponse) {
            return result;
        }

        const { data, service, method } = result;

        const postResult = await handlePost(data, service, method);

        return NextResponse.json(postResult, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}