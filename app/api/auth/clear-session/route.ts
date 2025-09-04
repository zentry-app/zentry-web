import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const response = NextResponse.json({ success: true }, { status: 200 });

    // Eliminar la cookie estableciendo maxAge a 0 o una fecha pasada
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Error clearing session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 