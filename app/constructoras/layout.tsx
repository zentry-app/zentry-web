import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Zentry para Constructoras | Oferta Especial de Apertura',
    description: 'Equipa tus nuevos desarrollos con Zentry desde $13 MXN por casa al mes. Aumenta la plusvalía y seguridad de tus residenciales.',
    openGraph: {
        title: 'Oferta Especial para Constructoras - Zentry',
        description: 'La app residencial que tus clientes esperan. Solo $13 al mes por casa.',
        url: 'https://zentry.com.mx/constructoras', // Example URL
        siteName: 'Zentry',
        locale: 'es_MX',
        type: 'website',
    },
};

export default function ConstructorasLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-slate-50 min-h-screen">
            {children}
        </div>
    );
}
