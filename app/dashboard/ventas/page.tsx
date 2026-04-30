"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VentasRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/cotizaciones");
  }, [router]);
  return null;
}
