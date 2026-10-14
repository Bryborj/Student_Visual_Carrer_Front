import React, { useState, useEffect } from 'react';
import { Link } from '../hooks/useRouter';

interface StudentPlanEditorProps {
    availablePlans?: any[];
    onGoHome: () => void;
}

interface Proposal {
    id: string;
    career: string;
    author: string;
    emailHash: string;
    reason: string;
    courses: any[];
    electives: any[];
    minCredits?: number;
    maxCredits?: number;
    status: string;
    votesFor: number;
    votesAgainst: number;
    userVote?: string;
    votingEndsAt?: string;
    createdAt?: string;
    resolvedAt?: string;
    adminFeedback?: string;
}

export default function StudentPlanEditor({ availablePlans = [], onGoHome }: StudentPlanEditorProps) {
    const [activeTab, setActiveTab] = useState<'proposals' | 'new_proposal'>('proposals');
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedCareerFilter, setSelectedCareerFilter] = useState<string>('Todas');

    // Auth State (Sesión de Alumno Institucional)
    const [user, setUser] = useState<{ username: string; emailHash: string } | null>(() => {
        const saved = localStorage.getItem('forum_session');
        return saved ? JSON.parse(saved) : null;
    });
    const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [authEmail, setAuthEmail] = useState('');
    const [authPin, setAuthPin] = useState('');
    const [authUsername, setAuthUsername] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [authSuccess, setAuthSuccess] = useState('');
    const [pinSent, setPinSent] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);

    // Formulario de Nueva Propuesta
    const [selectedCareer, setSelectedCareer] = useState<string>(
        availablePlans.length > 0 ? availablePlans[0].career : 'Ingeniería en Ciencias de la Computación'
    );
    const [reason, setReason] = useState<string>('');
    const [jsonCourses, setJsonCourses] = useState<string>('[]');
    const [jsonElectives, setJsonElectives] = useState<string>('[]');
    const [minCredits, setMinCredits] = useState<number>(250);
    const [maxCredits, setMaxCredits] = useState<number>(350);
    const [proposalStatus, setProposalStatus] = useState<{ type: string; message: string }>({ type: '', message: '' });
    const [expandedProposalId, setExpandedProposalId] = useState<string | null>(null);

    // Cargar propuestas
    const fetchProposals = async () => {
        setLoading(true);
        try {
            let url = '/api/proposals';
            const params = new URLSearchParams();
            if (selectedCareerFilter !== 'Todas') params.append('career', selectedCareerFilter);
            if (user?.emailHash) params.append('user_email_hash', user.emailHash);

            const query = params.toString();
            if (query) url += `?${query}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setProposals(data);
            }
        } catch (error) {
            console.error('Error fetching proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, [selectedCareerFilter, user]);

    // Cargar plan existente al formulario para editar
    const handleLoadCurrentPlan = async () => {
        setLoading(true);
        setProposalStatus({ type: '', message: '' });
        try {
            const res = await fetch(`/api/plan?career=${encodeURIComponent(selectedCareer)}`);
            if (res.ok) {
                const data = await res.json();
                setJsonCourses(JSON.stringify(data.courses || [], null, 2));
                setJsonElectives(JSON.stringify(data.electives || [], null, 2));
                if (data.min_credits) setMinCredits(data.min_credits);
                if (data.max_credits) setMaxCredits(data.max_credits);
                setProposalStatus({
                    type: 'success',
                    message: `Plan cargado (${(data.courses || []).length} bloques). Modifica las materias y justifica tu propuesta.`
                });
            } else {
                setProposalStatus({ type: 'error', message: 'No se encontró el plan especificado.' });
            }
        } catch (e) {
            setProposalStatus({ type: 'error', message: 'Error de red al cargar el plan.' });
        } finally {
            setLoading(false);
        }
    };

    // Enviar voto
    const handleVote = async (proposalId: string, voteType: 'for' | 'against') => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        try {
            const token = localStorage.getItem('forum_token');
            const res = await fetch(`/api/proposals/${proposalId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    username: user.username,
                    emailHash: user.emailHash,
                    voteType
                })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.auto_approved) {
                    alert(`🎉 ¡Meta de votos alcanzada! ${data.message}`);
                }
                fetchProposals();
            } else {
                alert(data.detail || 'Error al emitir voto');
            }
        } catch (e) {
            alert('Error de conexión al votar');
        }
    };

    // Enviar propuesta
    const handleSubmitProposal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        if (!reason.trim()) {
            setProposalStatus({ type: 'error', message: 'Debes proporcionar una justificación para la actualización.' });
            return;
        }

        let parsedCourses, parsedElectives;
        try {
            parsedCourses = JSON.parse(jsonCourses);
            parsedElectives = JSON.parse(jsonElectives);
        } catch (e) {
            setProposalStatus({ type: 'error', message: 'El formato JSON de las materias o electivas es inválido.' });
            return;
        }

        setLoading(true);
        setProposalStatus({ type: '', message: '' });

        try {
            const token = localStorage.getItem('forum_token');
            const res = await fetch('/api/proposals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    career: selectedCareer,
                    username: user.username,
                    emailHash: user.emailHash,
                    reason,
                    courses: parsedCourses,
                    electives: parsedElectives,
                    min_credits: minCredits,
                    max_credits: maxCredits
                })
            });

            const data = await res.json();
            if (res.ok) {
                setProposalStatus({
                    type: 'success',
                    message: '¡Propuesta publicada exitosamente! Tu voto a favor inicial fue registrado.'
                });
                setReason('');
                setActiveTab('proposals');
                fetchProposals();
            } else {
                setProposalStatus({ type: 'error', message: data.detail || 'Error al publicar propuesta.' });
            }
        } catch (e) {
            setProposalStatus({ type: 'error', message: 'Error de red al publicar propuesta.' });
        } finally {
            setLoading(false);
        }
    };

    // Auth handlers
    const handleSendPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setAuthSuccess('');
        setAuthLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send_pin', email: authEmail })
            });
            const data = await res.json();
            if (res.ok) {
                setPinSent(true);
                setAuthSuccess('PIN enviado a tu correo institucional (@buap.mx).');
                if (data.devPin) {
                    console.log('DEV PIN:', data.devPin);
                    setAuthSuccess(`Modo DEV: Tu PIN es ${data.devPin}`);
                }
            } else {
                setAuthError(data.detail || data.error || 'Error enviando PIN');
            }
        } catch (err) {
            setAuthError('Error de conexión');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setAuthLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'register',
                    email: authEmail,
                    pin: authPin,
                    username: authUsername,
                    password: authPassword
                })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('forum_session', JSON.stringify(data.user));
                if (data.token) {
                    localStorage.setItem('forum_token', data.token);
                }
                setUser(data.user);
                setShowAuthModal(false);
            } else {
                setAuthError(data.detail || data.error || 'Error al registrarse');
            }
        } catch (err) {
            setAuthError('Error de conexión');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setAuthLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    identifier: authUsername,
                    password: authPassword
                })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('forum_session', JSON.stringify(data.user));
                if (data.token) {
                    localStorage.setItem('forum_token', data.token);
                }
                setUser(data.user);
                setShowAuthModal(false);
            } else {
                setAuthError(data.detail || data.error || 'Credenciales incorrectas');
            }
        } catch (err) {
            setAuthError('Error de conexión');
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
            {/* Header */}
            <header className="border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onGoHome}
                        className="p-2 rounded-xl hover:bg-surface-container-high transition-colors flex items-center gap-2 text-on-surface-variant hover:text-primary"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-sm font-medium hidden sm:inline">Inicio</span>
                    </button>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                            <span>🗳️</span> Gobernanza y Actualización de Planes
                        </h1>
                        <p className="text-xs text-on-surface-variant">
                            Participación comunitaria y validación colectiva de mapas curriculares BUAP
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-3 bg-surface-container-high px-3 py-1.5 rounded-full border border-outline-variant/40">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs font-semibold text-primary">@{user.username}</span>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('forum_session');
                                    localStorage.removeItem('forum_token');
                                    setUser(null);
                                }}
                                className="text-xs text-on-surface-variant hover:text-error transition-colors ml-1"
                                title="Cerrar Sesión"
                            >
                                Salir
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-sm"
                        >
                            Acceder como Alumno
                        </button>
                    )}
                </div>
            </header>

            {/* Main Tabs Navigation */}
            <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 pt-6 pb-2">
                <div className="flex border-b border-outline-variant/40 gap-6">
                    <button
                        onClick={() => setActiveTab('proposals')}
                        className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'proposals'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span>📋</span> Propuestas y Votaciones Activas ({proposals.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('new_proposal')}
                        className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'new_proposal'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span>➕</span> Proponer Actualización de Plan
                    </button>
                </div>
            </div>

            {/* Tab 1: Proposals List & Voting */}
            {activeTab === 'proposals' && (
                <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 flex-1">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-surface p-4 rounded-2xl border border-outline-variant/30">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-on-surface-variant uppercase">Filtrar por carrera:</span>
                            <select
                                value={selectedCareerFilter}
                                onChange={(e) => setSelectedCareerFilter(e.target.value)}
                                className="px-3 py-1.5 rounded-xl bg-background border border-outline-variant/50 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                            >
                                <option value="Todas">Todas las carreras</option>
                                {availablePlans.map((p, idx) => (
                                    <option key={idx} value={p.career}>{p.career}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={fetchProposals}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span> Actualizar
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-16 text-on-surface-variant animate-pulse">
                            Cargando propuestas comunitarias...
                        </div>
                    ) : proposals.length === 0 ? (
                        <div className="text-center py-16 bg-surface/50 rounded-2xl border border-dashed border-outline-variant/50 p-8">
                            <span className="text-4xl mb-3 block">🗳️</span>
                            <h3 className="text-lg font-bold text-on-surface">No hay propuestas registradas</h3>
                            <p className="text-sm text-on-surface-variant mt-1 mb-4">
                                Sé el primer alumno en proponer una actualización curricular para tu carrera.
                            </p>
                            <button
                                onClick={() => setActiveTab('new_proposal')}
                                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:brightness-110"
                            >
                                Crear Nueva Propuesta
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {proposals.map((p) => {
                                const totalVotes = (p.votesFor || 0) + (p.votesAgainst || 0);
                                const isExpanded = expandedProposalId === p.id;

                                return (
                                    <div
                                        key={p.id}
                                        className="bg-surface rounded-2xl p-6 border border-outline-variant/40 shadow-sm hover:border-primary/40 transition-all"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {p.status === 'voting' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            En Votación 🗳️
                                                        </span>
                                                    )}
                                                    {p.status === 'auto_approved' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                                                            Auto-Aprobada por Votos ⚡
                                                        </span>
                                                    )}
                                                    {p.status === 'admin_approved' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            Aprobada por Staff 👑
                                                        </span>
                                                    )}
                                                    {p.status === 'rejected' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                                                            Rechazada ❌
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-on-surface">{p.career}</h3>
                                                <p className="text-xs text-on-surface-variant mt-0.5">
                                                    Propuesto por <span className="font-semibold text-primary">@{p.author}</span> • {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Reciente'}
                                                </p>
                                            </div>

                                            {/* Voting actions */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleVote(p.id, 'for')}
                                                    disabled={p.status !== 'voting'}
                                                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                        p.userVote === 'for'
                                                            ? 'bg-green-600 text-white border-green-600 shadow-md scale-105'
                                                            : 'border-outline-variant/50 text-on-surface hover:bg-green-500/10 hover:border-green-500/40 disabled:opacity-50'
                                                    }`}
                                                >
                                                    <span>👍</span>
                                                    <span>A Favor</span>
                                                    <span className="ml-1 bg-surface-container-high px-1.5 py-0.5 rounded text-[10px]">
                                                        {p.votesFor}
                                                    </span>
                                                </button>

                                                <button
                                                    onClick={() => handleVote(p.id, 'against')}
                                                    disabled={p.status !== 'voting'}
                                                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                        p.userVote === 'against'
                                                            ? 'bg-red-600 text-white border-red-600 shadow-md scale-105'
                                                            : 'border-outline-variant/50 text-on-surface hover:bg-red-500/10 hover:border-red-500/40 disabled:opacity-50'
                                                    }`}
                                                >
                                                    <span>👎</span>
                                                    <span>En Contra</span>
                                                    <span className="ml-1 bg-surface-container-high px-1.5 py-0.5 rounded text-[10px]">
                                                        {p.votesAgainst}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <div className="bg-surface-container-high/60 p-3.5 rounded-xl my-3 text-xs sm:text-sm text-on-surface leading-relaxed border border-outline-variant/20">
                                            <strong>Justificación:</strong> {p.reason}
                                        </div>

                                        {p.adminFeedback && (
                                            <div className="bg-primary/5 p-3 rounded-xl my-2 text-xs text-primary border border-primary/20">
                                                <strong>Comentario del Administrador:</strong> {p.adminFeedback}
                                            </div>
                                        )}

                                        {/* Expandable details */}
                                        <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
                                            <span>Materias: {p.courses?.length || 0} periodos • Créditos: {p.minCredits || 0} - {p.maxCredits || 0}</span>
                                            <button
                                                onClick={() => setExpandedProposalId(isExpanded ? null : p.id)}
                                                className="text-primary hover:underline font-semibold"
                                            >
                                                {isExpanded ? 'Ocultar Detalle' : 'Ver Materias Propuestas'}
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="mt-4 p-4 rounded-xl bg-background border border-outline-variant/40">
                                                <h4 className="text-xs font-bold text-primary uppercase mb-2">Contenido de la Propuesta (JSON):</h4>
                                                <pre className="text-[11px] font-mono text-on-surface-variant max-h-60 overflow-y-auto p-3 bg-surface rounded-lg">
                                                    {JSON.stringify({ courses: p.courses, electives: p.electives }, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            )}

            {/* Tab 2: Propose Plan Update */}
            {activeTab === 'new_proposal' && (
                <main className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-6 flex-1">
                    <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-outline-variant/40 shadow-sm">
                        <h2 className="text-xl font-bold text-on-surface mb-2">Sugerir Actualización de Plan de Estudios</h2>
                        <p className="text-xs sm:text-sm text-on-surface-variant mb-6">
                            Los alumnos pueden proponer adiciones, reestructuración de materias, cambios en prerrequisitos o créditos. Tu propuesta entrará al sistema de votación comunitaria para auto-aprobación o revisión del staff.
                        </p>

                        {proposalStatus.message && (
                            <div className={`p-4 rounded-xl text-xs sm:text-sm mb-6 ${
                                proposalStatus.type === 'success'
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}>
                                {proposalStatus.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmitProposal} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Carrera</label>
                                    <select
                                        value={selectedCareer}
                                        onChange={(e) => setSelectedCareer(e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:border-primary"
                                    >
                                        {availablePlans.map((p, idx) => (
                                            <option key={idx} value={p.career}>{p.career}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Modalidad</label>
                                    <input
                                        type="text"
                                        value={selectedModalidad}
                                        onChange={(e) => setSelectedModalidad(e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:border-primary"
                                        placeholder="Escolarizada"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleLoadCurrentPlan}
                                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">download</span>
                                    Cargar datos actuales de este plan para editar
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                                    Motivo o Justificación del Cambio <span className="text-primary">*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:border-primary resize-y"
                                    placeholder="Ejemplo: Se actualizan las materias optativas terminales y prerrequisitos del bloque 6 según acuerdo de academia 2024..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Créditos Mínimos</label>
                                    <input
                                        type="number"
                                        value={minCredits}
                                        onChange={(e) => setMinCredits(parseInt(e.target.value, 10))}
                                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Créditos Máximos</label>
                                    <input
                                        type="number"
                                        value={maxCredits}
                                        onChange={(e) => setMaxCredits(parseInt(e.target.value, 10))}
                                        className="w-full px-3.5 py-2 rounded-xl bg-background border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                                    Estructura de Materias por Periodo (JSON)
                                </label>
                                <textarea
                                    value={jsonCourses}
                                    onChange={(e) => setJsonCourses(e.target.value)}
                                    rows={10}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-outline-variant/50 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                                    placeholder='[{"cluster": "Primer Periodo", "content": [...]}]'
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:brightness-110 active:scale-98 transition-all shadow-md disabled:opacity-50"
                            >
                                {loading ? 'Publicando...' : 'Publicar Propuesta para Votación'}
                            </button>
                        </form>
                    </div>
                </main>
            )}

            {/* Modal de Autenticación de Alumno */}
            {showAuthModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-outline-variant/40 max-w-md w-full shadow-2xl relative">
                        <button
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface text-lg"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-6">
                            <span className="text-3xl mb-1 block">🐺</span>
                            <h3 className="text-xl font-bold text-on-surface">Acceso Institucional Alumnos</h3>
                            <p className="text-xs text-on-surface-variant mt-1">
                                Verifica tu correo institucional (@buap.mx) para proponer cambios y votar.
                            </p>
                        </div>

                        {authError && (
                            <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                                {authError}
                            </div>
                        )}
                        {authSuccess && (
                            <div className="p-3 mb-4 rounded-xl bg-green-500/10 border border-green-500/30 text-xs text-green-400">
                                {authSuccess}
                            </div>
                        )}

                        <div className="flex border-b border-outline-variant/40 mb-5">
                            <button
                                onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                                className={`flex-1 pb-2 text-xs font-bold border-b-2 ${
                                    authMode === 'login' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                                }`}
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
                                className={`flex-1 pb-2 text-xs font-bold border-b-2 ${
                                    authMode === 'register' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                                }`}
                            >
                                Registrarse con PIN
                            </button>
                        </div>

                        {authMode === 'login' ? (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-on-surface-variant mb-1">Usuario o Correo BUAP</label>
                                    <input
                                        type="text"
                                        value={authUsername}
                                        onChange={(e) => setAuthUsername(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-background border border-outline-variant/40 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-on-surface-variant mb-1">Contraseña</label>
                                    <input
                                        type="password"
                                        value={authPassword}
                                        onChange={(e) => setAuthPassword(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-background border border-outline-variant/40 text-sm"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm hover:brightness-110"
                                >
                                    {authLoading ? 'Verificando...' : 'Entrar'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                {!pinSent ? (
                                    <form onSubmit={handleSendPin} className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-on-surface-variant mb-1">Correo Institucional (@buap.mx)</label>
                                            <input
                                                type="email"
                                                value={authEmail}
                                                onChange={(e) => setAuthEmail(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-background border border-outline-variant/40 text-sm"
                                                placeholder="tu.nombre@alumno.buap.mx"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:brightness-110"
                                        >
                                            {authLoading ? 'Generando PIN...' : 'Enviar PIN de Verificación'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleRegister} className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-on-surface-variant mb-1">Código PIN (6 dígitos)</label>
                                            <input
                                                type="text"
                                                value={authPin}
                                                onChange={(e) => setAuthPin(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-background border border-outline-variant/40 text-sm font-mono tracking-widest text-center"
                                                placeholder="123456"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-on-surface-variant mb-1">Nombre de Usuario</label>
                                            <input
                                                type="text"
                                                value={authUsername}
                                                onChange={(e) => setAuthUsername(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-background border border-outline-variant/40 text-sm"
                                                placeholder="LoboDigital"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-on-surface-variant mb-1">Contraseña</label>
                                            <input
                                                type="password"
                                                value={authPassword}
                                                onChange={(e) => setAuthPassword(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-background border border-outline-variant/40 text-sm"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:brightness-110"
                                        >
                                            {authLoading ? 'Creando cuenta...' : 'Completar Registro'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
