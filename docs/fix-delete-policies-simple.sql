-- Script ALTERNATIVO más simple para habilitar eliminación
-- Usar este si el script principal no funciona
-- Ejecutar en el SQL Editor de Supabase

-- OPCIÓN 1: Desactivar RLS temporalmente para depurar (NO RECOMENDADO PARA PRODUCCIÓN)
-- ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- OPCIÓN 2: Crear una política muy permisiva para admins (RECOMENDADO)
-- Primero, eliminar todas las políticas de DELETE existentes
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'posts' AND cmd = 'DELETE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON posts', pol.policyname);
    END LOOP;
END $$;

-- Crear una política simple que permita eliminar a usuarios autenticados
-- Ajusta según tus necesidades de seguridad
CREATE POLICY "Allow delete for authenticated users"
ON posts
FOR DELETE
TO authenticated
USING (true);  -- Permite a cualquier usuario autenticado eliminar

-- Si prefieres ser más restrictivo, usa esta alternativa:
/*
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON posts;

CREATE POLICY "Allow delete for specific roles"
ON posts
FOR DELETE
TO authenticated
USING (
  -- Verificar en la sesión de Supabase el rol del usuario
  (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
  OR
  (current_setting('request.jwt.claims', true)::json->>'role' = 'delegado')
  OR
  (autor = auth.uid())
);
*/

-- Verificar las políticas
SELECT * FROM pg_policies WHERE tablename = 'posts' AND cmd = 'DELETE';
