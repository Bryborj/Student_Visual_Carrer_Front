import React, { useState, useEffect } from 'react';

const WelcomeScreen = ({ onSelectVisualizer, onSelectForum, availablePlansCount = 0 }) => {
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
        <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between relative overflow-hidden transition-colors duration-300">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

            {/* Header */}
            <header className="w-full border-b border-outline-variant bg-surface/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                            🐺
                        </div>
                        <div>
                            <h1 className="font-display-title text-lg sm:text-xl font-bold text-on-surface leading-tight">
                                Comunidad BUAP
                            </h1>
                            <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5 font-medium">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                Portal Académico & Foro Estudiantil
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            aria-label="Alternar Modo Oscuro"
                            className="p-2.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all scale-95 active:scale-90 shadow-sm"
                            title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                        >
                            <span className="material-symbols-outlined text-lg text-[#f59e0b]">
                                {darkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Hero & Navigation Hub */}
            <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center z-10 w-full">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-variant mb-6 shadow-sm">
                    <span className="text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                        🚀 Plataforma Estudiantil Todo-en-Uno
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary font-mono px-2 py-0.5 rounded-full font-bold">
                        Acceso Rápido
                    </span>
                </div>

                {/* Hero Title */}
                <div className="text-center max-w-3xl mb-10 sm:mb-14 space-y-4">
                    <h2 className="font-display-title text-3xl sm:text-5xl font-extrabold tracking-tight text-on-surface leading-tight sm:leading-tight">
                        Elige tu destino en la{' '}
                        <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                            Comunidad BUAP
                        </span>
                    </h2>
                    <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
                        Hemos separado nuestras dos herramientas principales para que ingreses al instante sin demoras. Diseñado por y para estudiantes de la BUAP.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl mb-12">
                    
                    {/* Card 1: Visualizador Curricular */}
                    <div 
                        onClick={onSelectVisualizer}
                        className="group relative bg-surface-container-lowest border border-outline-variant hover:border-primary/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1.5 overflow-hidden"
                    >
                        {/* Glow effect on card hover */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/15 transition-all duration-500 pointer-events-none"></div>

                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                                    📊
                                </div>
                                <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    Herramienta Académica
                                </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
                                Visualizador de Plan de Estudios
                            </h3>
                            
                            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
                                Explora tu malla curricular organizada por semestres. Simula tus materias aprobadas, verifica prerrequisitos y calcula tu avance crediticio en tiempo real.
                            </p>

                            <div className="space-y-2 mb-8">
                                <div className="flex items-center gap-2 text-xs text-on-surface font-medium">
                                    <span className="material-symbols-outlined text-sm text-blue-500">check_circle</span>
                                    <span>Cálculo automático de créditos y porcentaje</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-on-surface font-medium">
                                    <span className="material-symbols-outlined text-sm text-blue-500">check_circle</span>
                                    <span>Validación inteligente de prerrequisitos</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-on-surface font-medium">
                                    <span className="material-symbols-outlined text-sm text-blue-500">check_circle</span>
                                    <span>Guardado automático del progreso en tu navegador</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="button"
                            className="w-full py-3 px-5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md group-hover:shadow-lg"
                        >
                            <span>Ir al Visualizador</span>
                            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </div>

                    {/* Card 2: Foro Comunidad BUAP */}
                    <div 
                        onClick={onSelectForum}
                        className="group relative bg-surface-container-lowest border border-outline-variant hover:border-purple-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1.5 overflow-hidden"
                    >
                        {/* Glow effect on card hover */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/15 transition-all duration-500 pointer-events-none"></div>

                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                                    💬
                                </div>
                                <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
                                    Comunidad Activa
                                </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold text-on-surface mb-3 group-hover:text-purple-400 transition-colors">
                                Foro Comunidad BUAP
                            </h3>
                            
                            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
                                Conecta con estudiantes de todas las facultades. Comparte recomendaciones de profesores, debate sobre electivas y encuentra compañeros de estudio.
                            </p>

                            <div className="space-y-2 mb-8">
                                <div className="flex items-center gap-2 text-xs text-on-surface font-medium">
                                    <span className="material-symbols-outlined text-sm text-purple-400">lock</span>
                                    <span>Identidad anónima con verificación institucional BUAP</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-on-surface font-medium">
                                    <span className="material-symbols-outlined text-sm text-purple-400">star</span>
                                    <span>Reseñas docentes y consejos por materia</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-on-surface font-medium">
                                    <span className="material-symbols-outlined text-sm text-purple-400">forum</span>
                                    <span>Discusión categorizada por carreras y temas</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="button"
                            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md group-hover:shadow-lg"
                        >
                            <span>Entrar al Foro BUAP</span>
                            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </div>

                </div>

                {/* Features Highlights Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl pt-4 border-t border-outline-variant/60 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-surface-container/50 border border-outline-variant/40">
                        <span className="material-symbols-outlined text-blue-500 text-2xl shrink-0">speed</span>
                        <div>
                            <h4 className="text-xs font-bold text-on-surface">Carga Ultrarrápida</h4>
                            <p className="text-[11px] text-on-surface-variant">Acceso directo sin esperas del servidor</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-surface-container/50 border border-outline-variant/40">
                        <span className="material-symbols-outlined text-emerald-500 text-2xl shrink-0">shield</span>
                        <div>
                            <h4 className="text-xs font-bold text-on-surface">Privacidad Protegida</h4>
                            <p className="text-[11px] text-on-surface-variant">Sin almacenamiento de datos personales</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-surface-container/50 border border-outline-variant/40">
                        <span className="material-symbols-outlined text-purple-400 text-2xl shrink-0">groups</span>
                        <div>
                            <h4 className="text-xs font-bold text-on-surface">100% Estudiantil</h4>
                            <p className="text-[11px] text-on-surface-variant">Desarrollado por estudiantes BUAP</p>
                        </div>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="w-full bg-surface-container-lowest border-t border-outline-variant py-6 px-4 text-center z-10">
                <p className="text-xs text-on-surface-variant">
                    © {new Date().getFullYear()} Z-SH by <a href="https://github.com/Bryborj" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Bryan Borges</a>. Proyecto universitario sin fines de lucro.
                </p>
            </footer>
        </div>
    );
};

export default WelcomeScreen;
