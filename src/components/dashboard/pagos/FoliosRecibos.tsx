"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  limit as limitFn,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  Search,
  Printer,
  Loader2,
  Calendar,
  Banknote,
  ArrowDownUp,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateReceiptPDF,
  formatHouseLabel,
} from "@/lib/utils/generate-receipt-pdf";
import { fmtFull } from "./payments-types";

interface FolioEntry {
  id: string;
  folio: string;
  houseId: string;
  houseLabel: string;
  residentName: string;
  payerName: string;
  amountCents: number;
  method: "cash" | "transfer" | "card" | string;
  concept: string;
  validatedAt: Date;
  createdAt: Date;
  referenceNumber?: string;
  periodKey?: string;
}

interface FoliosRecibosProps {
  residencialId: string;
}

type DateFilter = "all" | "today" | "week" | "month" | "3months";
type MethodFilter = "all" | "cash" | "transfer" | "card";
type SortOrder = "newest" | "oldest" | "amount_desc" | "amount_asc";

const MONTH_NAMES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatReceiptTimestamp(date: Date): string {
  const day = date.getDate();
  const month = MONTH_NAMES_ES[date.getMonth()];
  const year = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${day} de ${month} de ${year} · ${hh}:${mm}`;
}

function methodLabel(method: string): string {
  switch (method) {
    case "cash":
      return "Efectivo";
    case "transfer":
      return "Transferencia";
    case "card":
      return "Tarjeta";
    default:
      return method || "—";
  }
}

export default function FoliosRecibos({ residencialId }: FoliosRecibosProps) {
  const [folios, setFolios] = useState<FolioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  // Cached residencial fiscal data for reprinting
  const [residencialMeta, setResidencialMeta] = useState<{
    nombre?: string;
    direccion?: string;
    razonSocial?: string;
    rfc?: string;
    domicilioFiscal?: string;
  }>({});

  // Resolve residencialId → docId (may be legacy internal ID)
  const [residencialDocId, setResidencialDocId] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!residencialId) return;
      // First try as docId directly
      const direct = await getDoc(doc(db, "residenciales", residencialId));
      if (direct.exists()) {
        setResidencialDocId(residencialId);
        const d = direct.data();
        setResidencialMeta({
          nombre: d.nombre,
          direccion: d.direccion,
          razonSocial: d.datosFiscales?.razonSocial,
          rfc: d.datosFiscales?.rfc,
          domicilioFiscal: d.datosFiscales?.domicilioFiscal,
        });
        return;
      }
      // Fallback: search by legacy residencialID
      const q = query(
        collection(db, "residenciales"),
        where("residencialID", "==", residencialId),
        limitFn(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        setResidencialDocId(docSnap.id);
        const d = docSnap.data();
        setResidencialMeta({
          nombre: d.nombre,
          direccion: d.direccion,
          razonSocial: d.datosFiscales?.razonSocial,
          rfc: d.datosFiscales?.rfc,
          domicilioFiscal: d.datosFiscales?.domicilioFiscal,
        });
      }
    })();
  }, [residencialId]);

  // Load folios once we have the docId
  useEffect(() => {
    if (!residencialDocId) return;
    (async () => {
      setLoading(true);
      try {
        const piRef = collection(
          db,
          "residenciales",
          residencialDocId,
          "paymentIntents",
        );
        const q = query(
          piRef,
          where("status", "==", "validated"),
          orderBy("validatedAt", "desc"),
          limitFn(500),
        );
        const snap = await getDocs(q);

        const entries: FolioEntry[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          if (!data.folio) return; // skip entries without folio

          const validatedAt =
            data.validatedAt?.toDate?.() ||
            data.createdAt?.toDate?.() ||
            new Date();
          const createdAt = data.createdAt?.toDate?.() || validatedAt;

          entries.push({
            id: d.id,
            folio: data.folio,
            houseId: data.houseId || "",
            houseLabel: data.houseLabel || data.houseId || "",
            residentName: data.residentName || "",
            payerName: data.payerName || data.residentName || "",
            amountCents: data.amountCents || data.amount || 0,
            method: data.method || "",
            concept: data.concept || data.description || "Cuota Ordinaria",
            validatedAt,
            createdAt,
            referenceNumber: data.referenceNumber || data.reference,
            periodKey: data.periodKey,
          });
        });

        setFolios(entries);
      } catch (err) {
        console.error("[FoliosRecibos] Error loading folios:", err);
        toast.error("Error al cargar los folios");
      } finally {
        setLoading(false);
      }
    })();
  }, [residencialDocId]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = [...folios];

    // Search
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter(
        (f) =>
          f.folio.toLowerCase().includes(s) ||
          f.houseLabel.toLowerCase().includes(s) ||
          f.residentName.toLowerCase().includes(s) ||
          f.payerName.toLowerCase().includes(s),
      );
    }

    // Date filter
    const now = new Date();
    if (dateFilter !== "all") {
      const cutoff = new Date(now);
      if (dateFilter === "today") cutoff.setHours(0, 0, 0, 0);
      else if (dateFilter === "week") cutoff.setDate(now.getDate() - 7);
      else if (dateFilter === "month") cutoff.setDate(now.getDate() - 30);
      else if (dateFilter === "3months") cutoff.setDate(now.getDate() - 90);
      result = result.filter((f) => f.validatedAt >= cutoff);
    }

    // Method filter
    if (methodFilter !== "all") {
      result = result.filter((f) => f.method === methodFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortOrder === "newest")
        return b.validatedAt.getTime() - a.validatedAt.getTime();
      if (sortOrder === "oldest")
        return a.validatedAt.getTime() - b.validatedAt.getTime();
      if (sortOrder === "amount_desc") return b.amountCents - a.amountCents;
      if (sortOrder === "amount_asc") return a.amountCents - b.amountCents;
      return 0;
    });

    return result;
  }, [folios, search, dateFilter, methodFilter, sortOrder]);

  // Stats
  const totalAmount = useMemo(
    () => filtered.reduce((acc, f) => acc + f.amountCents, 0),
    [filtered],
  );

  const handlePrint = async (entry: FolioEntry) => {
    setPrinting(entry.id);
    try {
      await generateReceiptPDF({
        folio: entry.folio,
        houseId: entry.houseId,
        payerName: entry.payerName || entry.residentName || "—",
        concept: entry.concept,
        amountCents: entry.amountCents,
        method: methodLabel(entry.method),
        timestamp: formatReceiptTimestamp(entry.validatedAt),
        isAdmin: true,
        residencialName: residencialMeta.nombre,
        residencialAddress: residencialMeta.direccion,
        razonSocial: residencialMeta.razonSocial,
        rfc: residencialMeta.rfc,
        domicilioFiscal: residencialMeta.domicilioFiscal,
        referencia: entry.referenceNumber,
      });
      toast.success(`Recibo ${entry.folio} generado`);
    } catch (err) {
      console.error("[FoliosRecibos] Print error:", err);
      toast.error("Error al generar el recibo");
    } finally {
      setPrinting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Folios & Recibos
            </h2>
            <p className="text-xs text-muted-foreground">
              Historial de recibos generados — reimprime cualquier folio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {filtered.length} folios
          </Badge>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold">
            {fmtFull(totalAmount)}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200/70">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por folio, casa o residente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <Select
              value={dateFilter}
              onValueChange={(v) => setDateFilter(v as DateFilter)}
            >
              <SelectTrigger className="h-10">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
                <SelectItem value="all">Todo el historial</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={methodFilter}
              onValueChange={(v) => setMethodFilter(v as MethodFilter)}
            >
              <SelectTrigger className="h-10">
                <Banknote className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex justify-end">
            <Select
              value={sortOrder}
              onValueChange={(v) => setSortOrder(v as SortOrder)}
            >
              <SelectTrigger className="h-8 w-[200px] text-xs">
                <ArrowDownUp className="h-3 w-3 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
                <SelectItem value="amount_desc">Monto mayor a menor</SelectItem>
                <SelectItem value="amount_asc">Monto menor a mayor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-slate-200/70 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
            <p className="mt-3 text-sm text-muted-foreground">
              Cargando folios...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-10 w-10 mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No se encontraron folios
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ajusta los filtros o amplía el rango de fechas
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-colors"
              >
                {/* Folio badge */}
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/50 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-blue-600" />
                  </div>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {entry.folio}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 font-normal"
                    >
                      {methodLabel(entry.method)}
                    </Badge>
                    {entry.periodKey && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 font-normal bg-slate-50"
                      >
                        {entry.periodKey}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-800 truncate">
                      {entry.houseLabel || formatHouseLabel(entry.houseId)}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground truncate">
                      {entry.payerName || entry.residentName || "—"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatReceiptTimestamp(entry.validatedAt)}
                    {entry.referenceNumber && (
                      <>
                        {" · "}
                        <span className="font-mono">
                          Ref: {entry.referenceNumber}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-slate-900 text-base">
                    {fmtFull(entry.amountCents)}
                  </div>
                </div>

                {/* Print button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrint(entry)}
                  disabled={printing === entry.id}
                  className="flex-shrink-0 gap-1.5"
                >
                  {printing === entry.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Printer className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Imprimir</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
