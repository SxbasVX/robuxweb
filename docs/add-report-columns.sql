-- Agregar columnas para soportar múltiples archivos por ensayo
-- (ensayo principal + reporte de Turnitin)

ALTER TABLE student_essays 
ADD COLUMN IF NOT EXISTS essay_url TEXT,
ADD COLUMN IF NOT EXISTS essay_name TEXT,
ADD COLUMN IF NOT EXISTS report_url TEXT,
ADD COLUMN IF NOT EXISTS report_name TEXT;

-- Migrar datos existentes de file_url a essay_url
UPDATE student_essays 
SET essay_url = file_url,
    essay_name = SUBSTRING(file_url FROM '[^/]+$')
WHERE essay_url IS NULL AND file_url IS NOT NULL;

-- Comentario: 
-- essay_url: URL del ensayo principal
-- essay_name: Nombre del archivo del ensayo
-- report_url: URL del reporte de Turnitin (opcional)
-- report_name: Nombre del archivo del reporte (opcional)
-- file_url: Se mantiene por compatibilidad, apunta al mismo archivo que essay_url
