import { NextRequest, NextResponse } from 'next/server';
import { generateSystemPrompt, generateUserPrompt } from '@/lib/ai/zentry-context';
import { adminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

interface GenerateBlogRequest {
    topic: string;
    tone?: 'professional' | 'casual' | 'technical' | 'friendly';
    length?: 'short' | 'medium' | 'long';
    language?: 'es' | 'en';
    includeImages?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        // Verificar autenticación
        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
        }

        const idToken = authorization.split('Bearer ')[1];

        if (!adminAuth) {
            return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const { admin, superadmin, isAdmin } = decodedToken;

        // Solo administradores pueden generar contenido
        if (!admin && !superadmin && !isAdmin) {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const { topic, tone = 'professional', length = 'medium', language = 'es', includeImages = true }: GenerateBlogRequest = await req.json();

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        // Generar prompts con contexto completo de Zentry
        const systemPrompt = generateSystemPrompt(tone, length);
        const userPrompt = generateUserPrompt(topic);

        // Usar Groq (más rápido y gratuito) en lugar de OpenAI
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 8000,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Groq API Error:', error);
            return NextResponse.json({
                error: 'Failed to generate content',
                details: error
            }, { status: 500 });
        }

        const data = await response.json();
        const generatedContent = JSON.parse(data.choices[0].message.content);

        // Para imágenes, usar Unsplash API (gratis)
        let coverImageUrl = '';
        if (includeImages) {
            try {
                const searchQuery = encodeURIComponent(topic.split(' ').slice(0, 3).join(' '));
                const unsplashResponse = await fetch(
                    `https://api.unsplash.com/photos/random?query=${searchQuery}&orientation=landscape&client_id=${process.env.UNSPLASH_ACCESS_KEY}`,
                    { headers: { 'Accept-Version': 'v1' } }
                );

                if (unsplashResponse.ok) {
                    const imageData = await unsplashResponse.json();
                    coverImageUrl = imageData.urls.regular;
                } else {
                    // Fallback: imagen placeholder
                    coverImageUrl = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=675&fit=crop`;
                }
            } catch (error) {
                console.error('Image fetch failed:', error);
                coverImageUrl = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=675&fit=crop`;
            }
        }

        return NextResponse.json({
            ...generatedContent,
            coverImage: coverImageUrl,
            generatedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Error generating blog post:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
