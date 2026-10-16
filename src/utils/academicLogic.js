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

/**
 * Generates a clean, unique, standardized subject ID/code from its name
 * following BUAP curriculum conventions (e.g., "Programación Básica" -> "PB",
 * "Inglés I" -> "ING1", "Cálculo Diferencial con Aplicaciones" -> "CDA",
 * "Física" -> "FIS"), with automatic collision avoidance against existing IDs.
 *
 * @param {string} subjectName - The display name of the subject.
 * @param {Array<string>} existingIds - Existing subject IDs in the plan.
 * @param {string} [currentId=''] - Current subject's own ID (excluded when editing).
 * @returns {string} Unique uppercase subject ID.
 */
export const generateSubjectId = (subjectName, existingIds = [], currentId = '') => {
    if (!subjectName || !subjectName.trim()) return '';

    const romanMap = {
        I: '1', II: '2', III: '3', IV: '4', V: '5',
        VI: '6', VII: '7', VIII: '8', IX: '9', X: '10'
    };

    const stopWords = new Set([
        'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'EN', 'Y', 'E', 'O', 'U',
        'PARA', 'POR', 'CON', 'A', 'AL', 'UN', 'UNA', 'UNOS', 'UNAS', 'SOBRE', 'SIN'
    ]);

    const clean = subjectName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .trim();

    const tokens = clean.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return '';

    const meaningful = tokens.filter(t => !stopWords.has(t.toUpperCase()));
    const words = meaningful.length > 0 ? meaningful : tokens;

    const isNumeral = (w) => {
        const up = w.toUpperCase();
        return Boolean(romanMap[up]) || /^\d+$/.test(up);
    };

    const toNumeral = (w) => {
        const up = w.toUpperCase();
        return romanMap[up] || up;
    };

    let baseId = '';

    if (words.length === 1) {
        const w = words[0].toUpperCase();
        baseId = w.slice(0, 3);
    } else if (words.length === 2 && isNumeral(words[1])) {
        // Ej: "Inglés I" -> "ING1", "Física II" -> "FIS2"
        baseId = `${words[0].toUpperCase().slice(0, 3)}${toNumeral(words[1])}`;
    } else {
        baseId = words
            .map((w) => {
                if (isNumeral(w)) return toNumeral(w);
                return w[0].toUpperCase();
            })
            .join('')
            .slice(0, 6);
    }

    baseId = baseId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!baseId) baseId = 'MAT';

    const usedIds = new Set(
        (existingIds || [])
            .filter(id => id && String(id).trim().toUpperCase() !== String(currentId || '').trim().toUpperCase())
            .map(id => String(id).trim().toUpperCase())
    );

    if (!usedIds.has(baseId)) {
        return baseId;
    }

    // Resolver colisión automáticamente
    let counter = 2;
    const endsWithDigit = /\d$/.test(baseId);
    while (true) {
        const candidate = endsWithDigit ? `${baseId}_${counter}` : `${baseId}${counter}`;
        if (!usedIds.has(candidate)) {
            return candidate;
        }
        counter++;
    }
};

