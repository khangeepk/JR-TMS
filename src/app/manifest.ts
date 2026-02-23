import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'JR Arcade TMS',
        short_name: 'JR TMS',
        description: 'Tenant Management System for JR Arcade',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1e293b',
        orientation: 'portrait-primary',
        icons: [
            {
                src: '/window.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
            },
            {
                src: '/window.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
            },
        ],
    };
}
