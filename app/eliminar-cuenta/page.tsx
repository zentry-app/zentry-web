import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Info, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Solicitar Eliminación de Cuenta | Zentry",
  description: "Aprende cómo solicitar la eliminación de tu cuenta y datos de Zentry",
};

export default function EliminarCuentaPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" className="gap-2" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Eliminación de Cuenta en Zentry</h1>
            <p className="text-muted-foreground">
              Última actualización: {new Date().toLocaleDateString()}
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">¿Cómo solicitar la eliminación de tu cuenta?</h2>
            <p className="text-muted-foreground leading-relaxed">
              En Zentry respetamos tu privacidad y tu derecho a controlar tus datos. Si deseas eliminar tu cuenta y tus datos personales
              de nuestros sistemas, por favor sigue estos pasos:
            </p>
            
            <Card className="mt-4">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Envía una solicitud por email
                  </h3>
                  <p className="text-muted-foreground">
                    Envía un correo electrónico a <span className="font-semibold text-primary">privacidad@zentry.app</span> con el asunto "Solicitud de Eliminación de Cuenta" e incluye:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                    <li>La dirección de correo electrónico asociada a tu cuenta</li>
                    <li>Tu nombre completo como aparece en la aplicación</li>
                    <li>El código del residencial al que perteneces (si lo conoces)</li>
                  </ul>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Recibirás un correo de confirmación en un plazo máximo de 72 horas hábiles.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Información importante sobre la eliminación de cuentas
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold">Datos que se eliminarán:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4 mt-2">
                  <li>Información de perfil personal (nombre, apellidos, teléfono)</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Historial de alertas y notificaciones generadas por ti</li>
                  <li>Foto de perfil y documentos de identificación</li>
                  <li>Información de inicio de sesión y preferencias de la aplicación</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold">Datos que se conservarán:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4 mt-2">
                  <li>Registros de seguridad para cumplimiento legal (hasta 90 días)</li>
                  <li>Registros de transacciones por requisitos fiscales (período legal aplicable)</li>
                  <li>Datos agregados o anonimizados para análisis</li>
                </ul>
              </div>
              
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-amber-50 border-amber-200">
                <Clock className="h-6 w-6 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800">Periodo de retención</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Tras la solicitud de eliminación de cuenta, tus datos personales serán eliminados en un plazo máximo de 30 días.
                    Los datos que debemos conservar por obligaciones legales se mantendrán seguros y aislados, con acceso restringido,
                    únicamente durante el período legalmente requerido.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Consecuencias de la eliminación</h2>
            <p className="text-muted-foreground leading-relaxed">
              Al eliminar tu cuenta:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li>Perderás acceso inmediato a la aplicación Zentry</li>
              <li>No podrás recuperar la información asociada a tu cuenta</li>
              <li>Se revocarán los permisos de acceso al residencial</li>
              <li>No recibirás más alertas ni notificaciones</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Si quieres volver a utilizar la aplicación en el futuro, deberás crear una nueva cuenta y pasar nuevamente
              por el proceso de aprobación del administrador del residencial.
            </p>
          </section>

          <section className="pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Para más información sobre cómo manejamos tus datos, consulta nuestra{" "}
              <Link href="/privacidad" className="text-primary hover:underline">
                Política de Privacidad
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 