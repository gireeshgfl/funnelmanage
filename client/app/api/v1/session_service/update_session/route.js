export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { handleRequestComprehensive } from '@utils/auth/processrequest';
import { UpdateSessionSchema } from '@/utils/schema/session_schema';
import { handlePost } from '@/utils/synchrnousPost';
import eventBus from '@/utils/eventBus';

export async function PUT(request, { params }) {
  try {
    const result = await handleRequestComprehensive(request, UpdateSessionSchema);
    
    if (result instanceof NextResponse) {
      return result;
    }
    
    const { data, service, method } = result;
    
    const putResult = await handlePost(data, service, method);
    
    const updatedData = putResult.data;
    
    eventBus.emit('sessionUpdated', updatedData);
    
    return NextResponse.json(
      { 
        message: "Session updated successfully", 
        updatedSession: updatedData 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
