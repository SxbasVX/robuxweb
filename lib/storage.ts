import { getSupabase } from './supabaseClient';
import { getFileExt } from './utils';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function uploadFiles(
  groupId: number,
  files: File[],
  opts?: { postId?: string; userId?: string }
) {
  const urls: string[] = [];
  const supabase = getSupabase();
  
  for (const f of files) {
    if (f.size > MAX_BYTES) throw new Error('Archivo demasiado grande (>10MB)');
    const ext = getFileExt(f.name);
    if (!ext) throw new Error('Extensión no permitida');
    
    // Nombre simple - solo timestamp + extensión original
    const timestamp = Date.now();
    const fileName = `${timestamp}${ext}`;
    const path = `grupos/${groupId}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('grupos')
      .upload(path, f, { upsert: true });
    
    if (error) {
      throw new Error(`Error subiendo archivo: ${error.message}`);
    }
    
    const { data } = supabase.storage.from('grupos').getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  
  return urls;
}

// Back-compat wrapper
export async function uploadFilesForPost(groupId: number, postId: string, files: File[]) {
  return uploadFiles(groupId, files, { postId });
}
