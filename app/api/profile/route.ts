import { NextResponse } from 'next/server';
import { ensureProfile, identityFromRequest, saveProfile } from '../../lib/server-profile';

export async function GET(request: Request) {
  try {
    const identity = await identityFromRequest(request);
    const profile = await ensureProfile(identity);
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const identity = await identityFromRequest(request);
    const body = await request.json();
    const profile = await saveProfile(identity, body);
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save profile';
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
}
