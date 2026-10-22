import React, { useState, useEffect } from 'react';
import ProposalPreviewModal from './ProposalPreviewModal';
import PlanEditorPanel from './PlanEditorPanel';
import Layout from './Layout';
import { navigate } from '../hooks/useRouter';

interface StudentPlanEditorProps {
    availablePlans?: any[];
    initialCareer?: string;
    initialTab?: 'proposals' | 'new_proposal';
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
    isNewPlan?: boolean;
    status: string;
    votesFor: number;
    votesAgainst: number;
    userVote?: string;
    votingEndsAt?: string;
    createdAt?: string;
    resolvedAt?: string;
    adminFeedback?: string;
}

interface PreviewState {
    career: string;
    author?: string;
    reason?: string;
    isNewPlan: boolean;
    courses: any[];
    originalCourses: any[] | null;
    loadingOriginal: boolean;
}

// Tiempo mínimo que se muestra el estado de carga en autenticación para evitar parpadeos.
const MIN_AUTH_LOADING_MS = 700;
const withMinDelay = async <T,>(promise: Promise<T>, ms = MIN_AUTH_LOADING_MS): Promise<T> => {
    const [result] = await Promise.all([promise, new Promise(r => setTimeout(r, ms))]);
    return result;
};

const Spinner = ({ className = '' }: { className?: string }) => (
    <span
        className={`inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}
        aria-hidden="true"
    />
);

export default function StudentPlanEditor({ availablePlans = [], initialCareer = '', initialTab = 'proposals', onGoHome }: StudentPlanEditorProps) {
    const [activeTab, setActiveTab] = useState<'proposals' | 'new_proposal'>(initialTab);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedCareerFilter, setSelectedCareerFilter] = useState<string>('Todas');

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const handleSwitchTab = (tab: 'proposals' | 'new_proposal') => {
        setActiveTab(tab);
        if (tab === 'new_proposal') {
            navigate('/propuestas?tab=editor');
        } else {
            navigate('/propuestas');
        }
    };

    // Auth State (Sesión de Alumno Institucional compartida con el Foro)
    const [user, setUser] = useState<{ username: string; emailHash: string } | null>(() => {
        try {
            const saved = localStorage.getItem('forum_session');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
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

    const [preview, setPreview] = useState<PreviewState | null>(null);

    // Abre el modal de vista previa y, si es una actualización, carga el plan oficial para comparar
    const openPreview = async (data: Omit<PreviewState, 'originalCourses' | 'loadingOriginal'>) => {
        setPreview({ ...data, originalCourses: null, loadingOriginal: !data.isNewPlan });
        if (data.isNewPlan) return;
        let originalCourses: any[] | null = null;
        try {
            const res = await fetch(`/api/plan?career=${encodeURIComponent(data.career)}`);
            if (res.ok) originalCourses = (await res.json()).courses || [];
        } catch (e) {
            console.error('Error cargando plan oficial para comparar:', e);
        }
        setPreview(prev => (prev && prev.career === data.career ? { ...prev, originalCourses, loadingOriginal: false } : prev));
    };

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

    const handleLogout = () => {
        localStorage.removeItem('forum_session');
        localStorage.removeItem('forum_token');
        setUser(null);
    };

    // Auth handlers
    const handleSendPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setAuthSuccess('');
        if (!authEmail || !authEmail.includes('buap.mx')) {
            setAuthError('Por favor ingresa un correo institucional válido (@alumno.buap.mx o @correo.buap.mx)');
            return;
        }
        setAuthLoading(true);

        try {
            const res = await withMinDelay(fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send_pin', email: authEmail })
            }));
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
            const res = await withMinDelay(fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'register',
                    email: authEmail,
                    pin: authPin,
                    username: authUsername,
                    password: authPassword
                })
            }));
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
            const res = await withMinDelay(fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    identifier: authUsername,
                    password: authPassword
                })
            }));
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

    // Controles de sesión unificados en el Header del Layout
    const authControls = user ? (
        <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs sm:text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-on-surface">@{user.username}</span>
            <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="text-on-surface-variant hover:text-error transition-colors flex items-center ml-1 cursor-pointer"
            >
                <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
        </div>
    ) : (
        <div className="flex items-center gap-2">
            <button
                onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
                Iniciar Sesión
            </button>
            <button
                onClick={() => { setShowAuthModal(true); setAuthMode('register'); }}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl bg-on-surface text-surface hover:opacity-90 text-xs font-semibold transition-all active:scale-95 shadow-xs cursor-pointer"
            >
                Registrarse
            </button>
        </div>
    );

    const headerSubtitleControl = (
        <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-metadata-label bg-surface-container text-on-surface-variant border border-outline-variant/40">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Participación comunitaria y validación colectiva de mapas curriculares BUAP</span>
            </span>
        </div>
    );

    return (
        <Layout
            title="Gobernanza y Actualización de Planes"
            activeRoute={activeTab === 'new_proposal' ? 'proposals-editor' : 'proposals'}
            headerControls={headerSubtitleControl}
            rightControls={authControls}
            onGoHome={onGoHome}
            onOpenForum={() => navigate('/foro')}
            onOpenProposals={() => handleSwitchTab('proposals')}
            onOpenAdmin={() => navigate('/admin')}
        >
            {/* Control Segmentado de Pestañas */}
            <div className="max-w-7xl mx-auto w-full px-4 md:px-grid-margin pt-6 pb-2">
                <div className="bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/40 inline-flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto shadow-2xs">
                    <button
                        onClick={() => handleSwitchTab('proposals')}
                        className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'proposals'
                                ? 'bg-surface-container-lowest text-on-surface shadow-xs border border-outline-variant/40'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px] text-amber-500">how_to_vote</span>
                        <span>Propuestas y Votaciones Activas</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            activeTab === 'proposals'
                                ? 'bg-on-surface text-surface'
                                : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                            {proposals.length}
                        </span>
                    </button>

                    <button
                        onClick={() => handleSwitchTab('new_proposal')}
                        className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'new_proposal'
                                ? 'bg-surface-container-lowest text-on-surface shadow-xs border border-outline-variant/40'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px] text-primary">edit_calendar</span>
                        <span>Editor Visual de Planes</span>
                        <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface-variant">
                            Proponer / Crear
                        </span>
                    </button>
                </div>
            </div>

            {/* Tab 1: Proposals List & Voting */}
            {activeTab === 'proposals' && (
                <div className="max-w-7xl mx-auto w-full px-4 md:px-grid-margin py-5 flex-1">
                    {/* Barra de Filtros y Acciones */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-2xs">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                <span>Filtrar por carrera:</span>
                            </div>
                            <select
                                value={selectedCareerFilter}
                                onChange={(e) => setSelectedCareerFilter(e.target.value)}
                                className="px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/50 text-xs sm:text-sm text-on-surface font-medium focus:outline-none focus:border-primary transition-colors"
                            >
                                <option value="Todas">Todas las carreras ({proposals.length})</option>
                                {availablePlans.map((p, idx) => (
                                    <option key={idx} value={p.career}>{p.career}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={fetchProposals}
                                className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/40 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">refresh</span>
                                <span>Actualizar</span>
                            </button>
                            <button
                                onClick={() => handleSwitchTab('new_proposal')}
                                className="px-3.5 py-2 rounded-xl bg-on-surface text-surface hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                <span>Nueva Propuesta</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-16 text-center">
                            <Spinner className="w-6 h-6 text-primary mb-3" />
                            <p className="text-sm font-medium text-on-surface-variant animate-pulse">
                                Cargando propuestas comunitarias...
                            </p>
                        </div>
                    ) : proposals.length === 0 ? (
                        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/60 p-8 shadow-2xs">
                            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4 border border-outline-variant/40">
                                <span className="material-symbols-outlined text-3xl text-on-surface-variant">how_to_vote</span>
                            </div>
                            <h3 className="font-display-title text-xl font-bold text-on-surface">
                                No hay propuestas registradas
                            </h3>
                            <p className="text-sm text-on-surface-variant mt-1.5 mb-6 max-w-md mx-auto">
                                Sé el primer estudiante en proponer una actualización curricular o integrar el mapa de estudios de tu licenciatura.
                            </p>
                            <button
                                onClick={() => handleSwitchTab('new_proposal')}
                                className="px-5 py-2.5 rounded-xl bg-on-surface text-surface text-xs sm:text-sm font-semibold hover:opacity-90 transition-all active:scale-95 inline-flex items-center gap-2 shadow-xs cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                                <span>Abrir Editor Visual de Planes</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {proposals.map((p) => {
                                const votesFor = p.votesFor || 0;
                                const votesAgainst = p.votesAgainst || 0;
                                const totalVotes = votesFor + votesAgainst;
                                const approvalRatio = totalVotes > 0 ? Math.round((votesFor / totalVotes) * 100) : 0;

                                return (
                                    <article
                                        key={p.id}
                                        className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/40 shadow-2xs hover:border-outline-variant/80 transition-all"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {p.isNewPlan ? (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/12 text-purple-700 dark:text-purple-300 border border-purple-500/25 inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                                            Nuevo Plan Curricular
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant border border-outline-variant/40 inline-flex items-center gap-1">
                                                            Actualización de Malla
                                                        </span>
                                                    )}

                                                    {p.status === 'voting' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25 inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                            En Votación Abierta
                                                        </span>
                                                    )}
                                                    {p.status === 'auto_approved' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            Aprobada por Comunidad
                                                        </span>
                                                    )}
                                                    {p.status === 'admin_approved' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            Validada por Staff
                                                        </span>
                                                    )}
                                                    {p.status === 'rejected' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/12 text-rose-700 dark:text-rose-300 border border-rose-500/25 inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                            Descartada
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="font-display-title text-xl font-bold text-on-surface leading-snug">
                                                    {p.career}
                                                </h3>

                                                <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
                                                    <span>Propuesto por <strong className="text-on-surface">@{p.author}</strong></span>
                                                    <span>•</span>
                                                    <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Reciente'}</span>
                                                    <span>•</span>
                                                    <span>{p.courses?.length || 0} semestres ({p.minCredits || 0}–{p.maxCredits || 0} créditos)</span>
                                                </div>
                                            </div>

                                            {/* Controles de Votación */}
                                            <div className="flex flex-col sm:items-end gap-2 shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleVote(p.id, 'for')}
                                                        disabled={p.status !== 'voting'}
                                                        className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                                                            p.userVote === 'for'
                                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                                : 'bg-surface-container-low border-outline-variant/50 text-on-surface hover:bg-emerald-500/10 hover:border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                                                        <span>A Favor</span>
                                                        <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                                                            p.userVote === 'for' ? 'bg-black/20 text-white' : 'bg-surface-container-high text-on-surface'
                                                        }`}>
                                                            {votesFor}
                                                        </span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleVote(p.id, 'against')}
                                                        disabled={p.status !== 'voting'}
                                                        className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                                                            p.userVote === 'against'
                                                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                                                : 'bg-surface-container-low border-outline-variant/50 text-on-surface hover:bg-rose-500/10 hover:border-rose-500/40 disabled:opacity-50 disabled:cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                                                        <span>En Contra</span>
                                                        <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                                                            p.userVote === 'against' ? 'bg-black/20 text-white' : 'bg-surface-container-high text-on-surface'
                                                        }`}>
                                                            {votesAgainst}
                                                        </span>
                                                    </button>
                                                </div>

                                                {totalVotes > 0 && (
                                                    <div className="w-full sm:w-52 flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-rose-500/25 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-500 transition-all duration-300"
                                                                style={{ width: `${approvalRatio}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] font-metadata-label text-on-surface-variant">
                                                            {approvalRatio}% respaldo ({totalVotes} {totalVotes === 1 ? 'voto' : 'votos'})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Justificación Académica */}
                                        <div className="bg-surface-container-low/80 p-4 rounded-xl my-3 text-xs sm:text-sm text-on-surface leading-relaxed border-l-3 border-primary border border-outline-variant/30">
                                            <span className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                                                Motivo y Justificación de la Propuesta
                                            </span>
                                            {p.reason}
                                        </div>

                                        {p.adminFeedback && (
                                            <div className="bg-surface-container p-3.5 rounded-xl my-2.5 text-xs text-on-surface border border-outline-variant/50 flex items-start gap-2.5">
                                                <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">verified_user</span>
                                                <div>
                                                    <strong className="block text-on-surface mb-0.5">Nota de Revisión Institucional:</strong>
                                                    <span className="text-on-surface-variant">{p.adminFeedback}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pie de Tarjeta y Vista Previa */}
                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant pt-3 border-t border-outline-variant/30">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">school</span>
                                                <span>
                                                    Optativas incluidas: <strong className="text-on-surface">{p.electives?.length || 0}</strong>
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => openPreview({
                                                    career: p.career,
                                                    author: p.author,
                                                    reason: p.reason,
                                                    isNewPlan: !!p.isNewPlan,
                                                    courses: p.courses || []
                                                })}
                                                className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
                                                <span>Inspeccionar Mapa y Comparación</span>
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Propose Plan Update or New Plan (Interactive Visual Editor) */}
            {activeTab === 'new_proposal' && (
                <div className="max-w-7xl mx-auto w-full px-4 md:px-grid-margin py-5 flex-1">
                    <div className="mb-5 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-start sm:items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant/40 shrink-0">
                                <span className="material-symbols-outlined text-xl text-primary">edit_calendar</span>
                            </div>
                            <div>
                                <h2 className="font-display-title text-base sm:text-lg font-bold text-on-surface">
                                    Editor Visual de Planes y Propuestas Estudiantiles
                                </h2>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                    Agrega, edita o reordena asignaturas por semestre. Las claves se generan automáticamente y, al aprobarse, tu usuario quedará acreditado en el plan oficial.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleSwitchTab('proposals')}
                            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center transition-colors shrink-0 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            <span>Ver Votaciones</span>
                        </button>
                    </div>

                    <PlanEditorPanel
                        mode="proposal"
                        password=""
                        availablePlans={availablePlans}
                        initialCareer={initialCareer}
                        user={user}
                        onRequireLogin={() => setShowAuthModal(true)}
                        onOpenPreview={(data: any) => openPreview(data)}
                        onProposalSubmitted={() => {
                            handleSwitchTab('proposals');
                            fetchProposals();
                        }}
                        onPlanSaved={undefined}
                    />
                </div>
            )}

            {/* Modal de Vista Previa de Propuesta */}
            <ProposalPreviewModal
                isOpen={!!preview}
                onClose={() => setPreview(null)}
                career={preview?.career || ''}
                author={preview?.author}
                reason={preview?.reason}
                isNewPlan={preview?.isNewPlan}
                proposedCourses={preview?.courses || []}
                originalCourses={preview?.originalCourses}
                loadingOriginal={preview?.loadingOriginal}
            />

            {/* Modal de Autenticación de Alumno (Unificado con estilo Gris Oxford) */}
            {showAuthModal && (
                <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
                    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative my-auto">
                        <button
                            onClick={() => { setShowAuthModal(false); setAuthError(''); }}
                            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="mb-5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant border border-outline-variant/40 mb-2">
                                Identidad Estudiantil BUAP
                            </span>
                            <h3 className="font-display-title text-xl font-bold text-on-surface">
                                Acceso a Gobernanza Curricular
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-1">
                                Verifica tu correo institucional (@alumno.buap.mx o @correo.buap.mx) para votar y enviar propuestas.
                            </p>
                        </div>

                        {authError && (
                            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 font-medium">
                                {authError}
                            </div>
                        )}
                        {authSuccess && (
                            <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                                {authSuccess}
                            </div>
                        )}

                        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 mb-5">
                            <button
                                type="button"
                                onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    authMode === 'login'
                                        ? 'bg-surface-container-lowest text-on-surface shadow-2xs border border-outline-variant/30'
                                        : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    authMode === 'register'
                                        ? 'bg-surface-container-lowest text-on-surface shadow-2xs border border-outline-variant/30'
                                        : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                Registrarse con PIN
                            </button>
                        </div>

                        {authMode === 'login' ? (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                                        Usuario o Correo BUAP
                                    </label>
                                    <input
                                        type="text"
                                        value={authUsername}
                                        onChange={(e) => setAuthUsername(e.target.value)}
                                        placeholder="Ej. LoboDigital o correo@alumno.buap.mx"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={authPassword}
                                        onChange={(e) => setAuthPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:border-primary"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="w-full py-2.5 rounded-xl bg-on-surface text-surface font-semibold text-xs sm:text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    {authLoading && <Spinner />}
                                    {authLoading ? 'Iniciando sesión...' : 'Entrar a mi Cuenta'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                {!pinSent ? (
                                    <form onSubmit={handleSendPin} className="space-y-3.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                                                Correo Institucional (@buap.mx)
                                            </label>
                                            <input
                                                type="email"
                                                value={authEmail}
                                                onChange={(e) => setAuthEmail(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:border-primary"
                                                placeholder="tu.nombre@alumno.buap.mx"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="w-full py-2.5 rounded-xl bg-on-surface text-surface font-semibold text-xs sm:text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                        >
                                            {authLoading && <Spinner />}
                                            {authLoading ? 'Enviando PIN...' : 'Enviar PIN de Verificación'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleRegister} className="space-y-3.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                                                Código PIN (6 dígitos)
                                            </label>
                                            <input
                                                type="text"
                                                value={authPin}
                                                onChange={(e) => setAuthPin(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 text-sm font-mono tracking-widest text-center text-on-surface focus:outline-none focus:border-primary"
                                                placeholder="123456"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                                                Nombre de Usuario (Seudónimo o Nombre)
                                            </label>
                                            <input
                                                type="text"
                                                value={authUsername}
                                                onChange={(e) => setAuthUsername(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:border-primary"
                                                placeholder="LoboDigital"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                                                Contraseña
                                            </label>
                                            <input
                                                type="password"
                                                value={authPassword}
                                                onChange={(e) => setAuthPassword(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:border-primary"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="w-full py-2.5 rounded-xl bg-on-surface text-surface font-semibold text-xs sm:text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                        >
                                            {authLoading && <Spinner />}
                                            {authLoading ? 'Creando cuenta...' : 'Completar Registro'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
}
