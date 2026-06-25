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
            className={`border-l-4 ${areaClass} rounded border flex flex-col p-card-padding h-32 ${currentStatus} print:h-auto print:min-h-[70px] print:border-outline-variant print:border-l-4 print:opacity-100 print:shadow-none print:p-1`}
            onClick={() => status !== 'LOCKED' && onToggle(name)}
            title={status === 'LOCKED' ? 'Prerrequisitos pendientes' : 'Click para alternar estado'}
        >
            <div className="flex justify-between items-start mb-2 print:mb-0">
                <span className={`text-metadata-label font-metadata-label ${color} print:text-[8px] print:bg-surface-container print:px-1 print:rounded print:border print:border-outline-variant`}>
                    {credits} CR
                </span>
                <span className={`material-symbols-outlined text-[14px] ${color} print:text-[10px]`}>
                    {icon}
                </span>
            </div>
            
            <h3 className={`text-course-title font-course-title mb-4 ${status === 'PASSED' || status === 'AVAILABLE' ? 'text-on-surface' : 'text-on-surface-variant'} print:text-[9px] print:leading-tight print:mb-1`}>
                {name}
            </h3>
            
            <div className="mt-auto flex gap-2 print:hidden">
                <span className="text-metadata-label font-metadata-label bg-surface-container px-2 py-0.5 rounded text-on-surface-variant" title=''>
                    <span className="group hover:bg-surface-container-high transition-colors duration-300 cursor-help relative pr-1">
                        {theory}
                        <span className="absolute left-8 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            Horas de teoria
                        </span>
                    </span>
                    <span className="group hover:bg-surface-container-high transition-colors duration-300 cursor-help relative pr-1">{lab}
                        <span className="absolute left-8 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            Horas de laboratorio
                        </span>
                    </span>
                    <span className="group hover:bg-surface-container-high transition-colors duration-300 cursor-help relative">{auto}
                        <span className="absolute left-8 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            Horas de trabajo autonomo
                        </span>
                    </span>
                </span>
            </div>

            <div className="hidden print:flex justify-between items-end mt-auto pt-1 border-t border-dotted border-outline-variant">
                <span className="font-metadata-label text-[7px] text-on-surface-variant">{subject.id || ''}</span>
            </div>
        </div>
    );
};

export default SubjectNode;
