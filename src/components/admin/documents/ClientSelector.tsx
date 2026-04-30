"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ClientsService } from "@/lib/services/clients-service";
import type { Client } from "@/types/documents";

interface ClientSelectorProps {
  value: Client | null;
  onChange: (client: Client) => void;
}

export function ClientSelector({ value, onChange }: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    direccion: "",
    rfc: "",
  });
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ClientsService.getAllClients().then(setClients);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.empresa.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q)
    );
  });

  const handleSelect = (c: Client) => {
    onChange(c);
    setOpen(false);
    setSearch("");
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = await ClientsService.createClient(newClient);
      setClients((prev) =>
        [...prev, created].sort((a, b) => a.empresa.localeCompare(b.empresa)),
      );
      onChange(created);
      setCreateOpen(false);
      setNewClient({
        nombre: "",
        empresa: "",
        email: "",
        telefono: "",
        direccion: "",
        rfc: "",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 h-11 text-sm font-medium bg-white hover:border-slate-400 transition-colors"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value
            ? `${value.empresa || value.nombre}`
            : "Seleccionar cliente..."}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 h-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Sin resultados
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {c.empresa || c.nombre}
                  </p>
                  {c.empresa && (
                    <p className="text-xs text-slate-400">{c.nombre}</p>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" /> Nuevo cliente
            </button>
          </div>
        </div>
      )}

      {/* Modal Crear Cliente */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black">Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: "Empresa / Razón Social*", key: "empresa" },
              { label: "Nombre del Contacto", key: "nombre" },
              { label: "Dirección de Facturación", key: "direccion" },
              { label: "Email", key: "email" },
              { label: "Teléfono", key: "telefono" },
              { label: "RFC", key: "rfc" },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {label}
                </Label>
                <Input
                  value={(newClient as any)[key]}
                  onChange={(e) =>
                    setNewClient((p) => ({ ...p, [key]: e.target.value }))
                  }
                  className="h-10 rounded-lg"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newClient.empresa || saving}
              className="bg-slate-900 text-white font-black rounded-xl"
            >
              {saving ? "Guardando..." : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
