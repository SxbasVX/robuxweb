import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, postId, autor, contenido, autorNombre } = body;
    
    console.log('API: Insertando comentario', { groupId, postId, autor, autorNombre });
    
    // Crear cliente sin RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });
    
    const payload = {
      autor: autor.startsWith('anon_') ? '00000000-0000-0000-0000-000000000000' : autor,
      contenido: `${contenido}|||POST_ID:${postId}`,
      fecha: Date.now(),
      autorNombre: autorNombre || 'Usuario Anónimo',
      grupo: groupId,
      reacciones: {}
    };
    
    // Intentar inserción directa
    const { data, error } = await supabase
      .from('comentarios')
      .insert(payload)
      .select('id')
      .single();
    
    if (error) {
      console.error('API Error:', error);
      
      // Si falla por RLS, intentar con query SQL directo
      const { data: rawData, error: rawError } = await supabase.rpc('insert_comment', {
        p_autor: payload.autor,
        p_contenido: payload.contenido,
        p_fecha: payload.fecha,
        p_autor_nombre: payload.autorNombre,
        p_grupo: payload.grupo
      });
      
      if (rawError) {
        console.error('Raw query error:', rawError);
        return NextResponse.json({ error: `RLS Error: ${error.message}. Necesitas deshabilitar RLS en Supabase.` }, { status: 400 });
      }
      
      return NextResponse.json({ id: rawData, success: true });
    }
    
    console.log('API: Comentario insertado exitosamente:', data.id);
    return NextResponse.json({ id: data.id, success: true });
    
  } catch (error) {
    console.error('API Exception:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}