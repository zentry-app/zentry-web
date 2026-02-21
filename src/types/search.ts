export type SearchCategory = 
  | 'usuarios' 
  | 'residenciales' 
  | 'areas_comunes' 
  | 'reservas' 
  | 'tags'
  | 'ingresos'
  | 'pagos'
  | 'guardias';

export interface SearchResult {
  id: string;
  type: SearchCategory;
  title: string;
  subtitle: string;
  metadata?: string;
  icon: string;
  href: string;
  residencialId?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  resultsByCategory: Record<SearchCategory, SearchResult[]>;
  totalResults: number;
  searchTime: number;
}

export interface SearchOptions {
  residencialId?: string;
  limit?: number;
  categories?: SearchCategory[];
}
