-- Script para habilitar eliminación de posts para admins y delegados
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Primero, vamos a ver las políticas actuales (solo para referencia)
-- SELECT * FROM pg_policies WHERE tablename = 'posts';

-- 2. Eliminar la política de DELETE existente si hay alguna que esté bloqueando
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON posts;
DROP POLICY IF EXISTS "Allow delete for post owners" ON posts;

-- 3. Crear nueva política de DELETE que permita:
--    - Admins pueden eliminar cualquier post
--    - Delegados pueden eliminar posts de su propio grupo
--    - Usuarios pueden eliminar sus propios posts
CREATE POLICY "Enable delete for admins, delegados and owners"
ON posts
FOR DELETE
USING (
  -- Permitir si es admin
  (auth.uid() IN (SELECT id FROM usuarios WHERE role = 'admin'))
  OR
  -- Permitir si es delegado del mismo grupo
  (
    auth.uid() IN (SELECT id FROM usuarios WHERE role = 'delegado') 
    AND grupo IN (SELECT group FROM usuarios WHERE id = auth.uid())
  )
  OR
  -- Permitir si es el autor del post
  (autor = auth.uid())
);

-- 4. Verificar que la política de UPDATE también permita a admins y delegados
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;

CREATE POLICY "Enable update for admins, delegados and owners"
ON posts
FOR UPDATE
USING (
  -- Permitir si es admin
  (auth.uid() IN (SELECT id FROM usuarios WHERE role = 'admin'))
  OR
  -- Permitir si es delegado del mismo grupo
  (
    auth.uid() IN (SELECT id FROM usuarios WHERE role = 'delegado') 
    AND grupo IN (SELECT group FROM usuarios WHERE id = auth.uid())
  )
  OR
  -- Permitir si es el autor del post
  (autor = auth.uid())
)
WITH CHECK (
  -- Permitir si es admin
  (auth.uid() IN (SELECT id FROM usuarios WHERE role = 'admin'))
  OR
  -- Permitir si es delegado del mismo grupo
  (
    auth.uid() IN (SELECT id FROM usuarios WHERE role = 'delegado') 
    AND grupo IN (SELECT group FROM usuarios WHERE id = auth.uid())
  )
  OR
  -- Permitir si es el autor del post
  (autor = auth.uid())
);

-- 5. IMPORTANTE: Si estás usando la tabla 'estudiantes' en lugar de 'usuarios' para los posts
--    necesitarás ajustar las políticas. Descomenta y ajusta según tu esquema:

/*
-- Si los posts son creados por estudiantes y gestionados por usuarios admin/delegado:
DROP POLICY IF EXISTS "Enable delete for admins, delegados and owners" ON posts;

CREATE POLICY "Enable delete for admins and delegados"
ON posts
FOR DELETE
USING (
  -- Permitir si es admin (usuario con role admin)
  (auth.uid() IN (SELECT id FROM usuarios WHERE role = 'admin'))
  OR
  -- Permitir si es delegado del mismo grupo (usuario con role delegado)
  (
    auth.uid() IN (SELECT id FROM usuarios WHERE role = 'delegado' AND "group" = posts.grupo)
  )
  OR
  -- Permitir si es el estudiante autor
  (autor IN (SELECT id FROM estudiantes WHERE id = posts.autor))
);
*/

-- 6. Verificar las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'posts' 
ORDER BY policyname;
