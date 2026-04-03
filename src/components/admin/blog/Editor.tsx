'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Image as ImageIcon,
    Link as LinkIcon,
    Heading1,
    Heading2,
    Quote,
    Undo,
    Redo,
    Code
} from 'lucide-react';
import { useEffect } from 'react';

interface EditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    editable?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    const addImage = () => {
        const url = window.prompt('URL de la imagen:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL:', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update link
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 sticky top-0 z-10 rounded-t-lg">
            <Button
                variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className="h-8 w-8"
                title="Negrita"
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className="h-8 w-8"
                title="Cursiva"
            >
                <Italic className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
            <Button
                variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="h-8 w-8"
                title="Título 1"
            >
                <Heading1 className="h-4 w-4" />
            </Button>
            <Button
                variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className="h-8 w-8"
                title="Título 2"
            >
                <Heading2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
            <Button
                variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="h-8 w-8"
                title="Lista"
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className="h-8 w-8"
                title="Lista numerada"
            >
                <ListOrdered className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
            <Button
                variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className="h-8 w-8"
                title="Cita"
            >
                <Quote className="h-4 w-4" />
            </Button>
            <Button
                variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className="h-8 w-8"
                title="Código"
            >
                <Code className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
            <Button
                variant={editor.isActive('link') ? 'secondary' : 'ghost'}
                size="icon"
                onClick={setLink}
                className="h-8 w-8"
                title="Enlace"
            >
                <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={addImage}
                className="h-8 w-8"
                title="Imagen"
            >
                <ImageIcon className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="h-8 w-8"
                title="Deshacer"
            >
                <Undo className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="h-8 w-8"
                title="Rehacer"
            >
                <Redo className="h-4 w-4" />
            </Button>
        </div>
    );
};

export const BlogEditor = ({ content, onChange, placeholder = 'Escribe aquí tu contenido...', editable = true }: EditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        editable,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[400px] p-6',
            },
        },
    });

    // Update content if it changes externally (only when not focused to avoid cursor jumping)
    useEffect(() => {
        if (editor && content !== editor.getHTML() && !editor.isFocused) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

export default BlogEditor;
