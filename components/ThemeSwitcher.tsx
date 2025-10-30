import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const ThemeSwitcher: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const themes = [
        { name: 'Light', value: 'light', icon: Sun },
        { name: 'Dark', value: 'dark', icon: Moon },
        { name: 'System', value: 'system', icon: Monitor },
    ];
    
    const currentTheme = themes.find(t => t.value === theme);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
            >
                {currentTheme && <currentTheme.icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <ul>
                        {themes.map(({ name, value, icon: Icon }) => (
                            <li key={value}>
                                <button
                                    onClick={() => {
                                        setTheme(value as 'light' | 'dark' | 'system');
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                        theme === value ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
