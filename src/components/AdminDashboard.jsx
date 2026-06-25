import React, { useState, useEffect } from 'react';

function AdminDashboard() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [availablePlans, setAvailablePlans] = useState([]);
    const [selectedPlanToLoad, setSelectedPlanToLoad] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            fetch('/api/plans-list')
                .then(res => res.json())
                .then(data => setAvailablePlans(data))
                .catch(console.error);
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
                delete data._id; // Delete internal Mongo ID
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
            
            // Generate a filename based on career if possible
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
                setStatus({ type: 'error', message: data.error || 'Contraseña incorrecta' });
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
                setJsonInput(''); // Limpiar después de éxito
            } else {
                setStatus({ type: 'error', message: data.error || 'Error al guardar el plan' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Error de conexión' });
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
                            <label className="block text-sm font-medium text-on-surface/70 mb-1">Contraseña</label>
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
                            {loading ? 'Verificando...' : 'Entrar'}
                        </button>
                    </form>
                    <button 
                        onClick={() => window.location.hash = ''} 
                        className="mt-6 w-full text-center text-sm text-primary hover:underline"
                    >
                        Volver a la app principal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-surface p-6 rounded-2xl shadow-sm border border-primary/10">
                    <h1 className="text-2xl font-bold text-on-surface">Dashboard de Administrador</h1>
                    <button 
                        onClick={() => window.location.hash = ''}
                        className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                        Salir del Admin
                    </button>
                </div>

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-primary/10">
                    <h2 className="text-xl font-bold text-on-surface mb-4">Cargar Plan Existente</h2>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-on-surface/70 mb-1">Selecciona un plan para editar</label>
                            <select 
                                className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/20 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
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
                            className="w-full sm:w-auto px-6 py-2.5 bg-secondary text-on-secondary rounded-xl font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50"
                        >
                            Cargar JSON
                        </button>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-primary/10">
                    <h2 className="text-xl font-bold text-on-surface mb-4">Editor de JSON</h2>
                    <p className="text-on-surface/70 mb-6 text-sm">
                        Pega el objeto JSON completo del plan de estudios. Debe contener al menos <code className="bg-background px-1 py-0.5 rounded">career</code>, <code className="bg-background px-1 py-0.5 rounded">faculty</code> y <code className="bg-background px-1 py-0.5 rounded">courses</code>. 
                        <strong> Nota:</strong> La base de datos ahora es relacional. El backend automáticamente buscará o creará la <code>Facultad</code> usando el nombre y enlazará su ID al plan. También puedes incluir <code className="bg-background px-1 py-0.5 rounded">modalidad</code> (ej. Línea, Presencial).
                    </p>

                    <form onSubmit={handleAddPlan} className="space-y-4">
                        <div>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="w-full h-96 px-4 py-3 rounded-xl bg-background border border-primary/20 text-on-surface font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                placeholder='{\n  "career": "Ingeniería en Software",\n  "modalidad": "Línea",\n  "faculty": "Facultad de Ciencias de la Computación",\n  "logo_url": "...",\n  "courses": [\n    ...\n  ]\n}'
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
                                className="flex-1 py-3 px-8 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Guardar Cambios en BD'}
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadJson}
                                disabled={!jsonInput.trim()}
                                className="flex-1 py-3 px-8 bg-surface-container-high text-on-surface rounded-xl font-medium border border-outline-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                Descargar JSON
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
