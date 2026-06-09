import React from 'react';
import Layout from './components/Layout';
import ClusterColumn from './components/ClusterColumn';
import { useStudyPlan } from './hooks/useStudyPlan';

function App() {
    const { planData, passedSubjects, toggleSubject, resetPlan, getSubjectStatus, stats } = useStudyPlan();

    return (
        <Layout stats={stats} onReset={resetPlan} title={planData.career} logo_url={planData.logo_url} faculty={planData.faculty}>
            <div className="grid-container px-4 md:px-grid-margin py-4 md:py-8 max-w-container-max-width mx-auto gap-0 print:p-0">
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
