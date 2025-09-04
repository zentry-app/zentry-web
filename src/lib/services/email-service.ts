/**
 * Servicio de Email para envío de confirmaciones de registro
 * Replica la funcionalidad del EmailService de la app móvil
 */

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface RegistrationEmailData {
  toEmail: string;
  userName: string;
  residentialName?: string;
}

class EmailService {
  private static instance: EmailService;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Envía un correo de confirmación de registro
   */
  async sendRegistrationConfirmationEmail(data: RegistrationEmailData): Promise<void> {
    try {
      console.log('📧 Enviando correo de confirmación de registro:', data.toEmail);

      const emailData: EmailData = {
        to: data.toEmail,
        subject: 'Registro exitoso - Zentry',
        html: this.generateRegistrationEmailHTML(data),
        text: this.generateRegistrationEmailText(data)
      };

      await this.sendEmail(emailData);
      console.log('✅ Correo de confirmación enviado exitosamente');
    } catch (error) {
      console.error('❌ Error al enviar correo de confirmación:', error);
      throw error;
    }
  }

  /**
   * Envía un correo de aprobación de cuenta
   */
  async sendAccountApprovalEmail(data: RegistrationEmailData): Promise<void> {
    try {
      console.log('📧 Enviando correo de aprobación de cuenta:', data.toEmail);

      const emailData: EmailData = {
        to: data.toEmail,
        subject: '¡Tu cuenta ha sido aprobada! - Zentry',
        html: this.generateApprovalEmailHTML(data),
        text: this.generateApprovalEmailText(data)
      };

      await this.sendEmail(emailData);
      console.log('✅ Correo de aprobación enviado exitosamente');
    } catch (error) {
      console.error('❌ Error al enviar correo de aprobación:', error);
      throw error;
    }
  }

  /**
   * Envía un correo genérico
   */
  private async sendEmail(emailData: EmailData): Promise<void> {
    try {
      // En producción, esto se conectaría a un servicio de email real
      // Por ahora, simularemos el envío
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [DEV] Simulando envío de email:', {
          to: emailData.to,
          subject: emailData.subject,
          preview: emailData.html.substring(0, 100) + '...'
        });
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1000));
        return;
      }

      // En producción, usar un servicio real como SendGrid, Mailgun, etc.
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error(`Error al enviar email: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error en sendEmail:', error);
      throw error;
    }
  }

  /**
   * Genera el HTML para el correo de confirmación de registro (igual que la app móvil)
   */
  private generateRegistrationEmailHTML(data: RegistrationEmailData): string {
    return `
      <h2>¡Registro exitoso en Zentry!</h2>
      <p>Hola ${data.userName},</p>
      <p>Tu registro en Zentry ha sido completado exitosamente. Tu cuenta está pendiente de autorización por parte del administrador.</p>
      <p>Una vez que tu cuenta sea autorizada, recibirás un correo electrónico con las instrucciones para acceder a la plataforma.</p>
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      <br>
      <p>Saludos,</p>
      <p>El equipo de Zentry</p>
    `;
  }

  /**
   * Genera el texto plano para el correo de confirmación
   */
  private generateRegistrationEmailText(data: RegistrationEmailData): string {
    return `
¡Bienvenido a Zentry!

Hola ${data.userName},

Tu cuenta ha sido creada exitosamente en Zentry. Para completar el proceso de registro, sigue estos pasos:

1. Verifica tu correo electrónico
   Haz clic en el enlace de verificación que te hemos enviado por separado.

2. Espera la aprobación
   Un administrador revisará tu cuenta y documentos. Esto puede tomar entre 24-48 horas.

3. Recibe la confirmación
   Una vez aprobada, recibirás un correo de confirmación y podrás iniciar sesión.

Si tienes alguna pregunta, no dudes en contactarnos.

¡Gracias por unirte a Zentry!

© 2024 Zentry. Todos los derechos reservados.
Este es un correo automático, por favor no respondas a este mensaje.
    `;
  }

  /**
   * Genera el HTML para el correo de aprobación (igual que la app móvil)
   */
  private generateApprovalEmailHTML(data: RegistrationEmailData): string {
    return `
      <h2>¡Bienvenido a Zentry!</h2>
      <p>Hola ${data.userName},</p>
      <p>¡Nos complace informarte que tu cuenta ha sido aprobada! Ya puedes acceder a todas las funcionalidades de Zentry.</p>
      <h3>¿Qué puedes hacer ahora?</h3>
      <ul>
        <li>Iniciar sesión en la aplicación</li>
        <li>Generar códigos QR para tus visitantes</li>
        <li>Recibir notificaciones de accesos</li>
        <li>Gestionar tus visitas autorizadas</li>
        <li>Y mucho más...</li>
      </ul>
      <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador de tu residencial.</p>
      <br>
      <p>¡Gracias por confiar en Zentry!</p>
      <p>Atentamente,</p>
      <p>El equipo de Zentry</p>
    `;
  }

  /**
   * Genera el texto plano para el correo de aprobación
   */
  private generateApprovalEmailText(data: RegistrationEmailData): string {
    return `
¡Tu cuenta ha sido aprobada!

Hola ${data.userName},

¡Excelentes noticias! Tu cuenta de Zentry ha sido aprobada y ya puedes comenzar a usar todos nuestros servicios.

Ahora puedes:
- Iniciar sesión en tu cuenta
- Gestionar visitantes
- Recibir notificaciones de seguridad
- Participar en eventos de la comunidad
- Y mucho más...

Inicia sesión en: ${process.env.NEXT_PUBLIC_APP_URL}/login

¡Bienvenido oficialmente a la comunidad Zentry!

© 2024 Zentry. Todos los derechos reservados.
Este es un correo automático, por favor no respondas a este mensaje.
    `;
  }
}

export default EmailService.getInstance(); 