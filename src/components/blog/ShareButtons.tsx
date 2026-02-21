'use client';

import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function ShareButtons() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success('Enlace copiado al portapapeles');
    };

    const shareOnTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    const shareOnLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    return (
        <div className="flex items-center gap-12">
            <button
                onClick={shareOnTwitter}
                className="group flex flex-col items-center gap-3 transition-all hover:-translate-y-1"
            >
                <div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all">
                    <svg className="w-5 h-5 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Twitter (X)</span>
            </button>

            <button
                onClick={shareOnLinkedIn}
                className="group flex flex-col items-center gap-3 transition-all hover:-translate-y-1"
            >
                <div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-[#0077b5] group-hover:border-[#0077b5] transition-all">
                    <svg className="w-5 h-5 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">LinkedIn</span>
            </button>

            <button
                className="group flex flex-col items-center gap-3 transition-all hover:-translate-y-1"
                onClick={copyToClipboard}
            >
                <div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
                    <CheckCircle2 className="w-5 h-5 group-hover:text-white transition-colors" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Copiar Enlace</span>
            </button>
        </div>
    );
}
