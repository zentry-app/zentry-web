/**
 * Utilidad de sanitización HTML para contenido de blog.
 * Usa sanitize-html en lugar de isomorphic-dompurify para evitar problemas con jsdom
 * en el entorno de build y runtime de Next.js/Vercel (ERR_REQUIRE_ESM, default-stylesheet.css).
 */
import sanitizeHtml from 'sanitize-html';

const BLOG_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'sub', 'sup',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'div', 'span',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'figure', 'figcaption',
  ],
  allowedAttributes: {
    'a': ['href', 'name', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
    'span': ['class'],
    'div': ['class'],
    'p': ['class'],
    'ul': ['class'],
    'ol': ['class'],
    'li': ['class'],
    'blockquote': ['class'],
    'h1': ['class'], 'h2': ['class'], 'h3': ['class'], 'h4': ['class'], 'h5': ['class'], 'h6': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },
};

export function sanitizeBlogContent(html: string): string {
  return sanitizeHtml(html || '', BLOG_SANITIZE_OPTIONS);
}
