'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/dashboard/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui';
import { 
  Settings, 
  Bell, 
  Shield, 
  Mail, 
  Globe, 
  Database, 
  Save,
  Server
} from 'lucide-react';

export default function ConfiguracionPage() {
  const { toast } = useToast();
  
  // Configuración General
  const [generalConfig, setGeneralConfig] = useState({
    siteName: 'Zentry Admin',
    siteDescription: 'Sistema de administración de residenciales',
    contactEmail: 'admin@zentry.com',
    maxResidenciales: '50',
    maxUsersPerResidencial: '500'
  });
  
  // Configuración de Notificaciones
  const [notificationsConfig, setNotificationsConfig] = useState({
    enableEmailNotifications: true,
    enablePushNotifications: false,
    newUserNotification: true,
    newResidencialNotification: true,
    securityAlertNotification: true,
    maintenanceNotification: false
  });
  
  // Configuración de Seguridad
  const [securityConfig, setSecurityConfig] = useState({
    requireTwoFactor: false,
    passwordExpiryDays: '90',
    sessionTimeoutMinutes: '60',
    maxLoginAttempts: '5',
    requireStrongPasswords: true
  });

  const handleGeneralInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralConfig({
      ...generalConfig,
      [name]: value
    });
  };

  const handleNotificationToggle = (settingName: string) => {
    setNotificationsConfig({
      ...notificationsConfig,
      [settingName]: !notificationsConfig[settingName as keyof typeof notificationsConfig]
    });
  };

  const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityConfig({
      ...securityConfig,
      [name]: value
    });
  };

  const handleSecurityToggle = (settingName: string) => {
    setSecurityConfig({
      ...securityConfig,
      [settingName]: !securityConfig[settingName as keyof typeof securityConfig]
    });
  };

  const saveSettings = (section: string) => {
    // Aquí se implementaría la lógica para guardar en la base de datos
    
    toast({
      title: 'Configuración guardada',
      description: `La configuración de ${section} se ha guardado correctamente`,
    });
  };

  return (
    <AdminLayout requireGlobalAdmin={true}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración del Sistema</h1>
          <p className="text-muted-foreground">
            Administra los parámetros globales de Zentry
          </p>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Server className="h-4 w-4 mr-2" />
            Avanzado
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                <CardTitle>Configuración General</CardTitle>
              </div>
              <CardDescription>
                Ajustes básicos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nombre del Sistema</Label>
                  <Input
                    id="siteName"
                    name="siteName"
                    value={generalConfig.siteName}
                    onChange={handleGeneralInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Descripción</Label>
                  <Input
                    id="siteDescription"
                    name="siteDescription"
                    value={generalConfig.siteDescription}
                    onChange={handleGeneralInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contacto</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={generalConfig.contactEmail}
                    onChange={handleGeneralInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxResidenciales">Máximo de Residenciales</Label>
                  <Input
                    id="maxResidenciales"
                    name="maxResidenciales"
                    type="number"
                    value={generalConfig.maxResidenciales}
                    onChange={handleGeneralInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxUsersPerResidencial">Máximo de Usuarios por Residencial</Label>
                  <Input
                    id="maxUsersPerResidencial"
                    name="maxUsersPerResidencial"
                    type="number"
                    value={generalConfig.maxUsersPerResidencial}
                    onChange={handleGeneralInputChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => saveSettings('general')}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                <CardTitle>Configuración de Notificaciones</CardTitle>
              </div>
              <CardDescription>
                Configura cómo y cuándo se envían las notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableEmailNotifications">Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar alertas vía email
                    </p>
                  </div>
                  <Switch
                    id="enableEmailNotifications"
                    checked={notificationsConfig.enableEmailNotifications}
                    onCheckedChange={() => handleNotificationToggle('enableEmailNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enablePushNotifications">Notificaciones Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar alertas push a dispositivos móviles
                    </p>
                  </div>
                  <Switch
                    id="enablePushNotifications"
                    checked={notificationsConfig.enablePushNotifications}
                    onCheckedChange={() => handleNotificationToggle('enablePushNotifications')}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="mb-4 text-sm font-medium">Eventos de Notificación</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newUserNotification">Nuevos Usuarios</Label>
                    <Switch
                      id="newUserNotification"
                      checked={notificationsConfig.newUserNotification}
                      onCheckedChange={() => handleNotificationToggle('newUserNotification')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newResidencialNotification">Nuevos Residenciales</Label>
                    <Switch
                      id="newResidencialNotification"
                      checked={notificationsConfig.newResidencialNotification}
                      onCheckedChange={() => handleNotificationToggle('newResidencialNotification')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="securityAlertNotification">Alertas de Seguridad</Label>
                    <Switch
                      id="securityAlertNotification"
                      checked={notificationsConfig.securityAlertNotification}
                      onCheckedChange={() => handleNotificationToggle('securityAlertNotification')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenanceNotification">Mantenimiento del Sistema</Label>
                    <Switch
                      id="maintenanceNotification"
                      checked={notificationsConfig.maintenanceNotification}
                      onCheckedChange={() => handleNotificationToggle('maintenanceNotification')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => saveSettings('notificaciones')}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                <CardTitle>Configuración de Seguridad</CardTitle>
              </div>
              <CardDescription>
                Ajustes relacionados con la seguridad del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireTwoFactor">Autenticación de Dos Factores</Label>
                    <p className="text-sm text-muted-foreground">
                      Requerir 2FA para todos los administradores
                    </p>
                  </div>
                  <Switch
                    id="requireTwoFactor"
                    checked={securityConfig.requireTwoFactor}
                    onCheckedChange={() => handleSecurityToggle('requireTwoFactor')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireStrongPasswords">Contraseñas Fuertes</Label>
                    <p className="text-sm text-muted-foreground">
                      Requerir contraseñas con mínimo 8 caracteres, mayúsculas, minúsculas y números
                    </p>
                  </div>
                  <Switch
                    id="requireStrongPasswords"
                    checked={securityConfig.requireStrongPasswords}
                    onCheckedChange={() => handleSecurityToggle('requireStrongPasswords')}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiryDays">Caducidad de Contraseñas (días)</Label>
                  <Input
                    id="passwordExpiryDays"
                    name="passwordExpiryDays"
                    type="number"
                    value={securityConfig.passwordExpiryDays}
                    onChange={handleSecurityInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeoutMinutes">Tiempo de Sesión (minutos)</Label>
                  <Input
                    id="sessionTimeoutMinutes"
                    name="sessionTimeoutMinutes"
                    type="number"
                    value={securityConfig.sessionTimeoutMinutes}
                    onChange={handleSecurityInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Intentos Máximos de Login</Label>
                  <Input
                    id="maxLoginAttempts"
                    name="maxLoginAttempts"
                    type="number"
                    value={securityConfig.maxLoginAttempts}
                    onChange={handleSecurityInputChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => saveSettings('seguridad')}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                <CardTitle>Configuración Avanzada</CardTitle>
              </div>
              <CardDescription>
                Ajustes avanzados del sistema - Sólo para administradores experimentados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 py-8 text-center">
                <Server className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">Herramientas del Sistema</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Estas operaciones pueden afectar el funcionamiento del sistema.
                  </p>
                </div>
                <div className="flex justify-center space-x-4 mt-6">
                  <Button variant="outline" onClick={() => 
                    toast({ 
                      title: 'Operación realizada', 
                      description: 'Base de datos compactada correctamente'
                    })
                  }>
                    Compactar Base de Datos
                  </Button>
                  <Button variant="outline" onClick={() => 
                    toast({ 
                      title: 'Operación realizada', 
                      description: 'Caché del sistema limpiada'
                    })
                  }>
                    Limpiar Caché
                  </Button>
                  <Button variant="destructive" onClick={() => 
                    toast({ 
                      title: 'Atención', 
                      description: 'Esta operación no está disponible en este momento',
                      variant: 'destructive'
                    })
                  }>
                    Reiniciar Sistema
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
} 