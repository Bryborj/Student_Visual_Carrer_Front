import React, { useState } from 'react';

function AdminDashboard() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

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
                    <h2 className="text-xl font-bold text-on-surface mb-4">Agregar / Actualizar Plan de Estudios</h2>
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
                        <button
                            type="submit"
                            disabled={loading || !jsonInput.trim()}
                            className="w-full md:w-auto py-3 px-8 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Guardar Plan en Base de Datos'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
