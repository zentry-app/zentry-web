'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { SearchResponse } from '@/types/search';
import { SearchResultItem } from './search-result-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, SearchX } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResponse | null;
  isSearching: boolean;
  isOpen: boolean;
  onClose: () => void;
}

// Nombres amigables para las categorías
const categoryNames: Record<string, string> = {
  usuarios: 'Usuarios',
  residenciales: 'Residenciales',
  areas_comunes: 'Áreas Comunes',
  reservas: 'Reservas',
  tags: 'Tags',
  ingresos: 'Ingresos',
  pagos: 'Pagos',
  guardias: 'Guardias'
};

/**
 * Componente que muestra los resultados de búsqueda en un dropdown
 */
export function SearchResults({ results, isSearching, isOpen, onClose }: SearchResultsProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown de resultados */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute top-full left-0 right-0 mt-2 z-50 w-full"
      >
        <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl shadow-primary/10 dark:bg-card/95 dark:border-border/20 zentry:bg-white zentry:border-white/30 zentry:shadow-2xl">
          <ScrollArea className="max-h-[70vh]">
            <div className="p-2">
              {/* Estado de carga */}
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary zentry:text-primary" />
                  <span className="ml-2 text-sm font-semibold text-muted-foreground zentry:text-gray-900 zentry:font-bold">Buscando...</span>
                </div>
              )}

              {/* Sin resultados */}
              {!isSearching && results && results.totalResults === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <SearchX className="h-12 w-12 text-muted-foreground/50 mb-3 zentry:text-gray-500" />
                  <p className="text-sm font-bold text-foreground mb-1 zentry:text-gray-900 zentry:font-extrabold">
                    No se encontraron resultados
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground text-center zentry:text-gray-700 zentry:font-bold">
                    Intenta con otros términos de búsqueda
                  </p>
                </div>
              )}

              {/* Resultados agrupados por categoría */}
              {!isSearching && results && results.totalResults > 0 && (
                <div className="space-y-4">
                  {/* Header con total de resultados */}
                  <div className="px-4 pt-2 pb-1 border-b border-border/40 zentry:border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider zentry:text-gray-900 zentry:font-extrabold">
                        Resultados de búsqueda
                      </p>
                      <Badge variant="secondary" className="text-xs font-bold zentry:bg-primary zentry:text-white zentry:font-extrabold">
                        {results.totalResults} {results.totalResults === 1 ? 'resultado' : 'resultados'}
                      </Badge>
                    </div>
                    <p className="text-[0.65rem] text-muted-foreground/70 mt-1 zentry:text-gray-700 zentry:font-semibold">
                      Búsqueda completada en {results.searchTime}ms
                    </p>
                  </div>

                  {/* Categorías con resultados */}
                  <div className="space-y-3">
                    {Object.entries(results.resultsByCategory).map(([category, categoryResults]) => {
                      if (categoryResults.length === 0) return null;

                      return (
                        <div key={category} className="space-y-1">
                          {/* Header de categoría */}
                          <div className="px-4 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-foreground flex items-center gap-2 zentry:text-gray-900 zentry:font-extrabold">
                              {categoryNames[category] || category}
                              <Badge variant="outline" className="text-[0.6rem] h-5 font-bold zentry:border-gray-400 zentry:text-gray-900 zentry:bg-gray-100 zentry:font-extrabold">
                                {categoryResults.length}
                              </Badge>
                            </h3>
                          </div>

                          {/* Items de la categoría */}
                          <div className="space-y-1">
                            <AnimatePresence mode="popLayout">
                              {categoryResults.map((result) => (
                                <SearchResultItem
                                  key={result.id}
                                  result={result}
                                  onSelect={onClose}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </motion.div>
    </>
  );
}
