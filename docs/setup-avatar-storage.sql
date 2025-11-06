-- Script para configurar el bucket de storage para avatares

-- Políticas de storage para el bucket 'avatars'
-- Permitir que usuarios autenticados suban archivos
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Permitir que usuarios autenticados actualicen sus propios avatares
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Permitir que usuarios autenticados eliminen sus propios avatares
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Permitir lectura pública de avatares
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Verificar políticas
SELECT * FROM storage.policies WHERE bucket_id = 'avatars';
