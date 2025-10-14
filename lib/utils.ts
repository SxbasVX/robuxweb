export function formatDate(ms: number) {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleString();
  }
}

export const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.mp4'] as const;
export type AcceptedExt = typeof ACCEPTED_EXTENSIONS[number];

export function getFileExt(name: string): AcceptedExt | null {
  const lower = name.toLowerCase();
  for (const ext of ACCEPTED_EXTENSIONS) if (lower.endsWith(ext)) return ext;
  return null;
}
