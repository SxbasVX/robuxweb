'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getSupabase } from './supabaseClient';
import { useAuth } from './auth-context';

export interface SearchFilters {
  query: string;
  type: 'all' | 'posts' | 'comments' | 'essays' | 'students';
  group: number | 'all';
  author: string | 'all';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  status: 'all' | 'published' | 'draft';
  sortBy: 'date' | 'relevance' | 'author' | 'group';
  sortOrder: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  type: 'post' | 'comment' | 'essay' | 'student';
  title: string;
  content: string;
  author: string;
  authorName?: string;
  group?: number;
  date: string;
  highlights: string[];
  score: number;
  metadata: Record<string, any>;
}

export function useAdvancedSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { user, role } = useAuth();

  const defaultFilters: SearchFilters = {
    query: '',
    type: 'all',
    group: 'all',
    author: 'all',
    dateRange: 'all',
    status: 'all',
    sortBy: 'relevance',
    sortOrder: 'desc'
  };

  // Cargar historial de búsqueda desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  // Función principal de búsqueda
  const search = useCallback(async (filters: SearchFilters) => {
    if (!filters.query.trim() && filters.type === 'all') {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      let allResults: SearchResult[] = [];

      // Búsqueda en posts
      if (filters.type === 'all' || filters.type === 'posts') {
        const { data: posts } = await supabase
          .from('posts')
          .select('*')
          .ilike('contenido', `%${filters.query}%`)
          .or(`titulo.ilike.%${filters.query}%`)
          .eq(filters.group !== 'all' ? 'grupo' : 'grupo', filters.group !== 'all' ? filters.group : undefined)
          .eq(filters.status !== 'all' ? 'status' : 'status', filters.status !== 'all' ? filters.status : undefined)
          .order('fechaCreacion', { ascending: filters.sortOrder === 'asc' })
          .limit(50);

        if (posts) {
          const postResults = posts.map(post => ({
            id: post.id,
            type: 'post' as const,
            title: post.titulo || 'Sin título',
            content: post.contenido,
            author: post.autor,
            authorName: post.autorNombre,
            group: post.grupo,
            date: new Date(post.fechaCreacion).toISOString(),
            highlights: getHighlights(post.contenido, filters.query),
            score: calculateRelevanceScore(post.contenido + ' ' + (post.titulo || ''), filters.query),
            metadata: {
              archivos: post.archivos,
              youtube_url: post.youtube_url,
              reacciones: post.reacciones
            }
          }));
          allResults.push(...postResults);
        }
      }

      // Búsqueda en comentarios
      if (filters.type === 'all' || filters.type === 'comments') {
        const { data: comments } = await supabase
          .from('comentarios')
          .select('*')
          .ilike('contenido', `%${filters.query}%`)
          .eq(filters.group !== 'all' ? 'grupo' : 'grupo', filters.group !== 'all' ? filters.group : undefined)
          .order('fecha', { ascending: filters.sortOrder === 'asc' })
          .limit(30);

        if (comments) {
          const commentResults = comments.map(comment => ({
            id: comment.id,
            type: 'comment' as const,
            title: 'Comentario',
            content: comment.contenido,
            author: comment.autor,
            authorName: comment.autorNombre,
            group: comment.grupo,
            date: new Date(comment.fecha).toISOString(),
            highlights: getHighlights(comment.contenido, filters.query),
            score: calculateRelevanceScore(comment.contenido, filters.query),
            metadata: {
              postId: comment.postId,
              reacciones: comment.reacciones
            }
          }));
          allResults.push(...commentResults);
        }
      }

      // Búsqueda en ensayos
      if (filters.type === 'all' || filters.type === 'essays') {
        const { data: essays } = await supabase
          .from('student_essays')
          .select('*')
          .ilike('title', `%${filters.query}%`)
          .or(`description.ilike.%${filters.query}%`)
          .order('uploaded_at', { ascending: filters.sortOrder === 'asc' })
          .limit(20);

        if (essays) {
          const essayResults = essays.map(essay => ({
            id: essay.id,
            type: 'essay' as const,
            title: essay.title,
            content: essay.description || '',
            author: essay.student_id,
            date: essay.uploaded_at,
            highlights: getHighlights(essay.title + ' ' + (essay.description || ''), filters.query),
            score: calculateRelevanceScore(essay.title + ' ' + (essay.description || ''), filters.query),
            metadata: {
              file_url: essay.file_url,
              category: essay.category
            }
          }));
          allResults.push(...essayResults);
        }
      }

      // Búsqueda en estudiantes (solo para admin/delegado)
      if ((filters.type === 'all' || filters.type === 'students') && (role === 'admin' || role === 'delegado')) {
        const { data: students } = await supabase
          .from('users')
          .select('*')
          .ilike('full_name', `%${filters.query}%`)
          .or(`email.ilike.%${filters.query}%`)
          .eq('role', 'usuario')
          .eq(filters.group !== 'all' ? 'group' : 'group', filters.group !== 'all' ? filters.group : undefined)
          .limit(20);

        if (students) {
          const studentResults = students.map(student => ({
            id: student.id,
            type: 'student' as const,
            title: student.full_name || student.email,
            content: student.email,
            author: student.id,
            group: student.group,
            date: student.created_at || new Date().toISOString(),
            highlights: getHighlights((student.full_name || '') + ' ' + student.email, filters.query),
            score: calculateRelevanceScore((student.full_name || '') + ' ' + student.email, filters.query),
            metadata: {
              role: student.role,
              group: student.group
            }
          }));
          allResults.push(...studentResults);
        }
      }

      // Ordenar por relevancia o fecha
      if (filters.sortBy === 'relevance') {
        allResults.sort((a, b) => filters.sortOrder === 'asc' ? a.score - b.score : b.score - a.score);
      } else if (filters.sortBy === 'date') {
        allResults.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
      }

      // Aplicar filtros de fecha
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let cutoffDate: Date;

        switch (filters.dateRange) {
          case 'today':
            cutoffDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            cutoffDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            cutoffDate = new Date(0);
        }

        allResults = allResults.filter(result => new Date(result.date) >= cutoffDate);
      }

      setResults(allResults);
      setTotalResults(allResults.length);

      // Guardar en historial si hay query
      if (filters.query.trim()) {
        saveToHistory(filters.query);
      }

    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [role]);

  // Función para obtener highlights del texto
  const getHighlights = (text: string, query: string): string[] => {
    if (!query.trim()) return [];

    const words = query.toLowerCase().split(/\s+/);
    const highlights: string[] = [];
    const textLower = text.toLowerCase();

    words.forEach(word => {
      const index = textLower.indexOf(word);
      if (index !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(text.length, index + word.length + 30);
        const snippet = text.substring(start, end);
        highlights.push('...' + snippet + '...');
      }
    });

    return highlights.slice(0, 3); // Máximo 3 highlights
  };

  // Función para calcular score de relevancia
  const calculateRelevanceScore = (text: string, query: string): number => {
    if (!query.trim()) return 0;

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/);

    let score = 0;

    // Coincidencia exacta de la query completa
    if (textLower.includes(queryLower)) {
      score += 100;
    }

    // Coincidencias de palabras individuales
    words.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * 10;
      }
    });

    // Penalizar por longitud del texto (textos más cortos son más relevantes)
    score = score / Math.log(text.length + 1);

    return score;
  };

  // Guardar en historial
  const saveToHistory = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const newHistory = [trimmedQuery, ...searchHistory.filter(q => q !== trimmedQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  // Limpiar historial
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search_history');
  };

  // Sugerencias de búsqueda
  const getSuggestions = (query: string): string[] => {
    if (!query.trim()) return searchHistory.slice(0, 5);

    const filtered = searchHistory.filter(item => 
      item.toLowerCase().includes(query.toLowerCase())
    );

    // Agregar sugerencias comunes
    const commonSuggestions = [
      'ensayos', 'videos', 'proyectos', 'inteligencia artificial',
      'energías renovables', 'telemedicina', 'blockchain', 'aprendizaje'
    ].filter(s => s.includes(query.toLowerCase()) && !filtered.includes(s));

    return [...filtered, ...commonSuggestions].slice(0, 5);
  };

  return {
    search,
    results,
    loading,
    totalResults,
    searchHistory,
    clearHistory,
    getSuggestions,
    defaultFilters
  };
}