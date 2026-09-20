import React, { useState, useEffect } from 'react';
import { navigate } from '../hooks/useRouter';

function AdminDashboard() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('proposals'); // 'proposals' o 'editor'
    const [jsonInput, setJsonInput] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [availablePlans, setAvailablePlans] = useState([]);
    const [selectedPlanToLoad, setSelectedPlanToLoad] = useState('');
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

    const handleLoadPlan = async () => {
        if (!selectedPlanToLoad) return;
        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            const [career, modalidad] = selectedPlanToLoad.split('|');
            let url = `/api/plan?career=${encodeURIComponent(career)}`;
            if (modalidad && modalidad !== 'null' && modalidad !== 'undefined') {
                url += `&modalidad=${encodeURIComponent(modalidad)}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                delete data._id; // Delete internal Database ID
                setJsonInput(JSON.stringify(data, null, 2));
                setStatus({ type: 'success', message: 'Plan cargado correctamente. Puedes editarlo abajo.' });
            } else {
                setStatus({ type: 'error', message: 'Error al cargar el plan.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Error de conexión.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadJson = () => {
        try {
            JSON.parse(jsonInput);
            const blob = new Blob([jsonInput], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            let filename = 'study_plan.json';
            try {
                const parsed = JSON.parse(jsonInput);
                if (parsed.career) {
                    filename = `Plan_${parsed.career.replace(/\s+/g, '_')}.json`;
                }
            } catch (e) {}

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            setStatus({ type: 'error', message: 'El JSON es inválido, no se puede descargar.' });
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', password })
            });
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

    const handleAddPlan = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        let payload;
        try {
            payload = JSON.parse(jsonInput);
        } catch (e) {
            setStatus({ type: 'error', message: 'JSON inválido. Por favor revisa el formato.' });
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addPlan', password, payload })
            });
            const data = await res.json();
            
            if (res.ok) {
                setStatus({ type: 'success', message: data.message });
                setJsonInput('');
                loadAdminData();
            } else {
                setStatus({ type: 'error', message: data.detail || data.error || 'Error al guardar el plan' });
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
                            className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Verificando...' : 'Entrar al Panel'}
                        </button>
                    </form>
                    <button 
                        onClick={() => navigate('/')} 
                        className="mt-6 w-full text-center text-sm text-primary hover:underline"
                    >
                        Volver al Portal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 text-on-surface">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-surface p-6 rounded-2xl shadow-sm border border-primary/10">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Panel de Control de Staff</h1>
                        <p className="text-xs text-on-surface-variant mt-0.5">Gestión oficial de mapas curriculares y moderación de gobernanza estudiantil</p>
                    </div>
                    <button 
                        onClick={() => navigate('/')}
                        className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                        Salir del Admin
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-outline-variant/30 gap-6">
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
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'editor'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span>⚙️</span> Editor Manual de Planes (JSON)
                    </button>
                </div>

                {/* Tab 1: Proposals Moderation */}
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
                                                    {p.career} ({p.modalidad})
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

                {/* Tab 2: Manual JSON Editor */}
                {activeTab === 'editor' && (
                    <div className="space-y-6">
                        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-primary/10">
                            <h2 className="text-xl font-bold text-on-surface mb-4">Cargar Plan Existente</h2>
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-sm font-medium text-on-surface/70 mb-1">Selecciona un plan en base de datos</label>
                                    <select 
                                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/20 text-on-surface focus:outline-none focus:border-primary"
                                        value={selectedPlanToLoad}
                                        onChange={e => setSelectedPlanToLoad(e.target.value)}
                                    >
                                        <option value="">-- Seleccionar un plan en BD --</option>
                                        {availablePlans.map(p => (
                                            <option key={`${p.career}|${p.modalidad}`} value={`${p.career}|${p.modalidad}`}>
                                                {p.career} {p.modalidad ? `(${p.modalidad})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button 
                                    onClick={handleLoadPlan}
                                    disabled={!selectedPlanToLoad || loading}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-secondary text-on-secondary rounded-xl font-medium hover:bg-secondary/90 disabled:opacity-50"
                                >
                                    Cargar JSON
                                </button>
                            </div>
                        </div>

                        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-primary/10">
                            <h2 className="text-xl font-bold text-on-surface mb-4">Editor de JSON</h2>
                            <form onSubmit={handleAddPlan} className="space-y-4">
                                <div>
                                    <textarea
                                        value={jsonInput}
                                        onChange={(e) => setJsonInput(e.target.value)}
                                        className="w-full h-96 px-4 py-3 rounded-xl bg-background border border-primary/20 text-on-surface font-mono text-sm focus:outline-none focus:border-primary"
                                        placeholder='{\n  "career": "Ingeniería en Software",\n  "modalidad": "Línea",\n  "faculty": "Facultad de Ciencias de la Computación",\n  "courses": [...]\n}'
                                        required
                                    />
                                </div>
                                {status.message && (
                                    <div className={`p-4 rounded-xl text-sm ${status.type === 'error' ? 'bg-error/10 text-error' : 'bg-green-500/10 text-green-500'}`}>
                                        {status.message}
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        type="submit"
                                        disabled={loading || !jsonInput.trim()}
                                        className="flex-1 py-3 px-8 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {loading ? 'Guardando...' : 'Guardar Cambios en BD'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownloadJson}
                                        disabled={!jsonInput.trim()}
                                        className="flex-1 py-3 px-8 bg-surface-container-high text-on-surface rounded-xl font-medium border border-outline-variant hover:bg-surface-container-highest disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">download</span>
                                        Descargar JSON
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
