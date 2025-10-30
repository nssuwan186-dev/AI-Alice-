import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
    const [theme, setThemeState] = useState<Theme>('system');

    const applyTheme = useCallback((selectedTheme: Theme) => {
        if (selectedTheme === 'dark' || (selectedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);
    
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        const initialTheme = storedTheme || 'system';
        setThemeState(initialTheme);
        applyTheme(initialTheme);
    }, [applyTheme]);
    
    const setTheme = (newTheme: Theme) => {
        localStorage.setItem('theme', newTheme);
        setThemeState(newTheme);
        applyTheme(newTheme);
    };

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            // Only apply system theme if the current setting is 'system'
            const currentTheme = localStorage.getItem('theme') as Theme | null;
            if (currentTheme === 'system' || !currentTheme) {
                 applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [applyTheme]);


    return { theme, setTheme };
};
