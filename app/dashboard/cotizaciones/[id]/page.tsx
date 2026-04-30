"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DocumentForm } from "@/components/admin/documents/DocumentForm";
import { DocumentsService } from "@/lib/services/documents-service";
import type { ZentryDocument } from "@/types/documents";
import { Loader2 } from "lucide-react";

export default function EditDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<ZentryDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DocumentsService.getDocument(id).then((d) => {
      setDoc(d);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-slate-400 font-black">Documento no encontrado.</p>
      </div>
    );
  }

  return <DocumentForm existingDocument={doc} />;
}
