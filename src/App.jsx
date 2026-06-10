import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ClusterColumn from './components/ClusterColumn';
import VerifyEmail from './components/VerifyEmail';
import { useStudyPlan } from './hooks/useStudyPlan';

function App() {
    const [isVerified, setIsVerified] = useState(false);

    // Inicializar el tema de forma global para que las pantallas previas al Layout lo respeten
    useEffect(() => {
        const theme = localStorage.getItem('theme');
        const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const handleVerification = (email) => {
        setIsVerified(true);
    };

    const { planData, loading, error, passedSubjects, toggleSubject, resetPlan, getSubjectStatus, stats } = useStudyPlan();

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-background">
                <VerifyEmail onVerified={handleVerification} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-on-surface">
                <div className="text-xl font-medium animate-pulse">Cargando plan de estudios...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-error">
                <div className="text-xl font-medium">Error al cargar el plan: {error}</div>
            </div>
        );
    }

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
