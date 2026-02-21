/**
 * Zentry Brand Context for AI Content Generation
 * 
 * Este archivo define el contexto de marca, tono y estilo
 * que la IA usará para generar contenido consistente.
 */

export const ZENTRY_BRAND_CONTEXT = {
    // Información de la empresa
    company: {
        name: "Zentry",
        tagline: "Gestión Residencial Inteligente",
        description: "Plataforma moderna de gestión para condominios y residenciales que integra control de acceso, pagos, reservas, comunicados y más en una sola solución.",
        mission: "Modernizar la administración de condominios mediante tecnología intuitiva y accesible",
        values: [
            "Innovación tecnológica",
            "Simplicidad y usabilidad",
            "Seguridad y confiabilidad",
            "Transparencia en la gestión",
            "Comunidad y conexión"
        ]
    },

    // Características principales
    features: [
        "Control de acceso digital con QR y tags NFC",
        "Sistema de pagos integrado",
        "Gestión de reservas de áreas comunes",
        "Comunicados y notificaciones push",
        "Panel de administración centralizado",
        "App móvil para residentes y administradores",
        "Reportes y estadísticas en tiempo real",
        "Gestión de guardias y personal",
        "Sistema de tickets de soporte",
        "Alertas de pánico y seguridad"
    ],

    // Público objetivo
    audience: {
        primary: "Administradores de condominios y residenciales",
        secondary: "Residentes de condominios modernos",
        personas: [
            {
                role: "Administrador",
                painPoints: [
                    "Gestión manual y desorganizada",
                    "Falta de transparencia en pagos",
                    "Comunicación ineficiente con residentes",
                    "Control de acceso obsoleto"
                ],
                goals: [
                    "Automatizar procesos administrativos",
                    "Mejorar comunicación con residentes",
                    "Aumentar transparencia financiera",
                    "Modernizar seguridad"
                ]
            },
            {
                role: "Residente",
                painPoints: [
                    "Procesos lentos y burocráticos",
                    "Falta de información oportuna",
                    "Dificultad para reservar áreas comunes",
                    "Pagos complicados"
                ],
                goals: [
                    "Acceso rápido y fácil",
                    "Información clara y oportuna",
                    "Pagos simples y seguros",
                    "Reservas convenientes"
                ]
            }
        ]
    },

    // Tono y estilo de escritura
    writingStyle: {
        tone: {
            primary: "Profesional pero accesible",
            characteristics: [
                "Claro y directo",
                "Moderno y tecnológico",
                "Amigable sin ser informal",
                "Educativo y útil",
                "Optimista sobre el futuro"
            ]
        },
        voice: {
            do: [
                "Usar ejemplos prácticos y casos de uso reales",
                "Explicar beneficios tangibles",
                "Incluir datos y estadísticas cuando sea relevante",
                "Hablar en segunda persona (tú/usted) cuando sea apropiado",
                "Usar lenguaje inclusivo",
                "Mencionar soluciones específicas de Zentry cuando sea relevante"
            ],
            dont: [
                "Usar jerga técnica sin explicación",
                "Ser demasiado formal o corporativo",
                "Hacer promesas exageradas",
                "Criticar directamente a la competencia",
                "Usar lenguaje negativo o alarmista"
            ]
        },
        formatting: {
            structure: [
                "Introducción clara que engancha",
                "Secciones bien definidas con H2/H3",
                "Listas para facilitar lectura",
                "Ejemplos concretos",
                "Call-to-action sutil al final"
            ],
            elements: [
                "Emojis moderados para énfasis (1-2 por sección)",
                "Negritas para conceptos clave",
                "Listas numeradas para pasos/procesos",
                "Listas con bullets para características/beneficios",
                "Citas o estadísticas destacadas"
            ]
        }
    },

    // Temas relevantes para el blog
    contentPillars: [
        {
            name: "Tecnología Residencial",
            topics: [
                "Control de acceso inteligente",
                "Domótica en condominios",
                "Apps móviles para residentes",
                "IoT en edificios",
                "Seguridad digital"
            ]
        },
        {
            name: "Gestión y Administración",
            topics: [
                "Mejores prácticas administrativas",
                "Transparencia financiera",
                "Comunicación efectiva",
                "Resolución de conflictos",
                "Cumplimiento normativo"
            ]
        },
        {
            name: "Comunidad y Convivencia",
            topics: [
                "Construcción de comunidad",
                "Eventos y actividades",
                "Sostenibilidad en condominios",
                "Bienestar de residentes",
                "Espacios comunes"
            ]
        },
        {
            name: "Tendencias e Innovación",
            topics: [
                "Futuro de la vivienda",
                "PropTech y Real Estate Tech",
                "Smart buildings",
                "Experiencias de usuario",
                "Casos de éxito"
            ]
        }
    ],

    // SEO y keywords
    seo: {
        primaryKeywords: [
            "gestión de condominios",
            "administración residencial",
            "control de acceso",
            "app para condominios",
            "software residencial"
        ],
        secondaryKeywords: [
            "tecnología para condominios",
            "modernización residencial",
            "seguridad en condominios",
            "pagos de mantenimiento",
            "comunicación con residentes"
        ]
    },

    // Ejemplos de artículos exitosos (para referencia de tono)
    exampleTitles: [
        "5 Tecnologías que Están Transformando la Gestión de Condominios en 2024",
        "Cómo Reducir Costos Administrativos con Automatización Inteligente",
        "Guía Completa: Implementar Control de Acceso Digital en tu Condominio",
        "De lo Tradicional a lo Digital: El Viaje de Modernización Residencial",
        "10 Señales de que tu Condominio Necesita Actualizar su Sistema de Gestión"
    ]
};

// Función para generar el prompt del sistema con contexto completo
export function generateSystemPrompt(tone: string, length: string): string {
    const context = ZENTRY_BRAND_CONTEXT;

    const wordCounts = {
        short: '500-800',
        medium: '1000-1500',
        long: '2000-3000'
    };

    return `Eres un escritor experto de contenido para ${context.company.name}, ${context.company.description}

## IDENTIDAD DE MARCA
- Misión: ${context.company.mission}
- Valores: ${context.company.values.join(', ')}
- Tono: ${context.writingStyle.tone.primary}

## CARACTERÍSTICAS DE ZENTRY
${context.features.map(f => `- ${f}`).join('\n')}

## AUDIENCIA
Escribes principalmente para ${context.audience.primary}, quienes buscan:
${context.audience.personas[0].goals.map(g => `- ${g}`).join('\n')}

## ESTILO DE ESCRITURA
**HACER:**
${context.writingStyle.voice.do.map(d => `✓ ${d}`).join('\n')}

**EVITAR:**
${context.writingStyle.voice.dont.map(d => `✗ ${d}`).join('\n')}

## ESTRUCTURA DEL CONTENIDO
${context.writingStyle.formatting.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## FORMATO DE SALIDA
Responde ÚNICAMENTE con un objeto JSON válido con esta estructura:
{
  "title": "Título atractivo, SEO-friendly, que prometa valor claro",
  "slug": "titulo-en-formato-url-amigable",
  "excerpt": "Resumen de 150-160 caracteres que enganche y describa el valor",
  "content": "Contenido HTML completo con <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "coverImagePrompt": "Descripción detallada para DALL-E: estilo moderno, minimalista, profesional",
  "metaTitle": "Título SEO (máx 60 caracteres)",
  "metaDescription": "Descripción SEO (máx 160 caracteres)"
}

## REQUISITOS DEL CONTENIDO
- Longitud: ${wordCounts[length as keyof typeof wordCounts]} palabras
- Tono: ${tone}
- Idioma: Español (México/Latinoamérica)
- HTML bien formado y semántico
- Incluir ejemplos prácticos
- Mencionar beneficios específicos de Zentry cuando sea relevante (sin ser promocional)
- Optimizado para SEO con keywords naturales
- Estructura clara con secciones bien definidas
- Call-to-action sutil al final

## KEYWORDS RELEVANTES
Primarias: ${context.seo.primaryKeywords.join(', ')}
Secundarias: ${context.seo.secondaryKeywords.join(', ')}

Genera contenido valioso, educativo y accionable que posicione a Zentry como líder de pensamiento en gestión residencial moderna.`;
}

// Función para generar el prompt del usuario con contexto adicional
export function generateUserPrompt(topic: string): string {
    const context = ZENTRY_BRAND_CONTEXT;

    return `Genera un artículo completo sobre: "${topic}"

## CONTEXTO ADICIONAL
Este artículo será publicado en el blog de ${context.company.name}, ${context.company.tagline}.

Nuestros lectores son principalmente ${context.audience.primary.toLowerCase()} que buscan soluciones prácticas y modernas para mejorar la gestión de sus propiedades.

## ENFOQUE DESEADO
- Proporciona valor real y accionable
- Usa ejemplos específicos del contexto de condominios/residenciales
- Si es relevante, menciona cómo la tecnología (como la que ofrece Zentry) puede ayudar
- Mantén un balance entre educación y promoción (80% educativo, 20% promocional)
- Incluye estadísticas o datos cuando sea posible (puedes usar datos generales de la industria)

## PILARES DE CONTENIDO RELEVANTES
${context.contentPillars.map(pillar => `- ${pillar.name}: ${pillar.topics.slice(0, 3).join(', ')}`).join('\n')}

Genera un artículo que sea informativo, útil y que posicione a Zentry como experto en el tema.`;
}

export default ZENTRY_BRAND_CONTEXT;
