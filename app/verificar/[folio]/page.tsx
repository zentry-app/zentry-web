"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getFunctions, httpsCallable } from "firebase/functions";
import Image from "next/image";
import { app } from "@/lib/firebase/config";

// ─── Types ───────────────────────────────────────────────────────────────────

type VerificationState =
  | "loading"
  | "valid"
  | "invalid"
  | "not_found"
  | "error";

interface VerificationData {
  folio: string;
  monto: number; // centavos
  fecha: string; // ISO string o dateStr
  vivienda: string;
  estado: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VerificarPage() {
  const params = useParams<{ folio: string }>();
  const searchParams = useSearchParams();

  const folio = params?.folio ?? "";
  const hash = searchParams?.get("h") ?? "";

  const [state, setState] = useState<VerificationState>("loading");
  const [data, setData] = useState<VerificationData | null>(null);

  useEffect(() => {
    if (!folio) {
      setState("not_found");
      return;
    }

    const verify = async () => {
      try {
        // Small delay for animation to feel deliberate
        await new Promise((r) => setTimeout(r, 1400));

        const functions = getFunctions(app, "us-central1");
        const apiVerifyReceipt = httpsCallable<
          { folio: string; hash: string },
          { valid: boolean; found: boolean; data?: VerificationData }
        >(functions, "apiVerifyReceipt");

        const result = await apiVerifyReceipt({ folio, hash });
        const res = result.data;

        if (!res.found) {
          setState("not_found");
        } else if (res.valid && res.data) {
          setData(res.data);
          setState("valid");
        } else {
          setState("invalid");
        }
      } catch (err: any) {
        console.error("[verificar] Error:", err);
        setState("error");
      }
    };

    verify();
  }, [folio, hash]);

  // ─── Format helpers ────────────────────────────────────────────────────────

  const formatMonto = (centavos: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(centavos / 100);

  const formatFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes shield-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.96); }
        }
        @keyframes dot-blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes draw-check {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes draw-x {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes ring-expand {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .shield-pulse { animation: shield-pulse 1.8s ease-in-out infinite; }
        .dot-1 { animation: dot-blink 1.2s infinite 0s; }
        .dot-2 { animation: dot-blink 1.2s infinite 0.2s; }
        .dot-3 { animation: dot-blink 1.2s infinite 0.4s; }
        .fade-in-up { animation: fade-in-up 0.5s ease-out both; }
        .check-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: draw-check 0.6s ease-out 0.2s forwards;
        }
        .x-path {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: draw-x 0.4s ease-out 0.1s forwards;
        }
        .ring-expand {
          animation: ring-expand 1.2s ease-out infinite;
        }
      `}</style>

      <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-8 fade-in-up" style={{ animationDelay: "0ms" }}>
          <Image
            src="/assets/logo/zentry-logo-new.png"
            alt="Zentry"
            width={120}
            height={36}
            className="object-contain"
            priority
          />
        </div>

        {/* Card */}
        <div
          className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          {/* ── Loading ── */}
          {state === "loading" && (
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative">
                {/* Pulsing ring */}
                <div className="absolute inset-0 rounded-full border-2 border-blue-400/40 ring-expand" />
                {/* Shield icon */}
                <div className="shield-pulse relative w-20 h-20 rounded-full bg-blue-500/10 border border-blue-400/30 flex items-center justify-center">
                  <ShieldIcon className="w-10 h-10 text-blue-400" />
                </div>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">
                  Verificando comprobante
                  <span className="dot-1 ml-0.5">.</span>
                  <span className="dot-2">.</span>
                  <span className="dot-3">.</span>
                </p>
                <p className="text-blue-300/60 text-sm mt-1 font-mono">
                  {folio}
                </p>
              </div>
              <div className="w-full h-px bg-white/5" />
              <p className="text-white/30 text-xs">
                Autenticando integridad del documento
              </p>
            </div>
          )}

          {/* ── Valid ── */}
          {state === "valid" && data && (
            <div className="flex flex-col items-center text-center gap-6 fade-in-up">
              {/* Success icon */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-10 h-10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      className="check-path"
                      d="M5 13l4 4L19 7"
                      stroke="#34d399"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <p className="text-emerald-400 font-bold text-2xl">
                  Comprobante Verificado
                </p>
                <p className="text-white/50 text-sm mt-1">
                  Este documento es auténtico
                </p>
              </div>

              <div className="w-full h-px bg-white/5" />

              {/* Details */}
              <div className="w-full space-y-3 text-left">
                <DetailRow label="Folio" value={data.folio} mono />
                <DetailRow label="Monto" value={formatMonto(data.monto)} />
                <DetailRow label="Fecha" value={formatFecha(data.fecha)} />
                <DetailRow label="Vivienda" value={data.vivienda} />
                <DetailRow label="Estado" value={data.estado} highlight />
              </div>

              <div className="w-full h-px bg-white/5" />

              {/* Hash badge */}
              <div className="w-full bg-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white/40 text-xs">Hash de verificación</p>
                  <p className="text-emerald-300/80 text-xs font-mono truncate">
                    {hash}
                  </p>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-full">
                    OK
                  </span>
                </div>
              </div>

              <p className="text-white/25 text-xs text-center leading-relaxed">
                Este comprobante fue emitido por la plataforma Zentry y su
                integridad ha sido verificada criptográficamente.
              </p>
            </div>
          )}

          {/* ── Invalid ── */}
          {state === "invalid" && (
            <div className="flex flex-col items-center text-center gap-6 fade-in-up">
              <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-400/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                  <path
                    className="x-path"
                    d="M6 6l12 12M18 6L6 18"
                    stroke="#f87171"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <p className="text-red-400 font-bold text-2xl">
                  Comprobante No Válido
                </p>
                <p className="text-white/50 text-sm mt-2 leading-relaxed">
                  El hash de verificación no coincide.{" "}
                  <span className="text-red-300/80">
                    Este documento puede haber sido alterado.
                  </span>
                </p>
              </div>

              <div className="w-full h-px bg-white/5" />

              <div className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-white/40 text-xs font-mono break-all">
                  {folio}
                </p>
                <p className="text-red-400/60 text-xs mt-1">
                  Hash proporcionado: {hash}
                </p>
              </div>

              <p className="text-white/25 text-xs leading-relaxed">
                Si crees que esto es un error, contacta al administrador de tu
                residencial.
              </p>
            </div>
          )}

          {/* ── Not Found ── */}
          {state === "not_found" && (
            <div className="flex flex-col items-center text-center gap-6 fade-in-up">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-400/20 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-10 h-10"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>

              <div>
                <p className="text-yellow-400 font-bold text-2xl">
                  Comprobante no encontrado
                </p>
                <p className="text-white/50 text-sm mt-2 leading-relaxed">
                  No se encontró un comprobante con el folio indicado.
                </p>
              </div>

              <div className="w-full h-px bg-white/5" />
              <p className="text-white/30 text-xs font-mono">{folio || "—"}</p>
            </div>
          )}

          {/* ── Error ── */}
          {state === "error" && (
            <div className="flex flex-col items-center text-center gap-6 fade-in-up">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <ShieldIcon className="w-10 h-10 text-white/30" />
              </div>
              <div>
                <p className="text-white/70 font-semibold text-xl">
                  Error de verificación
                </p>
                <p className="text-white/30 text-sm mt-1">
                  No fue posible conectar al servidor. Intenta más tarde.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          className="mt-8 text-white/20 text-xs text-center fade-in-up"
          style={{ animationDelay: "160ms" }}
        >
          Zentry — Plataforma de administración residencial |{" "}
          <a
            href="https://zentrymx.com"
            className="underline underline-offset-2 hover:text-white/40 transition-colors"
          >
            zentrymx.com
          </a>
        </p>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/40 text-sm flex-shrink-0">{label}</span>
      <span
        className={[
          "text-sm text-right",
          mono ? "font-mono" : "font-medium",
          highlight ? "text-emerald-400 font-semibold" : "text-white/90",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6L12 2z" />
      <path d="M9 12l2 2 4-4" strokeWidth="2" />
    </svg>
  );
}
