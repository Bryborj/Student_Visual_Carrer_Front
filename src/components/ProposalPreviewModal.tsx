import React, { useMemo, useState } from 'react';

interface Subject {
    id?: string;
    subject?: string;
    name?: string;
    credits?: number;
    Credits?: number;
    required?: string | string[] | null;
    position_Y?: number;
    Position?: number;
    [key: string]: any;
}

interface Cluster {
    cluster: number | string;
    content: Subject[];
}

interface ProposalPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    career: string;
    author?: string;
    reason?: string;
    isNewPlan?: boolean;
    proposedCourses: Cluster[];
    originalCourses?: Cluster[] | null;
    loadingOriginal?: boolean;
}

type ChangeType = 'added' | 'modified' | 'removed' | 'unchanged';

const subjectName = (s: Subject) => s.subject || s.name || 'Sin nombre';
const subjectCredits = (s: Subject) => Number(s.credits ?? s.Credits ?? 0) || 0;
const subjectKey = (s: Subject) => (s.id ? `id:${s.id}` : `name:${subjectName(s).toLowerCase()}`);

const flatten = (courses: Cluster[] = []) => {
    const map = new Map<string, Subject & { cluster: Cluster['cluster'] }>();
    (Array.isArray(courses) ? courses : []).forEach(c => {
        (c?.content || []).forEach(s => map.set(subjectKey(s), { ...s, cluster: c.cluster }));
    });
    return map;
};

const normalizeReq = (r: Subject['required']) =>
    Array.isArray(r) ? [...r].sort().join(',') : (r ?? '').toString();

const describeDiff = (before: Subject & { cluster: any }, after: Subject & { cluster: any }) => {
    const diffs: string[] = [];
    if (String(before.cluster) !== String(after.cluster)) diffs.push(`Semestre ${before.cluster} → ${after.cluster}`);
    const rowBefore = Number(before.position_Y ?? before.Position ?? 0);
    const rowAfter = Number(after.position_Y ?? after.Position ?? 0);
    if (rowBefore && rowAfter && rowBefore !== rowAfter) diffs.push(`Fila ${rowBefore} → ${rowAfter}`);
    if (subjectCredits(before) !== subjectCredits(after)) diffs.push(`Créditos ${subjectCredits(before)} → ${subjectCredits(after)}`);
    if (subjectName(before) !== subjectName(after)) diffs.push(`Nombre "${subjectName(before)}" → "${subjectName(after)}"`);
    if (normalizeReq(before.required) !== normalizeReq(after.required)) {
        diffs.push(`Prerrequisitos [${normalizeReq(before.required) || 'ninguno'}] → [${normalizeReq(after.required) || 'ninguno'}]`);
    }
    ['theory', 'lab', 'autonomous'].forEach(k => {
        if ((before[k] ?? null) !== (after[k] ?? null)) diffs.push(`${k} ${before[k] ?? '-'} → ${after[k] ?? '-'}`);
    });
    return diffs;
};

const CHANGE_STYLES: Record<ChangeType, string> = {
    added: 'border-l-green-500 bg-green-500/10',
    modified: 'border-l-amber-500 bg-amber-500/10',
    removed: 'border-l-red-500 bg-red-500/10 opacity-60 line-through',
    unchanged: 'border-l-outline-variant bg-surface-container'
};

export default function ProposalPreviewModal({
    isOpen,
    onClose,
    career,
    author,
    reason,
    isNewPlan = false,
    proposedCourses,
    originalCourses,
    loadingOriginal = false
}: ProposalPreviewModalProps) {
    const [tab, setTab] = useState<'map' | 'changes'>('map');

    const analysis = useMemo(() => {
        const proposed = flatten(proposedCourses);
        const original = flatten(originalCourses || []);
        const added: Subject[] = [];
        const modified: { subject: Subject; diffs: string[] }[] = [];
        const removed: Subject[] = [];
        const status = new Map<string, ChangeType>();

        proposed.forEach((s, key) => {
            const before = original.get(key);
            if (!before) {
                added.push(s);
                status.set(key, 'added');
            } else {
                const diffs = describeDiff(before, s);
                if (diffs.length) {
                    modified.push({ subject: s, diffs });
                    status.set(key, 'modified');
                } else {
                    status.set(key, 'unchanged');
                }
            }
        });
        original.forEach((s, key) => {
            if (!proposed.has(key)) removed.push(s);
        });

        const sum = (m: Map<string, Subject>) => Array.from(m.values()).reduce((a, s) => a + subjectCredits(s), 0);
        return {
            added, modified, removed, status,
            proposedCredits: sum(proposed),
            originalCredits: sum(original),
            proposedCount: proposed.size
        };
    }, [proposedCourses, originalCourses]);

    if (!isOpen) return null;

    const clusters = (Array.isArray(proposedCourses) ? proposedCourses : [])
        .slice()
        .sort((a, b) => Number(a.cluster) - Number(b.cluster));
    const hasOriginal = !isNewPlan && Array.isArray(originalCourses) && originalCourses.length > 0;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="proposal-preview-title"
        >
            <div
                className="bg-surface rounded-2xl border border-outline-variant/40 w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-outline-variant/30">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                isNewPlan
                                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/30'
                                    : 'bg-primary/10 text-primary border-primary/20'
                            }`}>
                                {isNewPlan ? 'Nuevo plan' : 'Actualización'}
                            </span>
                            {author && <span className="text-xs text-on-surface-variant">por <strong className="text-primary">@{author}</strong></span>}
                        </div>
                        <h2 id="proposal-preview-title" className="text-lg sm:text-xl font-bold text-on-surface truncate">
                            Vista previa: {career}
                        </h2>
                        {reason && <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{reason}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar vista previa"
                        className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface shrink-0"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Summary + Tabs */}
                <div className="px-5 sm:px-6 pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-center">
                        <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/30">
                            <div className="text-lg font-bold text-on-surface">{analysis.proposedCount}</div>
                            <div className="text-[10px] uppercase text-on-surface-variant">Materias</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/30">
                            <div className="text-lg font-bold text-on-surface">
                                {analysis.proposedCredits}
                                {hasOriginal && analysis.proposedCredits !== analysis.originalCredits && (
                                    <span className={`text-xs ml-1 ${analysis.proposedCredits > analysis.originalCredits ? 'text-green-500' : 'text-red-500'}`}>
                                        ({analysis.proposedCredits > analysis.originalCredits ? '+' : ''}{analysis.proposedCredits - analysis.originalCredits})
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] uppercase text-on-surface-variant">Créditos</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/30">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">{analysis.added.length}</div>
                            <div className="text-[10px] uppercase text-on-surface-variant">Agregadas</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                {analysis.modified.length}{hasOriginal ? ` / ${analysis.removed.length}` : ''}
                            </div>
                            <div className="text-[10px] uppercase text-on-surface-variant">
                                {hasOriginal ? 'Modif. / Removidas' : 'Modificadas'}
                            </div>
                        </div>
                    </div>

                    <div className="flex border-b border-outline-variant/40 gap-6">
                        {[
                            { id: 'map', label: 'Mapa curricular', icon: 'account_tree' },
                            { id: 'changes', label: 'Resumen de cambios', icon: 'difference' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id as 'map' | 'changes')}
                                className={`pb-2.5 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                                    tab === t.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-5 sm:p-6">
                    {loadingOriginal ? (
                        <div className="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
                            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Comparando con el plan oficial...
                        </div>
                    ) : tab === 'map' ? (
                        clusters.length === 0 ? (
                            <p className="text-center text-sm text-on-surface-variant py-12">La propuesta no contiene materias.</p>
                        ) : (
                            <>
                                {hasOriginal && (
                                    <div className="flex flex-wrap gap-3 mb-4 text-[11px] text-on-surface-variant">
                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500" /> Agregada</span>
                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Modificada</span>
                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-outline-variant" /> Sin cambios</span>
                                    </div>
                                )}
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {clusters.map(c => {
                                        const subjects = (c.content || []).slice().sort(
                                            (a, b) => (a.position_Y || a.Position || 0) - (b.position_Y || b.Position || 0)
                                        );
                                        const maxRow = subjects.length > 0
                                            ? Math.max(...subjects.map((s, idx) => Number(s.position_Y ?? s.Position) || (idx + 1)))
                                            : 0;
                                        return (
                                            <div key={String(c.cluster)} className="min-w-[175px] w-[175px] shrink-0">
                                                <h3 className="text-xs font-bold text-center text-on-surface-variant uppercase mb-2 py-1.5 rounded-lg bg-surface-container-high">
                                                    Semestre {c.cluster}
                                                </h3>
                                                <div className="space-y-2">
                                                    {Array.from({ length: maxRow }, (_, rIdx) => {
                                                        const rowIndex = rIdx + 1;
                                                        const s = subjects.find(
                                                            (sub, idx) => (Number(sub.position_Y ?? sub.Position) || (idx + 1)) === rowIndex
                                                        );
                                                        if (!s) {
                                                            return (
                                                                <div
                                                                    key={`empty-${c.cluster}-${rowIndex}`}
                                                                    className="min-h-[76px] rounded-lg border border-dashed border-outline-variant/25 bg-surface/20 flex items-center justify-center text-[10px] font-mono text-on-surface-variant/40"
                                                                >
                                                                    Fila {rowIndex} • Vacío
                                                                </div>
                                                            );
                                                        }
                                                        const change = hasOriginal ? (analysis.status.get(subjectKey(s)) || 'unchanged') : 'unchanged';
                                                        const req = normalizeReq(s.required);
                                                        return (
                                                            <div
                                                                key={`${subjectKey(s)}-${rowIndex}`}
                                                                className={`min-h-[76px] border-l-4 rounded-lg border border-outline-variant/30 p-2.5 flex flex-col justify-between ${CHANGE_STYLES[change]}`}
                                                                title={req ? `Prerrequisitos: ${req}` : 'Sin prerrequisitos'}
                                                            >
                                                                <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                                                                    <span>{subjectCredits(s)} CR</span>
                                                                    {s.id && <span className="font-mono">{s.id}</span>}
                                                                </div>
                                                                <div className="text-xs font-semibold text-on-surface leading-tight">{subjectName(s)}</div>
                                                                {req && <div className="text-[10px] text-on-surface-variant mt-1 truncate">Req: {req}</div>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )
                    ) : (
                        <div className="space-y-6">
                            {!hasOriginal && (
                                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-on-surface">
                                    {isNewPlan
                                        ? 'Es una carrera nueva: todas las materias se agregarán a la herramienta.'
                                        : 'No fue posible cargar el plan oficial para compararlo; se listan todas las materias propuestas.'}
                                </div>
                            )}
                            <ChangeSection title="Materias agregadas" color="text-green-600 dark:text-green-400" icon="add_circle"
                                items={analysis.added.map(s => ({ s }))} />
                            {hasOriginal && (
                                <>
                                    <ChangeSection title="Materias modificadas" color="text-amber-600 dark:text-amber-400" icon="edit"
                                        items={analysis.modified.map(m => ({ s: m.subject, diffs: m.diffs }))} />
                                    <ChangeSection title="Materias removidas" color="text-red-600 dark:text-red-400" icon="remove_circle"
                                        items={analysis.removed.map(s => ({ s }))} />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ChangeSection({ title, color, icon, items }: {
    title: string;
    color: string;
    icon: string;
    items: { s: Subject; diffs?: string[] }[];
}) {
    return (
        <section>
            <h3 className={`text-sm font-bold flex items-center gap-1.5 mb-2 ${color}`}>
                <span className="material-symbols-outlined text-base">{icon}</span>
                {title} ({items.length})
            </h3>
            {items.length === 0 ? (
                <p className="text-xs text-on-surface-variant pl-6">Ninguna.</p>
            ) : (
                <ul className="space-y-1.5">
                    {items.map(({ s, diffs }) => (
                        <li key={subjectKey(s)} className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs">
                            <div className="flex justify-between gap-2">
                                <span className="font-semibold text-on-surface">{subjectName(s)}</span>
                                <span className="text-on-surface-variant shrink-0">Sem. {(s as any).cluster} • {subjectCredits(s)} CR</span>
                            </div>
                            {diffs && diffs.length > 0 && (
                                <ul className="mt-1 pl-3 list-disc text-on-surface-variant">
                                    {diffs.map(d => <li key={d}>{d}</li>)}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
