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
        <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col transition-colors duration-300">
            {/* Header - No Print */}
            <header className="bg-background border-b border-outline-variant sticky top-0 z-50 print:hidden transition-colors duration-300">
                <div className="flex justify-between items-center w-full px-grid-margin py-4 max-w-container-max-width mx-auto">
                    <div className="flex items-center gap-4">
                        <h1 className="text-display-title font-display-title text-on-surface">
                            {title}
                        </h1>
                        <div className="bg-surface-container px-3 py-1 rounded-full flex items-center gap-2 border border-outline-variant">
                            <span className="text-metadata-label font-metadata-label text-on-surface-variant">
                                {Math.round(stats.passedCredits)} / {stats.totalCredits} Créditos
                            </span>
                            <div className="w-24 h-2 bg-surface-variant rounded-full overflow-hidden">
                                <div className="h-full bg-tertiary" style={{ width: `${stats.percentage}%` }}></div>
                            </div>
                            <span className="text-metadata-label font-metadata-label text-tertiary">
                                ({Math.round(stats.percentage)}%)
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onReset}
                            aria-label="Reiniciar"
                            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors scale-95 active:opacity-80"
                            title="Reiniciar"
                        >
                            <span className="material-symbols-outlined text-error">refresh</span>
                        </button>

                        <button
                            onClick={handlePrint}
                            aria-label="Imprimir"
                            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors scale-95 active:opacity-80"
                            title="Imprimir"
                        >
                            <span className="material-symbols-outlined">print</span>
                        </button>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            aria-label="Modo Claro/Oscuro"
                            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors scale-95 active:opacity-80"
                            title="Alternar Modo Oscuro"
                        >
                            <span className="material-symbols-outlined text-[#f59e0b]">
                                {darkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative print:overflow-visible">
                {/* Print Header */}
                <div className="hidden print:block mb-8 mt-8 text-center">
                    <h1 className="text-3xl font-bold mb-2 text-black">{title}</h1>
                    <p className="text-black">Progreso: {Math.round(stats.passedCredits)} / {stats.totalCredits} Créditos ({Math.round(stats.percentage)}%)</p>
                </div>

                {children}
            </main>
            
            {/* Footer */}
            <footer className="bg-surface-container-lowest border-t border-outline-variant w-full py-6 px-grid-margin flex flex-col md:flex-row justify-between items-center text-center md:text-left mt-auto print:hidden">
                <p className="text-body-md font-body-md text-on-surface-variant">© 2026 Z-SH by <a href="https://github.com/Bryborj" className="text-primary hover:underline">Bryan Borges</a>. All credits and prerequisites are subject to administrative verification.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <a className="text-body-md font-body-md text-on-surface-variant hover:text-primary transition-opacity opacity-80 hover:opacity-100" href="#">Academic Regulations</a>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
