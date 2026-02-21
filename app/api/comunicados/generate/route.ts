import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: NextRequest) {
  try {
    // Obtener el token de autorización
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const idToken = authorization.split('Bearer ')[1];

    // Verificar que adminAuth esté disponible
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin no está configurado correctamente' },
        { status: 500 }
      );
    }

    // Verificar el token y obtener las claims del usuario
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { admin, superadmin, isAdmin } = decodedToken;

    // Verificar que el usuario sea admin
    if (!admin && !superadmin && !isAdmin) {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { idea, textoActual, accion, tono } = body;

    // Validar que haya una idea o texto actual
    if (!idea && !textoActual) {
      return NextResponse.json({
        error: 'Se requiere una idea del comunicado o texto actual para procesar'
      }, { status: 400 });
    }

    // Construir el prompt según la acción
    let systemPrompt = `Eres un asistente especializado en redactar comunicados formales para residenciales y condominios.
Genera comunicados profesionales, claros y concisos en español.
El comunicado debe incluir:
- Un título descriptivo y profesional
- Una descripción detallada pero clara
- Tono apropiado según el contexto (formal, amigable, urgente)

Responde SOLO con el texto del comunicado, sin explicaciones adicionales.`;

    let userPrompt = '';

    if (accion === 'mejorar') {
      systemPrompt = `Eres un experto en redacción profesional. Mejora la redacción del siguiente comunicado manteniendo su mensaje principal pero haciéndolo más claro, profesional y efectivo. Responde SOLO con el texto mejorado, sin explicaciones.`;
      userPrompt = `Mejora la redacción de este comunicado:\n\n${textoActual}`;
    } else if (accion === 'ajustar-tono') {
      const tonoDescripcion = tono === 'formal' ? 'muy formal y profesional' :
        tono === 'amigable' ? 'amigable y cercano pero profesional' :
          tono === 'urgente' ? 'urgente y directo' : 'profesional';
      systemPrompt = `Eres un experto en redacción. Ajusta el tono del siguiente comunicado para que sea ${tonoDescripcion}, manteniendo toda la información importante. Responde SOLO con el texto ajustado, sin explicaciones.`;
      userPrompt = `Ajusta el tono de este comunicado:\n\n${textoActual}`;
    } else if (accion === 'regenerar') {
      userPrompt = `Genera un comunicado profesional basado en esta idea:\n\n${idea}`;
    } else {
      // Generar nuevo
      userPrompt = `Genera un comunicado profesional para un residencial basado en esta idea:\n\n${idea}`;
    }

    // Llamar a Groq API
    const requestBody = {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    };

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en Groq API:", errorText);
      return NextResponse.json(
        { error: 'Error al generar el comunicado. Por favor intenta de nuevo.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const textoGenerado = data.choices[0]?.message?.content || "No se pudo generar el comunicado.";

    return NextResponse.json({
      success: true,
      texto: textoGenerado.trim()
    });

  } catch (error: any) {
    console.error('Error generating comunicado:', error);
    return NextResponse.json({
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}
