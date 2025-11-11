-- Tabla para comentarios en trabajos de estudiantes
-- Soporta comentarios anónimos y con nombre opcional

create table if not exists public.student_comments (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,  -- ID del ensayo, video o evidencia
  item_type text not null check (item_type in ('essay', 'video', 'evidencia')),  -- Tipo de trabajo
  student_id uuid not null,  -- ID del estudiante dueño del trabajo
  group_id int not null check (group_id between 1 and 5),  -- Grupo
  autor uuid,  -- ID del usuario que comenta (null para anónimos)
  contenido text not null,  -- Contenido del comentario
  "autorNombre" text,  -- Nombre opcional del autor (null = anónimo)
  fecha bigint not null,  -- Timestamp del comentario
  created_at timestamp with time zone default now()
);

-- Índices para mejorar rendimiento
create index if not exists idx_student_comments_item on public.student_comments (item_id, item_type);
create index if not exists idx_student_comments_student on public.student_comments (student_id);
create index if not exists idx_student_comments_fecha on public.student_comments (fecha desc);

-- Habilitar RLS
alter table public.student_comments enable row level security;

-- Políticas de seguridad

-- Todos pueden leer comentarios (incluso anónimos)
drop policy if exists "comments readable" on public.student_comments;
create policy "comments readable" 
  on public.student_comments 
  for select 
  using (true);

-- Todos pueden insertar comentarios (incluso anónimos)
drop policy if exists "anyone can insert comments" on public.student_comments;
create policy "anyone can insert comments" 
  on public.student_comments 
  for insert 
  with check (true);

-- Usuarios autenticados pueden actualizar sus propios comentarios
drop policy if exists "auth can update own comments" on public.student_comments;
create policy "auth can update own comments" 
  on public.student_comments 
  for update 
  to authenticated 
  using (auth.uid() = autor AND autor IS NOT NULL) 
  with check (auth.uid() = autor AND autor IS NOT NULL);

-- Usuarios autenticados pueden eliminar sus propios comentarios
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
