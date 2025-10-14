-- Script para crear tabla de estudiantes y cargar todos los datos
-- Ejecutar este script completo en Supabase SQL Editor

-- 1. Crear tabla de estudiantes si no existe
CREATE TABLE IF NOT EXISTS estudiantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nombre_completo TEXT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    grupo INTEGER NOT NULL CHECK (grupo >= 1 AND grupo <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Limpiar tabla si existe
DELETE FROM estudiantes;

-- 3. Insertar todos los estudiantes nuevos
INSERT INTO estudiantes (codigo, nombre_completo, email, grupo) VALUES

-- GRUPO 1: Inteligencia Artificial y Machine Learning (6 estudiantes)
('25010238', 'Vilca Cruz Marsia Gianella Katherine', 'marsia.vilcac@unmsm.edu.pe', 1),
('25010282', 'Luna Viilca Sahara Dula', 'luna.vilcac@unmsm.edu.pe', 1),
('25010578', 'Romani Medina Nadit Liliana', 'nadit.romanim@unmsm.edu.pe', 1),
('25010236', 'Maza Morales Benjamin Pedro', 'benjamin.mazam@unmsm.edu.pe', 1),
('25010014', 'Damjanovic Burga Yenko Branko', 'yenko.damjanovicb@unmsm.edu.pe', 1),
('25010031', 'Navarro Cespedes Sunny Adriana', 'sunny.navarr.ocg@unmsm.edu.pe', 1),

-- GRUPO 2: Energías Renovables y Conservación (6 estudiantes)
('25010434', 'Palomino Huamani Judit Gabriela', 'judit.palominoh@unmsm.edu.pe', 2),
('25010007', 'Asuncion Pomasonco Allison Giselle', 'allison.asuncionp@unmsm.edu.pe', 2),
('25010126', 'Martinez Gomez Alvaro Jose', 'alvaro.martinezg@unmsm.edu.pe', 2),
('25010393', 'Yaranga Mejia Zharick Scarlett', 'zharick.yarangam@unmsm.edu.pe', 2),
('25010427', 'Maquera Mendoza Bryan Antony', 'bryan.maqueram@unmsm.edu.pe', 2),
('25010028', 'Luque Leayza David Mauricio', 'david.luquel@unmsm.edu.pe', 2),

-- GRUPO 3: Telemedicina y Aplicaciones Médicas (5 estudiantes)
('25010297', 'Quispe Abtao Jhack Hildibrahan', 'jhack.quispea@unmsm.edu.pe', 3),
('25010093', 'Reyes Mendieta Karla Fernanda', 'karla.reyesm@unmsm.edu.pe', 3),
('25010336', 'Hanampa Bellido Luz Berli', 'luz.hanampab@unmsm.edu.pe', 3),
('25010478', 'Gonzales Lopez Lulio Main', 'lulio.gonzalesl@unmsm.edu.pe', 3),
('25010149', 'Ballon Ramos Robert Andres', 'robert.ballonr@unmsm.edu.pe', 3),

-- GRUPO 4: Plataformas de Aprendizaje Interactivo (5 estudiantes)
('25010127', 'Martinez Lugue Claudia Alexandra', 'claudia.martinezl@unmsm.edu.pe', 4),
('20010327', 'Morales Damian Andrea Katherine', 'andrea.moralesd@unmsm.edu.pe', 4),
('25010330', 'Josue Osorio Anghely Cristal', 'anghely.josueo@unmsm.edu.pe', 4),
('25010360', 'Espinoza Cardeña Alessandra Abyael', 'alessandra.espinozac@unmsm.edu.pe', 4),
('25010687', 'Granada Juarez Alejandra', 'alejandra.granadaj@unmsm.edu.pe', 4),

-- GRUPO 5: Aplicaciones Descentralizadas y DeFi (7 estudiantes)
('25010473', 'Balbin Cueva Aaron', 'aaron.balbinc@unmsm.edu.pe', 5),
('25010353', 'Carrillo Castillo Brenda', 'brenda.carrilloc@unmsm.edu.pe', 5),
('25010240', 'Hurtado Dominguez Angel Valeria', 'angel.hurtadod@unmsm.edu.pe', 5),
('25010173', 'Marcelo Diego Francesco', 'francesco.marcelod@unmsm.edu.pe', 5),
('25010483', 'Medina Vera Arturo Alexis', 'arturo.medinav@unmsm.edu.pe', 5),
('25010486', 'Obregon Castro Jhesbelt Anadira', 'jhesbelt.obregonc@unmsm.edu.pe', 5),
('25010196', 'Ramon Ipushima Ilan Yefet', 'ilan.ramoni@unmsm.edu.pe', 5);

-- 4. Crear tabla de ensayos si no existe
CREATE TABLE IF NOT EXISTS ensayos_estudiantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    archivo_url TEXT,
    tipo_archivo VARCHAR(50) DEFAULT 'pdf',
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calificacion INTEGER CHECK (calificacion >= 0 AND calificacion <= 20),
    comentarios_profesor TEXT
);

-- 5. Crear tabla de videos si no existe
CREATE TABLE IF NOT EXISTS videos_estudiantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    video_url TEXT NOT NULL,
    tipo_video VARCHAR(20) DEFAULT 'youtube',
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duracion_minutos INTEGER,
    calificacion INTEGER CHECK (calificacion >= 0 AND calificacion <= 20)
);

-- 6. Crear tabla de evidencias si no existe
CREATE TABLE IF NOT EXISTS evidencias_estudiantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    archivo_url TEXT NOT NULL,
    tipo_evidencia VARCHAR(50) DEFAULT 'imagen',
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validado BOOLEAN DEFAULT FALSE
);

-- 7. Verificar que se creó todo correctamente
SELECT 'Estudiantes por grupo:' as reporte;
SELECT 
    grupo, 
    COUNT(*) as total_estudiantes,
    STRING_AGG(nombre_completo, ', ' ORDER BY nombre_completo) as nombres
FROM estudiantes 
GROUP BY grupo 
ORDER BY grupo;

SELECT 'Resumen total:' as reporte;
SELECT COUNT(*) as total_estudiantes FROM estudiantes;

SELECT 'Tablas creadas:' as reporte;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('estudiantes', 'ensayos_estudiantes', 'videos_estudiantes', 'evidencias_estudiantes');