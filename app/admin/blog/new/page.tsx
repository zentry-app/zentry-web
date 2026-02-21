'use client';

import { AdminLayout } from '@/components/dashboard/admin-layout';
import BlogForm from '@/components/admin/blog/BlogForm';

export default function NewPostPage() {
    return (
        <AdminLayout requireGlobalAdmin={true}>
            <BlogForm />
        </AdminLayout>
    );
}
