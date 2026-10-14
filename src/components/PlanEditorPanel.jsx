import React, { useState, useEffect, useMemo } from 'react';
import { navigate } from '../hooks/useRouter';

export default function PlanEditorPanel({ password, availablePlans = [], onPlanSaved }) {
    // Modo: 'modify' (modificar existente) o 'create' (crear nuevo)
    const [editorMode, setEditorMode] = useState('modify');
    const [selectedCareerToLoad, setSelectedCareerToLoad] = useState('');
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Plan en edición
    const [career, setCareer] = useState('');
    const [faculty, setFaculty] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [minCredits, setMinCredits] = useState(250);
    const [maxCredits, setMaxCredits] = useState(350);
    const [courses, setCourses] = useState([]); // Array de clusters: [{ cluster: 1, content: [...] }]
    const [electives, setElectives] = useState([]);

    // Modal de edición/adición de materia
    const [editingSubject, setEditingSubject] = useState(null); // { subject: {...}, clusterIndex: number, isNew: boolean }
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

    // Modal de importación/exportación JSON
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
    const [rawJsonText, setRawJsonText] = useState('');

    // Modal de confirmación para eliminar plan
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Inicializar nuevo plan con número de semestres por defecto (ej. 9 semestres)
    const initBlankPlan = (semestersCount = 9) => {
        const initialClusters = Array.from({ length: semestersCount }, (_, i) => ({
            cluster: i + 1,
            content: []
        }));
        setCareer('');
        setFaculty(availablePlans[0]?.faculty || 'Facultad de Ciencias de la Computación');
        setLogoUrl(availablePlans[0]?.logo_url || '');
        setMinCredits(250);
        setMaxCredits(350);
        setCourses(initialClusters);
        setElectives([]);
        setFeedback({ type: '', message: '' });
    };

    // Al montar o cambiar a 'create'
    useEffect(() => {
        if (editorMode === 'create' && courses.length === 0) {
            initBlankPlan(9);
        } else if (editorMode === 'modify' && availablePlans.length > 0 && !selectedCareerToLoad) {
            setSelectedCareerToLoad(availablePlans[0].career);
        }
    }, [editorMode, availablePlans]);

    // Cargar plan existente seleccionado
    const handleLoadPlan = async (careerName) => {
        if (!careerName) return;
        setLoading(true);
        setFeedback({ type: '', message: '' });
        try {
            const res = await fetch(`/api/plan?career=${encodeURIComponent(careerName)}`);
            if (res.ok) {
                const data = await res.json();
                setCareer(data.career || careerName);
                setFaculty(data.faculty || '');
                setLogoUrl(data.logo_url || '');
                setMinCredits(data.min_credits || 250);
                setMaxCredits(data.max_credits || 350);
                setCourses(Array.isArray(data.courses) ? data.courses : []);
                setElectives(Array.isArray(data.electives) ? data.electives : []);
                setFeedback({ type: 'success', message: `Plan "${data.career}" cargado correctamente.` });
            } else {
                setFeedback({ type: 'error', message: 'No se pudo cargar el plan de la base de datos.' });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: 'Error de conexión al cargar el plan.' });
        } finally {
            setLoading(false);
        }
    };

    // Escuchar cambio en select de plan a cargar
    useEffect(() => {
        if (editorMode === 'modify' && selectedCareerToLoad) {
            handleLoadPlan(selectedCareerToLoad);
        }
    }, [selectedCareerToLoad, editorMode]);

    // Gestión de cantidad de semestres (7 a +9 semestres)
    const handleAddSemester = () => {
        const nextCluster = courses.length + 1;
        setCourses([...courses, { cluster: nextCluster, content: [] }]);
    };

    const handleRemoveSemester = () => {
        if (courses.length <= 1) return;
        const lastSemester = courses[courses.length - 1];
        if (lastSemester.content && lastSemester.content.length > 0) {
            if (!confirm(`El Semestre ${lastSemester.cluster} tiene ${lastSemester.content.length} materias. ¿Seguro que deseas eliminarlo? Sus materias se perderán.`)) {
                return;
            }
        }
        setCourses(courses.slice(0, -1));
    };

    const handleSetSemestersCount = (targetCount) => {
        const count = Math.max(1, parseInt(targetCount, 10));
        if (count > courses.length) {
            const newClusters = [...courses];
            for (let i = courses.length + 1; i <= count; i++) {
                newClusters.push({ cluster: i, content: [] });
            }
            setCourses(newClusters);
        } else if (count < courses.length) {
            const hasSubjectsInRemoved = courses.slice(count).some(c => c.content?.length > 0);
            if (hasSubjectsInRemoved) {
                if (!confirm(`Reducir a ${count} semestres eliminará las materias de los semestres superiores. ¿Continuar?`)) {
                    return;
                }
            }
            setCourses(courses.slice(0, count));
        }
    };

    // Lista plana de todas las materias existentes para autocompletar prerrequisitos
    const allSubjects = useMemo(() => {
        const list = [];
        courses.forEach(cluster => {
            (cluster.content || []).forEach(sub => {
                list.push({
                    id: sub.id,
                    subject: sub.subject || sub.name,
                    cluster: cluster.cluster,
                    credits: sub.credits
                });
            });
        });
        return list;
    }, [courses]);

    // Cálculos estadísticos
    const totalSubjectsCount = allSubjects.length;
    const calculatedCredits = allSubjects.reduce((acc, s) => acc + (Number(s.credits) || 0), 0);

    // Acciones sobre materias
    const handleOpenAddSubject = (clusterIndex) => {
        const cluster = courses[clusterIndex];
        const nextPositionY = (cluster.content || []).length + 1;
        setEditingSubject({
            clusterIndex,
            isNew: true,
            subject: {
                id: '',
                subject: '',
                credits: 6,
                theory: 3,
                lab: 2,
                autonomous: 0,
                required: '',
                position_Y: nextPositionY
            }
        });
        setIsSubjectModalOpen(true);
    };

    const handleOpenEditSubject = (clusterIndex, subjectIndex) => {
        const target = courses[clusterIndex].content[subjectIndex];
        setEditingSubject({
            clusterIndex,
            subjectIndex,
            isNew: false,
            subject: { ...target }
        });
        setIsSubjectModalOpen(true);
    };

    const handleSaveSubjectModal = (e) => {
        e.preventDefault();
        if (!editingSubject) return;

        const { clusterIndex, isNew, subjectIndex, subject } = editingSubject;
        if (!subject.subject.trim() || !subject.id.trim()) {
            alert('El nombre de la materia y la clave/ID son obligatorios.');
            return;
        }

        const updatedCourses = [...courses];
        const clusterContent = [...(updatedCourses[clusterIndex].content || [])];

        const cleanSubject = {
            ...subject,
            id: subject.id.trim().toUpperCase(),
            subject: subject.subject.trim(),
            credits: Number(subject.credits) || 0,
            theory: Number(subject.theory) || 0,
            lab: Number(subject.lab) || 0,
            autonomous: Number(subject.autonomous) || 0,
            position_Y: Number(subject.position_Y) || 1,
            required: subject.required ? subject.required.trim() : null
        };

        if (isNew) {
            clusterContent.push(cleanSubject);
        } else {
            clusterContent[subjectIndex] = cleanSubject;
        }

        // Reordenar por position_Y
        clusterContent.sort((a, b) => (a.position_Y || 0) - (b.position_Y || 0));
        updatedCourses[clusterIndex].content = clusterContent;

        setCourses(updatedCourses);
        setIsSubjectModalOpen(false);
        setEditingSubject(null);
    };

    const handleDeleteSubject = (clusterIndex, subjectIndex) => {
        const sub = courses[clusterIndex].content[subjectIndex];
        if (!confirm(`¿Eliminar la materia "${sub.subject}"?`)) return;

        const updatedCourses = [...courses];
        updatedCourses[clusterIndex].content = updatedCourses[clusterIndex].content.filter((_, idx) => idx !== subjectIndex);
        setCourses(updatedCourses);
    };

    const handleMoveSubjectVertical = (clusterIndex, subjectIndex, direction) => {
        const cluster = courses[clusterIndex];
        const content = [...cluster.content];
        const targetIndex = subjectIndex + direction;
        if (targetIndex < 0 || targetIndex >= content.length) return;

        // Intercambiar
        const temp = content[subjectIndex];
        content[subjectIndex] = content[targetIndex];
        content[targetIndex] = temp;

        // Reasignar position_Y
        content.forEach((s, idx) => {
            s.position_Y = idx + 1;
        });

        const updatedCourses = [...courses];
        updatedCourses[clusterIndex].content = content;
        setCourses(updatedCourses);
    };

    const handleMoveSubjectHorizontal = (clusterIndex, subjectIndex, direction) => {
        const targetClusterIndex = clusterIndex + direction;
        if (targetClusterIndex < 0 || targetClusterIndex >= courses.length) return;

        const updatedCourses = [...courses];
        const sourceContent = [...updatedCourses[clusterIndex].content];
        const targetContent = [...(updatedCourses[targetClusterIndex].content || [])];

        const [movedSubject] = sourceContent.splice(subjectIndex, 1);
        movedSubject.position_Y = targetContent.length + 1;
        targetContent.push(movedSubject);

        // Reindexar fuentes
        sourceContent.forEach((s, idx) => { s.position_Y = idx + 1; });

        updatedCourses[clusterIndex].content = sourceContent;
        updatedCourses[targetClusterIndex].content = targetContent;
        setCourses(updatedCourses);
    };

    // Guardar Plan Oficial en Base de Datos
    const handleSavePlanToDb = async () => {
        if (!career.trim()) {
            setFeedback({ type: 'error', message: 'Ingresa el nombre de la carrera.' });
            return;
        }
        if (courses.length === 0 || totalSubjectsCount === 0) {
            setFeedback({ type: 'error', message: 'El plan debe contener al menos un semestre con materias.' });
            return;
        }

        setLoading(true);
        setFeedback({ type: '', message: '' });

        const payload = {
            career: career.trim(),
            faculty: faculty.trim(),
            logo_url: logoUrl.trim(),
            min_credits: Number(minCredits) || calculatedCredits,
            max_credits: Number(maxCredits) || calculatedCredits + 50,
            courses,
            electives
        };

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'addPlan',
                    password,
                    payload
                })
            });
            const data = await res.json();
            if (res.ok) {
                setFeedback({
                    type: 'success',
                    message: `✅ ¡Plan "${career}" guardado exitosamente en base de datos!`
                });
                if (onPlanSaved) {
                    onPlanSaved(career);
                }
            } else {
                setFeedback({ type: 'error', message: data.detail || data.error || 'Error al guardar plan en base de datos.' });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: 'Error de red al conectar con el servidor.' });
        } finally {
            setLoading(false);
        }
    };

    // Eliminar Plan de Base de Datos
    const handleDeletePlanFromDb = async () => {
        if (!career.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_plan',
                    password,
                    payload: { career: career.trim() }
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Plan "${career}" eliminado correctamente.`);
                setIsDeleteModalOpen(false);
                if (onPlanSaved) {
                    onPlanSaved(null);
                }
                setEditorMode('modify');
            } else {
                alert(data.detail || 'Error al eliminar plan.');
            }
        } catch (e) {
            alert('Error de conexión al eliminar el plan.');
        } finally {
            setLoading(false);
        }
    };

    // Descargar JSON
    const handleDownloadJson = () => {
        const planObj = {
            career: career.trim(),
            faculty: faculty.trim(),
            logo_url: logoUrl.trim(),
            min_credits: Number(minCredits),
            max_credits: Number(maxCredits),
            courses,
            electives
        };
        const blob = new Blob([JSON.stringify(planObj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Plan_${career.replace(/\s+/g, '_') || 'Estudios'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Importar JSON
    const handleApplyImportedJson = () => {
        try {
            const parsed = JSON.parse(rawJsonText);
            if (!parsed.career || !Array.isArray(parsed.courses)) {
                alert('El JSON debe contener al menos "career" y "courses" como un arreglo.');
                return;
            }
            setCareer(parsed.career);
            if (parsed.faculty) setFaculty(parsed.faculty);
            if (parsed.logo_url) setLogoUrl(parsed.logo_url);
            if (parsed.min_credits) setMinCredits(parsed.min_credits);
            if (parsed.max_credits) setMaxCredits(parsed.max_credits);
            setCourses(parsed.courses);
            if (Array.isArray(parsed.electives)) setElectives(parsed.electives);

            setIsJsonModalOpen(false);
            setFeedback({ type: 'success', message: 'JSON importado con éxito en el lienzo visual.' });
        } catch (e) {
            alert('El contenido ingresado no es un JSON válido.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Barra superior de Modo y Selección */}
            <div className="bg-surface p-5 rounded-2xl border border-primary/15 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Toggle Modificar vs Crear */}
                    <div className="inline-flex p-1 rounded-xl bg-surface-container border border-outline-variant/30">
                        <button
                            type="button"
                            onClick={() => {
                                setEditorMode('modify');
                                if (availablePlans.length > 0) {
                                    handleLoadPlan(availablePlans[0].career);
                                }
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                editorMode === 'modify'
                                    ? 'bg-primary text-on-primary shadow-sm'
                                    : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                        >
                            <span>✏️</span> Modificar Plan Existente
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEditorMode('create');
                                initBlankPlan(9);
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                editorMode === 'create'
                                    ? 'bg-primary text-on-primary shadow-sm'
                                    : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                        >
                            <span>➕</span> Crear Nuevo Plan
                        </button>
                    </div>

                    {/* Acciones Globales */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setRawJsonText(JSON.stringify({
                                    career, faculty, logo_url: logoUrl,
                                    min_credits: minCredits, max_credits: maxCredits,
                                    courses, electives
                                }, null, 2));
                                setIsJsonModalOpen(true);
                            }}
                            className="px-3 py-2 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest border border-outline-variant/40 flex items-center gap-1.5 transition-colors"
                            title="Ver o pegar formato JSON"
                        >
                            <span className="material-symbols-outlined text-sm">code</span>
                            <span>Importar / Ver JSON</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadJson}
                            className="px-3 py-2 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest border border-outline-variant/40 flex items-center gap-1.5 transition-colors"
                            title="Descargar copia JSON a tu disco"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>Descargar JSON</span>
                        </button>

                        {editorMode === 'modify' && career && (
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="px-3 py-2 rounded-xl bg-error/10 text-xs font-semibold text-error hover:bg-error/20 border border-error/30 flex items-center gap-1.5 transition-colors"
                                title="Eliminar plan de la base de datos"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                <span>Eliminar Plan</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleSavePlanToDb}
                            disabled={loading}
                            className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-sm">save</span>
                            <span>{loading ? 'Guardando...' : 'Guardar Plan en BD'}</span>
                        </button>
                    </div>
                </div>

                {/* Si está en modo Modificar: selector de plan */}
                {editorMode === 'modify' && (
                    <div className="pt-2 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center gap-3">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                            Seleccionar Plan:
                        </label>
                        <select
                            value={selectedCareerToLoad}
                            onChange={(e) => setSelectedCareerToLoad(e.target.value)}
                            className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-background border border-primary/25 text-on-surface text-sm focus:outline-none focus:border-primary"
                        >
                            {availablePlans.map((p) => (
                                <option key={p.career} value={p.career}>
                                    {p.career} — {p.faculty}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => handleLoadPlan(selectedCareerToLoad)}
                            className="px-4 py-2 rounded-xl bg-secondary/15 text-secondary text-xs font-bold hover:bg-secondary/25 transition-colors"
                        >
                            Recargar Datos
                        </button>
                    </div>
                )}

                {/* Feedback */}
                {feedback.message && (
                    <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        feedback.type === 'error'
                            ? 'bg-error/10 text-error border border-error/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}>
                        <span className="material-symbols-outlined text-base">
                            {feedback.type === 'error' ? 'error' : 'check_circle'}
                        </span>
                        <span>{feedback.message}</span>
                    </div>
                )}
            </div>

            {/* Formulario de Metadatos del Plan */}
            <div className="bg-surface p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                    <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                        <span>📋</span> Información General del Plan
                    </h2>
                    {/* Resumen de estadísticas */}
                    <div className="flex items-center gap-4 text-xs">
                        <span className="text-on-surface-variant">
                            Materias: <strong className="text-primary">{totalSubjectsCount}</strong>
                        </span>
                        <span className="text-on-surface-variant">
                            Créditos asignados: <strong className="text-secondary">{calculatedCredits}</strong>
                        </span>
                        <span className="text-on-surface-variant">
                            Semestres: <strong className="text-primary">{courses.length}</strong>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-primary uppercase">Nombre de la Carrera / Licenciatura *</label>
                        <input
                            type="text"
                            value={career}
                            onChange={(e) => setCareer(e.target.value)}
                            placeholder="Ej. Ingeniería en Ciencias de la Computación"
                            className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-primary uppercase">Facultad *</label>
                        <input
                            type="text"
                            value={faculty}
                            onChange={(e) => setFaculty(e.target.value)}
                            placeholder="Ej. Facultad de Ciencias de la Computación"
                            className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-primary uppercase">URL del Logo Institucional</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="url"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary"
                            />
                            {logoUrl && (
                                <img
                                    src={logoUrl}
                                    alt="Logo preview"
                                    className="w-9 h-9 object-contain rounded bg-background p-1 border border-outline-variant/30"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-primary uppercase">Créditos Mínimos</label>
                        <input
                            type="number"
                            value={minCredits}
                            onChange={(e) => setMinCredits(parseInt(e.target.value, 10) || 0)}
                            className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-primary uppercase">Créditos Máximos</label>
                        <input
                            type="number"
                            value={maxCredits}
                            onChange={(e) => setMaxCredits(parseInt(e.target.value, 10) || 0)}
                            className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Barra de Configuración de Semestres (7 a +9 semestres) */}
            <div className="bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">view_column</span>
                        Semestres del Plan:
                    </span>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                        {courses.length} Semestres
                    </span>
                    {/* Presets rápidos */}
                    <div className="hidden sm:flex items-center gap-1.5 ml-2">
                        {[7, 8, 9, 10].map(n => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => handleSetSemestersCount(n)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    courses.length === n
                                        ? 'bg-secondary text-on-secondary'
                                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                {n} Sem.
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleRemoveSemester}
                        disabled={courses.length <= 1}
                        className="px-3 py-1.5 rounded-xl bg-surface-container text-xs font-bold text-on-surface hover:bg-error/10 hover:text-error border border-outline-variant/40 disabled:opacity-30 transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">remove</span>
                        <span>Quitar Semestre</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleAddSemester}
                        className="px-3 py-1.5 rounded-xl bg-primary/15 text-xs font-bold text-primary hover:bg-primary/25 border border-primary/30 transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>Agregar Semestre</span>
                    </button>
                </div>
            </div>

            {/* Tablero Visual de Semestres y Materias (Columnas) */}
            <div className="overflow-x-auto pb-4">
                <div
                    className="flex gap-4 min-w-max"
                    style={{ minHeight: '480px' }}
                >
                    {courses.map((clusterObj, clusterIdx) => {
                        const subjectsInCluster = clusterObj.content || [];
                        const clusterCredits = subjectsInCluster.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);

                        return (
                            <div
                                key={clusterObj.cluster}
                                className="w-72 bg-surface-container-low/70 rounded-2xl border border-outline-variant/30 flex flex-col shadow-sm"
                            >
                                {/* Header del Semestre */}
                                <div className="p-3.5 border-b border-outline-variant/20 bg-surface-container-high/40 rounded-t-2xl flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-sm text-primary">
                                            Semestre {clusterObj.cluster}
                                        </h3>
                                        <p className="text-[11px] text-on-surface-variant">
                                            {subjectsInCluster.length} materias • {clusterCredits} CR
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenAddSubject(clusterIdx)}
                                        className="p-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center gap-1 text-xs font-semibold"
                                        title={`Agregar materia al Semestre ${clusterObj.cluster}`}
                                    >
                                        <span className="material-symbols-outlined text-base">add</span>
                                        <span className="hidden sm:inline">Materia</span>
                                    </button>
                                </div>

                                {/* Lista de Tarjetas de Asignaturas */}
                                <div className="p-3 flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[600px]">
                                    {subjectsInCluster.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-outline-variant/30 rounded-xl text-center text-on-surface-variant/60">
                                            <span className="material-symbols-outlined text-2xl mb-1">playlist_add</span>
                                            <span className="text-xs">Sin materias aún</span>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenAddSubject(clusterIdx)}
                                                className="mt-2 text-[11px] text-primary hover:underline font-bold"
                                            >
                                                + Agregar primera materia
                                            </button>
                                        </div>
                                    ) : (
                                        subjectsInCluster.map((sub, subIdx) => {
                                            const subName = sub.subject || sub.name;
                                            return (
                                                <div
                                                    key={sub.id || subIdx}
                                                    className="bg-surface rounded-xl p-3 border border-outline-variant/40 shadow-sm hover:border-primary/50 transition-all group flex flex-col justify-between"
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                                                                {sub.id}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary/10 text-secondary">
                                                                {sub.credits} CR
                                                            </span>
                                                        </div>
                                                        <h4 className="text-xs font-bold text-on-surface leading-tight mb-2">
                                                            {subName}
                                                        </h4>
                                                        <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-2">
                                                            <span>T: {sub.theory}h • L: {sub.lab}h</span>
                                                            {sub.required ? (
                                                                <span className="bg-surface-container px-1.5 py-0.5 rounded text-amber-400 font-mono" title={`Prerrequisito: ${sub.required}`}>
                                                                    Req: {sub.required}
                                                                </span>
                                                            ) : (
                                                                <span className="text-green-500">Sin Req</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Botonera de acciones de la materia */}
                                                    <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-on-surface-variant">
                                                        <div className="flex items-center gap-1">
                                                            {/* Mover horizontal (entre semestres) */}
                                                            <button
                                                                type="button"
                                                                disabled={clusterIdx === 0}
                                                                onClick={() => handleMoveSubjectHorizontal(clusterIdx, subIdx, -1)}
                                                                className="p-1 rounded hover:bg-surface-container disabled:opacity-20 text-[10px]"
                                                                title="Mover al semestre anterior"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">arrow_back</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={clusterIdx === courses.length - 1}
                                                                onClick={() => handleMoveSubjectHorizontal(clusterIdx, subIdx, 1)}
                                                                className="p-1 rounded hover:bg-surface-container disabled:opacity-20 text-[10px]"
                                                                title="Mover al siguiente semestre"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                                            </button>

                                                            {/* Mover vertical (dentro del semestre) */}
                                                            <button
                                                                type="button"
                                                                disabled={subIdx === 0}
                                                                onClick={() => handleMoveSubjectVertical(clusterIdx, subIdx, -1)}
                                                                className="p-1 rounded hover:bg-surface-container disabled:opacity-20 text-[10px]"
                                                                title="Subir posición"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">arrow_upward</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={subIdx === subjectsInCluster.length - 1}
                                                                onClick={() => handleMoveSubjectVertical(clusterIdx, subIdx, 1)}
                                                                className="p-1 rounded hover:bg-surface-container disabled:opacity-20 text-[10px]"
                                                                title="Bajar posición"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">arrow_downward</span>
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEditSubject(clusterIdx, subIdx)}
                                                                className="p-1 rounded hover:bg-primary/10 text-primary text-[10px]"
                                                                title="Editar materia"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">edit</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteSubject(clusterIdx, subIdx)}
                                                                className="p-1 rounded hover:bg-error/10 text-error text-[10px]"
                                                                title="Eliminar materia"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal: Formulario Guiado de Materia */}
            {isSubjectModalOpen && editingSubject && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">menu_book</span>
                                {editingSubject.isNew ? 'Nueva Asignatura' : 'Editar Asignatura'} (Semestre {courses[editingSubject.clusterIndex]?.cluster})
                            </h3>
                            <button
                                type="button"
                                onClick={() => { setIsSubjectModalOpen(false); setEditingSubject(null); }}
                                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSaveSubjectModal} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-primary uppercase mb-1">Nombre de la Asignatura *</label>
                                <input
                                    type="text"
                                    value={editingSubject.subject.subject}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        // Auto sugerir código si es nueva y está vacío
                                        let suggestedId = editingSubject.subject.id;
                                        if (editingSubject.isNew && (!suggestedId || suggestedId.length <= 4)) {
                                            const words = name.trim().split(/\s+/).filter(w => w.length > 2);
                                            if (words.length > 0) {
                                                suggestedId = words.map(w => w[0].toUpperCase()).join('').slice(0, 5);
                                            }
                                        }
                                        setEditingSubject({
                                            ...editingSubject,
                                            subject: { ...editingSubject.subject, subject: name, id: suggestedId }
                                        });
                                    }}
                                    placeholder="Ej. Programación Avanzada"
                                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/50 text-on-surface text-sm focus:outline-none focus:border-primary"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-primary uppercase mb-1">Clave / ID Único *</label>
                                    <input
                                        type="text"
                                        value={editingSubject.subject.id}
                                        onChange={(e) => setEditingSubject({
                                            ...editingSubject,
                                            subject: { ...editingSubject.subject, id: e.target.value.toUpperCase() }
                                        })}
                                        placeholder="Ej. PA, CDA, ARQ101"
                                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/50 text-on-surface text-sm font-mono focus:outline-none focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-primary uppercase mb-1">Créditos *</label>
                                    <input
                                        type="number"
                                        value={editingSubject.subject.credits}
                                        onChange={(e) => setEditingSubject({
                                            ...editingSubject,
                                            subject: { ...editingSubject.subject, credits: e.target.value }
                                        })}
                                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/50 text-on-surface text-sm focus:outline-none focus:border-primary"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Horas Teoría</label>
                                    <input
                                        type="number"
                                        value={editingSubject.subject.theory}
                                        onChange={(e) => setEditingSubject({
                                            ...editingSubject,
                                            subject: { ...editingSubject.subject, theory: e.target.value }
                                        })}
                                        className="w-full px-3 py-1.5 rounded-xl bg-background border border-outline-variant/50 text-on-surface text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Horas Lab / Práctica</label>
                                    <input
                                        type="number"
                                        value={editingSubject.subject.lab}
                                        onChange={(e) => setEditingSubject({
                                            ...editingSubject,
                                            subject: { ...editingSubject.subject, lab: e.target.value }
                                        })}
                                        className="w-full px-3 py-1.5 rounded-xl bg-background border border-outline-variant/50 text-on-surface text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Horas Autónomas</label>
                                    <input
                                        type="number"
                                        value={editingSubject.subject.autonomous}
                                        onChange={(e) => setEditingSubject({
                                            ...editingSubject,
                                            subject: { ...editingSubject.subject, autonomous: e.target.value }
                                        })}
                                        className="w-full px-3 py-1.5 rounded-xl bg-background border border-outline-variant/50 text-on-surface text-sm"
                                    />
                                </div>
                            </div>

                            {/* Selector Asistido de Prerrequisitos */}
                            <div>
                                <label className="block text-xs font-bold text-primary uppercase mb-1">
                                    Prerrequisito (Seleccionar de materias existentes o regla)
                                </label>
                                <div className="space-y-2">
                                    <select
                                        value={editingSubject.subject.required || ''}
                                        onChange={(e) => setEditingSubject({
                                            ...editingSubject,
                                            subject: { ...editingSubject.subject, required: e.target.value }
                                        })}
                                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/50 text-on-surface text-sm focus:outline-none focus:border-primary"
                                    >
                                        <option value="">-- Sin Prerrequisito (Disponible libremente) --</option>
                                        <optgroup label="Reglas de Créditos">
                                            <option value="70%">70% de créditos aprobados</option>
                                            <option value="50%">50% de créditos aprobados</option>
                                        </optgroup>
                                        <optgroup label="Materias del Plan">
                                            {allSubjects
                                                .filter(s => s.id !== editingSubject.subject.id)
                                                .map(s => (
                                                    <option key={`${s.cluster}-${s.id}`} value={s.id}>
                                                        Sem. {s.cluster} — [{s.id}] {s.subject}
                                                    </option>
                                                ))
                                            }
                                        </optgroup>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="O escribe clave personalizada (ej. PB, 70%)"
                                        value={editingSubject.subject.required || ''}
                                        onChange={(e) => setEditingSubject({
                                            ...editingSubject,
                                            subject: { ...editingSubject.subject, required: e.target.value }
                                        })}
                                        className="w-full px-3.5 py-1.5 rounded-xl bg-background/50 border border-outline-variant/30 text-xs font-mono text-on-surface-variant focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
                                <button
                                    type="button"
                                    onClick={() => { setIsSubjectModalOpen(false); setEditingSubject(null); }}
                                    className="px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-110 transition-colors shadow-sm"
                                >
                                    {editingSubject.isNew ? 'Agregar Materia' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Importar / Ver JSON */}
            {isJsonModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl p-6 max-w-2xl w-full space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">data_object</span>
                                Importar o Inspeccionar JSON del Plan
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsJsonModalOpen(false)}
                                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <p className="text-xs text-on-surface-variant">
                            Puedes pegar un archivo JSON estructurado para cargar de inmediato las materias en el editor visual interactivo.
                        </p>

                        <textarea
                            value={rawJsonText}
                            onChange={(e) => setRawJsonText(e.target.value)}
                            rows={16}
                            className="w-full p-3 rounded-xl bg-background border border-outline-variant/50 text-on-surface font-mono text-xs focus:outline-none focus:border-primary"
                            placeholder='{\n  "career": "Ingeniería en...",\n  "courses": [...]\n}'
                        />

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsJsonModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high"
                            >
                                Cerrar
                            </button>
                            <button
                                type="button"
                                onClick={handleApplyImportedJson}
                                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-110 shadow-sm"
                            >
                                Aplicar JSON al Lienzo Visual
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación para Eliminar Plan */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface border border-error/30 rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4 animate-fadeIn">
                        <div className="flex items-center gap-3 text-error">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                            <h3 className="text-lg font-bold">¿Eliminar Plan Oficial?</h3>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            Estás a punto de eliminar definitivamente el plan de <strong>"{career}"</strong> de la base de datos de PostgreSQL. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleDeletePlanFromDb}
                                disabled={loading}
                                className="px-5 py-2 rounded-xl bg-error text-white text-xs font-bold hover:bg-error/90 shadow-sm disabled:opacity-50"
                            >
                                {loading ? 'Eliminando...' : 'Sí, Eliminar de BD'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
