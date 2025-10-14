-- Supabase schema for the forum app
-- Run this in the SQL editor of your Supabase project

-- =============================================================
-- DESARROLLO: Deshabilitar RLS temporalmente
-- =============================================================
-- UNCOMMENT estas líneas para desarrollo (sin RLS):
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs DISABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comentarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;
GRANT SELECT, INSERT ON TABLE public.logs TO authenticated;
SELECT pg_notify('pgrst', 'reload schema');
-- =============================================================

-- Users table (optional mirror of auth.users data you care about)
create table if not exists public.users (
  id uuid primary key,
  email text,
  role text check (role in ('usuario','delegado','admin')) not null default 'usuario',
  "group" int check ("group" between 1 and 5)
);

-- Posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null,
  rol text not null check (rol in ('usuario','delegado','admin')),
  grupo int not null check (grupo between 1 and 5),
  "titulo" text not null default '',
  contenido text not null,
  archivos text[] not null default '{}',
  reacciones jsonb not null default '{}',
  "fechaCreacion" bigint not null,
  "autorNombre" text
);

-- Comments
create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  postId uuid not null references public.posts(id) on delete cascade,
  grupo int not null check (grupo between 1 and 5),
  autor uuid not null,
  contenido text not null,
  reacciones jsonb not null default '{}',
  fecha bigint not null,
  "autorNombre" text
);

-- In case tables already existed without the optional name columns, add them.
alter table if exists public.posts add column if not exists "autorNombre" text;
alter table if exists public.posts add column if not exists "titulo" text not null default '';
alter table if exists public.comentarios add column if not exists "autorNombre" text;

-- Optional workflow: allow draft uploads by any authenticated user
alter table if exists public.posts add column if not exists status text not null default 'draft' check (status in ('draft','published'));

-- Logs for admin actions
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  target uuid,
  at bigint not null
);

-- Helpful index
create index if not exists idx_posts_grupo_fecha on public.posts (grupo, "fechaCreacion" desc);
create index if not exists idx_comments_post on public.comentarios (postId);

-- RLS (adjust as needed)
-- PRODUCCIÓN: Habilitar RLS y políticas
alter table public.posts enable row level security;
alter table public.comentarios enable row level security;
alter table public.users enable row level security;
alter table public.logs enable row level security;

-- NOTE: RLS is ENABLED above for production. The statements below create
-- the full policy set. For development, use the DISABLE block at the top.

-- Optional (commented): If you keep RLS disabled, PostgREST will use SQL GRANTs.
-- By default, anon/authenticated roles may not have table privileges.
-- Uncomment the GRANTs you want to allow for signed-in users. This makes
-- every authenticated user able to perform these actions on ALL rows.
-- USE WITH CARE in production.
--
-- grant usage on schema public to authenticated;
-- grant select, insert, update, delete on table public.posts to authenticated;
-- grant select, insert, update, delete on table public.comentarios to authenticated;
-- grant select, insert, update, delete on table public.users to authenticated;
-- grant select, insert on table public.logs to authenticated;

-- Basic policies (production mode with RLS)
drop policy if exists "posts readable" on public.posts;
drop policy if exists "comments readable" on public.comentarios;
drop policy if exists "users readable" on public.users;
drop policy if exists "logs readable" on public.logs;
-- Lectura: publicados para todos; borradores solo autor o admin
create policy "posts readable" on public.posts
for select
using (
  status = 'published'
  or auth.uid() = autor
  or exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
  )
);
create policy "comments readable" on public.comentarios for select using (true);
create policy "users readable" on public.users for select using (true);
create policy "logs readable" on public.logs for select using (true);

-- Insert/update policies allowing authenticated users
drop policy if exists "auth can insert posts" on public.posts;
drop policy if exists "auth can update own posts" on public.posts;
-- 1) Permite a cualquier usuario autenticado crear un borrador (sin exigir grupo/rol); útil para subir archivos primero
create policy "auth can insert posts" on public.posts
for insert to authenticated
with check (auth.uid() = autor);
-- 2) Solo admin o delegado del grupo pueden publicar (status='published') o cambiar grupo/rol
create policy "auth can update own posts" on public.posts
for update to authenticated
using (auth.uid() = autor)
with check (
  (
    status = 'draft'
  ) or (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'delegado' and u."group" = grupo)
  )
);

drop policy if exists "auth can insert comments" on public.comentarios;
drop policy if exists "auth can update own comments" on public.comentarios;
create policy "auth can insert comments" on public.comentarios for insert to authenticated with check (auth.uid() = autor);
create policy "auth can update own comments" on public.comentarios for update to authenticated using (auth.uid() = autor) with check (auth.uid() = autor);

drop policy if exists "auth can read/write users self" on public.users;
drop policy if exists "auth upsert self" on public.users;
drop policy if exists "auth update self" on public.users;
create policy "auth can read/write users self" on public.users for select using (auth.uid() = id);
create policy "auth upsert self" on public.users for insert with check (auth.uid() = id);
create policy "auth update self" on public.users for update using (auth.uid() = id);

-- Admin policy example (assign a Supabase role to admin users in JWT or create a separate mechanism)
-- For simplicity, allow any authenticated to read logs, only authenticated to insert
drop policy if exists "auth can insert logs" on public.logs;
create policy "auth can insert logs" on public.logs for insert to authenticated with check (true);

-- Allow admins to update any user (for AdminPanel role management)
drop policy if exists "admin can update users" on public.users;
create policy "admin can update users" on public.users for update to authenticated
using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
) with check (true);

-- Explicit admin insert policy to avoid ambiguity
drop policy if exists "admin can insert posts (simple)" on public.posts;
create policy "admin can insert posts (simple)"
on public.posts
for insert to authenticated
with check (
  auth.uid() = autor and exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
  )
);

-- Admin can update/delete any post (management override)
drop policy if exists "admin can update posts" on public.posts;
create policy "admin can update posts"
on public.posts
for update to authenticated
using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
) with check (true);

drop policy if exists "admin can delete posts" on public.posts;
create policy "admin can delete posts"
on public.posts
for delete to authenticated
using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

-- RPC to increment reactions in a JSONB map
create or replace function public.increment_reaction(
  p_table text,
  p_id uuid,
  p_emoji text
) returns void as $$
declare
  sql text;
begin
  if p_table not in ('posts','comentarios') then
    raise exception 'invalid table %', p_table;
  end if;
  sql := format('update public.%I set reacciones = coalesce(reacciones, ''{}''::jsonb) || jsonb_build_object(%L, coalesce((reacciones->>%L)::int, 0) + 1) where id = %L',
                 p_table, p_emoji, p_emoji, p_id::text);
  execute sql;
end; $$ language plpgsql security definer;

-- Realtime: Supabase Realtime listens to postgres changes automatically when enabled on the table.
-- Enable Realtime for posts and comentarios in Database > Replication.

-- Refresh PostgREST schema cache so new columns (e.g., titulo, autorNombre) are recognized immediately
select pg_notify('pgrst', 'reload schema');

-- =============================================================
-- ALTERNATIVA: Políticas simples por autor (OWNER-BASED)
-- -------------------------------------------------------------
-- Usa este bloque si prefieres que cualquier usuario autenticado
-- pueda crear/editar SUS posts (autor = auth.uid()) sin depender
-- de role/group. Mantén los overrides de admin.
--
-- INSTRUCCIONES:
-- 1) Ejecuta los DROP y CREATE de abajo.
-- 2) Ejecuta de nuevo: select pg_notify('pgrst','reload schema');
-- 3) Si quieres volver al modo por roles/grupo, re-ejecuta el bloque
--    principal de políticas de arriba.
-- -------------------------------------------------------------
-- drop policy if exists "auth can insert posts" on public.posts;
-- drop policy if exists "auth can update own posts" on public.posts;
-- drop policy if exists "admin can insert posts (simple)" on public.posts;
-- create policy "owner can insert posts"
-- on public.posts
-- for insert to authenticated
-- with check (auth.uid() = autor);
-- create policy "owner can update posts"
-- on public.posts
-- for update to authenticated
-- using (auth.uid() = autor)
-- with check (auth.uid() = autor);
-- -- Overrides de admin (actualiza/borrar cualquier post):
-- drop policy if exists "admin can update posts" on public.posts;
-- create policy "admin can update posts"
-- on public.posts
-- for update to authenticated
-- using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
-- with check (true);
-- drop policy if exists "admin can delete posts" on public.posts;
-- create policy "admin can delete posts"
-- on public.posts
-- for delete to authenticated
-- using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));
-- select pg_notify('pgrst', 'reload schema');
