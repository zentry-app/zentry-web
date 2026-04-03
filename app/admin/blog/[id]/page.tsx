'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/dashboard/admin-layout';
import BlogForm from '@/components/admin/blog/BlogForm';
import { BlogService } from '@/lib/services/blog-service';
import { IBlogPost } from '@/types/models';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export default function EditPostPage() {
    const params = useParams();
    const { toast } = useToast();
    const [post, setPost] = useState<IBlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                if (typeof params.id === 'string') {
                    const data = await BlogService.getPostById(params.id);
                    if (data) {
                        setPost(data);
                    } else {
                        toast({
                            title: "Error",
                            description: "Artículo no encontrado",
                            variant: "destructive"
                        });
                    }
                }
            } catch (error) {
                console.error(error);
                toast({
                    title: "Error",
                    description: "Error al cargar el artículo",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [params.id, toast]);

    if (loading) {
        return (
            <AdminLayout requireGlobalAdmin={true}>
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AdminLayout>
        );
    }

    if (!post) {
        return (
            <AdminLayout requireGlobalAdmin={true}>
                <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
                    <h2 className="text-xl font-semibold">Artículo no encontrado</h2>
                    <p className="text-muted-foreground">El artículo que intentas editar no existe o ha sido eliminado.</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout requireGlobalAdmin={true}>
            <BlogForm initialData={post} isEditing={true} />
        </AdminLayout>
    );
}
