'use client';

import BlogForm from '@/components/admin/blog/BlogForm';

export default function DashboardNewPostPage() {
    return (
        <div className="container mx-auto py-6">
            <BlogForm basePath="/dashboard/blog" />
        </div>
    );
}
