export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { AuthPostRequest } from '@/utils/auth_handler';
import { validateRequest } from '@/utils/validate';
import { extractServiceAndMethod } from '@/utils/requestUtils';
import { parseAndValidateBody } from '@/utils/requestUtils';
import { SignupSchema } from '@/utils/schema/auth_schema';

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const { service, method } = await extractServiceAndMethod(url);
    const { body, response } = await parseAndValidateBody(request);

    if (response) {
      return NextResponse.json({ message: 'Body not found' }, { status: 400 });
    }
    const validation = validateRequest(body, SignupSchema);

    if (!validation.success) {
      console.error('Validation error:', validation.errors);
      return NextResponse.json({ message: validation.errors[0].message }, { status: 400 });
    }

    const result = await AuthPostRequest(validation.data, service, method);

    return NextResponse.json({
      message: result.message || 'Signup successful',
      status: result.status
    }, { status: result.status });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred', status: 500 }, { status: 500 });
  }
}