import React, { useState, useEffect } from 'react';
import { ForumPost, ForumUser } from '../types';
import { Link } from '../hooks/useRouter';

interface ForumPageProps {
  currentCareer?: string;
}

const CATEGORIES = [
  { id: 'Todos', label: '🌟 Todos', color: 'from-purple-500 to-indigo-500' },
  { id: '💬 General', label: '💬 General', color: 'from-blue-500 to-cyan-500' },
  { id: '👨‍🏫 Materias & Profesores', label: '👨‍🏫 Materias & Profesores', color: 'from-emerald-500 to-teal-500' },
  { id: '💡 Dudas Académicas', label: '💡 Dudas Académicas', color: 'from-amber-500 to-orange-500' },
  { id: '🚀 Proyectos & Colaboración', label: '🚀 Proyectos & Colaboración', color: 'from-rose-500 to-pink-500' }
];

const MOCK_POSTS: ForumPost[] = [
  {
    _id: 'mock-1',
    title: '¿Recomendaciones para Estructuras de Datos?',
    content: 'Hola comunidad lobo 🐺. Voy a llevar Estructuras de Datos el próximo semestre, ¿qué profesores recomiendan que expliquen bien y practiquen mucho con proyectos reales?',
    category: '👨‍🏫 Materias & Profesores',
    career: 'Ingeniería en Ciencias de la Computación',
    author: 'lobito.buap',
    emailHash: 'mock-hash-1',
    likes: 12,
    likedBy: [],
    comments: [
      {
        id: 'c1',
        author: 'ana.sofia',
        emailHash: 'mock-hash-2',
        content: 'Te recomiendo mucho repasar punteros y árboles antes de iniciar, ¡hace toda la diferencia!',
        createdAt: '2026-06-26T14:30:00Z'
      }
    ],
    createdAt: '2026-06-26T10:00:00Z'
  },
  {
    _id: 'mock-2',
    title: 'Grupo de estudio para Sistemas Operativos 🐧',
    content: 'Estamos armando un grupo para estudiar temas de concurrencia y Linux en ICC. Si alguien quiere unirse nos juntamos en la biblioteca central.',
    category: '🚀 Proyectos & Colaboración',
    career: 'Ingeniería en Ciencias de la Computación',
    author: 'carlos.dev',
    emailHash: 'mock-hash-3',
    likes: 8,
    likedBy: [],
    comments: [],
    createdAt: '2026-06-25T18:20:00Z'
  }
];

export const ForumPage: React.FC<ForumPageProps> = ({ currentCareer = 'Ingeniería en Ciencias de la Computación' }) => {
  const [posts, setPosts] = useState<ForumPost[]>(MOCK_POSTS);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // User Session State
  const [forumUser, setForumUser] = useState<ForumUser | null>(() => {
    try {
      const saved = localStorage.getItem('forum_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Auth View State
  const [showAuthView, setShowAuthView] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Register form fields
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPin, setRegPin] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [pinSent, setPinSent] = useState<boolean>(false);
  const [devPinAlert, setDevPinAlert] = useState<string>('');

  // Login form fields
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Create post form state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('💬 General');
  
  // Comment replies state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum?category=${encodeURIComponent(selectedCategory)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setPosts(data);
        } else if (selectedCategory === 'Todos') {
          setPosts(MOCK_POSTS);
        } else {
          setPosts(MOCK_POSTS.filter(p => p.category === selectedCategory));
        }
      }
    } catch (e) {
      console.error("Error cargando foro", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setDevPinAlert('');
    if (!regEmail || !regEmail.includes('buap.mx')) {
      setAuthError('Por favor ingresa un correo institucional válido (@alumno.buap.mx o @correo.buap.mx)');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_pin', email: regEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setPinSent(true);
        if (data.emailSent) {
          setAuthSuccess('📧 ¡Código PIN enviado! Revisa la bandeja de entrada o spam de tu correo institucional.');
          setDevPinAlert('');
        } else {
          setAuthSuccess('Código PIN generado.');
          if (data.brevoError && data.devPin) {
            setDevPinAlert(`${data.devPin} | Razón: ${data.brevoError}`);
          } else if (data.devPin) {
            setDevPinAlert(data.devPin);
          }
        }
      } else {
        setAuthError(data.error || 'Error al enviar PIN.');
      }
    } catch (err) {
      setAuthError('Error de conexión al enviar PIN.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!pinSent) {
      handleSendPin(e);
      return;
    }

    if (!regEmail || !regPin || !regUsername || !regPassword) {
      setAuthError('Todos los campos son obligatorios.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: regEmail,
          pin: regPin,
          username: regUsername,
          password: regPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('forum_session', JSON.stringify(data.user));
        setForumUser(data.user);
        setShowAuthView(false);
        setRegEmail('');
        setRegPin('');
        setRegUsername('');
        setRegPassword('');
        setPinSent(false);
      } else {
        setAuthError(data.error || 'Error en el registro.');
      }
    } catch (err) {
      setAuthError('Error de conexión en el registro.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!loginIdentifier || !loginPassword) {
      setAuthError('Ingresa tu usuario/correo y contraseña.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          identifier: loginIdentifier,
          password: loginPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('forum_session', JSON.stringify(data.user));
        setForumUser(data.user);
        setShowAuthView(false);
        setLoginIdentifier('');
        setLoginPassword('');
      } else {
        setAuthError(data.error || 'Credenciales inválidas.');
      }
    } catch (err) {
      setAuthError('Error de conexión al iniciar sesión.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('forum_session');
    setForumUser(null);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumUser) {
      setShowAuthView(true);
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) return;

    const optimisticPost: ForumPost = {
      _id: 'temp-' + Date.now(),
      title: newTitle,
      content: newContent,
      category: newCategory,
      career: currentCareer || 'General',
      author: forumUser.username,
      emailHash: forumUser.emailHash,
      likes: 1,
      likedBy: [forumUser.emailHash],
      comments: [],
      createdAt: new Date().toISOString()
    };

    setPosts([optimisticPost, ...posts]);
    setIsCreating(false);
    setNewTitle('');
    setNewContent('');

    try {
      await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_post',
          title: newTitle,
          content: newContent,
          category: newCategory,
          career: currentCareer,
          username: forumUser.username,
          emailHash: forumUser.emailHash
        })
      });
      fetchPosts();
    } catch (err) {
      console.error("Error enviando post", err);
    }
  };

  const handleLike = async (post: ForumPost) => {
    if (!forumUser) {
      setShowAuthView(true);
      return;
    }

    const hasLiked = post.likedBy?.includes(forumUser.emailHash);
    
    // Optimistic UI update
    setPosts(posts.map(p => {
      if (p._id === post._id) {
        const likedBy = p.likedBy || [];
        return {
          ...p,
          likes: hasLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
          likedBy: hasLiked ? likedBy.filter(e => e !== forumUser.emailHash) : [...likedBy, forumUser.emailHash]
        };
      }
      return p;
    }));

    if (!post._id?.startsWith('temp-') && !post._id?.startsWith('mock-')) {
      try {
        await fetch('/api/forum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'like_post',
            postId: post._id,
            username: forumUser.username,
            emailHash: forumUser.emailHash
          })
        });
      } catch (err) {
        console.error("Error al dar like", err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!forumUser) {
      setShowAuthView(true);
      return;
    }
    if (!commentText.trim()) return;

    const optimisticComment = {
      id: 'c-' + Date.now(),
      author: forumUser.username,
      emailHash: forumUser.emailHash,
      content: commentText,
      createdAt: new Date().toISOString()
    };

    setPosts(posts.map(p => {
      if (p._id === postId) {
        return { ...p, comments: [...p.comments, optimisticComment] };
      }
      return p;
    }));

    const textToSend = commentText;
    setCommentText('');

    if (!postId.startsWith('temp-') && !postId.startsWith('mock-')) {
      try {
        await fetch('/api/forum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_comment',
            postId,
            commentContent: textToSend,
            username: forumUser.username,
            emailHash: forumUser.emailHash
          })
        });
      } catch (err) {
        console.error("Error añadiendo comentario", err);
      }
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCat = selectedCategory === 'Todos' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col justify-between relative transition-colors duration-300">
      {/* Header Navigation */}
      <header className="sticky top-0 w-full z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 transition-colors duration-300 shadow-sm">
        <nav className="flex justify-between items-center px-4 sm:px-8 py-3.5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-md text-lg sm:text-xl font-semibold text-primary leading-none serif-title">Comunidad BUAP</span>
                <span className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-widest mt-1">Foro Estudiantil</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="font-label-md text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Inicio</Link>
            <Link to="/visualizador" className="font-label-md text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Visualizador</Link>
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Alternar Modo Oscuro"
              className="p-2 rounded-lg hover:bg-surface-container-high transition-colors duration-200 text-on-surface-variant hover:text-on-surface"
              title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            >
              <span className="material-symbols-outlined text-primary text-xl">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Auth Overlay Modal */}
      {showAuthView && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-2xl relative my-auto">
            <button
              onClick={() => { setShowAuthView(false); setAuthError(''); }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-3">
                🔐
              </div>
              <h3 className="text-xl font-bold text-on-surface">Acceso al Foro BUAP</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                🔒 Tu correo no se guardará. Solo almacenamos un hash criptográfico anónimo para verificar tu pertenencia a la BUAP.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-outline-variant mb-5">
              <button
                onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
                className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all ${
                  authTab === 'login'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
                className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all ${
                  authTab === 'register'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Regístrate gratis
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">error</span>
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">check_circle</span>
                <span>{authSuccess}</span>
              </div>
            )}

            {devPinAlert && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex flex-col gap-1.5">
                <span className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Modo Gratuito / Pruebas Activo:
                </span>
                <span>Tu PIN de verificación temporal es: <strong className="text-sm tracking-wider bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">{devPinAlert.split(' | Razón: ')[0]}</strong></span>
                {devPinAlert.includes(' | Razón: ') && (
                  <div className="mt-1 p-2 rounded bg-red-950/60 border border-red-500/40 text-red-200 text-[11px] font-mono leading-relaxed">
                    <strong>⚠️ Detalle de Brevo API:</strong> {devPinAlert.split(' | Razón: ')[1]}
                  </div>
                )}
              </div>
            )}

            {authTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">CORREO INSTITUCIONAL O USUARIO</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: lobito123 o estudiante@alumno.buap.mx"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">CONTRASEÑA</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {authLoading ? 'Verificando...' : 'Entrar al Foro'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">1. CORREO INSTITUCIONAL BUAP</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      disabled={pinSent}
                      placeholder="ejemplo@alumno.buap.mx"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="flex-1 bg-surface border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500 disabled:opacity-60"
                    />
                    {!pinSent && (
                      <button
                        type="button"
                        onClick={handleSendPin}
                        disabled={authLoading}
                        className="px-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl whitespace-nowrap transition-colors disabled:opacity-50"
                      >
                        {authLoading ? '...' : 'Enviar PIN'}
                      </button>
                    )}
                  </div>
                </div>

                {pinSent && (
                  <div className="space-y-4 animate-fadeIn border-t border-outline-variant/60 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">2. PIN DE VERIFICACIÓN (6 DÍGITOS)</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value)}
                        className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm tracking-widest font-bold text-center focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">3. NOMBRE DE USUARIO (PÚBLICO)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: lobito_computacion"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">4. CONTRASEÑA</label>
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {authLoading ? 'Registrando...' : 'Completar Registro'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Main Forum Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex flex-col gap-6">
        {/* Forum Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-purple-900/40 via-surface-container to-blue-900/40 border border-outline-variant flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white font-bold text-3xl shrink-0 animate-pulse">
              🐺
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent serif-title">
                Foro de Intercambio Académico
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant flex items-center gap-1.5 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Discusiones institucionales con identidad verificada y privacidad protegida
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {forumUser ? (
              <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant text-sm shadow-sm">
                <span className="font-bold text-purple-400">@{forumUser.username}</span>
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión del foro"
                  className="text-on-surface-variant hover:text-rose-400 ml-1 transition-colors flex items-center"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthView(true)}
                className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-md text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">key</span>
                <span>Iniciar Sesión / Registro</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant flex flex-col gap-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[250px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
              <input
                type="text"
                placeholder="Buscar temas, profesores, materias o dudas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* New Topic Button */}
            <button
              onClick={() => {
                if (!forumUser) {
                  setShowAuthView(true);
                } else {
                  setIsCreating(!isCreating);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add_comment</span>
              {isCreating ? 'Cancelar Publicación' : 'Nuevo Tema'}
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active 
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-md scale-105`
                      : 'bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Post Form Card */}
        {isCreating && forumUser && (
          <form onSubmit={handleCreatePost} className="p-6 rounded-2xl bg-surface-container border-2 border-purple-500/50 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2 text-purple-400">
                <span className="material-symbols-outlined text-xl">edit_square</span>
                Publicar una nueva discusión en la comunidad
              </h3>
              <span className="text-xs text-on-surface-variant bg-surface px-3 py-1 rounded-full border border-outline-variant">
                Como: @{forumUser.username} 🐺
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">CATEGORÍA</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                >
                  {CATEGORIES.filter(c => c.id !== 'Todos').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">TÍTULO DEL TEMA</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ¿Qué electivas recomiendan para 6to semestre?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">CONTENIDO / DETALLES</label>
              <textarea
                required
                rows={4}
                placeholder="Escribe aquí tu pregunta, recomendación o comentario para la comunidad..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-variant text-on-surface-variant transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all"
              >
                Publicar Discusión
              </button>
            </div>
          </form>
        )}

        {/* Posts List */}
        <div className="space-y-4">
          {loading && posts.length === 0 ? (
            <div className="py-20 text-center text-on-surface-variant flex flex-col items-center gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Cargando discusiones de la comunidad...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-20 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant p-8">
              <span className="material-symbols-outlined text-6xl text-purple-400 mb-3">forum</span>
              <h4 className="text-xl font-bold text-on-surface">No se encontraron discusiones</h4>
              <p className="text-sm mt-1 max-w-md mx-auto text-on-surface-variant">Sé el primer lobo en iniciar una conversación en esta categoría o intenta con otros términos de búsqueda.</p>
            </div>
          ) : (
            filteredPosts.map(post => {
              const isExpanded = expandedPostId === post._id;
              const hasLiked = forumUser ? post.likedBy?.includes(forumUser.emailHash) : false;
              const authorInitials = post.author.slice(0, 2).toUpperCase();

              return (
                <div 
                  key={post._id} 
                  className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant hover:border-purple-500/50 transition-all shadow-sm hover:shadow-md space-y-4"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                        {authorInitials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-base text-on-surface">@{post.author}</span>
                          <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1" title="Identidad verificada por hash criptográfico BUAP">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Verificado
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">{post.career}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-variant text-on-surface-variant shrink-0">
                      {post.category}
                    </span>
                  </div>

                  {/* Post Title & Content */}
                  <div className="pl-0 sm:pl-14 space-y-2">
                    <h4 className="font-bold text-lg text-on-surface leading-snug">{post.title}</h4>
                    <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* Post Actions */}
                  <div className="pl-0 sm:pl-14 pt-2 flex items-center gap-4 border-t border-outline-variant/40">
                    <button
                      onClick={() => handleLike(post)}
                      className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all ${
                        hasLiked 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 scale-105' 
                          : 'bg-surface hover:bg-surface-variant text-on-surface-variant border border-outline-variant'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-base ${hasLiked ? 'fill-current' : ''}`}>favorite</span>
                      {post.likes || 0} Me gusta
                    </button>

                    <button
                      onClick={() => setExpandedPostId(isExpanded ? null : (post._id || null))}
                      className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full bg-surface hover:bg-surface-variant text-on-surface-variant border border-outline-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">chat_bubble</span>
                      {post.comments?.length || 0} Comentarios
                    </button>
                  </div>

                  {/* Comments Section */}
                  {isExpanded && (
                    <div className="pl-0 sm:pl-14 pt-4 space-y-4 border-t border-outline-variant/80 animate-fadeIn">
                      <div className="space-y-3">
                        {post.comments && post.comments.length > 0 ? (
                          post.comments.map(c => (
                            <div key={c.id} className="p-4 rounded-xl bg-surface border border-outline-variant/60 text-xs sm:text-sm space-y-1.5 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-purple-400">@{c.author}</span>
                                <span className="text-[11px] text-on-surface-variant font-medium">🐺 Estudiante BUAP</span>
                              </div>
                              <p className="text-on-surface leading-relaxed">{c.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-on-surface-variant italic py-2">Aún no hay comentarios. ¡Sé el primero en aportar a esta discusión!</p>
                        )}
                      </div>

                      {/* Add Comment Input */}
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          placeholder={forumUser ? "Escribe una respuesta para la comunidad..." : "Inicia sesión para poder comentar..."}
                          disabled={!forumUser}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && post._id && handleAddComment(post._id)}
                          className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                        />
                        <button
                          onClick={() => post._id && handleAddComment(post._id)}
                          disabled={!forumUser}
                          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
                        >
                          <span>Responder</span>
                          <span className="material-symbols-outlined text-base">send</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/20 mt-16 transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-8 py-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <span className="font-headline-md text-xl text-primary serif-title font-bold">Comunidad BUAP</span>
            <span className="h-4 w-[1px] bg-outline-variant/40"></span>
            <span className="font-label-md text-xs text-on-surface-variant">Foro de Intercambio Académico</span>
          </div>
          <div className="flex gap-6">
            <Link to="/" className="font-label-md text-xs text-on-surface-variant hover:text-primary transition-colors">Inicio</Link>
            <Link to="/visualizador" className="font-label-md text-xs text-on-surface-variant hover:text-primary transition-colors">Visualizador</Link>
          </div>
        </div>
        <div className="text-center pb-6 border-t border-outline-variant/10 pt-4 px-4">
          <p className="text-[10px] font-label-md text-on-surface-variant/60 uppercase tracking-[0.15em]">🔒 Privacidad Garantizada: Tu correo institucional se protege mediante hash criptográfico SHA-256</p>
        </div>
      </footer>
    </div>
  );
};
