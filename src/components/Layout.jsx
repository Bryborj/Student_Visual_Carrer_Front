import React, { useState, useEffect } from 'react';
import { navigate } from '../hooks/useRouter';
import NavigationDrawer from './NavigationDrawer';

const Layout = ({ 
    children, 
    stats, 
    onReset, 
    title = "Plan de Estudios", 
    logo_url = "", 
    contributor = null,
    headerControls = null, 
    onOpenPlanSelector, 
    onOpenUpdates, 
    onOpenForum, 
    onOpenProposals,
    onOpenAdmin,
    onGoHome 
}) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showContributorModal, setShowContributorModal] = useState(false);
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

    useEffect(() => {
        if (contributor && title) {
            const seenKey = `contributor_seen_${title}_${contributor}`;
            if (!sessionStorage.getItem(seenKey)) {
                setShowContributorModal(true);
                sessionStorage.setItem(seenKey, 'true');
            }
        }
    }, [contributor, title]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col transition-colors duration-300">
            {/* Header - No Print */}
            <header className="bg-background border-b border-outline-variant sticky top-0 z-40 print:hidden transition-colors duration-300 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-center w-full px-4 md:px-grid-margin py-3.5 max-w-container-max-width mx-auto gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container p-1 shrink-0 border border-outline-variant/30">
                            {logo_url ? (
                                <img src={logo_url} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <span className="material-symbols-outlined text-primary text-2xl">school</span>
                            )}
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                            <h1 className="font-display-title text-xl sm:text-2xl font-bold text-on-surface leading-tight truncate max-w-xs sm:max-w-md lg:max-w-lg">
                                {title}
                            </h1>
                            {contributor && (
                                <button
                                    type="button"
                                    onClick={() => setShowContributorModal(true)}
                                    className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                                    title="Ver créditos de contribución comunitaria"
                                >
                                    <span>🌟</span>
                                    <span>Plan integrado gracias a <strong>@{contributor}</strong></span>
                                </button>
                            )}
                            {headerControls}
                        </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        {/* Indicador de Créditos Compacto */}
                        <div className="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-2 border border-outline-variant/40">
                            <span className="text-metadata-label font-metadata-label text-on-surface-variant">
                                {Math.round(stats.passedCredits)} / {stats.totalCredits} <span className="hidden md:inline">Créditos</span>
                            </span>
                            <div className="w-14 sm:w-20 h-2 bg-surface-variant rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${stats.percentage}%` }}></div>
                            </div>
                            <span className="text-metadata-label font-metadata-label font-bold text-primary">
                                {Math.round(stats.percentage)}%
                            </span>
                        </div>

                        {/* Botones Rápidos y Menú Hamburguesa */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                                onClick={() => navigate('/propuestas?tab=editor')}
                                aria-label="Proponer cambios o nuevo plan"
                                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all active:scale-95"
                                title="Abrir Editor Visual para proponer cambios o agregar un plan"
                            >
                                <span className="material-symbols-outlined text-lg">edit_calendar</span>
                                <span className="text-xs font-semibold hidden md:inline">Proponer / Editar Plan</span>
                            </button>

                            <button
                                onClick={handlePrint}
                                aria-label="Imprimir mapa curricular"
                                className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                                title="Imprimir o exportar PDF"
                            >
                                <span className="material-symbols-outlined text-xl">print</span>
                            </button>

                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                aria-label="Alternar modo claro u oscuro"
                                className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                                title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                            >
                                <span className="material-symbols-outlined text-xl text-amber-500">
                                    {darkMode ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>

                            {/* Botón Principal de Menú Hamburguesa */}
                            <button
                                onClick={() => setIsDrawerOpen(true)}
                                aria-label="Abrir menú de navegación"
                                aria-expanded={isDrawerOpen}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 transition-all active:scale-95 shadow-xs"
                                title="Menú de Navegación y Herramientas"
                            >
                                <span className="material-symbols-outlined text-xl text-primary">menu</span>
                                <span className="text-xs font-semibold tracking-wide hidden sm:inline">Menú</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Drawer Lateral */}
            <NavigationDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                currentCareer={title}
                stats={stats}
                onGoHome={onGoHome}
                onOpenPlanSelector={onOpenPlanSelector}
                onOpenForum={onOpenForum}
                onOpenProposals={onOpenProposals}
                onOpenAdmin={onOpenAdmin || (() => navigate('/admin'))}
                onOpenUpdates={onOpenUpdates}
                onReset={onReset}
                onPrint={handlePrint}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                activeRoute="visualizer"
            />

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

            {/* Modal de Créditos al Contribuidor */}
            {showContributorModal && contributor && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn print:hidden"
                    onClick={() => setShowContributorModal(false)}
                >
                    <div
                        className="bg-surface-container-lowest border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 mx-auto flex items-center justify-center text-white text-3xl shadow-lg mb-4">
                            🌟
                        </div>
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 mb-2">
                            Aportación Estudiantil BUAP
                        </span>
                        <h3 className="text-xl font-bold text-on-surface mb-2">
                            ¡Plan integrado gracias a @{contributor}!
                        </h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
                            Este mapa curricular (<strong className="text-on-surface">{title}</strong>) fue propuesto, estructurado o actualizado con el apoyo del usuario <strong className="text-amber-600 dark:text-amber-400">@{contributor}</strong> mediante el sistema de propuestas comunitarias.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowContributorModal(false)}
                            className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm transition-all shadow-md cursor-pointer"
                        >
                            ¡Genial, explorar mapa curricular!
                        </button>
                    </div>
                </div>
            )}

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
