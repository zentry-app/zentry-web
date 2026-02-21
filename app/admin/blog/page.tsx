'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/dashboard/admin-layout';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/components/ui';
import { BlogService } from '@/lib/services/blog-service';
import { IBlogPost } from '@/types/models';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BlogAdminPage() {
    const [posts, setPosts] = useState<IBlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<IBlogPost | null>(null);

    const { toast } = useToast();
    const router = useRouter();

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await BlogService.getAllPosts();
            setPosts(data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: `Error al cargar posts: ${error.message}`,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDeletePost = async () => {
        if (!selectedPost || !selectedPost.id) return;

        try {
            setLoading(true);
            await BlogService.deletePost(selectedPost.id);
            await fetchPosts();
            setIsDeleteDialogOpen(false);
            toast({
                title: 'Éxito',
                description: 'Post eliminado correctamente',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: `Error al eliminar post: ${error.message}`,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const openDeleteDialog = (post: IBlogPost) => {
        setSelectedPost(post);
        setIsDeleteDialogOpen(true);
    };

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        // Handle Firestore Timestamp or Date object
        const d = date.toDate ? date.toDate() : new Date(date);
        return format(d, 'PPP', { locale: es });
    };

    return (
        <AdminLayout requireGlobalAdmin={true}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Blog y Contenido</h1>
                    <p className="text-muted-foreground">
                        Gestiona los artículos y noticias del blog público
                    </p>
                </div>
                <Button onClick={() => router.push('/admin/blog/new')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Artículo
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Artículos Publicados</CardTitle>
                    <CardDescription>
                        Lista de todos los artículos del blog
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[400px]">Título</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Autor</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">Cargando...</TableCell>
                                </TableRow>
                            ) : posts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No hay artículos creados. ¡Empieza escribiendo uno!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                posts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{post.title}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[300px]">{post.slug}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {post.status === 'published' && <Badge className="bg-green-500">Publicado</Badge>}
                                            {post.status === 'draft' && <Badge variant="secondary">Borrador</Badge>}
                                            {post.status === 'scheduled' && <Badge className="bg-blue-500">Programado</Badge>}
                                            {post.status === 'archived' && <Badge variant="outline">Archivado</Badge>}
                                        </TableCell>
                                        <TableCell>
                                            {post.status === 'published' ? formatDate(post.publishedAt) :
                                                post.status === 'scheduled' ? (
                                                    <span className="text-blue-600 text-sm">📅 {formatDate(post.scheduledFor)}</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm italic">Sin publicar</span>
                                                )}
                                        </TableCell>
                                        <TableCell>{post.author?.name || 'Desconocido'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                {post.published && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/admin/blog/${post.id}`)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => openDeleteDialog(post)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Artículo</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar "{selectedPost?.title}"? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeletePost} disabled={loading}>
                            {loading ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
