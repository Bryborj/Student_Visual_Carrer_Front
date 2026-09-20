import React, { useState, useEffect } from 'react';
import { Link } from '../hooks/useRouter';

const WelcomeScreen = ({ availablePlansCount = 0 }) => {
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

    return (
        <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col justify-between relative overflow-x-hidden transition-colors duration-300">
            {/* Header Navigation */}
            <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 transition-colors duration-300">
                <nav className="flex justify-between items-center px-4 sm:px-8 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-headline-md text-lg sm:text-xl font-semibold text-primary leading-none serif-title">Comunidad BUAP</span>
                            <span className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-widest mt-1">Portal Académico</span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-10">
                        <Link to="/visualizador" className="font-label-md text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Visualizador</Link>
                        <Link to="/foro" className="font-label-md text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Foro</Link>
                        <Link to="/propuestas" className="font-label-md text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Actualizar Plan</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            aria-label="Alternar Modo Oscuro"
                            className="p-2 rounded-lg hover:bg-surface-container-high transition-colors duration-200 text-on-surface-variant hover:text-on-surface"
                            title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                        >
                            <span className="material-symbols-outlined text-primary text-xl">
                                {darkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                    </div>
                </nav>
            </header>

            <main className="relative pt-32 pb-16 flex-1 flex flex-col justify-center">
                {/* Subtle Background Elements */}
                <div className="bg-subtle-glow top-0 -left-20"></div>
                <div className="bg-subtle-glow bottom-20 -right-20"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
                    {/* Hero Content */}
                    <div className="text-center mb-12 sm:mb-16 space-y-6">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/50 text-xs font-label-md shadow-sm">
                            <span className="material-symbols-outlined text-primary text-[16px]">school</span>
                            <span className="text-on-surface-variant uppercase tracking-[0.2em] font-semibold">Recursos para la excelencia académica</span>
                        </div>
                        <h1 className="font-headline-lg text-3xl sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-[1.15] serif-title text-on-surface font-bold">
                            Infraestructura Digital para la <span className="text-primary italic font-medium">Comunidad BUAP</span>
                        </h1>
                        <p className="text-on-surface-variant text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                            Acceda a herramientas especializadas de gestión académica y participación estudiantil. Un entorno profesional diseñado para optimizar su trayectoria universitaria.
                        </p>
                    </div>

                    {/* Main Feature Grid */}
                    <div className="grid md:grid-cols-2 gap-8 mb-16">
                        {/* Academic Viewer Card */}
                        <div className="academic-card rounded-2xl p-8 sm:p-10 flex flex-col justify-between h-full shadow-lg">
                            <div>
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center shadow-md">
                                        <span className="material-symbols-outlined text-on-secondary-container text-3xl" style={{ fontVariationSettings: "'FILL' 0" }}>account_tree</span>
                                    </div>
                                    <span className="font-label-sm text-xs text-secondary uppercase tracking-[0.15em] py-1 border-b border-secondary/30 font-semibold">
                                        Módulo de Análisis
                                    </span>
                                </div>
                                <h2 className="font-headline-md text-2xl sm:text-3xl text-on-surface mb-4 serif-title font-bold">Visualizador de Plan de Estudios</h2>
                                <p className="text-on-surface-variant text-sm sm:text-base mb-8 leading-relaxed">
                                    Cartografía académica detallada. Gestione su avance curricular, valide prerrequisitos institucionales y proyecte su carga crediticia con precisión técnica.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-on-surface text-sm sm:text-base">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <span>Algoritmo de cálculo de créditos en tiempo real</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-on-surface text-sm sm:text-base">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <span>Matriz de validación de requisitos de egreso</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-on-surface text-sm sm:text-base">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <span>Persistencia de datos en entorno local seguro</span>
                                    </li>
                                </ul>
                            </div>
                            <Link to="/visualizador" className="w-full py-4 rounded-xl bg-on-surface text-surface font-semibold flex items-center justify-center gap-3 transition-all hover:bg-white active:scale-[0.98] shadow-md">
                                <span>Acceder al Visualizador</span>
                                <span className="material-symbols-outlined text-sm">arrow_outward</span>
                            </Link>
                        </div>

                        {/* Community Forum Card */}
                        <div className="academic-card rounded-2xl p-8 sm:p-10 flex flex-col justify-between h-full shadow-lg">
                            <div>
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center shadow-md">
                                        <span className="material-symbols-outlined text-on-primary-container text-3xl" style={{ fontVariationSettings: "'FILL' 0" }}>forum</span>
                                    </div>
                                    <span className="font-label-sm text-xs text-primary uppercase tracking-[0.15em] py-1 border-b border-primary/30 font-semibold">
                                        Espacio de Diálogo
                                    </span>
                                </div>
                                <h2 className="font-headline-md text-2xl sm:text-3xl text-on-surface mb-4 serif-title font-bold">Foro de Intercambio Académico</h2>
                                <p className="text-on-surface-variant text-sm sm:text-base mb-8 leading-relaxed">
                                    Plataforma de comunicación institucional. Participe en discusiones críticas sobre docencia, metodologías y vida universitaria con sus pares académicos.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-on-surface text-sm sm:text-base">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <span>Protocolo de identidad basado en correo institucional</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-on-surface text-sm sm:text-base">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <span>Repositorio de evaluations docentes verificadas</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-on-surface text-sm sm:text-base">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <span>Categorización por facultades y áreas de conocimiento</span>
                                    </li>
                                </ul>
                            </div>
                            <Link to="/foro" className="w-full py-4 rounded-xl bg-primary text-on-primary font-semibold flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-[0.98] shadow-md">
                                <span>Ingresar al Foro</span>
                                <span className="material-symbols-outlined text-sm">arrow_outward</span>
                            </Link>
                        </div>
                    </div>

                    {/* Quick Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="academic-card p-6 rounded-2xl flex items-center gap-5 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-xl">speed</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-on-surface text-base serif-title">Alto Rendimiento</h4>
                                <p className="text-xs text-on-surface-variant mt-0.5">Arquitectura ligera y eficiente</p>
                            </div>
                        </div>
                        <div className="academic-card p-6 rounded-2xl flex items-center gap-5 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-xl">encrypted</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-on-surface text-base serif-title">Soberanía de Datos</h4>
                                <p className="text-xs text-on-surface-variant mt-0.5">Privacidad por diseño técnico</p>
                            </div>
                        </div>
                        <div className="academic-card p-6 rounded-2xl flex items-center gap-5 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-xl">diversity_2</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-on-surface text-base serif-title">Iniciativa Estudiantil</h4>
                                <p className="text-xs text-on-surface-variant mt-0.5">Desarrollado para la comunidad</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/20 mt-16 transition-colors duration-300">
                <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-8 py-10 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6 md:mb-0">
                        <span className="font-headline-md text-2xl text-primary serif-title font-bold">Comunidad BUAP</span>
                        <span className="hidden md:block h-6 w-[1px] bg-outline-variant/40"></span>
                        <span className="font-label-md text-xs text-on-surface-variant tracking-wide">© {new Date().getFullYear()} ZrootSH All rings reserved.</span>
                    </div>
                    <div className="flex gap-8">
                        <Link to="/visualizador" className="font-label-md text-xs text-on-surface-variant hover:text-primary transition-colors">Visualizador</Link>
                        <Link to="/foro" className="font-label-md text-xs text-on-surface-variant hover:text-primary transition-colors">Foro</Link>
                        <a className="font-label-md text-xs text-on-surface-variant hover:text-primary transition-colors" href="https://github.com/Bryborj" target="_blank" rel="noopener noreferrer">Contacto</a>
                    </div>
                </div>
                <div className="text-center pb-8 border-t border-outline-variant/10 pt-6 px-4">
                    <p className="text-[10px] font-label-md text-on-surface-variant/60 uppercase tracking-[0.2em]">Desarrollo Técnico por Bryan Borges • Proyecto Universitario Independiente</p>
                </div>
            </footer>
        </div>
    );
};

export default WelcomeScreen;
