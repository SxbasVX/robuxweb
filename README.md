# Foro Interactivo

Foro en tiempo real con Next.js 14 (App Router), TypeScript, Tailwind, Framer Motion y Supabase (Auth, Postgres, Storage, Realtime).

## Requisitos de entorno
Crea un archivo `.env.local` en la raíz con:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Nota: Las claves públicas de Supabase son seguras para uso en cliente. No inicializamos el cliente en tiempo de compilación; se crea perezosamente en tiempo de ejecución.

## Configuración rápida
1) Instala dependencias
```
npm install
```
2) Inicializa la base de datos en Supabase
	- Abre el proyecto en Supabase y ve a SQL Editor.
	- Copia y ejecuta `docs/supabase-schema.sql` para crear tablas, RLS, índices y la función RPC `increment_reaction`.
	- En Database > Replication, habilita Realtime para las tablas `posts` y `comentarios`.
3) Crea el bucket de Storage
	- En Storage, crea un bucket llamado `grupos` (público).
	- Ajusta las políticas si deseas hacerlo privado y firmar URLs; por defecto el código usa URLs públicas.
4) Ejecuta en desarrollo
```
npm run dev
```
5) Compila para producción
```
npm run build
```

## Modelado de datos (Supabase)
- Tabla `users` (opcional, perfil/rol): `{ id uuid, email text, role 'usuario'|'delegado'|'admin', group 1..5 }`
- Tabla `posts`: `{ id uuid, autor uuid, rol, grupo 1..5, contenido text, archivos text[], reacciones jsonb, fechaCreacion bigint }`
- Tabla `comentarios`: `{ id uuid, postId uuid -> posts.id, grupo 1..5, autor uuid, contenido text, reacciones jsonb, fecha bigint }`
- Tabla `logs`: `{ id uuid, actor uuid, action text, target uuid, at bigint }`

Reacciones: se actualizan mediante la RPC `increment_reaction(p_table, p_id, p_emoji)` que incrementa un contador por emoji en el JSONB `reacciones`.

## Roles y permisos (app)
- usuario: ver, comentar, reaccionar
- delegado: publicar en su grupo asignado, adjuntar archivos
- admin: control total, asignar roles, ver logs

Las políticas RLS de ejemplo del script son un punto de partida; endurece según tus requisitos.

## Notas
- Subidas limitadas a 10MB y extensiones: .pdf .jpg .jpeg .png .gif .mp4
- Reacciones en tiempo real usando Supabase Realtime (postgres_changes)
- Diseño oscuro con glassmorphism