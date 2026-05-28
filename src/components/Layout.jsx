import React, { useState, useEffect } from 'react';

const Layout = ({ children, stats, onReset, title = "Plan de Estudios" }) => {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col font-sans">
            {/* Header - No Print */}
            <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm z-50 print:hidden transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {title}
                        </h1>
                        <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            <span>{Math.round(stats.passedCredits)} / {stats.totalCredits} Créditos</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">({Math.round(stats.percentage)}%)</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onReset}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium mr-2"
                            title="Reset Progress"
                        >
                            Reiniciar
                        </button>

                        <button
                            onClick={handlePrint}
                            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                            title="Imprimir"
                        >
                            🖨️ Imprimir
                        </button>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                            title="Alternar Modo Oscuro"
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="grow pt-20 pb-8 px-4 sm:px-6 lg:px-8 overflow-x-auto print:p-0 print:overflow-visible">
                {/* Print Header */}
                <div className="hidden print:block mb-8 text-center">
                    <h1 className="text-3xl font-bold mb-2">Plan de Estudios - Ingeniería en Ciencias de la Computación</h1>
                    <p>Progreso: {Math.round(stats.passedCredits)} / {stats.totalCredits} Créditos ({Math.round(stats.percentage)}%)</p>
                </div>

                <div className="min-w-fit mx-auto">
                    {children}
                </div>
            </main>
            {/* Footer */}
            <footer className="bg-gray-800 text-white py-4 text-center text-sm">
                <p>© 2025 Z-SH by <a href="https://github.com/Bryborj" className="text-blue-400 hover:underline">Bryan Borges</a></p>
            </footer>
        </div>
    );
};

export default Layout;
