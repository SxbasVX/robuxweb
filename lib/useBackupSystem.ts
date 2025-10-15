import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase } from './supabaseClient';

interface BackupRecord {
  id: string;
  created_at: string;
  type: 'manual' | 'automatic';
  records_count: number;
  status: 'completed' | 'failed';
  file_name: string;
}

export function useBackupSystem() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [backupList, setBackupList] = useState<BackupRecord[]>([]);

  const createBackup = useCallback(async (type: 'manual' | 'automatic' = 'manual') => {
    if (isLoading) return { success: false, error: 'Backup en progreso' };

    setIsLoading(true);
    try {
      const supabase = getSupabase();
      const timestamp = new Date().toISOString();
      const backupId = crypto.randomUUID();

      const [posts, comments, students, users] = await Promise.all([
        supabase.from('posts').select('*').then(r => r.data || []),
        supabase.from('comentarios').select('*').then(r => r.data || []),
        supabase.from('students').select('*').then(r => r.data || []),
        supabase.from('users').select('*').then(r => r.data || [])
      ]);

      const totalRecords = posts.length + comments.length + students.length + users.length;

      const backupData = {
        metadata: { id: backupId, created_at: timestamp, version: '1.0' },
        data: { posts, comentarios: comments, students, users },
        statistics: { total_records: totalRecords }
      };

      const fileName = `backup_${timestamp.split('T')[0]}_${Date.now()}.json`;
      const backupJson = JSON.stringify(backupData, null, 2);

      const backup: BackupRecord = {
        id: backupId,
        created_at: timestamp,
        type,
        records_count: totalRecords,
        status: 'completed',
        file_name: fileName
      };

      // Guardar en localStorage
      const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
      const newHistory = [backup, ...history.slice(0, 9)];
      localStorage.setItem('backupHistory', JSON.stringify(newHistory));
      setBackupList(newHistory);
      setLastBackup(timestamp);

      // Guardar en Supabase (tabla backups)
      await supabase.from('backups').insert({
        id: backupId,
        created_at: timestamp,
        type,
        records_count: totalRecords,
        status: 'completed',
        file_name: fileName,
        backup_json: backupJson
      });

      // Descargar backup
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, data: { id: backupId, records: totalRecords, timestamp, fileName } };
    } catch (error) {
      return { success: false, error: 'Error al crear backup' };
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const getBackupStatus = useCallback(async () => {
    const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    if (history.length > 0) {
      setLastBackup(history[0].created_at);
      setBackupList(history);
    }
    return { success: true, lastBackup: history[0]?.created_at || null };
  }, []);

  const loadBackup = useCallback(async (backupId: string) => {
    const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    const backup = history.find((b: BackupRecord) => b.id === backupId);
    return backup ? { success: true, data: backup } : { success: false, error: 'Backup no encontrado' };
  }, []);

  const deleteBackup = useCallback((backupId: string) => {
    const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    const newHistory = history.filter((b: BackupRecord) => b.id !== backupId);
    localStorage.setItem('backupHistory', JSON.stringify(newHistory));
    setBackupList(newHistory);
    setLastBackup(newHistory[0]?.created_at || null);
  }, []);


  // Backup automático cada 24h
  const autoBackupTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    getBackupStatus();

    // Solo iniciar el timer una vez
    if (!autoBackupTimer.current) {
      autoBackupTimer.current = setInterval(() => {
        createBackup('automatic');
      }, 24 * 60 * 60 * 1000); // 24 horas
    }
    return () => {
      if (autoBackupTimer.current) clearInterval(autoBackupTimer.current);
    };
  }, [getBackupStatus, createBackup]);

  return {
    createBackup,
    getBackupStatus,
    loadBackup,
    deleteBackup,
    isLoading,
    lastBackup,
    backupList
  };
}