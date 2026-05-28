import React from 'react';
import Layout from './components/Layout';
import ClusterColumn from './components/ClusterColumn';
import { useStudyPlan } from './hooks/useStudyPlan';

function App() {
    const { planData, passedSubjects, toggleSubject, resetPlan, getSubjectStatus, stats } = useStudyPlan();

    return (
        <Layout stats={stats} onReset={resetPlan} title={planData.career}>
            <div className="flex gap-8 pb-8 print:gap-4 print:pb-0">
                {planData.courses.map(cluster => (
                    <ClusterColumn
                        key={cluster.cluster}
                        cluster={cluster.cluster}
                        subjects={cluster.content}
                        getSubjectStatus={getSubjectStatus}
                        onToggleSubject={toggleSubject}
                    />
                ))}
            </div>
        </Layout>
    );
}

export default App;
