import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { postId, groupId, urls } = await req.json();
  if (!postId || !groupId || !Array.isArray(urls)) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const supabase = getSupabase();
  const { error } = await supabase.from('posts').update({ archivos: urls }).eq('id', postId).eq('grupo', groupId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
