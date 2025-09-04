"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function UserProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    nombre: '',
    curp: '',
    nss: '',
    telefono: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí irá la lógica para actualizar el perfil
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'Usuario'} />
            <AvatarFallback>{user?.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-medium">{user?.displayName || 'Usuario'}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                value={userData.nombre}
                onChange={(e) => setUserData({ ...userData, nombre: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="curp">CURP</Label>
              <Input
                id="curp"
                value={userData.curp}
                onChange={(e) => setUserData({ ...userData, curp: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nss">NSS</Label>
              <Input
                id="nss"
                value={userData.nss}
                onChange={(e) => setUserData({ ...userData, nss: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={userData.telefono}
                onChange={(e) => setUserData({ ...userData, telefono: e.target.value })}
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit">Guardar</Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)}
            >
              Editar Perfil
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 