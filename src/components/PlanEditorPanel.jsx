import React, { useState, useEffect, useMemo } from 'react';
import { navigate } from '../hooks/useRouter';
import { generateSubjectId } from '../utils/academicLogic';

/**
 * @param {{
 *   mode?: 'admin' | 'proposal',
 *   password?: string,
 *   availablePlans?: any[],
 *   onPlanSaved?: ((career: string | null) => void) | undefined,
 *   initialCareer?: string,
 *   user?: { username: string, emailHash: string } | null,
 *   onRequireLogin?: () => void,
 *   onProposalSubmitted?: (data: any) => void,
 *   onOpenPreview?: (data: any) => void
 * }} props
 */
export default function PlanEditorPanel({
    mode = 'admin',
    password = '',
    availablePlans = [],
    onPlanSaved,
    initialCareer = '',
    user = null,
    onRequireLogin,
    onProposalSubmitted,
    onOpenPreview
}) {
    const isProposalMode = mode === 'proposal';

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
    const [reason, setReason] = useState('');

    // Modal de edición/adición de materia
    const [editingSubject, setEditingSubject] = useState(null); // { subject: {...}, clusterIndex: number, isNew: boolean, originalId?: string, manualId?: boolean }
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

    // Modal de importación/exportación JSON
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
    const [rawJsonText, setRawJsonText] = useState('');

    // Modal de confirmación para eliminar plan
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Control de grilla (espacios en blanco position_Y) y Drag & Drop
    const [extraGridRows, setExtraGridRows] = useState(0);
    const [draggedItem, setDraggedItem] = useState(null); // { clusterIdx: number, rowIndex: number, subjectId: string }
    const [dragOverSlot, setDragOverSlot] = useState(null); // { clusterIdx: number, rowIndex: number }

    // Normaliza la grilla de cada semestre preservando huecos (position_Y) y evitando colisiones en la misma fila
    const normalizeClustersGrid = (rawCourses) => {
        if (!Array.isArray(rawCourses)) return [];
        return rawCourses.map((clusterObj) => {
            const content = Array.isArray(clusterObj.content) ? clusterObj.content : [];
            const sorted = [...content].sort(
                (a, b) => (Number(a.position_Y ?? a.Position) || 0) - (Number(b.position_Y ?? b.Position) || 0)
            );
            const usedRows = new Set();
            const normalizedContent = sorted.map((s, idx) => {
                let row = Math.max(1, Number(s.position_Y ?? s.Position) || (idx + 1));
                while (usedRows.has(row)) {
                    row += 1;
                }
                usedRows.add(row);
                return { ...s, position_Y: row };
            });
            return { ...clusterObj, content: normalizedContent };
        });
    };

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
        setExtraGridRows(0);
        setFeedback({ type: '', message: '' });
    };

    // Al montar o cambiar a 'create'
    useEffect(() => {
        if (editorMode === 'create' && courses.length === 0) {
            initBlankPlan(9);
        } else if (editorMode === 'modify' && availablePlans.length > 0 && !selectedCareerToLoad) {
            const careerToPick = (initialCareer && availablePlans.some(p => p.career === initialCareer))
                ? initialCareer
                : availablePlans[0].career;
            setSelectedCareerToLoad(careerToPick);
            handleLoadPlan(careerToPick);
        }
    }, [editorMode, availablePlans, initialCareer]);

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
                setCourses(normalizeClustersGrid(Array.isArray(data.courses) ? data.courses : []));
                setElectives(Array.isArray(data.electives) ? data.electives : []);
                setExtraGridRows(0);
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

    const existingIds = useMemo(() => allSubjects.map(s => s.id), [allSubjects]);

    // Detectar si el ID actual en el modal colisiona con otra materia
    const duplicateSubjectConflict = useMemo(() => {
        if (!editingSubject?.subject?.id) return null;
        const candidate = editingSubject.subject.id.trim().toUpperCase();
        if (!candidate) return null;
        return allSubjects.find(s => {
            if (s.id.toUpperCase() !== candidate) return false;
            if (!editingSubject.isNew && s.id.toUpperCase() === (editingSubject.originalId || '').toUpperCase()) {
                return false;
            }
            return true;
        }) || null;
    }, [editingSubject, allSubjects]);

    // Cálculos estadísticos y de filas de la grilla (position_Y)
    const totalSubjectsCount = allSubjects.length;
    const calculatedCredits = allSubjects.reduce((acc, s) => acc + (Number(s.credits) || 0), 0);

    const maxUsedRow = useMemo(() => {
        let max = 6;
        courses.forEach(c => {
            (c.content || []).forEach(s => {
                const row = Number(s.position_Y ?? s.Position) || 1;
                if (row > max) max = row;
            });
        });
        return max;
    }, [courses]);

    const totalGridRows = Math.max(1, maxUsedRow + extraGridRows);

    // Acciones sobre materias (soportando slots específicos de la grilla position_Y)
    const handleOpenAddSubject = (clusterIndex, targetRow = null) => {
        const cluster = courses[clusterIndex];
        const usedRows = new Set((cluster?.content || []).map(s => Number(s.position_Y) || 1));
        let firstFreeRow = 1;
        while (usedRows.has(firstFreeRow)) {
            firstFreeRow += 1;
        }
        const nextPositionY = targetRow ? Number(targetRow) : firstFreeRow;

        setEditingSubject({
            clusterIndex,
            isNew: true,
            originalId: '',
            manualId: false,
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
            originalId: target.id || '',
            manualId: false,
            subject: { ...target }
        });
        setIsSubjectModalOpen(true);
    };

    const handleSaveSubjectModal = (e) => {
        e.preventDefault();
        if (!editingSubject) return;

        const { clusterIndex, isNew, subjectIndex, subject, originalId } = editingSubject;
        const trimmedName = (subject.subject || '').trim();
        if (!trimmedName) {
            alert('El nombre de la materia es obligatorio.');
            return;
        }

        // Generar clave automáticamente si está vacía o si colisiona con otra materia
        let finalId = (subject.id || '').trim().toUpperCase();
        if (!finalId || duplicateSubjectConflict) {
            finalId = generateSubjectId(trimmedName, existingIds, originalId);
        }

        const updatedCourses = courses.map(c => ({
            ...c,
            content: (c.content || []).map(s => ({ ...s }))
        }));
        const clusterContent = updatedCourses[clusterIndex].content;
        const desiredRow = Math.max(1, Number(subject.position_Y) || 1);

        // Si otra materia en el mismo semestre ya ocupa desiredRow, empujar hacia abajo en cascada
        const otherItems = clusterContent
            .filter((_, idx) => isNew || idx !== subjectIndex)
            .sort((a, b) => (Number(a.position_Y) || 1) - (Number(b.position_Y) || 1));

        let rowToShift = desiredRow;
        otherItems.forEach(item => {
            if (Number(item.position_Y) === rowToShift) {
                item.position_Y = rowToShift + 1;
                rowToShift += 1;
            }
        });

        const cleanSubject = {
            ...subject,
            id: finalId,
            subject: trimmedName,
            credits: Number(subject.credits) || 0,
            theory: Number(subject.theory) || 0,
            lab: Number(subject.lab) || 0,
            autonomous: Number(subject.autonomous) || 0,
            position_Y: desiredRow,
            required: subject.required ? String(subject.required).trim() : null
        };

        if (isNew) {
            clusterContent.push(cleanSubject);
        } else {
            clusterContent[subjectIndex] = cleanSubject;
            // Si cambió la clave de una materia existente, actualizar referencias en prerrequisitos
            if (originalId && originalId.toUpperCase() !== finalId) {
                updatedCourses.forEach(c => {
                    c.content = c.content.map(item => {
                        if (item.required && String(item.required).toUpperCase() === originalId.toUpperCase()) {
                            return { ...item, required: finalId };
                        }
                        return item;
                    });
                });
            }
        }

        // Reordenar por position_Y conservando espacios en blanco
        clusterContent.sort((a, b) => (Number(a.position_Y) || 0) - (Number(b.position_Y) || 0));
        updatedCourses[clusterIndex].content = clusterContent;

        setCourses(updatedCourses);
        setIsSubjectModalOpen(false);
        setEditingSubject(null);
    };

    const handleDeleteSubject = (clusterIndex, subjectIndex) => {
        const sub = courses[clusterIndex].content[subjectIndex];
        if (!confirm(`¿Eliminar la materia "${sub.subject}"?`)) return;

        const updatedCourses = courses.map(c => ({
            ...c,
            content: [...(c.content || [])]
        }));
        // Eliminar sin compactar position_Y para respetar la grilla (deja su celda en blanco)
        updatedCourses[clusterIndex].content = updatedCourses[clusterIndex].content.filter((_, idx) => idx !== subjectIndex);
        setCourses(updatedCourses);
    };

    // Mover materia 1 fila arriba/abajo (soporta espacios en blanco o intercambio si está ocupada)
    const handleMoveSubjectVertical = (clusterIndex, subjectIndex, direction) => {
        const updatedCourses = courses.map(c => ({
            ...c,
            content: (c.content || []).map(s => ({ ...s }))
        }));
        const content = updatedCourses[clusterIndex].content;
        const currentSub = content[subjectIndex];
        if (!currentSub) return;

        const currentRow = Number(currentSub.position_Y) || (subjectIndex + 1);
        const targetRow = currentRow + direction;
        if (targetRow < 1) return;

        const occupant = content.find((s, idx) => idx !== subjectIndex && Number(s.position_Y) === targetRow);
        if (occupant) {
            occupant.position_Y = currentRow;
            currentSub.position_Y = targetRow;
        } else {
            currentSub.position_Y = targetRow;
        }

        content.sort((a, b) => (Number(a.position_Y) || 0) - (Number(b.position_Y) || 0));
        setCourses(updatedCourses);
    };

    // Mover materia al semestre contiguo conservando su fila si está libre
    const handleMoveSubjectHorizontal = (clusterIndex, subjectIndex, direction) => {
        const targetClusterIndex = clusterIndex + direction;
        if (targetClusterIndex < 0 || targetClusterIndex >= courses.length) return;

        const updatedCourses = courses.map(c => ({
            ...c,
            content: (c.content || []).map(s => ({ ...s }))
        }));
        const sourceContent = updatedCourses[clusterIndex].content;
        const targetContent = updatedCourses[targetClusterIndex].content;

        const [movedSubject] = sourceContent.splice(subjectIndex, 1);
        if (!movedSubject) return;

        const preferredRow = Number(movedSubject.position_Y) || 1;
        const usedTargetRows = new Set(targetContent.map(s => Number(s.position_Y) || 1));
        let finalRow = preferredRow;
        while (usedTargetRows.has(finalRow)) {
            finalRow += 1;
        }
        movedSubject.position_Y = finalRow;
        targetContent.push(movedSubject);
        targetContent.sort((a, b) => (Number(a.position_Y) || 0) - (Number(b.position_Y) || 0));

        setCourses(updatedCourses);
    };

    // Insertar un espacio en blanco en rowIndex empujando las materias desde rowIndex hacia abajo
    const handleInsertBlankAbove = (clusterIndex, rowIndex) => {
        const updatedCourses = courses.map(c => ({
            ...c,
            content: (c.content || []).map(s => ({ ...s }))
        }));
        updatedCourses[clusterIndex].content.forEach(s => {
            const r = Number(s.position_Y) || 1;
            if (r >= rowIndex) {
                s.position_Y = r + 1;
            }
        });
        updatedCourses[clusterIndex].content.sort((a, b) => (Number(a.position_Y) || 0) - (Number(b.position_Y) || 0));
        setCourses(updatedCourses);
    };

    // Cerrar un espacio en blanco subiendo 1 fila las materias que están debajo en ese semestre
    const handleRemoveBlankSlot = (clusterIndex, rowIndex) => {
        const updatedCourses = courses.map(c => ({
            ...c,
            content: (c.content || []).map(s => ({ ...s }))
        }));
        updatedCourses[clusterIndex].content.forEach(s => {
            const r = Number(s.position_Y) || 1;
            if (r > rowIndex) {
                s.position_Y = r - 1;
            }
        });
        updatedCourses[clusterIndex].content.sort((a, b) => (Number(a.position_Y) || 0) - (Number(b.position_Y) || 0));
        setCourses(updatedCourses);
    };

    // Handlers de Drag & Drop (Arrastrar y Soltar materias en cualquier celda de la grilla)
    const handleDragStart = (e, clusterIdx, rowIndex, subjectId) => {
        setDraggedItem({ clusterIdx, rowIndex, subjectId });
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            try {
                e.dataTransfer.setData('text/plain', `${clusterIdx}:${rowIndex}:${subjectId}`);
            } catch (_) {}
        }
    };

    const handleDragOver = (e, clusterIdx, rowIndex) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
        if (!dragOverSlot || dragOverSlot.clusterIdx !== clusterIdx || dragOverSlot.rowIndex !== rowIndex) {
            setDragOverSlot({ clusterIdx, rowIndex });
        }
    };

    const handleDragLeave = (clusterIdx, rowIndex) => {
        if (dragOverSlot && dragOverSlot.clusterIdx === clusterIdx && dragOverSlot.rowIndex === rowIndex) {
            setDragOverSlot(null);
        }
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverSlot(null);
    };

    const handleDrop = (e, targetClusterIdx, targetRowIndex) => {
        e.preventDefault();
        if (!draggedItem) return;

        const { clusterIdx: sourceClusterIdx, rowIndex: sourceRowIndex } = draggedItem;
        setDraggedItem(null);
        setDragOverSlot(null);

        if (sourceClusterIdx === targetClusterIdx && sourceRowIndex === targetRowIndex) {
            return;
        }

        const updatedCourses = courses.map(c => ({
            ...c,
            content: (c.content || []).map(s => ({ ...s }))
        }));

        const sourceContent = updatedCourses[sourceClusterIdx]?.content;
        const targetContent = updatedCourses[targetClusterIdx]?.content;
        if (!sourceContent || !targetContent) return;

        const sourceSubIdx = sourceContent.findIndex(s => Number(s.position_Y) === sourceRowIndex);
        if (sourceSubIdx === -1) return;

        const targetSubIdx = targetContent.findIndex(s => Number(s.position_Y) === targetRowIndex);

        if (sourceClusterIdx === targetClusterIdx) {
            // Mismo semestre: mover a espacio vacío o intercambiar con la materia destino
            if (targetSubIdx === -1) {
                sourceContent[sourceSubIdx].position_Y = targetRowIndex;
            } else {
                sourceContent[sourceSubIdx].position_Y = targetRowIndex;
                sourceContent[targetSubIdx].position_Y = sourceRowIndex;
            }
            sourceContent.sort((a, b) => (Number(a.position_Y) || 0) - (Number(b.position_Y) || 0));
        } else {
            // Diferente semestre: mover a espacio vacío o intercambiar entre ambos semestres
            const [movedSub] = sourceContent.splice(sourceSubIdx, 1);
            if (targetSubIdx === -1) {
                movedSub.position_Y = targetRowIndex;
                targetContent.push(movedSub);
            } else {
                const [swappedSub] = targetContent.splice(targetSubIdx, 1);
                movedSub.position_Y = targetRowIndex;
                swappedSub.position_Y = sourceRowIndex;
                targetContent.push(movedSub);
                sourceContent.push(swappedSub);
                sourceContent.sort((a, b) => (Number(a.position_Y) || 0) - (Number(b.position_Y) || 0));
            }
            targetContent.sort((a, b) => (Number(a.position_Y) || 0) - (Number(b.position_Y) || 0));
        }

        setCourses(updatedCourses);
    };

    // Guardar Plan Oficial en Base de Datos (Modo Admin)
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

    // Publicar Propuesta Comunitaria (Modo Estudiante)
    const handlePublishProposal = async () => {
        if (!career.trim()) {
            setFeedback({ type: 'error', message: 'Ingresa el nombre de la carrera o selecciona un plan existente.' });
            return;
        }
        if (!reason.trim()) {
            setFeedback({ type: 'error', message: 'Por favor escribe el motivo o justificación académica de tu propuesta.' });
            return;
        }
        if (courses.length === 0 || totalSubjectsCount === 0) {
            setFeedback({ type: 'error', message: 'El plan propuesto debe contener al menos un semestre con materias.' });
            return;
        }
        if (!user) {
            setFeedback({
                type: 'error',
                message: 'Inicia sesión con tu cuenta institucional (@buap.mx) para publicar tu propuesta. Tus cambios en el lienzo se conservarán.'
            });
            if (onRequireLogin) onRequireLogin();
            return;
        }

        setLoading(true);
        setFeedback({ type: '', message: '' });
        const isNew = editorMode === 'create';

        try {
            const token = localStorage.getItem('forum_token');
            const res = await fetch('/api/proposals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    career: career.trim(),
                    username: user.username,
                    emailHash: user.emailHash,
                    reason: reason.trim(),
                    courses,
                    electives,
                    min_credits: Number(minCredits) || calculatedCredits,
                    max_credits: Number(maxCredits) || calculatedCredits + 50,
                    is_new_plan: isNew
                })
            });

            const data = await res.json();
            if (res.ok) {
                setFeedback({
                    type: 'success',
                    message: isNew
                        ? `🎉 ¡Propuesta de nuevo plan publicada! Al aprobarse, aparecerá acreditada gracias a @${user.username}.`
                        : '🎉 ¡Propuesta publicada exitosamente! Tu voto inicial a favor fue registrado.'
                });
                setReason('');
                if (onProposalSubmitted) {
                    setTimeout(() => onProposalSubmitted(data), 900);
                }
            } else {
                setFeedback({ type: 'error', message: data.detail || data.error || 'Error al publicar la propuesta.' });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: 'Error de red al publicar la propuesta.' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenVisualPreview = () => {
        if (!onOpenPreview) return;
        onOpenPreview({
            career: career.trim() || 'Nueva Carrera Propuesta',
            author: user?.username,
            reason: reason.trim() || 'Vista previa en edición',
            isNewPlan: editorMode === 'create',
            courses
        });
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
            setCourses(normalizeClustersGrid(parsed.courses));
            setExtraGridRows(0);
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
                                    const targetCareer = selectedCareerToLoad || availablePlans[0].career;
                                    setSelectedCareerToLoad(targetCareer);
                                    handleLoadPlan(targetCareer);
                                }
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                editorMode === 'modify'
                                    ? 'bg-primary text-on-primary shadow-sm'
                                    : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                        >
                            <span>✏️</span> {isProposalMode ? 'Modificar Plan Existente' : 'Modificar Plan Existente'}
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
                            <span>➕</span> {isProposalMode ? 'Proponer Nuevo Plan' : 'Crear Nuevo Plan'}
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

                        {isProposalMode ? (
                            <>
                                {onOpenPreview && (
                                    <button
                                        type="button"
                                        onClick={handleOpenVisualPreview}
                                        className="px-4 py-2 rounded-xl bg-secondary/15 text-secondary text-xs font-bold hover:bg-secondary/25 border border-secondary/30 flex items-center gap-1.5 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">visibility</span>
                                        <span>Vista Previa y Cambios</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handlePublishProposal}
                                    disabled={loading}
                                    className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-sm">how_to_vote</span>
                                    <span>{loading ? 'Publicando...' : 'Publicar Propuesta a Votación'}</span>
                                </button>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
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
                                    {p.career} {p.faculty ? `— ${p.faculty}` : ''}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => handleLoadPlan(selectedCareerToLoad)}
                            className="px-4 py-2 rounded-xl bg-secondary/15 text-secondary text-xs font-bold hover:bg-secondary/25 transition-colors"
                        >
                            Recargar Datos Oficiales
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
                <div className="flex flex-wrap items-center justify-between border-b border-outline-variant/20 pb-3 gap-2">
                    <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                        <span>📋</span> {isProposalMode ? 'Datos del Plan y Justificación de la Propuesta' : 'Información General del Plan'}
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

                {isProposalMode && (
                    <div className="space-y-2 pb-2 border-b border-outline-variant/20">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="text-xs font-bold text-primary uppercase">
                                Motivo o Justificación Académica de la Propuesta *
                            </label>
                            {user ? (
                                <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1">
                                    <span>🌟</span>
                                    <span>Autor acreditado al aprobarse: <strong>@{user.username}</strong></span>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onRequireLogin}
                                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-xs">login</span>
                                    <span>Inicia sesión (@buap.mx) para acreditar tu usuario</span>
                                </button>
                            )}
                        </div>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={2}
                            placeholder={
                                editorMode === 'create'
                                    ? 'Ej. Incorporación del mapa curricular oficial Minerva de la Licenciatura en Ciencia de Datos...'
                                    : 'Ej. Se corrigen prerrequisitos del 5.º semestre y se agregan asignaturas optativas según plan vigente...'
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary resize-y"
                            required
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-primary uppercase">Nombre de la Carrera / Licenciatura *</label>
                        <input
                            type="text"
                            value={career}
                            onChange={(e) => setCareer(e.target.value)}
                            disabled={isProposalMode && editorMode === 'modify'}
                            placeholder="Ej. Ingeniería en Ciencias de la Computación"
                            className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary disabled:opacity-70"
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

            {/* Barra de Configuración de Semestres y Grilla (Filas y Espacios en Blanco) */}
            <div className="bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-base">view_column</span>
                            Semestres:
                        </span>
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                            {courses.length} Sem.
                        </span>
                        {/* Presets rápidos */}
                        <div className="hidden sm:flex items-center gap-1.5">
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

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleRemoveSemester}
                                disabled={courses.length <= 1}
                                className="px-2.5 py-1 rounded-xl bg-surface-container text-xs font-bold text-on-surface hover:bg-error/10 hover:text-error border border-outline-variant/40 disabled:opacity-30 transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-xs">remove</span>
                                <span>Semestre</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleAddSemester}
                                className="px-2.5 py-1 rounded-xl bg-primary/15 text-xs font-bold text-primary hover:bg-primary/25 border border-primary/30 transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-xs">add</span>
                                <span>Semestre</span>
                            </button>
                        </div>
                    </div>

                    {/* Control de Filas de la Grilla (Espacios en Blanco) */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-secondary text-base">grid_on</span>
                            Filas de Grilla:
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-bold text-xs border border-secondary/20">
                            {totalGridRows} Filas
                        </span>
                        <button
                            type="button"
                            onClick={() => setExtraGridRows(prev => Math.max(0, prev - 1))}
                            disabled={extraGridRows <= 0}
                            className="px-2.5 py-1 rounded-xl bg-surface-container text-xs font-bold text-on-surface hover:bg-surface-container-high border border-outline-variant/40 disabled:opacity-30 transition-colors flex items-center gap-1"
                            title="Reducir filas vacías adicionales al final de la grilla"
                        >
                            <span className="material-symbols-outlined text-xs">remove</span>
                            <span>Fila</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setExtraGridRows(prev => prev + 1)}
                            className="px-2.5 py-1 rounded-xl bg-secondary/15 text-xs font-bold text-secondary hover:bg-secondary/25 border border-secondary/30 transition-colors flex items-center gap-1"
                            title="Agregar una fila en blanco adicional a toda la grilla"
                        >
                            <span className="material-symbols-outlined text-xs">add</span>
                            <span>Agregar Fila en Blanco</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-sm">drag_indicator</span>
                        <strong>Arrastra y suelta (Drag & Drop)</strong> cualquier materia hacia otro semestre o hacia una celda vacía para organizar el mapa gráfico.
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-sm">space_dashboard</span>
                        <strong>Espacios en blanco:</strong> las celdas vacías se conservan en el visualizador para alinear cadenas de seriación.
                    </span>
                </div>
            </div>

            {/* Tablero Visual de Semestres y Grilla de Materias (Columnas x Filas) */}
            <div className="overflow-x-auto pb-4">
                <div
                    className="flex gap-4 min-w-max"
                    style={{ minHeight: '520px' }}
                >
                    {courses.map((clusterObj, clusterIdx) => {
                        const subjectsInCluster = clusterObj.content || [];
                        const clusterCredits = subjectsInCluster.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
                        const maxRowInThisCluster = subjectsInCluster.reduce(
                            (m, s) => Math.max(m, Number(s.position_Y) || 1),
                            0
                        );

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

                                {/* Grilla de Filas (1..totalGridRows) con soporte de Espacios en Blanco y Drag & Drop */}
                                <div className="p-3 flex-1 flex flex-col gap-2.5">
                                    {Array.from({ length: totalGridRows }, (_, rIdx) => {
                                        const rowIndex = rIdx + 1;
                                        const subIdx = subjectsInCluster.findIndex(
                                            s => (Number(s.position_Y) || 1) === rowIndex
                                        );
                                        const sub = subIdx !== -1 ? subjectsInCluster[subIdx] : null;
                                        const isDragOver =
                                            dragOverSlot &&
                                            dragOverSlot.clusterIdx === clusterIdx &&
                                            dragOverSlot.rowIndex === rowIndex;
                                        const isBeingDragged =
                                            draggedItem &&
                                            draggedItem.clusterIdx === clusterIdx &&
                                            draggedItem.rowIndex === rowIndex;

                                        if (!sub) {
                                            const hasSubjectsBelow = maxRowInThisCluster > rowIndex;
                                            return (
                                                <div
                                                    key={`empty-${clusterObj.cluster}-${rowIndex}`}
                                                    onDragOver={(e) => handleDragOver(e, clusterIdx, rowIndex)}
                                                    onDragLeave={() => handleDragLeave(clusterIdx, rowIndex)}
                                                    onDrop={(e) => handleDrop(e, clusterIdx, rowIndex)}
                                                    className={`min-h-[126px] rounded-xl border-2 border-dashed p-3 flex flex-col items-center justify-center text-center transition-all group ${
                                                        isDragOver
                                                            ? 'border-primary bg-primary/15 scale-[1.02] shadow-md'
                                                            : 'border-outline-variant/25 bg-surface/30 hover:border-primary/40 hover:bg-surface/60'
                                                    }`}
                                                >
                                                    <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/60 mb-1">
                                                        Fila {rowIndex} • Espacio en blanco
                                                    </span>
                                                    {isDragOver ? (
                                                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">place_item</span>
                                                            Soltar materia aquí
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap items-center justify-center gap-2 mt-1 opacity-75 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenAddSubject(clusterIdx, rowIndex)}
                                                                className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
                                                                title={`Agregar materia en Semestre ${clusterObj.cluster}, Fila ${rowIndex}`}
                                                            >
                                                                <span className="material-symbols-outlined text-xs">add</span>
                                                                <span>Materia aquí</span>
                                                            </button>
                                                            {hasSubjectsBelow && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveBlankSlot(clusterIdx, rowIndex)}
                                                                    className="px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-[10px] font-semibold flex items-center gap-0.5 transition-colors"
                                                                    title="Cerrar este espacio vacío subiendo 1 fila las materias inferiores"
                                                                >
                                                                    <span className="material-symbols-outlined text-xs">vertical_align_top</span>
                                                                    <span>Quitar espacio</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        const subName = sub.subject || sub.name;
                                        return (
                                            <div
                                                key={`${sub.id || subIdx}-row-${rowIndex}`}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, clusterIdx, rowIndex, sub.id)}
                                                onDragEnd={handleDragEnd}
                                                onDragOver={(e) => handleDragOver(e, clusterIdx, rowIndex)}
                                                onDragLeave={() => handleDragLeave(clusterIdx, rowIndex)}
                                                onDrop={(e) => handleDrop(e, clusterIdx, rowIndex)}
                                                className={`min-h-[126px] bg-surface rounded-xl p-3 border shadow-sm transition-all group flex flex-col justify-between cursor-grab active:cursor-grabbing ${
                                                    isBeingDragged
                                                        ? 'opacity-40 scale-95 border-primary ring-2 ring-primary/40'
                                                        : isDragOver
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary scale-[1.02]'
                                                        : 'border-outline-variant/40 hover:border-primary/50'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-1 mb-1.5">
                                                        <div className="flex items-center gap-1">
                                                            <span
                                                                className="material-symbols-outlined text-sm text-on-surface-variant/60 group-hover:text-primary cursor-grab"
                                                                title="Arrastra para mover a otra fila o semestre"
                                                            >
                                                                drag_indicator
                                                            </span>
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                                                                {sub.id}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-on-surface-variant/70">
                                                                F{rowIndex}
                                                            </span>
                                                        </div>
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
                                                    <div className="flex items-center gap-0.5">
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

                                                        {/* Mover vertical 1 fila (incluso hacia o dejando espacio en blanco) */}
                                                        <button
                                                            type="button"
                                                            disabled={rowIndex <= 1}
                                                            onClick={() => handleMoveSubjectVertical(clusterIdx, subIdx, -1)}
                                                            className="p-1 rounded hover:bg-surface-container disabled:opacity-20 text-[10px]"
                                                            title="Subir 1 fila en la grilla"
                                                        >
                                                            <span className="material-symbols-outlined text-xs">arrow_upward</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveSubjectVertical(clusterIdx, subIdx, 1)}
                                                            className="p-1 rounded hover:bg-surface-container text-[10px]"
                                                            title="Bajar 1 fila en la grilla (deja espacio en blanco arriba si está libre)"
                                                        >
                                                            <span className="material-symbols-outlined text-xs">arrow_downward</span>
                                                        </button>

                                                        {/* Insertar espacio en blanco justo arriba */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleInsertBlankAbove(clusterIdx, rowIndex)}
                                                            className="p-1 rounded hover:bg-secondary/15 text-secondary text-[10px]"
                                                            title="Insertar espacio en blanco arriba (empuja esta materia y las inferiores 1 fila hacia abajo)"
                                                        >
                                                            <span className="material-symbols-outlined text-xs">space_bar</span>
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
                                                            title="Eliminar materia (deja su celda en blanco)"
                                                        >
                                                            <span className="material-symbols-outlined text-xs">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                        let nextId = editingSubject.subject.id;
                                        if (editingSubject.isNew && !editingSubject.manualId) {
                                            nextId = generateSubjectId(name, existingIds, editingSubject.originalId);
                                        }
                                        setEditingSubject({
                                            ...editingSubject,
                                            subject: { ...editingSubject.subject, subject: name, id: nextId }
                                        });
                                    }}
                                    placeholder="Ej. Programación Avanzada"
                                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/50 text-on-surface text-sm focus:outline-none focus:border-primary"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-bold text-primary uppercase">
                                            Clave / ID (Automático)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const autoId = generateSubjectId(
                                                    editingSubject.subject.subject,
                                                    existingIds,
                                                    editingSubject.originalId
                                                );
                                                setEditingSubject({
                                                    ...editingSubject,
                                                    manualId: false,
                                                    subject: { ...editingSubject.subject, id: autoId }
                                                });
                                            }}
                                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                                            title="Regenerar clave única automáticamente a partir del nombre"
                                        >
                                            <span className="material-symbols-outlined text-xs">autorenew</span>
                                            <span>Auto-generar</span>
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={editingSubject.subject.id}
                                        onChange={(e) => setEditingSubject({
                                            ...editingSubject,
                                            manualId: true,
                                            subject: { ...editingSubject.subject, id: e.target.value.toUpperCase() }
                                        })}
                                        placeholder="Se genera automáticamente..."
                                        className={`w-full px-3.5 py-2 rounded-xl bg-background border text-on-surface text-sm font-mono focus:outline-none ${
                                            duplicateSubjectConflict
                                                ? 'border-error focus:border-error'
                                                : 'border-outline-variant/50 focus:border-primary'
                                        }`}
                                    />
                                    {duplicateSubjectConflict ? (
                                        <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                                            <span>⚠️</span>
                                            <span>
                                                Clave en uso por "{duplicateSubjectConflict.subject}" (Sem. {duplicateSubjectConflict.cluster}). Se ajustará automáticamente al guardar.
                                            </span>
                                        </p>
                                    ) : editingSubject.subject.id ? (
                                        <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
                                            <span>✨</span>
                                            <span>Clave única lista: <strong>{editingSubject.subject.id}</strong></span>
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-on-surface-variant mt-1">
                                            Se asignará automáticamente al escribir el nombre.
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
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
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase mb-1" title="Fila vertical en la columna del semestre (deja espacios en blanco si saltas filas)">
                                            Fila (Grilla)
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={editingSubject.subject.position_Y || 1}
                                            onChange={(e) => setEditingSubject({
                                                ...editingSubject,
                                                subject: { ...editingSubject.subject, position_Y: Math.max(1, parseInt(e.target.value, 10) || 1) }
                                            })}
                                            className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/50 text-on-surface text-sm focus:outline-none focus:border-secondary"
                                        />
                                    </div>
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
