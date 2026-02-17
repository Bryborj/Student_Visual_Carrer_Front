import React from 'react';

const SubjectNode = ({ subject, status, onToggle }) => {
    // Determine styles based on status
    // PASSED: Solid color (Green), clear text
    // AVAILABLE: Highlighted (Yellow/Orange), Hover visible
    // LOCKED: Opaque (Gray), Non-interactive

    const baseStyles = "p-4 rounded-lg shadow-md transition-all duration-300 transform border-2 flex flex-col justify-between h-32 w-48 relative overflow-hidden group select-none";

    const statusStyles = {
        PASSED: "bg-green-500 border-green-600 text-white hover:scale-105 cursor-pointer dark:bg-green-600 dark:border-green-500",
        AVAILABLE: "bg-yellow-100 border-yellow-400 text-gray-900 cursor-pointer animate-pulse-slow hover:scale-105 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:border-yellow-500 dark:text-yellow-100",
        LOCKED: "bg-gray-200 border-gray-300 text-gray-400 opacity-60 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-600 grayscale"
    };

    const getStatusLabel = () => {
        if (status === 'PASSED') return 'Aprobada';
        if (status === 'AVAILABLE') return 'Disponible';
        return 'Bloqueada';
    };

    return (
        <div
            className={`${baseStyles} ${statusStyles[status] || statusStyles.LOCKED}`}
            onClick={() => status !== 'LOCKED' && onToggle(subject.name)}
            title={status === 'LOCKED' ? 'Prerrequisitos pendientes' : 'Click para alternar estado'}
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase opacity-70 tracking-wider">
                    {subject.Credits} Créditos
                </span>
                {status === 'PASSED' && (
                    <span className="text-xs bg-white/20 px-1.5 rounded">✓</span>
                )}
            </div>

            {/* Body */}
            <div className="flex-grow flex items-center justify-center text-center">
                <h3 className="text-sm font-bold leading-tight line-clamp-3">
                    {subject.name}
                </h3>
            </div>

            {/* Footer / Tooltip logic could go here */}
            {/* For Locked, maybe show requirements on hover? Keeping it simple for now as requested. */}
        </div>
    );
};

export default SubjectNode;
