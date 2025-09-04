import { NextRequest, NextResponse } from 'next/server';

// Interfaz para los datos del email
interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Función para enviar email usando un servicio externo
async function sendEmailWithProvider(emailData: EmailData): Promise<boolean> {
  try {
    // Opción 1: Usar Resend (recomendado para Next.js)
    if (process.env.RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'noreply@zentry.app',
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        }),
      });

      if (resendResponse.ok) {
        console.log('✅ Email enviado exitosamente con Resend');
        return true;
      } else {
        const error = await resendResponse.text();
        console.error('❌ Error con Resend:', error);
      }
    }

    // Opción 2: Usar SendGrid como fallback
    if (process.env.SENDGRID_API_KEY) {
      const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: emailData.to }],
            subject: emailData.subject,
          }],
          from: { email: process.env.FROM_EMAIL || 'noreply@zentry.app' },
          content: [
            {
              type: 'text/html',
              value: emailData.html,
            },
            ...(emailData.text ? [{
              type: 'text/plain',
              value: emailData.text,
            }] : []),
          ],
        }),
      });

      if (sendGridResponse.ok) {
        console.log('✅ Email enviado exitosamente con SendGrid');
        return true;
      } else {
        const error = await sendGridResponse.text();
        console.error('❌ Error con SendGrid:', error);
      }
    }

    // Opción 3: Usar Gmail SMTP (igual que la app móvil)
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      const mailOptions = {
        from: `"Zentry App" <${process.env.GMAIL_USER}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email enviado exitosamente con Gmail SMTP:', info.messageId);
      return true;
    }

    // Si no hay ningún proveedor configurado, fallar
    console.error('❌ No hay proveedores de email configurados');
    return false;

  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que la petición venga del mismo dominio (seguridad básica)
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    if (process.env.NODE_ENV === 'production' && origin && !origin.includes(host || '')) {
      return NextResponse.json(
        { error: 'Origen no autorizado' },
        { status: 403 }
      );
    }

    // Parsear los datos del email
    const emailData: EmailData = await request.json();

    // Validar datos requeridos
    if (!emailData.to || !emailData.subject || !emailData.html) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: to, subject, html' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.to)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    console.log('📧 Enviando email a:', emailData.to);
    console.log('📧 Asunto:', emailData.subject);

    // Intentar enviar el email
    const success = await sendEmailWithProvider(emailData);

    if (success) {
      return NextResponse.json(
        { 
          message: 'Email enviado exitosamente',
          to: emailData.to,
          subject: emailData.subject
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Error al enviar email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error en la API de envío de email:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para verificar el estado del servicio de email
export async function GET() {
  const providers = {
    resend: !!process.env.RESEND_API_KEY,
    sendgrid: !!process.env.SENDGRID_API_KEY,
    gmail: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
  };

  const hasProvider = Object.values(providers).some(Boolean);

  return NextResponse.json({
    status: hasProvider ? 'configured' : 'not_configured',
    providers,
    activeProvider: providers.gmail ? 'Gmail SMTP' : 
                   providers.resend ? 'Resend' : 
                   providers.sendgrid ? 'SendGrid' : 'None',
    message: hasProvider 
      ? 'Servicio de email configurado correctamente'
      : 'No hay proveedores de email configurados'
  });
} 