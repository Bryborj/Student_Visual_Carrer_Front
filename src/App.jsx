import React from 'react';
import Layout from './components/Layout';
import ClusterColumn from './components/ClusterColumn';
import { useStudyPlan } from './hooks/useStudyPlan';

function App() {
    const { planData, passedSubjects, toggleSubject, resetPlan, getSubjectStatus, stats } = useStudyPlan();

    return (
        <Layout stats={stats} onReset={resetPlan} title={planData.career}>
            <div className="grid-container max-w-container-max-width mx-auto gap-0 print:block print:max-w-none">
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
