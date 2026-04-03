import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from "@/components/landing-new/Navbar";
import Footer from "@/components/landing-new/Footer";
import { BlogService } from '@/lib/services/blog-service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { ShareButtons } from '@/components/blog/ShareButtons';
import { sanitizeBlogContent } from '@/lib/utils/sanitize-html';

interface Props {
    params: { slug: string }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    console.warn('[Metadata] Generating metadata for slug:', params.slug);
    try {
        const post = await BlogService.getPostBySlug(params.slug);

        console.warn(`[Metadata] Post found? ${!!post}`);

        if (!post) {
            return {
                title: 'Artículo no encontrado | Zentry',
            };
        }

        return {
            title: `${post.title} | Blog Zentry`,
            description: post.excerpt || '',
            openGraph: {
                title: post.title,
                description: post.excerpt || '',
                images: post.coverImage ? [post.coverImage] : [],
                type: 'article',
                publishedTime: post.publishedAt?.toDate ? post.publishedAt.toDate().toISOString() : new Date().toISOString(),
                authors: [post.author?.name || 'Zentry Team'],
                tags: post.tags || [],
            },
        };
    } catch (error) {
        console.error('[Metadata] Error generating metadata:', error);
        return {
            title: 'Error | Zentry Blog',
            description: 'Error al cargar los detalles del artículo.',
        };
    }
}

export default async function BlogPostPage({ params }: Props) {
    console.warn('[Page] Rendering page for slug:', params.slug);
    let post;
    try {
        post = await BlogService.getPostBySlug(params.slug);
        console.warn(`[Page] Post fetched successfully? ${!!post}`);
    } catch (error) {
        console.error('Error loading blog post:', error);
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <Navbar forceScrolled={true} />
                <div className="text-center space-y-4 px-4">
                    <h1 className="text-2xl font-bold text-gray-900">Error al cargar el artículo</h1>
                    <p className="text-gray-500">Hubo un problema al conectar con el servidor. Por favor intenta más tarde.</p>
                    <Link href="/blog" className="text-blue-600 hover:underline">
                        Volver al blog
                    </Link>
                </div>
            </div>
        );
    }

    if (!post) {
        notFound();
    }

    let date;
    try {
        if (post.publishedAt?.toDate) {
            date = post.publishedAt.toDate();
        } else if (post.publishedAt) {
            date = new Date(post.publishedAt);
        } else {
            // Fallback if no date is present
            date = new Date();
        }

        // Check for invalid date
        if (isNaN(date.getTime())) {
            date = new Date();
        }
    } catch (e) {
        console.error('Error parsing date:', e);
        date = new Date();
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar forceScrolled={true} />

            <main className="pt-32 pb-20">
                {/* Progress Bar (Optional, can add later) */}

                <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    {/* Header: Floating Arc Style */}
                    <header className="mb-16 pt-8">
                        <Link
                            href="/blog"
                            className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 mb-12 transition-colors group"
                        >
                            <ArrowLeft className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Volver al Blog
                        </Link>

                        <div className="space-y-6 text-left">
                            <div className="flex items-center gap-3">
                                {(post.tags || []).slice(0, 1).map(tag => (
                                    <span key={tag} className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">
                                        {tag}
                                    </span>
                                ))}
                                <span className="h-px w-8 bg-gray-200" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    {format(date, 'MMMM d, yyyy', { locale: es })}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                                {post.title}
                            </h1>

                            <div className="flex items-center gap-4 pt-4">
                                <div className="flex items-center gap-3 group cursor-pointer">
                                    {post.author?.photoURL ? (
                                        <Image
                                            src={post.author.photoURL}
                                            alt={post.author?.name || 'Autor'}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full grayscale hover:grayscale-0 transition-all duration-500"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold border border-gray-200">
                                            {post.author?.name?.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm font-bold text-gray-900">{post.author?.name}</span>
                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Editor en Zentry</span>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-gray-100 mx-2" />
                                <div className="flex items-center gap-1.5 text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{post.readTime} min de lectura</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Featured Image - Ultra Clean */}
                    {post.coverImage && (
                        <div className="mb-20 -mx-4 sm:-mx-8 lg:-mx-24 overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2rem] bg-gray-50 aspect-[21/9]">
                            <Image
                                src={post.coverImage}
                                alt={post.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 1200px"
                            />
                        </div>
                    )}

                    {/* Content - Arc Style Typography */}
                    <div className="prose prose-blue max-w-none 
                        prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight
                        prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8
                        prose-p:text-gray-600 prose-p:text-lg prose-p:leading-relaxed prose-p:mb-8
                        prose-strong:text-black prose-strong:font-bold
                        prose-ul:list-none prose-ul:pl-0 prose-li:relative prose-li:pl-8 
                        prose-li:before:content-[''] prose-li:before:absolute prose-li:before:left-0 prose-li:before:top-[0.8em] prose-li:before:w-2 prose-li:before:h-2 prose-li:before:bg-blue-600 prose-li:before:rounded-full
                        prose-blockquote:border-l-0 prose-blockquote:bg-gray-50 prose-blockquote:px-10 prose-blockquote:py-8 prose-blockquote:rounded-[2rem] prose-blockquote:text-gray-900 prose-blockquote:text-2xl prose-blockquote:leading-relaxed prose-blockquote:not-italic prose-blockquote:font-medium
                        selection:bg-blue-100 selection:text-blue-900">
                        <div dangerouslySetInnerHTML={{ __html: sanitizeBlogContent(post.content || '') }} />
                    </div>

                    {/* Footer - Arc Minimalist Share */}
                    <div className="mt-32 mb-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-8 py-16 border-t border-gray-100">
                            <div className="bg-gray-50 px-6 py-2 rounded-full border border-gray-100">
                                <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Comparte este artículo</span>
                            </div>

                            <ShareButtons />
                        </div>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
