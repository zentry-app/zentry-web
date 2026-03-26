import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Package, AlertTriangle, Search, Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import { CatalogService, Product, PenaltyRule } from '@/lib/services/catalog-service';

interface CatalogManagementProps {
    residencialId: string;
}

const CATEGORY_LABELS: Record<Product['category'], string> = {
    access: 'Acceso',
    amenity: 'Amenidad',
    service: 'Servicio',
    monthly: 'Mensual',
};

export default function CatalogManagement({ residencialId }: CatalogManagementProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [penaltyRules, setPenaltyRules] = useState<PenaltyRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [productDialog, setProductDialog] = useState(false);
    const [penaltyDialog, setPenaltyDialog] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'product' | 'penalty'; id: string } | null>(null);

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingPenalty, setEditingPenalty] = useState<PenaltyRule | null>(null);

    const defaultProduct: Omit<Product, 'id'> = {
        name: '', description: '', priceCents: 0, category: 'monthly', active: true,
    };
    const defaultPenalty: Omit<PenaltyRule, 'id'> = {
        name: '', description: '', amountCents: 0, type: 'fixed', active: true,
    };

    const [productForm, setProductForm] = useState(defaultProduct);
    const [penaltyForm, setPenaltyForm] = useState(defaultPenalty);

    const loadCatalogs = useCallback(async () => {
        setLoading(true);
        console.log('[CatalogManagement] Loading for residencialId:', residencialId);
        try {
            const [prodRes, rulesRes] = await Promise.allSettled([
                CatalogService.getProducts(residencialId),
                CatalogService.getPenaltyRules(residencialId),
            ]);
            console.log('[CatalogManagement] Products:', prodRes.status, prodRes.status === 'fulfilled' ? prodRes.value.length : (prodRes as any).reason?.message);
            console.log('[CatalogManagement] Rules:', rulesRes.status, rulesRes.status === 'fulfilled' ? rulesRes.value.length : (rulesRes as any).reason?.message);
            if (prodRes.status === 'fulfilled') setProducts(prodRes.value);
            if (rulesRes.status === 'fulfilled') setPenaltyRules(rulesRes.value);
        } catch (error) {
            console.error('[CatalogManagement] Error:', error);
        } finally {
            setLoading(false);
        }
    }, [residencialId]);

    useEffect(() => {
        if (residencialId) loadCatalogs();
    }, [loadCatalogs, residencialId]);

    const handleSaveProduct = async () => {
        if (!productForm.name || productForm.priceCents < 0) {
            toast.warning('Completa todos los campos requeridos');
            return;
        }
        try {
            if (editingProduct) {
                await CatalogService.updateProduct(residencialId, editingProduct.id, productForm);
                toast.success('Producto actualizado');
            } else {
                await CatalogService.addProduct(residencialId, productForm);
                toast.success('Producto creado');
            }
            setProductDialog(false);
            loadCatalogs();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Error al guardar');
        }
    };

    const handleSavePenalty = async () => {
        if (!penaltyForm.name || penaltyForm.amountCents < 0) {
            toast.warning('Completa todos los campos requeridos');
            return;
        }
        try {
            if (editingPenalty) {
                await CatalogService.updatePenaltyRule(residencialId, editingPenalty.id, penaltyForm);
                toast.success('Regla actualizada');
            } else {
                await CatalogService.addPenaltyRule(residencialId, penaltyForm);
                toast.success('Regla creada');
            }
            setPenaltyDialog(false);
            loadCatalogs();
        } catch (error) {
            console.error('Error saving penalty:', error);
            toast.error('Error al guardar');
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            if (deleteConfirm.type === 'product') {
                await CatalogService.deleteProduct(residencialId, deleteConfirm.id);
            } else {
                await CatalogService.deletePenaltyRule(residencialId, deleteConfirm.id);
            }
            toast.success('Elemento eliminado');
            setDeleteConfirm(null);
            loadCatalogs();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar');
        }
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredPenalties = penaltyRules.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const displayPrice = (cents: number) => `$${(cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white/80 p-6 rounded-[2rem] shadow-zentry">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Catalogos y Reglas
                    </h2>
                    <p className="text-muted-foreground mt-1">Configura productos, cuotas y penalizaciones.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar..."
                        className="pl-9 h-11 rounded-xl bg-slate-50 border-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl bg-white/80 p-1 h-14 shadow-zentry border border-slate-100">
                    <TabsTrigger value="products" className="rounded-xl h-12 font-bold data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                        <Package className="w-4 h-4 mr-2" /> Productos y Cuotas
                    </TabsTrigger>
                    <TabsTrigger value="penalties" className="rounded-xl h-12 font-bold data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                        <AlertTriangle className="w-4 h-4 mr-2" /> Reglas y Multas
                    </TabsTrigger>
                </TabsList>

                {/* Products Tab */}
                <TabsContent value="products" className="mt-6">
                    <Card className="rounded-[2rem] border-none shadow-zentry bg-white/80">
                        <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                            <div>
                                <CardTitle className="text-xl font-bold">Conceptos de Cobro</CardTitle>
                                <CardDescription>Productos y cuotas que puedes cobrar a residentes.</CardDescription>
                            </div>
                            <Button
                                onClick={() => { setEditingProduct(null); setProductForm(defaultProduct); setProductDialog(true); }}
                                className="rounded-full bg-blue-600 hover:bg-blue-700 h-11 px-6 shadow-md hover:shadow-lg transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="group relative bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800">{product.name}</div>
                                            <div className={`px-2 py-1 text-[10px] font-black uppercase rounded-full ${product.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {product.active ? 'Activo' : 'Inactivo'}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-500 h-10 line-clamp-2 mb-2">{product.description || 'Sin descripcion'}</div>
                                        <div className="font-black text-lg text-blue-600 mb-1">{displayPrice(product.priceCents)}</div>
                                        <div className="text-xs text-slate-400 font-medium mb-4">{CATEGORY_LABELS[product.category]}</div>
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm" onClick={() => { setEditingProduct(product); setProductForm(product); setProductDialog(true); }}>
                                                <Edit className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm" onClick={() => setDeleteConfirm({ isOpen: true, type: 'product', id: product.id })}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="col-span-full text-center py-10 text-slate-400 font-medium">No se encontraron productos.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Penalty Rules Tab */}
                <TabsContent value="penalties" className="mt-6">
                    <Card className="rounded-[2rem] border-none shadow-zentry bg-white/80">
                        <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                            <div>
                                <CardTitle className="text-xl font-bold">Multas y Penalizaciones</CardTitle>
                                <CardDescription>Recargos por morosidad o incumplimientos.</CardDescription>
                            </div>
                            <Button
                                onClick={() => { setEditingPenalty(null); setPenaltyForm(defaultPenalty); setPenaltyDialog(true); }}
                                className="rounded-full bg-orange-600 hover:bg-orange-700 h-11 px-6 shadow-md hover:shadow-lg transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Nueva Regla
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {filteredPenalties.map((rule) => (
                                    <div key={rule.id} className="group relative bg-orange-50/50 border border-orange-100 p-5 rounded-2xl hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800">{rule.name}</div>
                                            <div className={`px-2 py-1 text-[10px] font-black uppercase rounded-full ${rule.active ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {rule.active ? 'Activo' : 'Inactivo'}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-500 h-10 line-clamp-2 mb-2">{rule.description || 'Sin descripcion'}</div>
                                        <div className="font-black text-lg text-orange-600 mb-1">
                                            {rule.type === 'percentage' ? `${rule.amountCents / 100}%` : displayPrice(rule.amountCents)}
                                        </div>
                                        <div className="text-xs text-slate-400 capitalize mb-4">Tipo: {rule.type === 'fixed' ? 'Fijo' : 'Porcentaje'}</div>
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm bg-white hover:bg-slate-100" onClick={() => { setEditingPenalty(rule); setPenaltyForm(rule); setPenaltyDialog(true); }}>
                                                <Edit className="h-4 w-4 text-orange-600" />
                                            </Button>
                                            <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm" onClick={() => setDeleteConfirm({ isOpen: true, type: 'penalty', id: rule.id })}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {filteredPenalties.length === 0 && (
                                    <div className="col-span-full text-center py-10 text-slate-400 font-medium">No se encontraron reglas configuradas.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Product Dialog */}
            <Dialog open={productDialog} onOpenChange={setProductDialog}>
                <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                        <DialogDescription>Define nombre, precio y categoria del producto.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre *</Label>
                            <Input placeholder="Ej. Cuota Mensual" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="h-11 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripcion</Label>
                            <Input placeholder="Opcional..." value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="h-11 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Precio (centavos) *</Label>
                                <div className="relative">
                                    <Input
                                        type="number" min="0" step="1" placeholder="0"
                                        value={productForm.priceCents || ''}
                                        onChange={e => setProductForm({ ...productForm, priceCents: parseInt(e.target.value) || 0 })}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select value={productForm.category} onValueChange={(val: Product['category']) => setProductForm({ ...productForm, category: val })}>
                                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Mensual</SelectItem>
                                        <SelectItem value="access">Acceso</SelectItem>
                                        <SelectItem value="amenity">Amenidad</SelectItem>
                                        <SelectItem value="service">Servicio</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch checked={productForm.active} onCheckedChange={c => setProductForm({ ...productForm, active: c })} id="active-prod" />
                            <Label htmlFor="active-prod">Activo y visible</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setProductDialog(false)} className="rounded-xl h-11">Cancelar</Button>
                        <Button onClick={handleSaveProduct} className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700">Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Penalty Dialog */}
            <Dialog open={penaltyDialog} onOpenChange={setPenaltyDialog}>
                <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-orange-600">{editingPenalty ? 'Editar Regla' : 'Nueva Regla'}</DialogTitle>
                        <DialogDescription>Penalizaciones por atrasos o incumplimientos.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre *</Label>
                            <Input placeholder="Ej. Recargo por Morosidad" value={penaltyForm.name} onChange={e => setPenaltyForm({ ...penaltyForm, name: e.target.value })} className="h-11 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripcion</Label>
                            <Input placeholder="Opcional..." value={penaltyForm.description} onChange={e => setPenaltyForm({ ...penaltyForm, description: e.target.value })} className="h-11 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Modalidad</Label>
                                <Select value={penaltyForm.type} onValueChange={(val: PenaltyRule['type']) => setPenaltyForm({ ...penaltyForm, type: val })}>
                                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Tipo" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">Monto Fijo</SelectItem>
                                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor (centavos) *</Label>
                                <Input
                                    type="number" min="0" step="1" placeholder="0"
                                    value={penaltyForm.amountCents || ''}
                                    onChange={e => setPenaltyForm({ ...penaltyForm, amountCents: parseInt(e.target.value) || 0 })}
                                    className="h-11 rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch checked={penaltyForm.active} onCheckedChange={c => setPenaltyForm({ ...penaltyForm, active: c })} id="active-penalty" />
                            <Label htmlFor="active-penalty">Regla Activa</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPenaltyDialog(false)} className="rounded-xl h-11">Cancelar</Button>
                        <Button onClick={handleSavePenalty} className="rounded-xl h-11 bg-orange-600 hover:bg-orange-700">Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-sm">
                    <DialogHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-2xl text-center">Eliminar elemento?</DialogTitle>
                        <DialogDescription className="text-center">Esta accion no se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
                        <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setDeleteConfirm(null)}>Mantener</Button>
                        <Button variant="destructive" className="w-full h-12 rounded-xl" onClick={handleDelete}>Si, eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
