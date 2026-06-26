import React, { version } from 'react';

const UPDATES = [
    {
        version: "v1.1.1",
        date: "25 de Junio, 2026",
        title: "Mejoras de calidad de vida y errores menores",
        changes: [
            "▪️ Se ha mejorado la legibilidad de las materias en la versión impresa.",
            "▪️ Se ha mejorado la experiencia de usuario.",
            "▪️ Eh agregado la carrera de Ingeniería en Ciencias de Datos.",
            "▪️ Trabajamos en agregar una mejor experiencia para el usuario."
        ]
    },
    {
        version: "v1.1.0",
        date: "24 de Junio, 2026",
        title: "Nuevo selector de carreras y rediseño",
        changes: [
            "▪️ Se ha implementado un nuevo modal interactivo para elegir tu Facultad, Carrera y Modalidad.",
            "▪️ Rediseño del selector para que sea mucho más estético y claro.",
            "▪️ Se añadió un botón en la barra superior (el icono de birrete) para cambiar de carrera en cualquier momento sin perder tu progreso de la sesión.",
            "▪️ Soporte para la selección de modalidad (Ej. Presencial, En Línea)."
        ]
    },
    {
        version: "v1.0.1",
        date: "18 de Junio, 2026",
        title: "Mejoras de Autenticación y Bases de Datos",
        changes: [
            "▪️ Integración con validación de correo institucional para mantener el acceso seguro.",
            "▪️ Ahora puedes decidir cuánto tiempo quieres mantener abierta tu sesión (1 día, 7 días o indefinidamente).",
            "▪️ Migración de los planes de estudio a nuestra nueva base de datos para una carga más rápida."
        ]
    }
];

export const CURRENT_VERSION = UPDATES[0].version;

function UpdatesModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
            <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl p-6 w-full max-w-lg flex flex-col gap-6 animate-[fade-in_0.2s_ease-out,zoom-in-95_0.2s_ease-out] max-h-[85vh]">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary p-2 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined">campaign</span>
                        </div>
                        <h2 className="text-xl font-display-title font-bold text-on-surface">Novedades y Actualizaciones</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                        aria-label="Cerrar"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {UPDATES.map((update, index) => (
                        <div key={update.version} className={`flex flex-col gap-2 ${index !== 0 ? 'opacity-80' : ''}`}>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-lg font-bold text-on-surface">{update.version}</h3>
                                <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{update.date}</span>
                            </div>
                            <h4 className="text-sm font-semibold text-primary">{update.title}</h4>
                            <ul className="flex flex-col gap-2 mt-1">
                                {update.changes.map((change, i) => (
                                    <li key={i} className="text-sm text-on-surface-variant font-body-md flex items-start gap-2">
                                        <span className="text-base leading-tight">{change.substring(0, 2)}</span>
                                        <span className="leading-relaxed">{change.substring(2).trim()}</span>
                                    </li>
                                ))}
                            </ul>
                            {index !== UPDATES.length - 1 && <hr className="border-outline-variant mt-4" />}
                        </div>
                    ))}
                </div>

                <div className="mt-2 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        ¡Entendido!
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UpdatesModal;
