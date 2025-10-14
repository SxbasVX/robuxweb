-- 1. Eliminar estudiantes normales de la tabla users (solo dejar admins y delegados)
DELETE FROM users WHERE role = 'usuario';

-- 2. Verificar que la tabla estudiantes contiene todos los estudiantes normales
-- (Si ya ejecutaste el script de creacion, este paso es solo informativo)
SELECT * FROM estudiantes;

-- 3. Crear política RLS para que solo admins y delegados puedan acceder a users
-- (Ejecuta esto en Supabase SQL Editor)
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Permitir solo lectura/escritura a admins y delegados
CREATE POLICY "Admins y Delegados pueden gestionar users" ON users
  FOR ALL
  USING (auth.role() = 'admin' OR auth.role() = 'delegado');

-- 4. (Opcional) Verificar que los trabajos y evidencias están vinculados a estudiantes
-- (Solo para revisión)
SELECT * FROM student_essays WHERE student_id NOT IN (SELECT id FROM estudiantes);
SELECT * FROM videos_estudiantes WHERE estudiante_id NOT IN (SELECT id FROM estudiantes);
SELECT * FROM evidencias_estudiantes WHERE estudiante_id NOT IN (SELECT id FROM estudiantes);

-- 5. (Opcional) Si necesitas migrar trabajos de usuarios a estudiantes, solicita el script específico.

-- ¡Listo! Ahora la gestión de estudiantes y sus trabajos es solo con la tabla estudiantes, y users queda para admins/delegados.