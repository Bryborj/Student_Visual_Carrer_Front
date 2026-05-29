import React from 'react';

const SubjectNode = ({ subject, status, onToggle }) => {
    const statusClasses = {
        PASSED: "status-passed hover:shadow-[0_0_15px_rgba(78,222,163,0.1)] transition-all cursor-pointer",
        AVAILABLE: "status-current hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all cursor-pointer",
        LOCKED: "status-locked opacity-30 cursor-not-allowed"
    };

    const iconForStatus = {
        PASSED: { icon: 'check_circle', color: 'text-tertiary' },
        AVAILABLE: { icon: 'clock_loader_40', color: 'text-[#f59e0b]' },
        LOCKED: { icon: 'lock', color: 'text-on-surface-variant' }
    };

    const areaClass = "area-core"; // Using core as default, could be dynamic

    const currentStatus = statusClasses[status] || statusClasses.LOCKED;
    const { icon, color } = iconForStatus[status] || iconForStatus.LOCKED;

    const credits = subject.credits ?? subject.Credits ?? '-';
    const name = subject.subject || subject.name;
    const theory = subject.theory ?? subject.Hours_of_Theory ?? '-';
    const lab = subject.lab ?? subject.Hours_of_Practice ?? '-';
    const auto = subject.autonomous ?? subject.Hours_of_Autonomous_Work ?? '-';

    return (
        <div
            className={`border-l-4 ${areaClass} rounded border flex flex-col p-card-padding h-32 ${currentStatus}`}
            onClick={() => status !== 'LOCKED' && onToggle(name)}
            title={status === 'LOCKED' ? 'Prerrequisitos pendientes' : 'Click para alternar estado'}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-metadata-label font-metadata-label ${color}`}>
                    {credits} CRÉDITOS
                </span>
                <span className={`material-symbols-outlined text-[14px] ${color}`}>
                    {icon}
                </span>
            </div>
            
            <h3 className={`text-course-title font-course-title mb-4 ${status === 'PASSED' || status === 'AVAILABLE' ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                {name}
            </h3>
            
            <div className="mt-auto flex gap-2">
                <span className="text-metadata-label font-metadata-label bg-surface-container px-1 py-0.5 rounded text-on-surface-variant">
                    {theory} {lab} {auto}
                </span>
            </div>
        </div>
    );
};

export default SubjectNode;
