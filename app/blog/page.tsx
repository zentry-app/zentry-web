'use client';

import { useState, useEffect } from 'react';
import Navbar from "@/components/landing-new/Navbar";
import Footer from "@/components/landing-new/Footer";
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogService } from '@/lib/services/blog-service';
import { IBlogPost } from '@/types/models';
import { motion } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function BlogPage() {
    const [posts, setPosts] = useState<IBlogPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<IBlogPost[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await BlogService.getPublishedPosts();
                setPosts(data);
                setFilteredPosts(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredPosts(posts);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = posts.filter(post =>
                post.title.toLowerCase().includes(query) ||
                post.excerpt.toLowerCase().includes(query) ||
                post.tags.some(tag => tag.toLowerCase().includes(query))
            );
            setFilteredPosts(filtered);
        }
    }, [searchQuery, posts]);

    return (
        <div className="min-h-screen bg-white">
            <Navbar forceScrolled={true} />

            <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
                {/* Hero Header */}
                <div className="text-center mb-16 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Zentry Blog</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900"
                    >
                        Historias y <span className="text-blue-600">Novedades</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-500 max-w-2xl mx-auto"
                    >
                        Descubre las últimas actualizaciones, consejos de administración condominal y noticias sobre tecnología para tu residencial.
                    </motion.p>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-md mx-auto relative group"
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Buscar artículos..."
                            className="pl-10 py-6 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </motion.div>
                </div>

                {/* Categories (Pending implementation, static for now) */}
                <div className="flex justify-center gap-2 mb-12 flex-wrap">
                    {['Todos', 'Tecnología', 'Seguridad', 'Administración', 'Tutoriales'].map((cat, idx) => (
                        <button
                            key={idx}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${idx === 0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Bento Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-gray-100 rounded-[24px] h-[400px]" />
                        ))}
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(400px,auto)]">
                        {filteredPosts.map((post, idx) => (
                            <BlogCard
                                key={post.id}
                                post={post}
                                isFeatured={idx === 0 && !searchQuery} // First post is featured only when not searching
                                className={idx === 0 && !searchQuery ? "md:col-span-2 lg:col-span-2" : ""}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-500">No se encontraron artículos.</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
