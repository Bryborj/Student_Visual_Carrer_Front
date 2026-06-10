import React, { useState } from 'react';

export default function VerifyEmail({ onVerified }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/verifyEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al verificar el correo');
            }

            if (data.verified) {
                onVerified(email);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
            <div className="bg-surface-container-high p-8 rounded-2xl shadow-2xl max-w-md w-full border border-outline-variant">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-on-surface mb-2">Verificación de Estudiante</h2>
                    <p className="text-on-surface-variant text-sm">
                        Para acceder al plan de estudios, por favor verifica que eres estudiante ingresando tu correo institucional BUAP.
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant mb-1">
                            Correo Institucional
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@alumno.buap.mx"
                            className="w-full px-4 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-on-surface transition-colors placeholder:text-outline"
                            required
                        />
                    </div>
                    
                    {error && (
                        <div className="text-on-error-container text-sm bg-error-container p-3 rounded-lg border border-error">
                            {error}
                        </div>
                    )}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2.5 px-4 bg-primary text-on-primary font-medium rounded-lg transition-colors flex justify-center items-center hover:opacity-90 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Verificar Correo'}
                    </button>
                </form>
            </div>
        </div>
    );
}
