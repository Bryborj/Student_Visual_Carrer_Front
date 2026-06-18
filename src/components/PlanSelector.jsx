import React, { useState, useMemo, useEffect } from 'react';

function PlanSelector({ availablePlans, selected, onChange }) {
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

    if (!availablePlans || availablePlans.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 mt-2 w-full max-w-sm">
            <select 
                className="bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors w-full print:hidden" 
                value={faculty} 
                onChange={handleFacultyChange}
            >
                <option value="" disabled>Selecciona Facultad</option>
                {faculties.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            
            <div className="flex gap-2 w-full">
                <select 
                    className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors print:hidden" 
                    value={career} 
                    onChange={handleCareerChange} 
                    disabled={!faculty}
                >
                    <option value="" disabled>Selecciona Carrera</option>
                    {careersForFaculty.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {modalidadesForCareer.length > 0 && (
                    <select 
                        className="bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors w-32 print:hidden" 
                        value={modalidad} 
                        onChange={handleModalidadChange} 
                        disabled={!career}
                    >
                        <option value="" disabled>Modalidad</option>
                        {modalidadesForCareer.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                )}
            </div>
            {/* Show only in print */}
            <div className="hidden print:block text-xs text-on-surface-variant font-medium mt-1">
                {faculty} {modalidad ? `• Modalidad ${modalidad}` : ''}
            </div>
        </div>
    );
}

export default PlanSelector;
