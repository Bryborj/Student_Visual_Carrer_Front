import React, { useState, useEffect } from 'react';

const Layout = ({ children, stats, onReset, title = "Plan de Estudios", logo_url = "", headerControls = null, onOpenPlanSelector, onOpenUpdates }) => {
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
                <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 md:px-grid-margin py-4 max-w-container-max-width mx-auto gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto text-center md:text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center rounded">
                                <img src={logo_url} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex flex-col items-start w-full max-w-xs sm:max-w-md">
                                <h1 className="font-display-title text-2xl font-bold text-on-surface leading-tight">{title}</h1>
                                {headerControls}
                            </div>
                        </div>
                        <div className="bg-surface-container px-3 py-1 rounded-full flex items-center gap-2 border border-outline-variant w-fit mx-auto md:mx-0">
                            <span className="text-metadata-label font-metadata-label text-on-surface-variant">
                                {Math.round(stats.passedCredits)} / {stats.totalCredits} <span className="hidden sm:inline">Créditos</span>
                            </span>
                            <div className="w-16 sm:w-24 h-2 bg-surface-variant rounded-full overflow-hidden">
                                <div className="h-full bg-tertiary" style={{ width: `${stats.percentage}%` }}></div>
                            </div>
                            <span className="text-metadata-label font-metadata-label text-tertiary">
                                ({Math.round(stats.percentage)}%)
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center md:justify-end gap-2 w-full md:w-auto">
                        {onOpenUpdates && (
                            <button
                                onClick={onOpenUpdates}
                                aria-label="Novedades"
                                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors scale-95 active:opacity-80"
                                title="Novedades y Actualizaciones"
                            >
                                <span className="material-symbols-outlined text-[#10b981]">campaign</span>
                            </button>
                        )}
                        {onOpenPlanSelector && (
                            <button
                                onClick={onOpenPlanSelector}
                                aria-label="Cambiar Carrera"
                                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors scale-95 active:opacity-80"
                                title="Cambiar Carrera"
                            >
                                <span className="material-symbols-outlined text-primary">school</span>
                            </button>
                        )}

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
            <main className="flex-1 overflow-auto relative print:overflow-visible">
                {/* Print Header */}
                <div className="hidden print:flex justify-between items-end border-b-2 border-on-surface pb-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center rounded">
                            <img src={logo_url} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="font-display-title text-2xl font-bold text-on-surface leading-tight">{title}</h1>
                            {headerControls}
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-metadata-label text-metadata-label uppercase">Créditos Totales: {Math.round(stats.passedCredits)} / {stats.totalCredits}</span>
                        </div>
                        <div className="w-48 h-2 border border-on-surface bg-surface-variant rounded-full overflow-hidden">
                            <div className="h-full bg-on-surface" style={{ width: `${stats.percentage}%` }}></div>
                        </div>
                        <p className="font-metadata-label text-metadata-label text-on-surface-variant">Avance de Carrera: {Math.round(stats.percentage)}%</p>
                    </div>
                </div>

                {children}
            </main>
            <footer className="bg-surface-container-lowest border-t border-outline-variant w-full py-6 px-grid-margin flex flex-col md:flex-row justify-between items-center text-center md:text-left mt-auto print:hidden">
                <p className="text-body-md font-body-md text-on-surface-variant">© {new Date().getFullYear()} Z-SH by <a href="https://github.com/Bryborj" className="text-primary hover:underline font-bold">Bryan Borges</a>. All credits and prerequisites are subject to administrative verification.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <a className="text-body-md font-body-md text-on-surface-variant hover:text-primary transition-opacity opacity-80 hover:opacity-100" href="#">Proyecto realizado por puro amor al arte</a>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
