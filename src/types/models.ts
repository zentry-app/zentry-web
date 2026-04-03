/**
 * Modelos de datos correspondientes al proyecto móvil Zentry
 * Estos modelos están diseñados para ser compatibles con la estructura
 * de datos utilizada en la aplicación móvil, sin requerir cambios en ella.
 */

export enum UserRole {
  Resident = "resident",
  Guard = "guard",
  Admin = "admin",
}

export interface UserModel {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: string;
  residencialId: string;
  residencialDocId: string;
  houseNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
  paternalLastName?: string;
  maternalLastName?: string;
  doNotDisturb?: boolean;
  doNotDisturbStart?: Date;
  doNotDisturbEnd?: Date;
  isGlobalAdmin?: boolean;
  managedResidencials?: string[];
}

export interface Residencial {
  id: string;
  nombre: string;
  name?: string;
  direccion: string;
  address?: string;
  ciudad?: string;
  city?: string;
  estado?: string;
  state?: string;
  codigoPostal?: string;
  postalCode?: string;
  pais?: string;
  country?: string;
  createdAt?: Date;
  updatedAt?: Date;
  adminIds?: string[];
  totalHouses?: number;
  datosFiscales?: {
    razonSocial?: string;
    rfc?: string;
    domicilioFiscal?: string;
  };
}

export interface AccessCode {
  id?: string;
  code: string;
  userId: string;
  residencialId: string;
  visitorName: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  validatedBy?: string;
  isOneTime: boolean;
}

export interface DrawerItem {
  label: string;
  route: string;
  icon: string;
}

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
}

export type BlogPostStatus = "draft" | "published" | "scheduled" | "archived";

export interface IBlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML content from Tiptap
  coverImage: string;
  author: {
    uid: string;
    name: string;
    photoURL?: string;
  };

  // Status & Publishing
  status: BlogPostStatus; // Granular status
  published: boolean; // Backward compatibility
  publishedAt?: Date | any | null;
  scheduledFor?: Date | any | null; // For scheduled posts
  createdAt?: Date | any | null;
  updatedAt?: Date | any | null;

  // Content & Metadata
  tags: string[];
  readTime: number; // in minutes
  featured?: boolean;
  wordCount?: number; // Auto-calculated

  // SEO Advanced
  seo?: {
    metaTitle?: string | null; // Falls back to title
    metaDescription?: string | null; // Falls back to excerpt
    canonicalUrl?: string | null;
    noindex?: boolean;
    nofollow?: boolean;
    ogImage?: string | null; // Falls back to coverImage
  };

  // AI & Embeddings
  content_for_ai?: string; // Clean text without HTML/emojis for embeddings
  embedding_id?: string; // Reference to vector DB

  // Versioning
  version?: number;
  lastEmbeddedAt?: Date | any;

  // Display Order
  order?: number; // Manual ordering on homepage
}
