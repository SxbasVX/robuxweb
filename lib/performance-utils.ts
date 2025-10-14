// Hook optimizado para manejar datos con cache
import { useEffect, useRef, useState, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

export const dataCache = new DataCache();

// Hook para debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para throttle
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecRef = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastExecRef.current >= delay) {
        lastExecRef.current = now;
        return func(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastExecRef.current = Date.now();
          func(...args);
        }, delay - (now - lastExecRef.current));
      }
    }) as T,
    [func, delay]
  );
}

// Hook para intersection observer (lazy loading)
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
}