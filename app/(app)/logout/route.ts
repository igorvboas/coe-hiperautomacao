import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL('/login', request.url);
  // 303 força browser a fazer GET após POST
  return NextResponse.redirect(url, { status: 303 });
}
