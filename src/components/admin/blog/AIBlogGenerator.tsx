'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { getAuthSafe } from '@/lib/firebase/config';

interface AIGeneratorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerated: (data: {
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        coverImage: string;
        tags: string[];
        metaTitle?: string;
        metaDescription?: string;
    }) => void;
}

export function AIBlogGenerator({ open, onOpenChange, onGenerated }: AIGeneratorProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState<'professional' | 'casual' | 'technical' | 'friendly'>('professional');
    const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [includeImages, setIncludeImages] = useState(true);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            toast({
                title: 'Tema requerido',
                description: 'Por favor ingresa un tema para el artículo',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            const auth = await getAuthSafe();
            const user = auth?.currentUser;
            const token = user ? await user.getIdToken() : '';

            const response = await fetch('/api/blog/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    topic,
                    tone,
                    length,
                    language: 'es',
                    includeImages
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate content');
            }

            const data = await response.json();

            onGenerated({
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                content: data.content,
                coverImage: data.coverImage || '',
                tags: data.tags || [],
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription
            });

            toast({
                title: '✨ Artículo generado',
                description: 'El contenido ha sido generado exitosamente. Puedes editarlo antes de publicar.',
            });

            onOpenChange(false);
            setTopic('');
        } catch (error: any) {
            console.error('Generation error:', error);
            toast({
                title: 'Error',
                description: 'No se pudo generar el artículo. Intenta de nuevo.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-purple-500" />
                        Generar Artículo con IA
                    </DialogTitle>
                    <DialogDescription>
                        Describe el tema y la IA escribirá un artículo completo por ti
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="topic">Tema del Artículo *</Label>
                        <Input
                            id="topic"
                            placeholder="Ej: Beneficios de la tecnología en condominios"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Sé específico para mejores resultados
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tone">Tono</Label>
                            <Select value={tone} onValueChange={(v: any) => setTone(v)} disabled={loading}>
                                <SelectTrigger id="tone">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="professional">Profesional</SelectItem>
                                    <SelectItem value="casual">Casual</SelectItem>
                                    <SelectItem value="technical">Técnico</SelectItem>
                                    <SelectItem value="friendly">Amigable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="length">Longitud</Label>
                            <Select value={length} onValueChange={(v: any) => setLength(v)} disabled={loading}>
                                <SelectTrigger id="length">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="short">Corto (500-800)</SelectItem>
                                    <SelectItem value="medium">Medio (1000-1500)</SelectItem>
                                    <SelectItem value="long">Largo (2000-3000)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="images" className="text-sm font-medium">
                                Generar imagen de portada
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Usa DALL-E para crear la imagen
                            </p>
                        </div>
                        <Switch
                            id="images"
                            checked={includeImages}
                            onCheckedChange={setIncludeImages}
                            disabled={loading}
                        />
                    </div>

                    {loading && (
                        <div className="rounded-lg bg-purple-50 p-4 border border-purple-200">
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-purple-900">
                                        Generando artículo...
                                    </p>
                                    <p className="text-xs text-purple-700">
                                        Esto puede tomar 30-60 segundos
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleGenerate} disabled={loading || !topic.trim()}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
