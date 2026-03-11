import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Providers } from '@/components/Providers'
import { MobileSidebarProvider } from '@/lib/MobileSidebarContext'
const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'JR Arcade Management',
    description: 'Rent Management System for JR Arcade',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} bg-background text-foreground antialiased`}>
                <Providers>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <MobileSidebarProvider>
                            {children}
                        </MobileSidebarProvider>
                    </ThemeProvider>
                </Providers>
            </body>
        </html>
    )
}
