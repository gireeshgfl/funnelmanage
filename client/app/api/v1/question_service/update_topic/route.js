export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { handleRequestComprehensive } from '@utils/auth/processrequest';
import { TopicUpdateSchema } from '@/utils/schema/session_schema';
import { handlePost } from '@/utils/synchrnousPost';

export async function PUT(request, { params }) {
  try {
    const result = await handleRequestComprehensive(request, TopicUpdateSchema);
    
    if (result instanceof NextResponse) {
      return result;
    }
    
    const { data, service, method } = result;
    
    // Handle the PUT request
    const putResult = await handlePost(data, service, method);
    
    return NextResponse.json(putResult, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}