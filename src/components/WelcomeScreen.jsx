import React, { useState, useEffect } from 'react';
import { Link, navigate } from '../hooks/useRouter';
import NavigationDrawer from './NavigationDrawer';
import wolfLogo from '../resources/wolf.svg';
import { IconBulbFilled } from '@tabler/icons-react';

const WelcomeScreen = ({ availablePlansCount = 0 }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
        <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col justify-between relative overflow-x-hidden transition-colors duration-300">
            {/* Header Navigation */}
            <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 transition-colors duration-300">
                <nav className="flex justify-between items-center px-4 sm:px-8 py-3.5 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center">
                            <img src="wolf.svg" alt="Lobo BUAP" className="w-full h-full object-contain filter dark:invert" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-headline-md text-lg sm:text-xl font-bold text-on-surface leading-none serif-title">Comunidad BUAP</span>
                            <span className="text-[10px] font-metadata-label text-on-surface-variant uppercase tracking-widest mt-1">Portal & Cartografía Curricular</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <a
                            href="https://github.com/Bryborj/Student_Visual_Carrer_Front"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Repositorio de GitHub del Proyecto"
                            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 text-xs font-semibold transition-all active:scale-95 shadow-xs"
                            title="Código Abierto en GitHub"
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            <span>Código Abierto</span>
                        </a>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            aria-label="Alternar Modo Oscuro"
                            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors duration-200 text-on-surface-variant hover:text-on-surface border border-outline-variant/30"
                            title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                        >
                            <span className="material-symbols-outlined text-amber-500 text-xl">
                                {darkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>

                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            aria-label="Abrir menú de navegación"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 transition-all active:scale-95 shadow-xs"
                            title="Menú de Navegación"
                        >
                            <span className="material-symbols-outlined text-xl text-on-surface">menu</span>
                            <span className="text-xs font-semibold tracking-wide hidden sm:inline">Menú</span>
                        </button>
                    </div>
                </nav>
            </header>

            {/* Navigation Drawer */}
            <NavigationDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                currentCareer=""
                onGoHome={() => navigate('/')}
                onOpenForum={() => navigate('/foro')}
                onOpenProposals={() => navigate('/propuestas')}
                onOpenAdmin={() => navigate('/admin')}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                activeRoute="home"
            />

            <main className="relative pt-28 sm:pt-36 pb-20 flex-1 flex flex-col justify-center">
                {/* Subtle Oxford Charcoal Glows */}
                <div className="bg-subtle-glow top-0 -left-20"></div>
                <div className="bg-subtle-glow bottom-20 -right-20"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
                    {/* Hero Header & Welcome Badge */}
                    <div className="text-center mb-12 sm:mb-16 space-y-6">

                        <h1 className="font-headline-lg text-3xl sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-[1.15] serif-title text-on-surface font-bold tracking-tight">
                            Cartografía Curricular y Espacio Abierto para la <span className="italic font-medium text-on-surface/85">Comunidad BUAP</span>
                        </h1>

                        <p className="text-on-surface-variant text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                            Herramientas académicas creadas por y para estudiantes. Proyecte su carga de materias con validación institucional en tiempo real, participe en debates docentes y colabore en la evolución de su carrera.
                        </p>

                        {/* Quick Highlights / KPI Strip */}
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto text-xs font-metadata-label text-on-surface-variant">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
                                <span className="material-symbols-outlined text-sm text-on-surface">school</span>
                                <span>{availablePlansCount > 0 ? `${availablePlansCount} Planes Registrados` : 'Planes de Múltiples Facultades'}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
                                <span className="material-symbols-outlined text-sm text-amber-500">terminal</span>
                                <span>100% Código Abierto en GitHub</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Feature Grid */}
                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {/* Academic Viewer Card */}
                        <div className="academic-card rounded-2xl p-7 sm:p-9 flex flex-col justify-between h-full shadow-lg">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-13 h-13 rounded-2xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center shadow-xs">
                                        <span className="material-symbols-outlined text-on-surface text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>account_tree</span>
                                    </div>
                                    <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-[0.16em] py-1 border-b border-outline-variant/40 font-semibold">
                                        Cartografía Académica
                                    </span>
                                </div>
                                <h2 className="font-headline-md text-2xl sm:text-3xl text-on-surface mb-3 serif-title font-bold">Visualizador de Plan de Estudios</h2>
                                <p className="text-on-surface-variant text-sm sm:text-base mb-6 leading-relaxed">
                                    Mapa curricular interactivo. Marque asignaturas aprobadas, desbloquee prerrequisitos sucesivos al instante y supervise el porcentaje de egreso con exactitud técnica.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-3 text-on-surface text-sm">
                                        <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                        <span>Cálculo dinámico de créditos cursados y faltantes</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-on-surface text-sm">
                                        <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                        <span>Matriz de candados y requisitos correlativos</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-on-surface text-sm">
                                        <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                        <span>Exportación lista para imprimir o guardar en PDF</span>
                                    </li>
                                </ul>
                            </div>
                            <Link to="/visualizador" className="w-full py-3.5 rounded-xl bg-on-surface text-surface font-semibold text-sm flex items-center justify-center gap-2.5 transition-all hover:opacity-90 active:scale-[0.98] shadow-md">
                                <span>Abrir Visualizador</span>
                                <span className="material-symbols-outlined text-sm">arrow_outward</span>
                            </Link>
                        </div>

                        {/* Community Forum Card */}
                        <div className="academic-card rounded-2xl p-7 sm:p-9 flex flex-col justify-between h-full shadow-lg">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-13 h-13 rounded-2xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center shadow-xs">
                                        <span className="material-symbols-outlined text-on-surface text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>forum</span>
                                    </div>
                                    <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-[0.16em] py-1 border-b border-outline-variant/40 font-semibold">
                                        Comunidad Estudiantil
                                    </span>
                                </div>
                                <h2 className="font-headline-md text-2xl sm:text-3xl text-on-surface mb-3 serif-title font-bold">Foro de Intercambio Académico</h2>
                                <p className="text-on-surface-variant text-sm sm:text-base mb-6 leading-relaxed">
                                    Punto de encuentro universitario. Comparta opiniones constructivas sobre materias, sugerencias docentes y consejos de cursada con validación institucional.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-3 text-on-surface text-sm">
                                        <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                        <span>Comunidad identificada con correo institucional BUAP</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-on-surface text-sm">
                                        <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                        <span>Calificaciones docentes y experiencias sobre cursos</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-on-surface text-sm">
                                        <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                        <span>Filtros organizados por carrera y facultad</span>
                                    </li>
                                </ul>
                            </div>
                            <Link to="/foro" className="w-full py-3.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/40 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-xs">
                                <span>Ingresar al Foro</span>
                                <span className="material-symbols-outlined text-sm">arrow_outward</span>
                            </Link>
                        </div>
                    </div>

                    {/* Student Visual Plan Editor Banner */}
                    <div className="academic-card rounded-2xl p-6 sm:p-8 mb-14 border border-outline-variant/40 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-13 h-13 rounded-2xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-amber-500 text-3xl">edit_calendar</span>
                            </div>
                            <div>
                                <h3 className="font-headline-md text-xl sm:text-2xl text-on-surface serif-title font-bold">
                                    Editor Visual de Planes y Propuestas Estudiantiles
                                </h3>
                                <p className="text-on-surface-variant text-sm mt-1 max-w-2xl leading-relaxed">
                                    ¿Tu carrera necesita actualizar optativas o aún no figura en la lista? Usa el lienzo gráfico interactivo para reordenar asignaturas, crear espacios libres y proponer nuevos planes que la comunidad pueda respaldar con su voto.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                            <Link
                                to="/propuestas?tab=editor"
                                className="px-5 py-3 rounded-xl bg-on-surface text-surface font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-xs"
                            >
                                <span className="material-symbols-outlined text-base">add_box</span>
                                <span>Abrir Editor Visual</span>
                            </Link>
                            <Link
                                to="/propuestas"
                                className="px-4 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/40 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                            >
                                <span className="material-symbols-outlined text-base text-amber-500">how_to_vote</span>
                                <span>Votar Propuestas</span>
                            </Link>
                        </div>
                    </div>

                    {/* Open Source & Git Collaboration Section */}
                    <div className="academic-card rounded-2xl p-7 sm:p-10 border border-outline-variant/40 shadow-xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-outline-variant/30">
                            <div>
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/40 uppercase tracking-wider mb-2">
                                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                    </svg>
                                    <span>Colaboración en GitHub</span>
                                </div>
                                <h3 className="font-headline-md text-2xl sm:text-3xl text-on-surface serif-title font-bold">
                                    Desarrollo Abierto & Contribución Comunitaria
                                </h3>
                                <p className="text-on-surface-variant text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                                    Este proyecto es totalmente abierto e independiente. Si eres estudiante, programador o deseas integrar el plan de estudios oficial de tu facultad, tu colaboración mediante código o datos es bienvenida.
                                </p>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant font-metadata-label bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30">
                                    <span>Pull Requests Bienvenidas</span>
                                </span>
                            </div>
                        </div>

                        {/* Git Repositories Grid */}
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {/* Frontend Repo Card */}
                            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/40 flex flex-col justify-between hover:border-outline transition-colors">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-on-surface text-xl">devices</span>
                                            <span className="font-semibold text-base text-on-surface">Frontend</span>
                                        </div>
                                        <span className="text-[10px] font-metadata-label px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                                            React 19 • TS • Tailwind
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                                        Visualización reactiva, manipulación de grafos de asignaturas, interfaz accesible y paneles interactivos de arrastre para planes de estudio.
                                    </p>
                                    <div className="text-[11px] font-metadata-label text-on-surface-variant/80 bg-surface-container p-2.5 rounded-lg border border-outline-variant/30 break-all mb-4 select-all">
                                        git clone https://github.com/Bryborj/Student_Visual_Carrer_Front.git
                                    </div>
                                </div>
                                <a
                                    href="https://github.com/Bryborj/Student_Visual_Carrer_Front"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/40 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
                                >
                                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                    </svg>
                                    <span>Ver Repositorio Frontend</span>
                                    <span className="material-symbols-outlined text-xs">arrow_outward</span>
                                </a>
                            </div>

                            {/* Backend Repo Card */}
                            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/40 flex flex-col justify-between hover:border-outline transition-colors">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-on-surface text-xl">database</span>
                                            <span className="font-semibold text-base text-on-surface">Backend & API</span>
                                        </div>
                                        <span className="text-[10px] font-metadata-label px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                                            Go (Golang) • PostgreSQL
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                                        Servicio de alta velocidad para mallas académicas, autenticación de correos universitarios, endpoints para foros y persistencia de propuestas.
                                    </p>
                                    <div className="text-[11px] font-metadata-label text-on-surface-variant/80 bg-surface-container p-2.5 rounded-lg border border-outline-variant/30 break-all mb-4 select-all">
                                        git clone https://github.com/Bryborj/Student_Visual_Carrer_Back.git
                                    </div>
                                </div>
                                <a
                                    href="https://github.com/Bryborj/Student_Visual_Carrer_Back"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/40 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
                                >
                                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                    </svg>
                                    <span>Ver Repositorio Backend</span>
                                    <span className="material-symbols-outlined text-xs">arrow_outward</span>
                                </a>
                            </div>
                        </div>

                        {/* Callout notice */}
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant bg-surface-container p-3.5 rounded-xl border border-outline-variant/30">
                            
                            <IconBulbFilled className="dark:text-amber-400" />
                            <span>
                                ¿Encontraste un error en los prerrequisitos o créditos de tu carrera? Abre un <a href="https://github.com/Bryborj/Student_Visual_Carrer_Front/issues" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-on-surface">Issue en GitHub</a> o envía tu propuesta directamente desde el editor visual.
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 mt-16 transition-colors duration-300">
                <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-8 py-10 max-w-7xl mx-auto gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-12 h-12 flex items-center justify-center p-1">
                                <img src="wolf.svg" alt="Lobo BUAP" className="w-full h-full filter dark:invert" />
                            </div>
                            <span className="font-headline-md text-xl text-on-surface serif-title font-bold">Comunidad BUAP</span>
                        </div>
                        <span className="hidden md:block h-5 w-[1px] bg-outline-variant/40"></span>
                        <span className="font-metadata-label text-xs text-on-surface-variant tracking-wide">
                            © {new Date().getFullYear()} ZrootSH • Licencia MIT Libre
                        </span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-on-surface-variant">
                        <Link to="/visualizador" className="hover:text-on-surface transition-colors">Visualizador</Link>
                        <Link to="/foro" className="hover:text-on-surface transition-colors">Foro</Link>
                        <Link to="/propuestas" className="hover:text-on-surface transition-colors">Propuestas</Link>
                        <a href="https://github.com/Bryborj/Student_Visual_Carrer_Front" target="_blank" rel="noopener noreferrer" className="hover:text-on-surface transition-colors">GitHub Front</a>
                        <a href="https://github.com/Bryborj/Student_Visual_Carrer_Back" target="_blank" rel="noopener noreferrer" className="hover:text-on-surface transition-colors">GitHub Back</a>
                        <a href="https://github.com/Bryborj" target="_blank" rel="noopener noreferrer" className="hover:text-on-surface transition-colors">Contacto (@Bryborj)</a>
                    </div>
                </div>

                <div className="text-center pb-8 border-t border-outline-variant/10 pt-5 px-4">
                    <p className="text-[10px] font-metadata-label text-on-surface-variant/70 uppercase tracking-[0.2em]">
                        Desarrollado de manera independiente por Bryan Borges para la comunidad estudiantil de la Benemérita Universidad Autónoma de Puebla
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default WelcomeScreen;
