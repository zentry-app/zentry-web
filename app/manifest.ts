import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Zentry | App Residencial',
        short_name: 'Zentry',
        description: 'La mejor aplicación para residenciales y condominios.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0070FF',
        icons: [
            {
                src: '/favicon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/favicon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
