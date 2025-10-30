import React from 'react';
import { Bot } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';

export const Header: React.FC = () => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 p-4 relative z-10">
            <div className="container mx-auto flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <Bot className="h-6 w-6" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                        AI Hotel ERP Assistant
                    </h1>
                 </div>
                 <ThemeSwitcher />
            </div>
        </header>
    );
};