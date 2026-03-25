'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { BlogEditor } from './Editor';
import { IBlogPost, BlogPostStatus } from '@/types/models';
import { BlogService } from '@/lib/services/blog-service';
import { Save, ArrowLeft, Loader2, X, Calendar, Eye, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AIBlogGenerator } from './AIBlogGenerator';

interface BlogFormProps {
    initialData?: IBlogPost;
    isEditing?: boolean;
    basePath?: string;
}

export const BlogForm = ({ initialData, isEditing = false, basePath = '/admin/blog' }: BlogFormProps) => {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);

    // Core Fields
    const [title, setTitle] = useState(initialData?.title || '');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');

    // Status & Publishing
    const [status, setStatus] = useState<BlogPostStatus>(initialData?.status || 'draft');
    const [scheduledFor, setScheduledFor] = useState(
        initialData?.scheduledFor ? new Date(initialData.scheduledFor.toDate?.() || initialData.scheduledFor).toISOString().slice(0, 16) : ''
    );

    // Metadata
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [readTime, setReadTime] = useState(initialData?.readTime || 5);
    const [wordCount, setWordCount] = useState(initialData?.wordCount || 0);
    const [featured, setFeatured] = useState(initialData?.featured || false);
    const [order, setOrder] = useState(initialData?.order || 0);

    // SEO Fields
    const [seoOpen, setSeoOpen] = useState(false);
    const [metaTitle, setMetaTitle] = useState(initialData?.seo?.metaTitle || '');
    const [metaDescription, setMetaDescription] = useState(initialData?.seo?.metaDescription || '');
    const [canonicalUrl, setCanonicalUrl] = useState(initialData?.seo?.canonicalUrl || '');
    const [noindex, setNoindex] = useState(initialData?.seo?.noindex || false);
    const [nofollow, setNofollow] = useState(initialData?.seo?.nofollow || false);
    const [ogImage, setOgImage] = useState(initialData?.seo?.ogImage || '');

    // Load user
    useEffect(() => {
        const user = { uid: 'admin-id', name: 'Admin', photoURL: '' };
        setCurrentUser(user);
    }, [initialData]);

    // Auto-generate slug from title
    useEffect(() => {
        if (!isEditing && title) {
            const generatedSlug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setSlug(generatedSlug);
        }
    }, [title, isEditing]);

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

    const cleanForAI = (html: string) => {
        return stripHtml(html)
            .replace(/[^\w\s.,!?-]/g, '') // Remove emojis and special chars
            .replace(/\s+/g, ' ')
            .trim();
    };

    const calculateMetrics = useCallback((htmlContent: string) => {
        const text = stripHtml(htmlContent);
        const words = text.split(/\s+/).filter(w => w.length > 0).length;
        const wordsPerMinute = 200;
        const minutes = Math.ceil(words / wordsPerMinute);
        return {
            wordCount: words,
            readTime: Math.max(1, minutes)
        };
    }, []);

    // Update metrics when content changes
    useEffect(() => {
        const metrics = calculateMetrics(content);
        setReadTime(metrics.readTime);
        setWordCount(metrics.wordCount);
    }, [calculateMetrics, content]);

    const handleAIGenerated = (data: any) => {
        setTitle(data.title);
        setSlug(data.slug);
        setExcerpt(data.excerpt);
        setContent(data.content);
        setCoverImage(data.coverImage);
        setTags(data.tags || []);
        setMetaTitle(data.metaTitle || '');
        setMetaDescription(data.metaDescription || '');

        toast({
            title: '✨ Contenido aplicado',
            description: 'Revisa y edita el contenido generado antes de publicar.',
        });
    };

    const handleSubmit = async () => {
        if (!title || !slug || !content) {
            toast({
                title: "Faltan datos",
                description: "El título, slug y contenido son obligatorios.",
                variant: "destructive"
            });
            return;
        }

        // Validate scheduled date
        if (status === 'scheduled' && !scheduledFor) {
            toast({
                title: "Fecha requerida",
                description: "Debes especificar una fecha para publicar el artículo programado.",
                variant: "destructive"
            });
            return;
        }

        try {
            setLoading(true);

            const isPublished = status === 'published';

            const postData: Partial<IBlogPost> = {
                title,
                slug,
                excerpt,
                content,
                coverImage,
                status,
                published: isPublished,
                publishedAt: isPublished ? (initialData?.publishedAt || new Date()) : null,
                scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
                tags,
                readTime,
                wordCount,
                featured,
                order,
                content_for_ai: cleanForAI(content),
                seo: {
                    metaTitle: metaTitle || null,
                    metaDescription: metaDescription || null,
                    canonicalUrl: canonicalUrl || null,
                    noindex,
                    nofollow,
                    ogImage: ogImage || null,
                },
                author: initialData?.author || {
                    uid: currentUser?.uid || 'admin',
                    name: currentUser?.name || 'Administrador',
                    photoURL: currentUser?.photoURL || ''
                }
            };

            if (isEditing && initialData?.id) {
                await BlogService.updatePost(initialData.id, postData);
                toast({ title: "Guardado", description: "El artículo ha sido actualizado." });
            } else {
                await BlogService.createPost(postData as Omit<IBlogPost, 'id' | 'createdAt' | 'updatedAt'>);
                toast({ title: "Creado", description: "El artículo ha sido creado exitosamente." });
                router.push(basePath);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Ocurrió un error al guardar.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = () => {
        switch (status) {
            case 'published':
                return <Badge className="bg-green-500">Publicado</Badge>;
            case 'scheduled':
                return <Badge className="bg-blue-500"><Calendar className="w-3 h-3 mr-1" />Programado</Badge>;
            case 'archived':
                return <Badge variant="outline">Archivado</Badge>;
            default:
                return <Badge variant="secondary">Borrador</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex items-center justify-between sticky top-[60px] z-20 bg-background/95 backdrop-blur py-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold">{isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}</h1>
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            {getStatusBadge()}
                            <span>•</span>
                            <span>{wordCount} palabras</span>
                            <span>•</span>
                            <span>{readTime} min lectura</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAiModalOpen(true)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-none"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generar con IA
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => window.open(`/blog/${slug}`, '_blank')}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-2">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Título del artículo"
                            className="text-3xl font-bold border-none shadow-none px-0 h-auto placeholder:text-muted-foreground focus-visible:ring-0"
                        />
                        <div className="flex items-center text-sm text-muted-foreground gap-1">
                            <span>slug:</span>
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="h-6 text-xs w-full max-w-sm font-mono border-none bg-transparent shadow-none p-0 focus-visible:ring-0 text-muted-foreground hover:text-foreground transition-colors"
                                placeholder="url-amigable"
                            />
                        </div>
                    </div>

                    <BlogEditor
                        content={content}
                        onChange={setContent}
                        placeholder="Empieza a escribir tu historia..."
                    />
                </div>

                {/* Sidebar Metadata */}
                <div className="space-y-4">
                    {/* Status & Publishing */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Estado y Publicación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select value={status} onValueChange={(v) => setStatus(v as BlogPostStatus)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Borrador</SelectItem>
                                        <SelectItem value="published">Publicado</SelectItem>
                                        <SelectItem value="scheduled">Programado</SelectItem>
                                        <SelectItem value="archived">Archivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {status === 'scheduled' && (
                                <div className="space-y-2">
                                    <Label>Fecha de Publicación</Label>
                                    <Input
                                        type="datetime-local"
                                        value={scheduledFor}
                                        onChange={(e) => setScheduledFor(e.target.value)}
                                    />
                                </div>
                            )}

                            <Separator />

                            <div className="flex items-center justify-between">
                                <Label htmlFor="featured">Destacado</Label>
                                <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
                            </div>

                            <div className="space-y-2">
                                <Label>Orden (Homepage)</Label>
                                <Input
                                    type="number"
                                    value={order}
                                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cover Image */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Imagen de Portada</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Input
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                placeholder="https://..."
                            />
                            {coverImage && (
                                <div className="mt-2 rounded-lg overflow-hidden border aspect-video relative group">
                                    <Image
                                        src={coverImage}
                                        alt="Cover"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 480px"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Excerpt */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Extracto</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                placeholder="Breve resumen para tarjetas y SEO..."
                            />
                        </CardContent>
                    </Card>

                    {/* Tags */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Etiquetas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                        {tag}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                                    </Badge>
                                ))}
                            </div>
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder="Escribe y presiona Enter..."
                            />
                        </CardContent>
                    </Card>

                    {/* SEO Advanced (Collapsible) */}
                    <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
                        <Card>
                            <CollapsibleTrigger asChild>
                                <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium">SEO Avanzado</CardTitle>
                                        {seoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-4 pt-0">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Meta Title (opcional, usa título por defecto)</Label>
                                        <Input
                                            value={metaTitle}
                                            onChange={(e) => setMetaTitle(e.target.value)}
                                            placeholder={title || "Título SEO..."}
                                            maxLength={60}
                                        />
                                        <span className="text-xs text-muted-foreground">{metaTitle.length}/60</span>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Meta Description (opcional, usa extracto por defecto)</Label>
                                        <textarea
                                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={metaDescription}
                                            onChange={(e) => setMetaDescription(e.target.value)}
                                            placeholder={excerpt || "Descripción SEO..."}
                                            maxLength={160}
                                        />
                                        <span className="text-xs text-muted-foreground">{metaDescription.length}/160</span>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Canonical URL (opcional)</Label>
                                        <Input
                                            value={canonicalUrl}
                                            onChange={(e) => setCanonicalUrl(e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">OG Image (opcional, usa cover por defecto)</Label>
                                        <Input
                                            value={ogImage}
                                            onChange={(e) => setOgImage(e.target.value)}
                                            placeholder={coverImage || "https://..."}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="noindex" className="text-xs">No Index</Label>
                                        <Switch id="noindex" checked={noindex} onCheckedChange={setNoindex} />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="nofollow" className="text-xs">No Follow</Label>
                                        <Switch id="nofollow" checked={nofollow} onCheckedChange={setNofollow} />
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                </div>
            </div>

            <AIBlogGenerator
                open={aiModalOpen}
                onOpenChange={setAiModalOpen}
                onGenerated={handleAIGenerated}
            />
        </div>
    );
};

export default BlogForm;
