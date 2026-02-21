'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Building, 
  Map, 
  BookOpen, 
  Tag, 
  ClipboardList,
  DollarSign,
  Shield
} from 'lucide-react';
import { SearchResult } from '@/types/search';
import { cn } from '@/lib/utils';

interface SearchResultItemProps {
  result: SearchResult;
  onSelect: () => void;
  isSelected?: boolean;
}

// Mapeo de iconos según el tipo de resultado
const iconMap = {
  usuarios: Users,
  residenciales: Building,
  areas_comunes: Map,
  reservas: BookOpen,
  tags: Tag,
  ingresos: ClipboardList,
  pagos: DollarSign,
  guardias: Shield
};

/**
 * Componente para un item individual de resultado de búsqueda
 */
export function SearchResultItem({ result, onSelect, isSelected }: SearchResultItemProps) {
  const router = useRouter();
  const Icon = iconMap[result.type] || ClipboardList;

  const handleClick = () => {
    router.push(result.href);
    onSelect();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
    >
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150 rounded-lg",
          "hover:bg-accent/50 dark:hover:bg-white/5 zentry:hover:bg-gray-100",
          isSelected && "bg-accent/50 dark:bg-white/5 zentry:bg-gray-100"
        )}
      >
        <div className={cn(
          "flex-shrink-0 mt-0.5 p-2 rounded-lg",
          "bg-primary/10 text-primary dark:bg-primary/20 zentry:bg-primary/10 zentry:text-primary"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate zentry:text-gray-900 zentry:font-bold">
              {result.title}
            </p>
            {result.metadata && (
              <span className="text-xs font-medium text-muted-foreground flex-shrink-0 mt-0.5 zentry:text-gray-700 zentry:font-semibold">
                {result.metadata}
              </span>
            )}
          </div>
          
          <p className="text-xs font-medium text-muted-foreground truncate zentry:text-gray-700 zentry:font-semibold">
            {result.subtitle}
          </p>
        </div>
      </button>
    </motion.div>
  );
}
