-- Script para agregar la columna avatar_url a las tablas users y estudiantes

-- Agregar columna avatar_url a la tabla users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Agregar columna avatar_url a la tabla estudiantes (si existe)
ALTER TABLE public.estudiantes 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Agregar índice para mejorar las búsquedas (opcional)
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON public.users(avatar_url);
CREATE INDEX IF NOT EXISTS idx_estudiantes_avatar_url ON public.estudiantes(avatar_url);

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'estudiantes') 
  AND column_name = 'avatar_url';
