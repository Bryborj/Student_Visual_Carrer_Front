import { useState, useEffect, useMemo } from 'react';
import planData from '../data/Plan_ICC.json';
import { normalizeData, isSubjectAvailable, getTotalPlanCredits, getPassedCredits } from '../utils/academicLogic';

const STORAGE_KEY = 'academic_plan_passed_subjects';

export const useStudyPlan = () => {
    // 1. Normalize Data (Memoized to run once)
    const { subjectsByName, unlockToName } = useMemo(() => normalizeData(planData), []);
    const totalCredits = useMemo(() => getTotalPlanCredits(planData), []);

    // 2. State Initialization from LocalStorage
    const [passedSubjects, setPassedSubjects] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to load state", e);
            return [];
        }
    });

    // 3. Persistence
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(passedSubjects));
    }, [passedSubjects]);

    // 4. Actions
    const toggleSubject = (subjectName) => {
        setPassedSubjects(prev => {
            if (prev.includes(subjectName)) {
                return prev.filter(s => s !== subjectName);
            } else {
                return [...prev, subjectName];
            }
        });
    };

    const resetPlan = () => {
        setPassedSubjects([]);
    };

    // 5. Helpers
    // Returns true if the subject is eligible to be taken (Unlocked)
    // NOTE: If already passed, it returns false (conceptually "available to take" implies not taken yet).
    // But for the UI, we might want to distinguish "Passed" vs "Available" vs "Locked".
    // This function answers "Is it UNLOCKED?". It relies on `isSubjectAvailable` which returns true if reqs met and not passed.
    // Wait, `isSubjectAvailable` in utils returns false if passed.
    // So `isUnlocked` basically means "Ready to take".
    // The UI needs 3 states:
    // - PASSED (in passedSubjects)
    // - AVAILABLE (not passed AND reqs met)
    // - LOCKED (not passed AND reqs NOT met)
    const getSubjectStatus = (subject) => {
        if (passedSubjects.includes(subject.name)) return 'PASSED';

        // Check requirements
        const available = isSubjectAvailable(subject, passedSubjects, subjectsByName, unlockToName, totalCredits);
        return available ? 'AVAILABLE' : 'LOCKED';
    };

    const stats = {
        passedCredits: getPassedCredits(passedSubjects, subjectsByName),
        totalCredits,
        percentage: totalCredits > 0 ? (getPassedCredits(passedSubjects, subjectsByName) / totalCredits) * 100 : 0
    };

    return {
        planData,
        passedSubjects,
        toggleSubject,
        resetPlan,
        getSubjectStatus,
        stats,
        subjectsByName
    };
};
