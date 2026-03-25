'use client';

import { motion } from 'framer-motion';
import { IBlogPost } from '@/types/models';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BlogCardProps {
    post: IBlogPost;
    className?: string;
    isFeatured?: boolean;
}

export const BlogCard = ({ post, className, isFeatured = false }: BlogCardProps) => {
    const date = post.publishedAt?.toDate ? post.publishedAt.toDate() : new Date(post.publishedAt);

    return (
        <Link href={`/blog/${post.slug}`}>
            <motion.div
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={cn(
                    "group relative overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 h-full flex flex-col",
                    isFeatured ? "row-span-2 col-span-2" : "",
                    className
                )}
            >
                <div className={cn(
                    "relative overflow-hidden w-full",
                    isFeatured ? "h-[60%]" : "h-[200px]"
                )}>
                    {post.coverImage ? (
                        <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes={isFeatured ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 1024px) 100vw, 33vw"}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                            <span className="text-4xl">📝</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                            {post.tags?.[0] || 'Artículo'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {format(date, 'd MMM, yyyy', { locale: es })}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                            {post.readTime} min lectura
                        </span>
                    </div>

                    <h3 className={cn(
                        "font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors",
                        isFeatured ? "text-3xl" : "text-xl"
                    )}>
                        {post.title}
                    </h3>

                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                        {post.excerpt}
                    </p>

                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100">
                        {post.author?.photoURL ? (
                            <Image
                                src={post.author.photoURL}
                                alt={post.author.name}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                {post.author?.name?.charAt(0) || 'A'}
                            </div>
                        )}
                        <span className="text-xs font-medium text-gray-700">
                            {post.author?.name}
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};
