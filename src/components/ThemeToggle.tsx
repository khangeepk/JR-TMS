'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch by waiting for mount
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="p-2 w-9 h-9" />

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-900 shadow-sm"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-emerald-400" />
            ) : (
                <Moon className="h-5 w-5 text-neutral-600" />
            )}
        </button>
    )
}
