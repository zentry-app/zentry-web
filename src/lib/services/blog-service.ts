import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { IBlogPost } from '@/types/models';

export const BlogService = {
    collectionRef: collection(db, 'blog_posts'),

    async getAllPosts(): Promise<IBlogPost[]> {
        try {
            const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as IBlogPost));
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            throw error;
        }
    },

    async getPublishedPosts(): Promise<IBlogPost[]> {
        try {
            const q = query(
                this.collectionRef,
                where('published', '==', true),
                orderBy('publishedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as IBlogPost));
        } catch (error) {
            console.error('Error fetching published posts:', error);
            throw error;
        }
    },

    async getPostBySlug(slug: string): Promise<IBlogPost | null> {
        console.warn(`[BlogService] Fetching post for slug: ${slug}`);
        try {
            if (!this.collectionRef) {
                console.error('[BlogService] Collection ref is undefined!');
            }
            const q = query(this.collectionRef, where('slug', '==', slug), limit(1));
            const snapshot = await getDocs(q);

            console.warn(`[BlogService] Snapshot empty? ${snapshot.empty}. Size: ${snapshot.size}`);

            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            const data = doc.data();
            console.warn(`[BlogService] Post found: ${doc.id}`);

            return {
                id: doc.id,
                ...data
            } as IBlogPost;
        } catch (error) {
            console.error('[BlogService] Error fetching post by slug:', error);
            throw error;
        }
    },

    async getPostById(id: string): Promise<IBlogPost | null> {
        try {
            const docRef = doc(this.collectionRef, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return null;

            return {
                id: docSnap.id,
                ...docSnap.data()
            } as IBlogPost;
        } catch (error) {
            console.error('Error fetching post by id:', error);
            throw error;
        }
    },

    async createPost(post: Omit<IBlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        try {
            const now = Timestamp.now();
            const newPost = {
                ...post,
                createdAt: now,
                updatedAt: now,
                publishedAt: post.status === 'published' ? now : null,
                version: 1,
            };

            const docRef = await addDoc(this.collectionRef, newPost);
            return docRef.id;
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    },

    async updatePost(id: string, updates: Partial<IBlogPost>): Promise<void> {
        try {
            const docRef = doc(this.collectionRef, id);
            const updateData: any = {
                ...updates,
                updatedAt: Timestamp.now()
            };

            // Auto-set publishedAt when status changes to published
            if (updates.status === 'published' && !updates.publishedAt) {
                updateData.publishedAt = Timestamp.now();
                updateData.published = true;
            }

            // Increment version
            const currentPost = await this.getPostById(id);
            if (currentPost) {
                updateData.version = (currentPost.version || 1) + 1;
            }

            await updateDoc(docRef, updateData);
        } catch (error) {
            console.error('Error updating post:', error);
            throw error;
        }
    },

    async deletePost(id: string): Promise<void> {
        try {
            const docRef = doc(this.collectionRef, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    },

    // Publish scheduled posts that are due
    async publishScheduledPosts(): Promise<number> {
        try {
            const now = Timestamp.now();
            const q = query(
                this.collectionRef,
                where('status', '==', 'scheduled'),
                where('scheduledFor', '<=', now)
            );

            const snapshot = await getDocs(q);
            let publishedCount = 0;

            for (const docSnap of snapshot.docs) {
                await this.updatePost(docSnap.id, {
                    status: 'published',
                    published: true,
                    publishedAt: now
                });
                publishedCount++;
            }

            return publishedCount;
        } catch (error) {
            console.error('Error publishing scheduled posts:', error);
            throw error;
        }
    }
};
