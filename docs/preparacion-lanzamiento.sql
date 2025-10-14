-- Eliminar todas las publicaciones, videos y evidencias
DELETE FROM posts;
DELETE FROM student_essays;
DELETE FROM videos_estudiantes;
DELETE FROM evidencias_estudiantes;

-- (Opcional) Reiniciar secuencias si usas SERIAL/IDENTITY
-- ALTER SEQUENCE posts_id_seq RESTART WITH 1;
-- ALTER SEQUENCE student_essays_id_seq RESTART WITH 1;
-- ALTER SEQUENCE videos_estudiantes_id_seq RESTART WITH 1;
-- ALTER SEQUENCE evidencias_estudiantes_id_seq RESTART WITH 1;

-- Verificar que todo está limpio
SELECT COUNT(*) AS total_posts FROM posts;
SELECT COUNT(*) AS total_essays FROM student_essays;
SELECT COUNT(*) AS total_videos FROM videos_estudiantes;
SELECT COUNT(*) AS total_evidencias FROM evidencias_estudiantes;

-- ¡Listo para lanzar en Vercel!