-- Actualización de políticas para permitir comentarios anónimos
-- Ejecutar este script en el SQL Editor de Supabase

-- 0. Modificar la columna autor para permitir UUID nulo (opcional para anónimos)
alter table public.student_comments 
  alter column autor drop not null;

-- 1. Eliminar políticas antiguas
drop policy if exists "auth can insert comments" on public.student_comments;
drop policy if exists "anyone can insert comments" on public.student_comments;

-- 2. Crear nueva política que permite a TODOS insertar comentarios (incluso anónimos)
create policy "anyone can insert comments" 
  on public.student_comments 
  for insert 
  with check (true);

-- 3. Verificar que las demás políticas estén correctas
-- Todos pueden leer
drop policy if exists "comments readable" on public.student_comments;
create policy "comments readable" 
  on public.student_comments 
  for select 
  using (true);

-- Solo usuarios autenticados pueden actualizar/eliminar sus propios comentarios
drop policy if exists "auth can update own comments" on public.student_comments;
create policy "auth can update own comments" 
  on public.student_comments 
  for update 
  to authenticated 
  using (auth.uid() = autor AND autor IS NOT NULL) 
  with check (auth.uid() = autor AND autor IS NOT NULL);

drop policy if exists "auth can delete own comments" on public.student_comments;
create policy "auth can delete own comments" 
  on public.student_comments 
  for delete 
  to authenticated 
  using (auth.uid() = autor AND autor IS NOT NULL);

-- Admins pueden hacer todo
drop policy if exists "admins can do everything" on public.student_comments;
create policy "admins can do everything" 
  on public.student_comments 
  for all 
  to authenticated 
  using (
    exists (
      select 1 from public.users 
      where users.id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- Verificar que RLS esté habilitado
alter table public.student_comments enable row level security;

-- Mostrar políticas activas (para verificar)
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename = 'student_comments'
order by policyname;
