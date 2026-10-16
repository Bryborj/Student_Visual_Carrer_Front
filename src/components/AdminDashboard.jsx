import React, { useState, useEffect } from 'react';
import { navigate } from '../hooks/useRouter';
import PlanEditorPanel from './PlanEditorPanel';

function AdminDashboard({ initialCareer = '', onPlanSaved }) {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' o 'proposals'
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [availablePlans, setAvailablePlans] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [rejectFeedback, setRejectFeedback] = useState({});

    const loadAdminData = () => {
        // Cargar lista de planes
        fetch('/api/plans-list')
            .then(res => res.json())
            .then(data => setAvailablePlans(data))
            .catch(console.error);

        // Cargar lista de propuestas de alumnos
        fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_proposals', password })
        })
            .then(res => res.json())
            .then(data => {
                if (data.proposals) setProposals(data.proposals);
            })
            .catch(console.error);
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadAdminData();
        }
    }, [isAuthenticated]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const [res] = await Promise.all([
                fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'verify', password })
                }),
                new Promise((resolve) => setTimeout(resolve, 650))
            ]);
            const data = await res.json();
            
            if (res.ok) {
                setIsAuthenticated(true);
                setStatus({ type: 'success', message: '¡Bienvenido Administrador!' });
            } else {
                setStatus({ type: 'error', message: data.detail || data.error || 'Contraseña incorrecta' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };


    const handleApproveProposal = async (proposalId) => {
        if (!confirm('¿Deseas aprobar esta propuesta y actualizar inmediatamente el plan oficial en vivo?')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve_proposal', password, proposalId })
            });
            const data = await res.json();
            if (res.ok) {
                alert('✅ Propuesta aprobada y plan oficial actualizado.');
                loadAdminData();
            } else {
                alert(data.detail || 'Error al aprobar propuesta.');
            }
        } catch (e) {
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectProposal = async (proposalId) => {
        const feedback = rejectFeedback[proposalId] || prompt('Motivo del rechazo (opcional):') || 'Rechazada por staff.';

        setLoading(true);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject_proposal', password, proposalId, feedback })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Propuesta marcada como rechazada.');
                loadAdminData();
            } else {
                alert(data.detail || 'Error al rechazar propuesta.');
            }
        } catch (e) {
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="bg-surface p-8 rounded-2xl shadow-lg max-w-md w-full border border-primary/10">
                    <h2 className="text-2xl font-bold text-on-surface mb-6 text-center">Acceso Administrador</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-on-surface/70 mb-1">Contraseña de Staff</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl bg-background border border-primary/20 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {status.message && (
                            <div className={`p-3 rounded-lg text-sm ${status.type === 'error' ? 'bg-error/10 text-error' : 'bg-green-500/10 text-green-500'}`}>
                                {status.message}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Verificando credenciales...</span>
                                </>
                            ) : (
                                'Entrar al Panel'
                            )}
                        </button>
                    </form>
                    <div className="mt-6 flex flex-col gap-2">
                        <button 
                            onClick={() => navigate('/visualizador')} 
                            className="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary transition-colors flex items-center justify-center gap-2 border border-outline-variant/30"
                        >
                            <span className="material-symbols-outlined text-base">account_tree</span>
                            Ir al Visualizador de Materias
                        </button>
                        <button 
                            onClick={() => navigate('/')} 
                            className="w-full text-center text-xs text-on-surface-variant hover:text-primary hover:underline py-1"
                        >
                            Volver al Portal de Inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 text-on-surface">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface p-6 rounded-2xl shadow-sm border border-primary/10 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Panel de Control de Staff</h1>
                        <p className="text-xs text-on-surface-variant mt-0.5">Gestión oficial de mapas curriculares y moderación de gobernanza estudiantil</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button 
                            onClick={() => navigate('/visualizador')}
                            className="px-3.5 py-2 text-xs font-semibold text-on-surface bg-surface-container hover:bg-surface-container-high rounded-xl border border-outline-variant/30 transition-colors flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-base text-primary">account_tree</span>
                            Visualizador
                        </button>
                        <button 
                            onClick={() => navigate('/')}
                            className="px-3.5 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
                        >
                            Salir al Portal
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-outline-variant/30 gap-6">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'editor'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span>⚙️</span> Gestión y Edición de Planes
                    </button>
                    <button
                        onClick={() => setActiveTab('proposals')}
                        className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'proposals'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span>🗳️</span> Propuestas de Alumnos ({proposals.filter(p => p.status === 'voting').length} pendientes)
                    </button>
                </div>

                {/* Tab 1: Interactive Plan Editor Panel */}
                {activeTab === 'editor' && (
                    <PlanEditorPanel
                        password={password}
                        availablePlans={availablePlans}
                        initialCareer={initialCareer}
                        onPlanSaved={(savedCareer) => {
                            loadAdminData();
                            if (onPlanSaved) onPlanSaved(savedCareer);
                        }}
                    />
                )}

                {/* Tab 2: Proposals Moderation */}
                {activeTab === 'proposals' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-on-surface">Propuestas de Actualización Estudiantil</h2>
                            <button
                                onClick={loadAdminData}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">refresh</span> Actualizar lista
                            </button>
                        </div>

                        {proposals.length === 0 ? (
                            <div className="bg-surface p-8 rounded-2xl text-center text-on-surface-variant border border-outline-variant/30">
                                No hay propuestas enviadas hasta el momento.
                            </div>
                        ) : (
                            proposals.map(p => (
                                <div key={p.id} className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-3">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                                    {p.career}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    p.status === 'voting' ? 'bg-blue-500/10 text-blue-400' :
                                                    p.status === 'auto_approved' ? 'bg-green-500/10 text-green-400' :
                                                    p.status === 'admin_approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-on-surface-variant">
                                                Autor: <span className="font-semibold text-primary">@{p.author}</span> • Votos a favor: <strong>{p.votesFor}</strong> • En contra: <strong>{p.votesAgainst}</strong>
                                            </p>
                                        </div>

                                        {p.status === 'voting' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleApproveProposal(p.id)}
                                                    className="px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-500 transition-colors shadow-sm"
                                                >
                                                    Aprobar y Aplicar Plan
                                                </button>
                                                <button
                                                    onClick={() => handleRejectProposal(p.id)}
                                                    className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-colors shadow-sm"
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-surface-container-high p-3 rounded-xl text-xs text-on-surface">
                                        <strong>Justificación del Alumno:</strong> {p.reason}
                                    </div>

                                    {p.adminFeedback && (
                                        <div className="text-xs text-on-surface-variant">
                                            <strong>Feedback Staff:</strong> {p.adminFeedback}
                                        </div>
                                    )}

                                    <details className="text-xs">
                                        <summary className="cursor-pointer text-primary font-semibold hover:underline">
                                            Ver materias propuestas ({p.courses?.length || 0} periodos)
                                        </summary>
                                        <pre className="mt-2 p-3 bg-background rounded-lg text-[11px] font-mono max-h-48 overflow-y-auto">
                                            {JSON.stringify({ courses: p.courses, electives: p.electives }, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
