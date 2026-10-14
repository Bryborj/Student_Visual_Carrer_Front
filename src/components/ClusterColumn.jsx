import React from 'react';
import SubjectNode from './SubjectNode';

const ClusterColumn = ({ cluster, subjects = [], getSubjectStatus, onToggleSubject }) => {
    const subjectRows = subjects.map(s => s.position_Y || s.Position || 1);
    const maxRow = subjectRows.length > 0 ? Math.max(...subjectRows) : 0;
    const rows = Array.from({ length: maxRow }, (_, i) => i + 1);

    return (
        <div className="flex flex-col gap-row-gap border-r border-outline-variant px-4 gap-4 print:px-1 print:border-none print:gap-2">
            <div className="sticky top-0 bg-background/90 backdrop-blur-sm py-2 z-10 border-outline-variant mb-2 print:static print:bg-surface-container print:border print:backdrop-blur-none print:py-1">
                <h2 className="text-semester-header font-semester-header text-center text-on-surface-variant print:uppercase print:text-[10px]">Semestre {cluster}</h2>
            </div>

            {rows.length === 0 ? (
                <div className="area-empty h-32 rounded flex flex-col items-center justify-center opacity-40 text-xs text-on-surface-variant p-2 text-center">
                    <span className="material-symbols-outlined mb-1">hourglass_empty</span>
                    <span>Sin materias registradas</span>
                </div>
            ) : (
                rows.map(rowIndex => {
                    // Compatible with old and new JSON formats
                    const subject = subjects.find(s => (s.position_Y || s.Position) === rowIndex);

                    if (subject) {
                        return (
                            <SubjectNode
                                key={subject.id || subject.subject || subject.name}
                                subject={subject}
                                status={getSubjectStatus(subject)}
                                onToggle={onToggleSubject}
                            />
                        );
                    } else {
                        return (
                            <div key={`empty-${rowIndex}`} className="area-empty h-32 rounded flex items-center justify-center opacity-30">
                                <span className="material-symbols-outlined text-outline-variant">lock</span>
                            </div>
                        );
                    }
                })
            )}
        </div>
    );
};

export default ClusterColumn;
