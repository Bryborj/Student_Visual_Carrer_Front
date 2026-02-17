/**
 * Calculate the total credits available in the entire study plan.
 * @param {Object} data - The raw plan data from JSON.
 * @returns {number} Total credits.
 */
export const getTotalPlanCredits = (data) => {
    let total = 0;
    data.courses.forEach(cluster => {
        cluster.content.forEach(subject => {
            total += subject.Credits;
        });
    });
    return total;
};

/**
 * Calculate the total credits of passed subjects.
 * @param {Array<string>} passedSubjectNames - List of passed subject names.
 * @param {Object} subjectsByName - Map of subject Name -> Subject Object.
 * @returns {number} Total passed credits.
 */
export const getPassedCredits = (passedSubjectNames, subjectsByName) => {
    let total = 0;
    passedSubjectNames.forEach(name => {
        const subject = subjectsByName[name];
        if (subject) {
            total += subject.Credits;
        }
    });
    return total;
};

/**
 * Normalizes the raw JSON data into lookup maps for efficient access.
 * @param {Object} data - The raw plan data.
 * @returns {Object} { subjectsByName, unlockToName }
 */
export const normalizeData = (data) => {
    const subjectsByName = {};
    const unlockToName = {};

    data.courses.forEach(cluster => {
        cluster.content.forEach(subject => {
            subjectsByName[subject.name] = { ...subject, cluster: cluster.cluster };

            if (subject.Unlock) {
                if (Array.isArray(subject.Unlock)) {
                    subject.Unlock.forEach(code => unlockToName[code] = subject.name);
                } else {
                    unlockToName[subject.Unlock] = subject.name;
                }
            }
        });
    });

    return { subjectsByName, unlockToName };
};

/**
 * Determines if a subject is available to take.
 * A subject is available if:
 * 1. It is NOT already passed.
 * 2. All its requirements are met.
 * 
 * @param {Object} subject - The subject object to check.
 * @param {Array<string>} passedSubjectNames - List of passed subject names.
 * @param {Object} subjectsByName - Map of subject Name -> Subject Object.
 * @param {Object} unlockToName - Map of Unlock Code -> Subject Name.
 * @param {number} totalPlanCredits - Total credits in the plan.
 * @returns {boolean} True if subject is available (unlocked).
 */
export const isSubjectAvailable = (subject, passedSubjectNames, subjectsByName, unlockToName, totalPlanCredits) => {
    if (passedSubjectNames.includes(subject.name)) return false; // Already passed

    const { Required } = subject;

    // If no requirements, it's available (unless passed, checked above)
    if (!Required) return true;

    // Helper to check if a specific code/rule is satisfied
    const checkCode = (code) => {
        // Special Rule: 70% credits
        if (code === "70% de créditos aprobados") {
            const passedCredits = getPassedCredits(passedSubjectNames, subjectsByName);
            // Avoid division by zero
            if (totalPlanCredits === 0) return false;
            return (passedCredits / totalPlanCredits) >= 0.7;
        }

        // Standard Code Requirement
        const providerName = unlockToName[code];

        // If the requirement code doesn't map to any subject, we have a problem.
        // In a robust app, we might handle this gracefully or log a warning.
        // For now, if provider not found, requirement is NOT met.
        if (!providerName) {
            // console.warn(`Provider for code ${code} not found.`);
            return false;
        }

        return passedSubjectNames.includes(providerName);
    };

    // If Required is an array, ALL must be satisfied
    if (Array.isArray(Required)) {
        return Required.every(checkCode);
    }

    // Single requirement
    return checkCode(Required);
};
