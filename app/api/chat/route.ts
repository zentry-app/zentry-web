import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(req: Request) {
    try {
        // Verificar autenticación
        const authorization = req.headers.get('authorization');
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Acceso denegado. Se requiere autenticación.' }, { status: 401 });
        }

        const idToken = authorization.split('Bearer ')[1];
        try {
            if (!adminAuth) {
                console.error('Firebase Admin not initialized');
                return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
            }
            await adminAuth.verifyIdToken(idToken);
        } catch (authError) {
            console.error('Error verificando token:', authError);
            return NextResponse.json({ error: 'Token de sesión inválido o expirado.' }, { status: 401 });
        }

        const { messages } = await req.json();
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres el asistente oficial de Zentry, una plataforma inteligente para la administración de residenciales y condominios. Tu objetivo es ayudar a los usuarios (administradores y residentes) a entender cómo funciona Zentry, resolver dudas sobre seguridad, pagos, reservaciones y comunicación. Responde de forma profesional, amigable y concisa. Si no sabes algo, sugiere contactar al soporte humano.',
                    },
                    ...messages,
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.error?.message || 'Error from Groq API' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
