import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Package, AlertTriangle, Search, Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import { CatalogService, ProductoCatalog, MultaCatalog } from '@/lib/services/catalog-service';

interface CatalogManagementProps {
    residencialId: string;
}

export default function CatalogManagement({ residencialId }: CatalogManagementProps) {
    const [productos, setProductos] = useState<ProductoCatalog[]>([]);
    const [multas, setMultas] = useState<MultaCatalog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog states
    const [productDialog, setProductDialog] = useState(false);
    const [multaDialog, setMultaDialog] = useState(false);
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; type: 'producto' | 'multa', id: string } | null>(null);

    // Form states
    const [editingProducto, setEditingProducto] = useState<ProductoCatalog | null>(null);
    const [editingMulta, setEditingMulta] = useState<MultaCatalog | null>(null);

    const defaultProducto: Omit<ProductoCatalog, 'id'> = {
        nombre: '',
        descripcion: '',
        precioSugerido: 0,
        tipo: 'recurrente',
        activo: true
    };

    const defaultMulta: Omit<MultaCatalog, 'id'> = {
        nombre: '',
        descripcion: '',
        monto: 0,
        tipo: 'fija',
        activo: true
    };

    const [productForm, setProductForm] = useState(defaultProducto);
    const [multaForm, setMultaForm] = useState(defaultMulta);

    const loadCatalogs = useCallback(async () => {
        setLoading(true);
        try {
            const [prodData, multasData] = await Promise.all([
                CatalogService.getProductos(residencialId),
                CatalogService.getMultas(residencialId)
            ]);
            setProductos(prodData);
            setMultas(multasData);
        } catch (error) {
            console.error('Error loading catalogs:', error);
            toast.error('Error al cargar los catálogos');
        } finally {
            setLoading(false);
        }
    }, [residencialId]);

    useEffect(() => {
        if (residencialId) {
            loadCatalogs();
        }
    }, [loadCatalogs, residencialId]);

    const handleSaveProduct = async () => {
        if (!productForm.nombre || productForm.precioSugerido < 0) {
            toast.warning('Por favor completa todos los campos requeridos correctamente');
            return;
        }

        try {
            if (editingProducto) {
                await CatalogService.updateProducto(residencialId, editingProducto.id, productForm);
                toast.success('Producto actualizado exitosamente');
            } else {
                await CatalogService.addProducto(residencialId, productForm);
                toast.success('Producto creado exitosamente');
            }
            setProductDialog(false);
            loadCatalogs();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Ocurrió un error al guardar');
        }
    };

    const handleSaveMulta = async () => {
        if (!multaForm.nombre || multaForm.monto < 0) {
            toast.warning('Por favor completa todos los campos requeridos correctamente');
            return;
        }

        try {
            if (editingMulta) {
                await CatalogService.updateMulta(residencialId, editingMulta.id, multaForm);
                toast.success('Regla actualizada exitosamente');
            } else {
                await CatalogService.addMulta(residencialId, multaForm);
                toast.success('Regla creada exitosamente');
            }
            setMultaDialog(false);
            loadCatalogs();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Ocurrió un error al guardar');
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirmDialog) return;

        try {
            if (deleteConfirmDialog.type === 'producto') {
                await CatalogService.deleteProducto(residencialId, deleteConfirmDialog.id);
            } else {
                await CatalogService.deleteMulta(residencialId, deleteConfirmDialog.id);
            }
            toast.success('Elemento eliminado');
            setDeleteConfirmDialog(null);
            loadCatalogs();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar');
        }
    };

    const filteredProductos = productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredMultas = multas.filter(m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Catálogos y Reglas
                    </h2>
                    <p className="text-muted-foreground mt-1">Configura los productos, cuotas y multas de tu residencial.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar en catálogos..."
                        className="pl-9 h-11 rounded-xl bg-slate-50 border-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="productos" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl bg-white p-1 h-14 shadow-sm border border-slate-100">
                    <TabsTrigger value="productos" className="rounded-xl h-12 font-bold data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                        <Package className="w-4 h-4 mr-2" />
                        Productos y Cuotas
                    </TabsTrigger>
                    <TabsTrigger value="multas" className="rounded-xl h-12 font-bold data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Reglas y Multas
                    </TabsTrigger>
                </TabsList>

                {/* PESTAÑA PRODUCTOS */}
                <TabsContent value="productos" className="mt-6">
                    <Card className="rounded-[2rem] border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                            <div>
                                <CardTitle className="text-xl font-bold">Conceptos de Cobro</CardTitle>
                                <CardDescription>Crea los conceptos que podrás cobrar a tus residentes.</CardDescription>
                            </div>
                            <Button
                                onClick={() => { setEditingProducto(null); setProductForm(defaultProducto); setProductDialog(true); }}
                                className="rounded-full bg-blue-600 hover:bg-blue-700 h-11 px-6 shadow-md hover:shadow-lg transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {filteredProductos.map((prod) => (
                                    <div key={prod.id} className="group relative bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800">{prod.nombre}</div>
                                            <div className={`px-2 py-1 text-[10px] font-black uppercase rounded-full ${prod.activo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {prod.activo ? 'Activo' : 'Inactivo'}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-500 h-10 line-clamp-2 mb-2">{prod.descripcion || 'Sin descripción'}</div>
                                        <div className="font-black text-lg text-blue-600 mb-2">{formatCurrency(prod.precioSugerido)}</div>
                                        <div className="text-xs text-slate-400 capitalize mb-4">Monto {prod.tipo}</div>

                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm" onClick={() => { setEditingProducto(prod); setProductForm(prod); setProductDialog(true); }}>
                                                <Edit className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm" onClick={() => setDeleteConfirmDialog({ isOpen: true, type: 'producto', id: prod.id })}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {filteredProductos.length === 0 && (
                                    <div className="col-span-full text-center py-10 text-slate-400 font-medium">
                                        No se encontraron productos. Crea el primero.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PESTAÑA MULTAS */}
                <TabsContent value="multas" className="mt-6">
                    <Card className="rounded-[2rem] border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                            <div>
                                <CardTitle className="text-xl font-bold">Multas y Penalizaciones</CardTitle>
                                <CardDescription>Configura los recargos automáticos o manuales por morosidad o faltas.</CardDescription>
                            </div>
                            <Button
                                onClick={() => { setEditingMulta(null); setMultaForm(defaultMulta); setMultaDialog(true); }}
                                className="rounded-full bg-orange-600 hover:bg-orange-700 h-11 px-6 shadow-md hover:shadow-lg transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Nueva Regla
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {filteredMultas.map((multa) => (
                                    <div key={multa.id} className="group relative bg-orange-50/50 border border-orange-100 p-5 rounded-2xl hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800">{multa.nombre}</div>
                                            <div className={`px-2 py-1 text-[10px] font-black uppercase rounded-full ${multa.activo ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {multa.activo ? 'Activo' : 'Inactivo'}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-500 h-10 line-clamp-2 mb-2">{multa.descripcion || 'Sin descripción'}</div>
                                        <div className="font-black text-lg text-orange-600 mb-2">
                                            {multa.tipo === 'porcentaje' ? `${multa.monto}%` : formatCurrency(multa.monto)}
                                        </div>
                                        <div className="text-xs text-slate-400 capitalize mb-4">Tipo: {multa.tipo}</div>

                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm bg-white hover:bg-slate-100" onClick={() => { setEditingMulta(multa); setMultaForm(multa); setMultaDialog(true); }}>
                                                <Edit className="h-4 w-4 text-orange-600" />
                                            </Button>
                                            <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm" onClick={() => setDeleteConfirmDialog({ isOpen: true, type: 'multa', id: multa.id })}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {filteredMultas.length === 0 && (
                                    <div className="col-span-full text-center py-10 text-slate-400 font-medium">
                                        No se encontraron multas configuradas.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* PRODUCT DIALOG */}
            <Dialog open={productDialog} onOpenChange={setProductDialog}>
                <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{editingProducto ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                        <DialogDescription>Define el nombre y el precio base sugerido para este concepto.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre del Producto *</Label>
                            <Input
                                placeholder="Ej. Cuota Mensual"
                                value={productForm.nombre}
                                onChange={e => setProductForm({ ...productForm, nombre: e.target.value })}
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input
                                placeholder="Opcional..."
                                value={productForm.descripcion}
                                onChange={e => setProductForm({ ...productForm, descripcion: e.target.value })}
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Precio Base Sugerido *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={productForm.precioSugerido || ''}
                                        onChange={e => setProductForm({ ...productForm, precioSugerido: parseFloat(e.target.value) || 0 })}
                                        className="pl-7 h-11 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Cobro</Label>
                                <Select value={productForm.tipo} onValueChange={(val: any) => setProductForm({ ...productForm, tipo: val })}>
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="recurrente">Recurrente (Mensual)</SelectItem>
                                        <SelectItem value="unico">Pago Único</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                checked={productForm.activo}
                                onCheckedChange={c => setProductForm({ ...productForm, activo: c })}
                                id="active-prod"
                            />
                            <Label htmlFor="active-prod">Activo y visible</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setProductDialog(false)} className="rounded-xl h-11">Cancelar</Button>
                        <Button onClick={handleSaveProduct} className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700">Guardar Producto</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MULTA DIALOG */}
            <Dialog open={multaDialog} onOpenChange={setMultaDialog}>
                <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-orange-600">{editingMulta ? 'Editar Regla/Multa' : 'Nueva Regla/Multa'}</DialogTitle>
                        <DialogDescription>Aplica penalizaciones por atrasos o incumplimientos.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre de la Penalización *</Label>
                            <Input
                                placeholder="Ej. Recargo por Morosidad"
                                value={multaForm.nombre}
                                onChange={e => setMultaForm({ ...multaForm, nombre: e.target.value })}
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input
                                placeholder="Opcional..."
                                value={multaForm.descripcion}
                                onChange={e => setMultaForm({ ...multaForm, descripcion: e.target.value })}
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Modalidad</Label>
                                <Select value={multaForm.tipo} onValueChange={(val: any) => setMultaForm({ ...multaForm, tipo: val })}>
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fija">Monto Fijo</SelectItem>
                                        <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor *</Label>
                                <div className="relative">
                                    {multaForm.tipo === 'fija' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>}
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={multaForm.monto || ''}
                                        onChange={e => setMultaForm({ ...multaForm, monto: parseFloat(e.target.value) || 0 })}
                                        className={`${multaForm.tipo === 'fija' ? 'pl-7' : 'pr-7'} h-11 rounded-xl`}
                                    />
                                    {multaForm.tipo === 'porcentaje' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                checked={multaForm.activo}
                                onCheckedChange={c => setMultaForm({ ...multaForm, activo: c })}
                                id="active-multa"
                            />
                            <Label htmlFor="active-multa">Regla Activa</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setMultaDialog(false)} className="rounded-xl h-11">Cancelar</Button>
                        <Button onClick={handleSaveMulta} className="rounded-xl h-11 bg-orange-600 hover:bg-orange-700">Guardar Regla</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRM */}
            <Dialog open={deleteConfirmDialog !== null} onOpenChange={() => setDeleteConfirmDialog(null)}>
                <DialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-sm">
                    <DialogHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-2xl text-center">¿Eliminar elemento?</DialogTitle>
                        <DialogDescription className="text-center">Esta acción no se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
                        <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setDeleteConfirmDialog(null)}>
                            Mantener
                        </Button>
                        <Button variant="destructive" className="w-full h-12 rounded-xl" onClick={handleDelete}>
                            Sí, eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
