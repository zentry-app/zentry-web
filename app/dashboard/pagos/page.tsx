"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getResidenciales, Residencial } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import PaymentsDashboard from "@/components/dashboard/pagos/PaymentsDashboard";

export default function PagosPage() {
  const router = useRouter();
  const { userClaims, loading: authLoading } = useAuth();

  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [residencialFilter, setResidencialFilter] = useState<string>("");
  const [loadingRes, setLoadingRes] = useState(true);

  const esAdminDeResidencial = useMemo(
    () => userClaims?.isResidencialAdmin && !userClaims?.isGlobalAdmin,
    [userClaims]
  );

  useEffect(() => {
    if (authLoading || (!userClaims?.isGlobalAdmin && !esAdminDeResidencial)) return;

    const load = async () => {
      try {
        const data = await getResidenciales();
        setResidenciales(data);

        if (esAdminDeResidencial) {
          const code = userClaims?.managedResidencialId;
          const match = data.find((r) => r.residencialID === code);
          if (match?.id) setResidencialFilter(match.id);
        }
      } catch (err) {
        console.error("Error loading residenciales:", err);
      } finally {
        setLoadingRes(false);
      }
    };
    load();
  }, [authLoading, userClaims, esAdminDeResidencial]);

  if (authLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!userClaims?.isGlobalAdmin && !esAdminDeResidencial) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No tienes permisos para acceder a esta sección.
            </p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Residential selector — only for global admin */}
      {userClaims?.isGlobalAdmin && (
        <Select value={residencialFilter} onValueChange={setResidencialFilter}>
          <SelectTrigger className="h-12 rounded-xl font-medium max-w-sm">
            <SelectValue placeholder="Selecciona un residencial" />
          </SelectTrigger>
          <SelectContent>
            {loadingRes ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Cargando...
              </div>
            ) : (
              residenciales.map((r) => (
                <SelectItem key={r.id} value={r.id!}>
                  {r.nombre}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {/* Single dashboard — no tabs */}
      {residencialFilter ? (
        <PaymentsDashboard residencialId={residencialFilter} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold">Selecciona un residencial</h3>
          <p className="text-muted-foreground text-sm mt-1">
            para ver el panel de pagos
          </p>
        </div>
      )}
    </div>
  );
}
