'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGlobalSearch } from '@/hooks/use-global-search';
import { SearchResults } from './search-results';
import { cn } from '@/lib/utils';

/**
 * Componente de barra de búsqueda global con shortcut de teclado
 */
export function SearchBar() {
  const {
    query,
    setQuery,
    results,
    isSearching,
    isOpen,
    setIsOpen,
    clearSearch
  } = useGlobalSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Shortcut Cmd+K / Ctrl+K para enfocar búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // ESC para cerrar resultados
      if (e.key === 'Escape' && isOpen) {
        clearSearch();
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, clearSearch]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  const handleClear = () => {
    clearSearch();
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <motion.div
        className={cn(
          "relative transition-all duration-300",
          isOpen ? "scale-[1.02]" : "scale-100"
        )}
      >
        <div className="relative group">
          {/* Icono de búsqueda */}
          <Search 
            className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-300 z-10",
              isOpen 
                ? "text-primary scale-110 zentry:text-white" 
                : "text-muted-foreground/60 group-hover:text-muted-foreground dark:text-white/60 dark:group-hover:text-white zentry:text-white/60 zentry:group-hover:text-white"
            )} 
          />

          {/* Input */}
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuarios, áreas, reservas, tags..."
            className={cn(
              "w-full pl-11 pr-20 h-10 transition-all duration-300 border-none",
              isOpen
                ? "bg-background ring-2 ring-primary/20 shadow-lg shadow-primary/5 dark:bg-white/10 dark:text-white dark:ring-white/20 zentry:bg-white/20 zentry:text-white zentry:ring-white/30 zentry:placeholder:text-white/70"
                : "bg-muted/50 hover:bg-muted/80 dark:bg-white/10 dark:text-white dark:placeholder:text-white/40 dark:hover:bg-white/20 zentry:bg-white/10 zentry:text-white zentry:placeholder:text-white/60 zentry:hover:bg-white/20",
              "rounded-2xl text-sm"
            )}
            onFocus={() => {
              if (query.length >= 2) {
                setIsOpen(true);
              }
            }}
          />

          {/* Botones de la derecha */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Botón clear (solo si hay texto) */}
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClear}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  "hover:bg-muted/80 dark:hover:bg-white/10 zentry:hover:bg-white/20",
                  "text-muted-foreground dark:text-white/60 zentry:text-white/80"
                )}
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}

            {/* Badge de shortcut (solo cuando no está enfocado) */}
            {!isOpen && !query && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "hidden sm:flex items-center gap-1 px-2 py-1 rounded-md",
                  "bg-muted/50 dark:bg-white/10 zentry:bg-white/20",
                  "text-[0.65rem] font-medium text-muted-foreground dark:text-white/60 zentry:text-white/80"
                )}
              >
                <Command className="h-2.5 w-2.5" />
                <span>K</span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Resultados */}
      <SearchResults
        results={results}
        isSearching={isSearching}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          inputRef.current?.blur();
        }}
      />
    </div>
  );
}
