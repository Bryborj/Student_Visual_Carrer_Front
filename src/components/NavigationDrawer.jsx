import React, { useEffect } from 'react';
import { navigate } from '../hooks/useRouter';
import { CURRENT_VERSION } from './UpdatesModal';
import wolfLogo from '../resources/wolf.svg';

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
                            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center p-1.5 border border-outline-variant/30 shadow-xs">
                                <img src={wolfLogo} alt="Lobo BUAP" className="w-full h-full object-contain filter dark:brightness-110" />
                            </div>
                            <div>
                                <span className="font-display-title text-base font-bold text-on-surface block leading-none">
                                    Comunidad BUAP
                                </span>
                                <span className="text-[11px] font-metadata-label text-on-surface-variant block mt-1">
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
                                    if (activeRoute !== 'visualizer') {
                                        navigate('/visualizador');
                                    }
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
                                    navigate('/propuestas?tab=editor');
                                }}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-on-surface hover:bg-primary/20 transition-colors border border-primary/25"
                            >
                                <div className="flex items-center gap-3.5">
                                    <span className="material-symbols-outlined text-lg text-primary">edit_calendar</span>
                                    <span className="font-semibold">Editor Visual de Planes</span>
                                </div>
                                <span className="text-[10px] bg-primary text-on-primary font-bold px-2 py-0.5 rounded-full">
                                    Proponer / Crear
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

                            <button
                                onClick={() => {
                                    onClose();
                                    if (activeRoute !== 'forum') {
                                        if (onOpenForum) onOpenForum();
                                        else navigate('/foro');
                                    }
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                                    activeRoute === 'forum'
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'text-on-surface hover:bg-surface-container-high'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <span className="material-symbols-outlined text-lg text-purple-500">forum</span>
                                    <span>Foro Estudiantil</span>
                                </div>
                                <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-full">
                                    Debates
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

                    {/* Sección 5: Código Abierto & Colaboración GitHub */}
                    <div>
                        <span className="text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider px-3 mb-2 block">
                            Código Abierto • GitHub
                        </span>
                        <div className="space-y-1">
                            <a
                                href="https://github.com/Bryborj/Student_Visual_Carrer_Front"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                            >
                                <div className="flex items-center gap-3.5">
                                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                    </svg>
                                    <span>Repo Frontend</span>
                                </div>
                                <span className="material-symbols-outlined text-xs text-on-surface-variant">arrow_outward</span>
                            </a>

                            <a
                                href="https://github.com/Bryborj/Student_Visual_Carrer_Back"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                            >
                                <div className="flex items-center gap-3.5">
                                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                    </svg>
                                    <span>Repo Backend</span>
                                </div>
                                <span className="material-symbols-outlined text-xs text-on-surface-variant">arrow_outward</span>
                            </a>
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
