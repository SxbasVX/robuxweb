'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAdvancedSearch, type SearchFilters, type SearchResult } from '../lib/useAdvancedSearch';
import { useAuth } from '../lib/auth-context';

interface AdvancedSearchProps {
  className?: string;
  onResultClick?: (result: SearchResult) => void;
}

export default function AdvancedSearch({ className = '', onResultClick }: AdvancedSearchProps) {
  const { role } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    group: 'all',
    author: 'all',
    dateRange: 'all',
    status: 'all',
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const {
    search,
    results,
    loading,
    totalResults,
    searchHistory,
    clearHistory,
    getSuggestions
  } = useAdvancedSearch();

  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Buscar cuando cambien los filtros
  useEffect(() => {
    const debounce = setTimeout(() => {
      search(filters);
    }, 300);

    return () => clearTimeout(debounce);
  }, [filters, search]);

  // Actualizar sugerencias cuando cambie la query
  useEffect(() => {
    setSuggestions(getSuggestions(filters.query));
  }, [filters.query, getSuggestions]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFilters(prev => ({ ...prev, query: suggestion }));
    setShowSuggestions(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'post': return '📝';
      case 'comment': return '💬';
      case 'essay': return '📄';
      case 'student': return '👤';
      default: return '📋';
    }
  };

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'post': return 'Publicación';
      case 'comment': return 'Comentario';
      case 'essay': return 'Ensayo';
      case 'student': return 'Estudiante';
      default: return 'Resultado';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${Math.floor(diffInHours)} horas`;
    if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)} días`;
    return date.toLocaleDateString('es-ES');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de búsqueda principal */}
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => {
              handleFilterChange('query', e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Buscar publicaciones, comentarios, ensayos..."
            className="w-full px-4 py-3 pl-12 pr-20 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 rounded text-sm transition-colors ${
              showFilters 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Filtros
          </button>
        </div>

        {/* Sugerencias */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-gray-400 mb-2">Sugerencias</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded text-white text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
              {searchHistory.length > 0 && (
                <div className="border-t border-slate-600 mt-2 pt-2">
                  <button
                    onClick={clearHistory}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Limpiar historial
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Panel de filtros avanzados */}
      {showFilters && (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tipo de contenido */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value="all">Todo</option>
                <option value="posts">Publicaciones</option>
                <option value="comments">Comentarios</option>
                <option value="essays">Ensayos</option>
                {(role === 'admin' || role === 'delegado') && (
                  <option value="students">Estudiantes</option>
                )}
              </select>
            </div>

            {/* Grupo */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Grupo</label>
              <select
                value={filters.group}
                onChange={(e) => handleFilterChange('group', e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value="all">Todos los grupos</option>
                <option value="1">Grupo 1 - IA & ML</option>
                <option value="2">Grupo 2 - Energías Renovables</option>
                <option value="3">Grupo 3 - Telemedicina</option>
                <option value="4">Grupo 4 - Aprendizaje</option>
                <option value="5">Grupo 5 - Blockchain</option>
              </select>
            </div>

            {/* Rango de fecha */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Fecha</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value="all">Todo el tiempo</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="year">Este año</option>
              </select>
            </div>

            {/* Ordenar por */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ordenar</label>
              <div className="flex space-x-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value="relevance">Relevancia</option>
                  <option value="date">Fecha</option>
                  <option value="author">Autor</option>
                </select>
                <button
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm hover:bg-slate-600"
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Estado (solo para posts) */}
          {(filters.type === 'all' || filters.type === 'posts') && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Estado de publicación</label>
              <div className="flex space-x-4">
                {['all', 'published', 'draft'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="radio"
                      value={status}
                      checked={filters.status === status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">
                      {status === 'all' ? 'Todos' : status === 'published' ? 'Publicados' : 'Borradores'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicador de carga */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-400">Buscando...</span>
        </div>
      )}

      {/* Contador de resultados */}
      {!loading && filters.query && (
        <div className="text-sm text-gray-400">
          {totalResults === 0 
            ? 'No se encontraron resultados' 
            : `${totalResults} resultado${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''}`
          }
        </div>
      )}

      {/* Resultados */}
      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={`${result.type}-${result.id}`}
            onClick={() => onResultClick?.(result)}
            className="bg-slate-800/50 border border-slate-600/30 rounded-lg p-4 hover:bg-slate-700/50 cursor-pointer transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{getResultIcon(result.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs">
                    {getResultTypeLabel(result.type)}
                  </span>
                  {result.group && (
                    <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">
                      Grupo {result.group}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {formatDate(result.date)}
                  </span>
                </div>
                <h3 className="text-white font-medium mb-1 truncate">
                  {result.title}
                </h3>
                <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                  {result.content}
                </p>
                {result.highlights.length > 0 && (
                  <div className="space-y-1">
                    {result.highlights.map((highlight, index) => (
                      <div key={index} className="text-xs text-yellow-300 bg-yellow-600/20 px-2 py-1 rounded">
                        {highlight}
                      </div>
                    ))}
                  </div>
                )}
                {result.authorName && (
                  <div className="text-xs text-gray-500 mt-2">
                    Por: {result.authorName}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje si no hay resultados */}
      {!loading && filters.query && results.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium mb-2">No se encontraron resultados</h3>
          <p className="text-sm">
            Intenta con términos diferentes o ajusta los filtros de búsqueda
          </p>
        </div>
      )}
    </div>
  );
}