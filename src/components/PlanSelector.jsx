import React, { useState, useMemo, useEffect } from 'react';

function PlanSelector({ availablePlans, selected, onChange, isOpen, onClose }) {
    const faculties = useMemo(() => {
        const facs = new Set();
        availablePlans.forEach(p => {
            if (p.faculty) facs.add(p.faculty);
        });
        return Array.from(facs);
    }, [availablePlans]);

    const [faculty, setFaculty] = useState(selected?.faculty || '');
    
    const careersForFaculty = useMemo(() => {
        if (!faculty) return [];
        const cars = new Set();
        availablePlans.filter(p => p.faculty === faculty).forEach(p => {
            if (p.career) cars.add(p.career);
        });
        return Array.from(cars);
    }, [availablePlans, faculty]);

    const [career, setCareer] = useState(selected?.career || '');

    const modalidadesForCareer = useMemo(() => {
        if (!career || !faculty) return [];
        const mods = new Set();
        availablePlans.filter(p => p.faculty === faculty && p.career === career).forEach(p => {
            if (p.modalidad) mods.add(p.modalidad);
        });
        return Array.from(mods);
    }, [availablePlans, faculty, career]);

    const [modalidad, setModalidad] = useState(selected?.modalidad || '');

    // Sync state from props (if 'selected' changes externally)
    useEffect(() => {
        if (selected) {
            if (selected.faculty !== faculty) setFaculty(selected.faculty);
            if (selected.career !== career) setCareer(selected.career);
            if (selected.modalidad !== modalidad) setModalidad(selected.modalidad || '');
        }
    }, [selected]);

    // Handlers
    const handleFacultyChange = (e) => {
        const newFac = e.target.value;
        setFaculty(newFac);
        
        // Auto-select first career
        const cars = Array.from(new Set(availablePlans.filter(p => p.faculty === newFac).map(p => p.career)));
        const newCar = cars[0] || '';
        setCareer(newCar);

        // Auto-select first modalidad
        const mods = Array.from(new Set(availablePlans.filter(p => p.faculty === newFac && p.career === newCar).map(p => p.modalidad).filter(Boolean)));
        const newMod = mods[0] || '';
        setModalidad(newMod);

        triggerChange(newFac, newCar, newMod);
    };

    const handleCareerChange = (e) => {
        const newCar = e.target.value;
        setCareer(newCar);

        const mods = Array.from(new Set(availablePlans.filter(p => p.faculty === faculty && p.career === newCar).map(p => p.modalidad).filter(Boolean)));
        const newMod = mods[0] || '';
        setModalidad(newMod);

        triggerChange(faculty, newCar, newMod);
    };

    const handleModalidadChange = (e) => {
        const newMod = e.target.value;
        setModalidad(newMod);
        triggerChange(faculty, career, newMod);
    };

    const triggerChange = (fac, car, mod) => {
        const plan = availablePlans.find(p => 
            p.career === car && 
            p.faculty === fac && 
            (p.modalidad === mod || (!p.modalidad && !mod))
        );
        if (plan) {
            onChange(plan);
        }
    };

    if (!isOpen || !availablePlans || availablePlans.length === 0) return null;

    // Check if the current local selection matches a valid plan
    const isValidSelection = !!availablePlans.find(p => 
        p.career === career && 
        p.faculty === faculty && 
        (p.modalidad === modalidad || (!p.modalidad && !modalidad))
    );

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
            <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-6 animate-[fade-in_0.2s_ease-out,zoom-in-95_0.2s_ease-out]">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-display-title font-bold text-on-surface">Seleccionar Plan</h2>
                        <p className="text-sm text-on-surface-variant font-body-md">Configura tu facultad y carrera actual.</p>
                    </div>
                    {onClose && isValidSelection && (
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                            aria-label="Cerrar"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>
                
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-primary uppercase tracking-wider">Facultad</label>
                        <select 
                            className="bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all w-full cursor-pointer hover:bg-surface-container-high" 
                            value={faculty} 
                            onChange={handleFacultyChange}
                        >
                            <option value="" disabled>Selecciona Facultad</option>
                            {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-xs font-semibold text-primary uppercase tracking-wider">Carrera</label>
                            <select 
                                className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all cursor-pointer hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed" 
                                value={career} 
                                onChange={handleCareerChange} 
                                disabled={!faculty}
                            >
                                <option value="" disabled>Selecciona Carrera</option>
                                {careersForFaculty.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {modalidadesForCareer.length > 0 && (
                            <div className="flex flex-col gap-1.5 sm:w-36">
                                <label className="text-xs font-semibold text-primary uppercase tracking-wider">Modalidad</label>
                                <select 
                                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all cursor-pointer hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed" 
                                    value={modalidad} 
                                    onChange={handleModalidadChange} 
                                    disabled={!career}
                                >
                                    <option value="" disabled>Modalidad</option>
                                    {modalidadesForCareer.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-2 flex justify-end">
                    <button 
                        onClick={onClose}
                        disabled={!isValidSelection}
                        className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span>Confirmar</span>
                        <span className="material-symbols-outlined text-sm">check</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PlanSelector;
