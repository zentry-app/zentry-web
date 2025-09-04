"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PensionCalculator() {
  const [semanasCotizadas, setSemanasCotizadas] = useState('');
  const [salarioPromedio, setSalarioPromedio] = useState('');

  const calcularPension = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica de cálculo
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Pensión</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={calcularPension} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="semanas">Semanas Cotizadas</Label>
            <Input
              id="semanas"
              type="number"
              value={semanasCotizadas}
              onChange={(e) => setSemanasCotizadas(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salario">Salario Promedio</Label>
            <Input
              id="salario"
              type="number"
              value={salarioPromedio}
              onChange={(e) => setSalarioPromedio(e.target.value)}
            />
          </div>
          <Button type="submit">Calcular Pensión</Button>
        </form>
      </CardContent>
    </Card>
  );
} 