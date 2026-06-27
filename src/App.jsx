import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ClusterColumn from './components/ClusterColumn';
import VerifyEmail from './components/VerifyEmail';
import AdminDashboard from './components/AdminDashboard';
import PlanSelector from './components/PlanSelector';
import UpdatesModal, { CURRENT_VERSION } from './components/UpdatesModal';
import { ForumModal } from './components/ForumModal';
import { useStudyPlan } from './hooks/useStudyPlan';

function App() {
    const [isVerified, setIsVerified] = useState(false);
    const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.hash === '#admin');
    
    const [availablePlans, setAvailablePlans] = useState([]);
    const [selectedPlanConfig, setSelectedPlanConfigState] = useState(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
    const [isForumModalOpen, setIsForumModalOpen] = useState(false);

    const handleCloseUpdates = () => {
        setIsUpdatesModalOpen(false);
        localStorage.setItem('last_seen_version', CURRENT_VERSION);
    };

    const setSelectedPlanConfig = (config) => {
        setSelectedPlanConfigState(config);
        if (config) {
            localStorage.setItem('selected_plan_config', JSON.stringify(config));
        }
    };

    // Fetch available plans list
    useEffect(() => {
        const fetchPlansList = async () => {
            try {
                const res = await fetch('/api/plans-list');
                if (res.ok) {
                    const data = await res.json();
                    setAvailablePlans(data);
                    
                    // Try to load from localStorage first
                    const savedPlan = localStorage.getItem('selected_plan_config');
                    if (savedPlan) {
                        try {
                            const parsed = JSON.parse(savedPlan);
                            // Validate that it exists in the fetched plans
                            const exists = data.find(p => p.career === parsed.career && p.faculty === parsed.faculty && p.modalidad === parsed.modalidad);
                            if (exists) {
                                setSelectedPlanConfigState(parsed);
                                
                                // Check for updates for returning users
                                const lastSeen = localStorage.getItem('last_seen_version');
                                if (lastSeen !== CURRENT_VERSION) {
                                    setIsUpdatesModalOpen(true);
                                }
                            } else {
                                throw new Error("Saved plan not found in current data");
                            }
                        } catch (e) {
                            const defaultPlan = data.find(p => p.career === "Ingeniería en Ciencias de la Computación") || data[0];
                            if (defaultPlan) {
                                setSelectedPlanConfig(defaultPlan);
                                setIsPlanModalOpen(true);
                            }
                        }
                    } else {
                        // Set default plan and open modal on first visit
                        const defaultPlan = data.find(p => p.career === "Ingeniería en Ciencias de la Computación") || data[0];
                        if (defaultPlan) {
                            setSelectedPlanConfig(defaultPlan);
                            setIsPlanModalOpen(true);
                        }
                        // Mark current version as seen so they don't see updates on their first visit
                        localStorage.setItem('last_seen_version', CURRENT_VERSION);
                    }
                }
            } catch (err) {
                console.error("Failed to load plans list", err);
            }
        };
        fetchPlansList();
    }, []);

    // Inicializar el tema de forma global y verificar sesión guardada
    useEffect(() => {
        const handleHashChange = () => {
            setIsAdminRoute(window.location.hash === '#admin');
        };
        window.addEventListener('hashchange', handleHashChange);
        const theme = localStorage.getItem('theme');
        const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Verificar sesión guardada
        const storedSession = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
        if (storedSession) {
            try {
                const data = JSON.parse(storedSession);
                if (data.expiresAt === 'indefinite' || (data.expiresAt && Date.now() < data.expiresAt)) {
                    setIsVerified(true);
                } else {
                    // Limpiar si expiró
                    localStorage.removeItem('auth_session');
                    sessionStorage.removeItem('auth_session');
                }
            } catch (e) {
                console.error("Error parsing session data", e);
            }
        }
    }, []);

    const handleVerification = (email, saveSession, duration) => {
        setIsVerified(true);

        const sessionData = {
            email,
            verifiedAt: Date.now()
        };

        if (saveSession) {
            if (duration === 'indefinite') {
                sessionData.expiresAt = 'indefinite';
            } else {
                const days = parseInt(duration, 10);
                if (!isNaN(days)) {
                    sessionData.expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
                } else {
                    sessionData.expiresAt = 'indefinite';
                }
            }
            localStorage.setItem('auth_session', JSON.stringify(sessionData));
        } else {
            // Guardar solo por la sesión (hasta cerrar la pestaña/navegador)
            sessionData.expiresAt = 'session';
            sessionStorage.setItem('auth_session', JSON.stringify(sessionData));
        }
    };

    const { planData, loading, error, passedSubjects, toggleSubject, resetPlan, getSubjectStatus, stats } = useStudyPlan(selectedPlanConfig?.career, selectedPlanConfig?.modalidad);

    if (isAdminRoute) {
        return <AdminDashboard />;
    }

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
        <Layout 
            stats={stats} 
            onReset={resetPlan} 
            title={planData.career} 
            logo_url={planData.logo_url} 
            onOpenPlanSelector={() => setIsPlanModalOpen(true)}
            onOpenUpdates={() => setIsUpdatesModalOpen(true)}
            onOpenForum={() => setIsForumModalOpen(true)}
        >
            <UpdatesModal 
                isOpen={isUpdatesModalOpen} 
                onClose={handleCloseUpdates} 
            />
            <ForumModal
                isOpen={isForumModalOpen}
                onClose={() => setIsForumModalOpen(false)}
                currentCareer={planData.career}
            />
            <PlanSelector 
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                availablePlans={availablePlans} 
                selected={selectedPlanConfig} 
                onChange={setSelectedPlanConfig} 
            />
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
