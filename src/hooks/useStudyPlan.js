import { useState, useEffect, useMemo, useCallback } from 'react';
import { normalizeData, isSubjectAvailable, getTotalPlanCredits, getPassedCredits } from '../utils/academicLogic';

export const useStudyPlan = (career) => {
    const [planData, setPlanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Fetch Data from PostgreSQL via API Route
    useEffect(() => {
        if (!career) return;
        const fetchPlan = async () => {
            setLoading(true);
            try {
                const url = `/api/plan?career=${encodeURIComponent(career)}`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('No se pudo cargar el plan de estudios.');
                }
                const data = await response.json();
                setPlanData(data);
            } catch (err) {
                console.error("Failed to fetch plan:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, [career]);

    // 2. Normalize Data (Memoized)
    const { subjectsByName, unlockToName } = useMemo(() => {
        if (!planData) return { subjectsByName: {}, unlockToName: {} };
        return normalizeData(planData);
    }, [planData]);

    const totalCredits = useMemo(() => {
        if (!planData) return 0;
        return getTotalPlanCredits(planData);
    }, [planData]);

    // 3. State Initialization from LocalStorage with legacy migration
    const STORAGE_KEY = `academic_plan_passed_subjects_${career}`;
    const getStoredSubjects = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return JSON.parse(stored);
            // Migración transparente si existía guardado con modalidad en versiones previas
            const legacy = localStorage.getItem(`academic_plan_passed_subjects_${career}_Escolarizada`) ||
                           localStorage.getItem(`academic_plan_passed_subjects_${career}_default`);
            if (legacy) return JSON.parse(legacy);
            return [];
        } catch (e) {
            console.error("Failed to load state", e);
            return [];
        }
    };

    const [passedSubjects, setPassedSubjects] = useState(getStoredSubjects);

    // Reset passedSubjects state when career changes
    useEffect(() => {
        setPassedSubjects(getStoredSubjects());
    }, [STORAGE_KEY]);

    // 4. Persistence
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(passedSubjects));
    }, [passedSubjects, STORAGE_KEY]);

    // 5. Actions
    const toggleSubject = useCallback((subjectName) => {
        setPassedSubjects(prev => {
            if (prev.includes(subjectName)) {
                return prev.filter(s => s !== subjectName);
            } else {
                return [...prev, subjectName];
            }
        });
    }, []);

    const resetPlan = useCallback(() => {
        setPassedSubjects([]);
    }, []);

    // 6. Helpers
    const getSubjectStatus = useCallback((subject) => {
        if (!planData) return 'LOCKED';
        if (passedSubjects.includes(subject.subject)) return 'PASSED';
        const available = isSubjectAvailable(subject, passedSubjects, subjectsByName, unlockToName, totalCredits);
        return available ? 'AVAILABLE' : 'LOCKED';
    }, [passedSubjects, subjectsByName, unlockToName, totalCredits, planData]);

    const stats = useMemo(() => {
        return {
            passedCredits: getPassedCredits(passedSubjects, subjectsByName),
            totalCredits,
            percentage: totalCredits > 0 ? (getPassedCredits(passedSubjects, subjectsByName) / totalCredits) * 100 : 0
        };
    }, [passedSubjects, subjectsByName, totalCredits]);

    return {
        planData,
        loading,
        error,
        passedSubjects,
        toggleSubject,
        resetPlan,
        getSubjectStatus,
        stats,
        subjectsByName
    };
};
