'use client';

import { KnowledgeBaseItem } from '@/types/support';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, Eye, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface KnowledgeBaseListProps {
  items: KnowledgeBaseItem[];
  loading: boolean;
  onItemSelect: (item: KnowledgeBaseItem) => void;
  onEdit: (item: KnowledgeBaseItem) => void;
  onDelete: (itemId: string) => void;
}

export function KnowledgeBaseList({
  items,
  loading,
  onItemSelect,
  onEdit,
  onDelete,
}: KnowledgeBaseListProps) {
  if (loading) {
    return (
      <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-primary" />
            Preguntas Frecuentes
          </CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black">Preguntas Frecuentes ({items.length})</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Gestiona las respuestas del chatbot</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        {items.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-50/80 border border-slate-100 text-muted-foreground font-medium">
            No hay preguntas frecuentes disponibles
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pregunta</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Veces Usada</TableHead>
                <TableHead>Efectividad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.knowledgeId}>
                  <TableCell className="max-w-[300px]">
                    <div className="truncate">{item.pregunta}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.categoria}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(item.roles || []).map((role) => (
                        <Badge key={role} variant="outline" className="text-xs capitalize">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{item.vecesUtilizada}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.efectividad >= 80
                          ? 'bg-green-500'
                          : item.efectividad >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }
                    >
                      {item.efectividad.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={item.activo ? 'bg-green-500' : 'bg-gray-500'}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2rem] border-white/20 shadow-zentry-lg max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold">{item.pregunta}</DialogTitle>
                            <DialogDescription asChild>
                              <div className="mt-4 space-y-3 text-slate-600">
                                <div className="flex gap-2 flex-wrap">
                                  <span className="font-semibold">Categoría:</span>
                                  <Badge variant="outline" className="font-normal">{item.categoria}</Badge>
                                </div>
                                <div>
                                  <span className="font-semibold">Tags:</span>
                                  <p className="mt-1 text-sm">{item.tags.join(', ') || '—'}</p>
                                </div>
                                <div className="mt-4">
                                  <span className="font-semibold">Respuesta:</span>
                                  <p className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                    {item.respuesta}
                                  </p>
                                </div>
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.knowledgeId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
