import React from 'react';
import SubjectNode from './SubjectNode';

const ClusterColumn = ({ cluster, subjects, getSubjectStatus, onToggleSubject }) => {
    return (
        <div className="flex flex-col gap-4 min-w-[14rem]">
            <div className="text-center py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-2">
                <h2 className="font-bold text-gray-700 dark:text-gray-300">
                    Semestre {cluster}
                </h2>
            </div>

            <div className="flex flex-col gap-3">
                {subjects.map(subject => (
                    <SubjectNode
                        key={subject.name}
                        subject={subject}
                        status={getSubjectStatus(subject)}
                        onToggle={onToggleSubject}
                    />
                ))}
            </div>
        </div>
    );
};

export default ClusterColumn;
