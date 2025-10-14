export type Emoji = '👍' | '❤️' | '😂' | '🔥' | '😢';

export type ReactionMap = Partial<Record<Emoji, number>>;

export type Post = {
  id: string;
  autor: string; // uid or display name
  rol: 'usuario' | 'delegado' | 'admin';
  grupo: 1 | 2 | 3 | 4 | 5;
  titulo?: string;
  contenido: string;
  archivos: string[]; // URLs
  youtube_url?: string; // URL de YouTube
  google_drive_url?: string; // URL de Google Drive
  reacciones: ReactionMap;
  fechaCreacion: number; // ms
  autorNombre?: string;
  status?: 'draft' | 'published';
};

export type Comment = {
  id: string;
  autor: string;
  contenido: string;
  fecha: number;
  reacciones: ReactionMap;
  autorNombre?: string;
};
