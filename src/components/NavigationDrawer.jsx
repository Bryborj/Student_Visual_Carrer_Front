import React, { useEffect } from 'react';
import { CURRENT_VERSION } from './UpdatesModal';

/**
 * NavigationDrawer
 * Menú de navegación lateral institucional inspirado en las guías de diseño limpio y funcional.
 * Agrupa de forma lógica la navegación académica, comunidad estudiantil, administración y herramientas.
 */
const NavigationDrawer = ({
    isOpen,
    onClose,
    currentCareer = "Plan de Estudios",
    stats = { passedCredits: 0, totalCredits: 0, percentage: 0 },
    onGoHome,
    onOpenPlanSelector,
    onOpenForum,
    onOpenProposals,
    onOpenAdmin,
    onOpenUpdates,
    onReset,
    onPrint,
    darkMode,
    onToggleDarkMode,
    activeRoute = 'visualizer'
}) => {
    // Cerrar al presionar la tecla Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Bloquear el scroll del body mientras el drawer esté abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <div 
            className={`fixed inset-0 z-50 transition-visibility duration-300 ${
                isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
            }`}
            aria-hidden={!isOpen}
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal de navegación"
        >
            {/* Backdrop con desenfoque suave */}
            <div 
                className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300 ease-out ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
            />

            {/* Panel Lateral Deslizante */}
            <div 
                className={`absolute top-0 right-0 h-full w-full max-w-sm sm:w-96 bg-surface text-on-surface border-l border-outline-variant/30 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Cabecera del Drawer */}
                <div className="p-6 border-b border-outline-variant/30 bg-surface-container-low/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-on-primary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    school
                                </span>
                            </div>
                            <div>
                                <span className="font-display-title text-base font-bold text-primary block leading-none">
                                    Comunidad BUAP
                                </span>
                                <span className="text-[11px] font-medium text-on-surface-variant block mt-1">
                                    Portal & Visualizador Curricular
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                            aria-label="Cerrar menú"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>

                    {/* Resumen de Carrera Activa & Progreso */}
                    {currentCareer && (
                        <div className="bg-surface rounded-xl p-3.5 border border-outline-variant/40 shadow-xs mt-3">
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <span className="text-xs font-semibold text-on-surface line-clamp-2 leading-snug">
                                    {currentCareer}
                                </span>
                                <span className="text-xs font-semibold text-primary shrink-0">
                                    {Math.round(stats.percentage)}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${Math.min(100, Math.max(0, stats.percentage))}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-on-surface-variant mt-2 font-metadata-label">
                                <span>{Math.round(stats.passedCredits)} de {stats.totalCredits} créditos</span>
                                {onOpenPlanSelector && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onOpenPlanSelector();
                                        }}
                                        className="text-primary hover:underline font-body-md font-medium"
                                    >
                                        Cambiar
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Lista de Navegación Scrolleable */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Sección 1: Cartografía Académica */}
                    <div>
                        <span className="text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider px-3 mb-2 block">
                            Navegación Académica
                        </span>
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    onClose();
                                    if (onGoHome) onGoHome();
                                }}
                                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                    activeRoute === 'home'
                                        ? 'bg-primary-container text-on-primary-container'
                                        : 'text-on-surface hover:bg-surface-container-high'
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg text-primary">home</span>
                                <span>Inicio / Portal</span>
                            </button>

                            <button
                                onClick={() => {
                                    onClose();
                                }}
                                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                    activeRoute === 'visualizer'
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'text-on-surface hover:bg-surface-container-high'
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg text-primary">account_tree</span>
                                <span>Visualizador de Materias</span>
                            </button>

                            {onOpenPlanSelector && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenPlanSelector();
                                    }}
                                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg text-primary">swap_horiz</span>
                                    <span>Seleccionar Otra Carrera</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sección 2: Comunidad & Participación */}
                    <div>
                        <span className="text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider px-3 mb-2 block">
                            Comunidad & Gobernanza
                        </span>
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    onClose();
                                    if (onOpenForum) onOpenForum();
                                }}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <span className="material-symbols-outlined text-lg text-purple-500">forum</span>
                                    <span>Foro Estudiantil</span>
                                </div>
                                <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-full">
                                    Debates
                                </span>
                            </button>

                            <button
                                onClick={() => {
                                    onClose();
                                    if (onOpenProposals) onOpenProposals();
                                }}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                            >
                                <div className="flex items-center gap-3.5">
                                    <span className="material-symbols-outlined text-lg text-amber-500">how_to_vote</span>
                                    <span>Propuestas de Alumnos</span>
                                </div>
                                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                                    Votar
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Sección 3: Conexión con Gestión y Edición de Planes (Staff / Admin) */}
                    <div>
                        <span className="text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider px-3 mb-2 block">
                            Administración Curricular
                        </span>
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    onClose();
                                    if (onOpenAdmin) onOpenAdmin();
                                }}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium bg-secondary-container/40 text-on-surface hover:bg-secondary-container/80 transition-colors border border-outline-variant/30"
                            >
                                <div className="flex items-center gap-3.5">
                                    <span className="material-symbols-outlined text-lg text-primary">tune</span>
                                    <span className="font-semibold">Gestión y Edición de Planes</span>
                                </div>
                                <span className="text-[10px] bg-primary text-on-primary font-bold px-2 py-0.5 rounded-md">
                                    Admin
                                </span>
                            </button>
                            <p className="text-[11px] text-on-surface-variant px-3 pt-1">
                                Crear nuevos planes (7 a 10+ semestres) o editar el mapa de materias oficial.
                            </p>
                        </div>
                    </div>

                    {/* Sección 4: Herramientas del Visualizador */}
                    <div>
                        <span className="text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider px-3 mb-2 block">
                            Herramientas
                        </span>
                        <div className="space-y-1">
                            {onPrint && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onPrint();
                                    }}
                                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg text-on-surface-variant">print</span>
                                    <span>Imprimir / Exportar PDF</span>
                                </button>
                            )}

                            {onReset && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onReset();
                                    }}
                                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg text-error">restart_alt</span>
                                    <span>Reiniciar Materias Marcadas</span>
                                </button>
                            )}

                            {onOpenUpdates && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenUpdates();
                                    }}
                                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg text-emerald-500">campaign</span>
                                    <span>Novedades del Sistema</span>
                                </button>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Pie del Drawer */}
                <div className="p-4 border-t border-outline-variant/30 bg-surface-container-low/50 space-y-3">
                    {/* Toggle de Modo Claro / Oscuro */}
                    <button
                        onClick={onToggleDarkMode}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium bg-surface hover:bg-surface-container-high transition-colors border border-outline-variant/30"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-lg text-amber-500">
                                {darkMode ? 'dark_mode' : 'light_mode'}
                            </span>
                            <span>{darkMode ? 'Modo Oscuro' : 'Modo Claro'}</span>
                        </div>
                        <span className="text-xs text-on-surface-variant font-metadata-label">
                            {darkMode ? 'Activado' : 'Desactivado'}
                        </span>
                    </button>

                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant/80 px-2">
                        <span>ZrootSH • BUAP</span>
                        <span className="font-metadata-label">v{CURRENT_VERSION}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavigationDrawer;
