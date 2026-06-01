/**
 * Calculate the total credits available in the entire study plan.
 * @param {Object} data - The raw plan data from JSON.
 * @returns {number} Total credits.
 */
export const getTotalPlanCredits = (data) => {
    return data.min_credits;
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
            const credits = subject.credits !== undefined ? subject.credits : (subject.Credits || 0);
            total += credits;
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
    const idToName = {};

    data.courses.forEach(cluster => {
        cluster.content.forEach(subject => {
            const subjectName = subject.subject || subject.name;
            subjectsByName[subjectName] = { ...subject, cluster: cluster.cluster };

            if (subject.id) {
                idToName[subject.id] = subjectName;
            }

            // For backward compatibility with the old JSON format
            if (subject.Unlock) {
                if (Array.isArray(subject.Unlock)) {
                    subject.Unlock.forEach(code => idToName[code] = subjectName);
                } else {
                    idToName[subject.Unlock] = subjectName;
                }
            }
        });
    });

    return { subjectsByName, unlockToName: idToName };
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
    const subjectName = subject.subject || subject.name;
    if (passedSubjectNames.includes(subjectName)) return false; // Already passed

    const requiredCodes = subject.required !== undefined ? subject.required : subject.Required;

    // If no requirements, it's available (unless passed, checked above)
    if (!requiredCodes || requiredCodes === "") return true;

    // Helper to check if a specific code/rule is satisfied
    const checkCode = (code) => {
        // Special Rule: 70% credits
        if ((typeof code === "string" && code.includes("%"))) {
            const passedCredits = getPassedCredits(passedSubjectNames, subjectsByName);
            if (totalPlanCredits === 0) return false;
            code = code.replace("%", "");
            const percentage = parseFloat(code) / 100;
            return (passedCredits / totalPlanCredits) >= percentage;
        }

        // Standard Code Requirement
        const providerName = unlockToName[code];

        if (!providerName) {
            return false;
        }

        return passedSubjectNames.includes(providerName);
    };

    // If Required is an array, ALL must be satisfied
    if (Array.isArray(requiredCodes)) {
        return requiredCodes.every(checkCode);
    }

    // Single requirement
    return checkCode(requiredCodes);
};
