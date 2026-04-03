import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Info, Clock, AlertTriangle, CheckCircle, Trash2, Shield, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Eliminación de Cuenta | Zentry",
  description: "Elimina tu cuenta y datos personales de Zentry de forma segura y transparente",
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

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold">Eliminación de Cuenta</h1>
            <p className="text-xl text-muted-foreground">
              Elimina tu cuenta y datos personales de forma segura
            </p>
            <p className="text-sm text-muted-foreground">
              Última actualización: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Alerta importante */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Importante:</strong> La eliminación de tu cuenta es permanente e irreversible. 
              Asegúrate de haber respaldado cualquier información importante antes de proceder.
            </AlertDescription>
          </Alert>

          {/* Formulario directo de eliminación */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Solicitar Eliminación de Cuenta</h2>
            
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <UserX className="h-5 w-5" />
                  Formulario de Solicitud de Eliminación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form action="mailto:privacidad@zentry.app" method="post" encType="text/plain">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Dirección de Correo Electrónico *</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="tu.email@ejemplo.com"
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fullName">Nombre Completo *</Label>
                      <Input 
                        id="fullName" 
                        name="fullName" 
                        type="text" 
                        placeholder="Tu nombre completo como aparece en la app"
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="residentialCode">Código del Residencial (si lo conoces)</Label>
                      <Input 
                        id="residentialCode" 
                        name="residentialCode" 
                        type="text" 
                        placeholder="Tu código de residencial"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reason">Motivo de Eliminación (opcional)</Label>
                      <Textarea 
                        id="reason" 
                        name="reason" 
                        placeholder="Cuéntanos por qué deseas eliminar tu cuenta..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 border rounded-lg bg-red-100 border-red-200">
                      <input 
                        type="checkbox" 
                        id="confirm" 
                        name="confirm" 
                        required 
                        className="mt-1"
                      />
                      <Label htmlFor="confirm" className="text-red-800">
                        Entiendo que la eliminación de cuenta es permanente e irreversible. 
                        Confirmo que deseo eliminar mi cuenta y todos los datos asociados.
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="submit" 
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar Solicitud de Eliminación
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href="/delete-account">View in English</Link>
                    </Button>
                  </div>
                  
                  <input type="hidden" name="subject" value="Solicitud de Eliminación de Cuenta" />
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Opciones de eliminación */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Opciones para Eliminar tu Cuenta</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Opción 1: Desde la app */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Eliminación desde la App
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-green-700">
                    La forma más rápida y directa de eliminar tu cuenta.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-green-800">Pasos:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                      <li>Abre la aplicación Zentry</li>
                      <li>Ve a Configuración de Cuenta</li>
                      <li>Selecciona "Eliminar Cuenta"</li>
                      <li>Confirma tu decisión</li>
                    </ol>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-green-600">
                      ✓ Eliminación inmediata<br/>
                      ✓ Confirmación automática<br/>
                      ✓ Cumple con políticas de Google Play
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Opción 2: Por email */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Mail className="h-5 w-5" />
                    Solicitud por Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-blue-700">
                    Alternativa para usuarios que prefieren contacto directo.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-blue-800">Envía email a:</p>
                    <p className="font-mono text-sm bg-blue-100 p-2 rounded text-blue-900">
                      privacidad@zentry.app
                    </p>
                    <p className="text-sm font-semibold text-blue-800">Asunto:</p>
                    <p className="font-mono text-sm bg-blue-100 p-2 rounded text-blue-900">
                      "Solicitud de Eliminación de Cuenta"
                    </p>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-blue-600">
                      ✓ Respuesta en 24-72 horas<br/>
                      ✓ Soporte personalizado<br/>
                      ✓ Confirmación por email
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Información requerida */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Información Requerida</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">
                  Para procesar tu solicitud de eliminación, necesitamos la siguiente información:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                  <li>Dirección de correo electrónico asociada a tu cuenta</li>
                  <li>Nombre completo como aparece en la aplicación</li>
                  <li>Código del residencial (si lo conoces)</li>
                  <li>Confirmación de que deseas eliminar permanentemente tu cuenta</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Información detallada sobre datos */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Qué Datos se Eliminan
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Datos que se eliminan */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <Trash2 className="h-5 w-5" />
                    Datos Eliminados Completamente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-red-700">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Información de perfil personal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Dirección de correo electrónico</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Historial de alertas y notificaciones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Foto de perfil y documentos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Preferencias de la aplicación</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Tokens de notificaciones</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Datos que se conservan */}
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Clock className="h-5 w-5" />
                    Datos Conservados (Legalmente Requeridos)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-amber-700">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Registros de seguridad (90 días)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Registros de transacciones (período fiscal)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Datos anonimizados para análisis</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                    <p className="text-xs text-amber-800">
                      Estos datos se mantienen seguros y aislados, con acceso restringido únicamente durante el período legalmente requerido.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Tiempo de procesamiento */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Tiempo de Procesamiento</h2>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-2">Plazos de Eliminación</h3>
                    <div className="space-y-2 text-blue-700">
                      <p className="text-sm">
                        <strong>Eliminación desde la app:</strong> Inmediata (dentro de 24 horas)
                      </p>
                      <p className="text-sm">
                        <strong>Solicitud por email:</strong> Procesada en 24-72 horas hábiles
                      </p>
                      <p className="text-sm">
                        <strong>Confirmación:</strong> Recibirás un email de confirmación una vez completada la eliminación
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Consecuencias */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Consecuencias de la Eliminación</h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Lo que sucederá:</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                      <li>Perderás acceso inmediato a la aplicación Zentry</li>
                      <li>No podrás recuperar la información asociada a tu cuenta</li>
                      <li>Se revocarán los permisos de acceso al residencial</li>
                      <li>No recibirás más alertas ni notificaciones</li>
                      <li>Tu perfil será eliminado de todos los sistemas</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">¿Quieres volver a usar Zentry?</h4>
                    <p className="text-sm text-gray-600">
                      Si decides volver en el futuro, deberás crear una nueva cuenta y pasar nuevamente 
                      por el proceso de aprobación del administrador del residencial.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Cumplimiento con políticas */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Cumplimiento y Transparencia</h2>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-2">Cumplimos con:</h3>
                    <ul className="space-y-1 text-green-700 text-sm">
                      <li>✓ Políticas de Google Play Store</li>
                      <li>✓ Ley Federal de Protección de Datos Personales (México)</li>
                      <li>✓ Reglamento General de Protección de Datos (RGPD)</li>
                      <li>✓ Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Enlaces importantes */}
          <section className="pt-6 border-t">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <p className="text-sm text-muted-foreground">
                Para más información sobre cómo manejamos tus datos, consulta nuestra{" "}
                <Link href="/privacidad" className="text-primary hover:underline font-medium">
                  Política de Privacidad
                </Link>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/privacidad">
                    <Info className="h-4 w-4 mr-2" />
                    Política de Privacidad
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/terms">
                    Términos de Servicio
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 