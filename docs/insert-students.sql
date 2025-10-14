-- Script SQL para insertar todos los nuevos integrantes de grupos
-- Ejecutar este script en Supabase SQL Editor

-- Primero limpiar usuarios que no sean admin (opcional, comentar si no quieres borrar usuarios existentes)
DELETE FROM users WHERE role != 'admin';

-- Insertar todos los estudiantes nuevos con UUIDs generados automáticamente
INSERT INTO users (id, email, role, "group", full_name) VALUES

-- GRUPO 1: Inteligencia Artificial y Machine Learning (6 estudiantes)
(gen_random_uuid(), 'marsia.vilcac@unmsm.edu.pe', 'usuario', 1, 'Vilca Cruz Marsia Gianella Katherine'),
(gen_random_uuid(), 'luna.vilcac@unmsm.edu.pe', 'usuario', 1, 'Luna Viilca Sahara Dula'),
(gen_random_uuid(), 'nadit.romanim@unmsm.edu.pe', 'usuario', 1, 'Romani Medina Nadit Liliana'),
(gen_random_uuid(), 'benjamin.mazam@unmsm.edu.pe', 'usuario', 1, 'Maza Morales Benjamin Pedro'),
(gen_random_uuid(), 'yenko.damjanovicb@unmsm.edu.pe', 'usuario', 1, 'Damjanovic Burga Yenko Branko'),
(gen_random_uuid(), 'sunny.navarr.ocg@unmsm.edu.pe', 'usuario', 1, 'Navarro Cespedes Sunny Adriana'),

-- GRUPO 2: Energías Renovables y Conservación (6 estudiantes)
(gen_random_uuid(), 'judit.palominoh@unmsm.edu.pe', 'usuario', 2, 'Palomino Huamani Judit Gabriela'),
(gen_random_uuid(), 'allison.asuncionp@unmsm.edu.pe', 'usuario', 2, 'Asuncion Pomasonco Allison Giselle'),
(gen_random_uuid(), 'alvaro.martinezg@unmsm.edu.pe', 'usuario', 2, 'Martinez Gomez Alvaro Jose'),
(gen_random_uuid(), 'zharick.yarangam@unmsm.edu.pe', 'usuario', 2, 'Yaranga Mejia Zharick Scarlett'),
(gen_random_uuid(), 'bryan.maqueram@unmsm.edu.pe', 'usuario', 2, 'Maquera Mendoza Bryan Antony'),
(gen_random_uuid(), 'david.luquel@unmsm.edu.pe', 'usuario', 2, 'Luque Leayza David Mauricio'),

-- GRUPO 3: Telemedicina y Aplicaciones Médicas (5 estudiantes)
(gen_random_uuid(), 'jhack.quispea@unmsm.edu.pe', 'usuario', 3, 'Quispe Abtao Jhack Hildibrahan'),
(gen_random_uuid(), 'karla.reyesm@unmsm.edu.pe', 'usuario', 3, 'Reyes Mendieta Karla Fernanda'),
(gen_random_uuid(), 'luz.hanampab@unmsm.edu.pe', 'usuario', 3, 'Hanampa Bellido Luz Berli'),
(gen_random_uuid(), 'lulio.gonzalesl@unmsm.edu.pe', 'usuario', 3, 'Gonzales Lopez Lulio Main'),
(gen_random_uuid(), 'robert.ballonr@unmsm.edu.pe', 'usuario', 3, 'Ballon Ramos Robert Andres'),

-- GRUPO 4: Plataformas de Aprendizaje Interactivo (5 estudiantes)
(gen_random_uuid(), 'claudia.martinezl@unmsm.edu.pe', 'usuario', 4, 'Martinez Lugue Claudia Alexandra'),
(gen_random_uuid(), 'andrea.moralesd@unmsm.edu.pe', 'usuario', 4, 'Morales Damian Andrea Katherine'),
(gen_random_uuid(), 'anghely.josueo@unmsm.edu.pe', 'usuario', 4, 'Josue Osorio Anghely Cristal'),
(gen_random_uuid(), 'alessandra.espinozac@unmsm.edu.pe', 'usuario', 4, 'Espinoza Cardeña Alessandra Abyael'),
(gen_random_uuid(), 'alejandra.granadaj@unmsm.edu.pe', 'usuario', 4, 'Granada Juarez Alejandra'),

-- GRUPO 5: Aplicaciones Descentralizadas y DeFi (7 estudiantes)
(gen_random_uuid(), 'aaron.balbinc@unmsm.edu.pe', 'usuario', 5, 'Balbin Cueva Aaron'),
(gen_random_uuid(), 'brenda.carrilloc@unmsm.edu.pe', 'usuario', 5, 'Carrillo Castillo Brenda'),
(gen_random_uuid(), 'angel.hurtadod@unmsm.edu.pe', 'usuario', 5, 'Hurtado Dominguez Angel Valeria'),
(gen_random_uuid(), 'francesco.marcelod@unmsm.edu.pe', 'usuario', 5, 'Marcelo Diego Francesco'),
(gen_random_uuid(), 'arturo.medinav@unmsm.edu.pe', 'usuario', 5, 'Medina Vera Arturo Alexis'),
(gen_random_uuid(), 'jhesbelt.obregonc@unmsm.edu.pe', 'usuario', 5, 'Obregon Castro Jhesbelt Anadira'),
(gen_random_uuid(), 'ilan.ramoni@unmsm.edu.pe', 'usuario', 5, 'Ramon Ipushima Ilan Yefet');

-- Verificar que se insertaron correctamente
SELECT 
    "group", 
    COUNT(*) as total_estudiantes,
    STRING_AGG(full_name, ', ' ORDER BY full_name) as nombres
FROM users 
WHERE role = 'usuario' 
GROUP BY "group" 
ORDER BY "group";

-- Mostrar resumen total
SELECT 
    role,
    COUNT(*) as total
FROM users 
GROUP BY role;