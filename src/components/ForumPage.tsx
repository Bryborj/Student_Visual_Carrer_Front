import React, { useState, useEffect } from 'react';
import { ForumPost, ForumUser } from '../types';
import { navigate } from '../hooks/useRouter';
import Layout from './Layout';

interface ForumPageProps {
  currentCareer?: string;
}

const CATEGORIES = [
  { id: 'Todos', label: 'Todos', dot: 'bg-on-surface', badge: 'bg-surface-container-high text-on-surface border border-outline-variant/40' },
  { id: '💬 General', label: 'General', dot: 'bg-outline', badge: 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40' },
  { id: '👨‍🏫 Materias & Profesores', label: 'Materias & Profesores', dot: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' },
  { id: '💡 Dudas Académicas', label: 'Dudas Académicas', dot: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30' },
  { id: '🚀 Proyectos & Colaboración', label: 'Proyectos & Colaboración', dot: 'bg-purple-500', badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30' }
];

const MOCK_POSTS: ForumPost[] = [];

export const ForumPage: React.FC<ForumPageProps> = ({ currentCareer = 'Ingeniería en Ciencias de la Computación' }) => {
  const [posts, setPosts] = useState<ForumPost[]>(MOCK_POSTS);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recientes' | 'populares' | 'comentados'>('recientes');
  const [sidebarNav, setSidebarNav] = useState<'discusiones' | 'populares' | 'recientes'>('discusiones');

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
      const [res] = await Promise.all([
        fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            email: regEmail,
            pin: regPin,
            username: regUsername,
            password: regPassword
          })
        }),
        new Promise((resolve) => setTimeout(resolve, 650))
      ]);
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('forum_session', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('forum_token', data.token);
        }
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
      const [res] = await Promise.all([
        fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login',
            identifier: loginIdentifier,
            password: loginPassword
          })
        }),
        new Promise((resolve) => setTimeout(resolve, 650))
      ]);
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('forum_session', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('forum_token', data.token);
        }
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
    localStorage.removeItem('forum_token');
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
      const token = localStorage.getItem('forum_token');
      await fetch('/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
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
      const token = localStorage.getItem('forum_token');
      try {
        await fetch('/api/forum', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
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
      const token = localStorage.getItem('forum_token');
      try {
        await fetch('/api/forum', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
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
                          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  }).sort((a, b) => {
    const activeSort = sidebarNav === 'populares' ? 'populares' : sidebarNav === 'recientes' ? 'recientes' : sortBy;
    if (activeSort === 'populares') return (b.likes || 0) - (a.likes || 0);
    if (activeSort === 'comentados') return (b.comments?.length || 0) - (a.comments?.length || 0);
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const getCategoryCount = (catId: string) => {
    if (catId === 'Todos') return posts.length;
    return posts.filter(p => p.category === catId).length;
  };

  const getBadgeClass = (categoryName: string) => {
    const found = CATEGORIES.find(c => c.id === categoryName || c.label === categoryName);
    return found?.badge || 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40';
  };

  const authControls = forumUser ? (
    <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs sm:text-sm">
      <span className="font-bold text-on-surface">@{forumUser.username}</span>
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
        onClick={() => { setShowAuthView(true); setAuthTab('login'); }}
        className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
      >
        Iniciar Sesión
      </button>
      <button
        onClick={() => { setShowAuthView(true); setAuthTab('register'); }}
        className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl bg-on-surface text-surface hover:opacity-90 text-xs font-semibold transition-all active:scale-95 shadow-xs cursor-pointer"
      >
        Registrarse
      </button>
    </div>
  );

  const careerBadgeControl = (
    <div className="mt-1 flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-metadata-label bg-surface-container text-on-surface-variant border border-outline-variant/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Comunidad: <strong className="text-on-surface">{currentCareer}</strong></span>
      </span>
    </div>
  );

  return (
    <Layout
      title="Foro de Intercambio Académico"
      activeRoute="forum"
      headerControls={careerBadgeControl}
      rightControls={authControls}
      onGoHome={() => navigate('/')}
      onOpenForum={() => navigate('/foro')}
      onOpenProposals={() => navigate('/propuestas')}
      onOpenAdmin={() => navigate('/admin')}
    >
      {/* Auth Overlay Modal */}
      {showAuthView && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 max-w-md w-full shadow-2xl relative my-auto">
            <button
              onClick={() => { setShowAuthView(false); setAuthError(''); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-high border border-outline-variant/40 mx-auto flex items-center justify-center text-on-surface shadow-xs mb-3 p-2">
                <img src="/wolf.svg" alt="Lobo BUAP" className="w-full h-full object-contain dark:invert" />
              </div>
              <h3 className="serif-title text-xl font-bold text-on-surface">Acceso al Foro BUAP</h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Tu correo no se guardará. Solo almacenamos un hash criptográfico anónimo (SHA-256) para verificar tu pertenencia a la BUAP.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-outline-variant/40 mb-5">
              <button
                onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
                className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  authTab === 'login'
                    ? 'border-on-surface text-on-surface'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
                className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  authTab === 'register'
                    ? 'border-on-surface text-on-surface'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Regístrate gratis
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">error</span>
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">check_circle</span>
                <span>{authSuccess}</span>
              </div>
            )}

            {devPinAlert && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs flex flex-col gap-1.5">
                <span className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Modo Gratuito / Pruebas Activo:
                </span>
                <span>Tu PIN de verificación temporal es: <strong className="text-sm tracking-wider bg-amber-500/20 px-2 py-0.5 rounded text-amber-800 dark:text-amber-200">{devPinAlert.split(' | Razón: ')[0]}</strong></span>
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
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Correo Institucional o Usuario</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: lobito123 o estudiante@alumno.buap.mx"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-outline"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Contraseña</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-outline"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-on-surface text-surface font-bold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Verificando credenciales...</span>
                    </>
                  ) : (
                    'Entrar al Foro'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">1. Correo Institucional BUAP</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      disabled={pinSent}
                      placeholder="ejemplo@alumno.buap.mx"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="flex-1 bg-surface-container-low border border-outline-variant/50 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-outline disabled:opacity-60"
                    />
                    {!pinSent && (
                      <button
                        type="button"
                        onClick={handleSendPin}
                        disabled={authLoading}
                        className="px-3.5 bg-on-surface text-surface hover:opacity-90 font-semibold text-xs rounded-xl whitespace-nowrap transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {authLoading ? '...' : 'Enviar PIN'}
                      </button>
                    )}
                  </div>
                </div>

                {pinSent && (
                  <div className="space-y-4 animate-fadeIn border-t border-outline-variant/40 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">2. PIN de Verificación (6 dígitos)</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-3 text-sm tracking-widest font-bold text-center text-on-surface focus:outline-none focus:border-outline"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">3. Nombre de Usuario (Público)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: lobito_computacion"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-outline"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">4. Contraseña</label>
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-outline"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 rounded-xl bg-on-surface text-surface font-bold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {authLoading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Registrando cuenta...</span>
                        </>
                      ) : (
                        'Completar Registro'
                      )}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Main Forum Content Container */}
      <div className="relative overflow-hidden">
        <div className="bg-subtle-glow top-0 -left-24"></div>
        <div className="bg-subtle-glow bottom-10 -right-24"></div>

        <div className="w-full max-w-container-max-width mx-auto px-4 md:px-grid-margin py-8 sm:py-10 relative z-10">
          {/* Editorial Hero Banner */}
          <div className="mb-10 pb-8 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-metadata-label bg-surface-container border border-outline-variant/40 text-on-surface-variant mb-3">
                <span className="material-symbols-outlined text-sm text-emerald-500">verified_user</span>
                <span>Identidad Institucional Protegida con SHA-256</span>
              </div>
              <h2 className="serif-title text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
                Diálogo & Comunidad Universitaria
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mt-2 leading-relaxed">
                Espacio abierto para compartir reseñas constructivas sobre materias, experiencias docentes, recursos académicos y proyectos estudiantiles en la BUAP.
              </p>
            </div>

            {!forumUser && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => { setShowAuthView(true); setAuthTab('register'); }}
                  className="px-4 py-2.5 rounded-xl bg-on-surface text-surface font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>Unirse con Correo BUAP</span>
                </button>
              </div>
            )}
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              {/* Navigation Views */}
              <nav className="academic-card rounded-2xl p-4 shadow-xs">
                <span className="text-[11px] font-metadata-label text-on-surface-variant uppercase tracking-wider px-2.5 mb-2.5 block">
                  Explorar Feed
                </span>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => { setSidebarNav('discusiones'); setSelectedCategory('Todos'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm cursor-pointer ${
                        sidebarNav === 'discusiones' && selectedCategory === 'Todos'
                          ? 'bg-surface-container-high text-on-surface font-semibold border border-outline-variant/40'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[19px]">forum</span>
                      <span>Todas las Discusiones</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { setSidebarNav('populares'); setSortBy('populares'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm cursor-pointer ${
                        sidebarNav === 'populares'
                          ? 'bg-surface-container-high text-on-surface font-semibold border border-outline-variant/40'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[19px] text-amber-500">local_fire_department</span>
                      <span>Más Populares</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { setSidebarNav('recientes'); setSortBy('recientes'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm cursor-pointer ${
                        sidebarNav === 'recientes'
                          ? 'bg-surface-container-high text-on-surface font-semibold border border-outline-variant/40'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[19px]">schedule</span>
                      <span>Más Recientes</span>
                    </button>
                  </li>
                </ul>
              </nav>

              {/* Categories */}
              <div className="academic-card rounded-2xl p-5 shadow-xs">
                <h3 className="text-[11px] font-metadata-label text-on-surface-variant uppercase tracking-wider mb-3.5">
                  Categorías Temáticas
                </h3>
                <ul className="space-y-1.5">
                  {CATEGORIES.map(cat => {
                    const active = selectedCategory === cat.id;
                    const count = getCategoryCount(cat.id);
                    return (
                      <li key={cat.id}>
                        <button
                          onClick={() => { setSelectedCategory(cat.id); setSidebarNav('discusiones'); }}
                          className={`w-full flex items-center justify-between group py-2 px-2.5 rounded-xl transition-all cursor-pointer ${
                            active
                              ? 'bg-surface-container-high text-on-surface font-semibold border border-outline-variant/40'
                              : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cat.dot}`}></span>
                            <span className="text-xs sm:text-sm truncate">
                              {cat.label}
                            </span>
                          </div>
                          <span className={`text-[11px] font-metadata-label px-2 py-0.5 rounded-full shrink-0 ${
                            active
                              ? 'bg-on-surface text-surface font-bold'
                              : 'text-on-surface-variant bg-surface-container'
                          }`}>
                            {count}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Privacy & Coexistence Box */}
              <div className="academic-card rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-on-surface font-semibold text-xs">
                  <span className="material-symbols-outlined text-base text-emerald-500">lock</span>
                  <span>Privacidad Criptográfica</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Tu correo institucional se transforma mediante un hash irreversible <span className="font-metadata-label text-on-surface">SHA-256</span>. Participa con libertad y respeto académico.
                </p>
              </div>
            </aside>

            {/* Main Feed */}
            <div className="lg:col-span-3 space-y-6">
              {/* Post Composer */}
              <form
                onSubmit={handleCreatePost}
                className="academic-card rounded-2xl shadow-xs overflow-hidden focus-within:border-outline transition-all duration-200"
              >
                <div className="flex items-start p-4 sm:p-5 gap-4">
                  <div className="w-10 h-10 rounded-xl shrink-0 bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-on-surface font-bold text-xs shadow-xs">
                    {forumUser ? (
                      forumUser.username.slice(0, 2).toUpperCase()
                    ) : (
                      <img src="/wolf.svg" alt="Lobo BUAP" className="w-6 h-6 object-contain dark:invert" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {forumUser && (
                      <input
                        type="text"
                        placeholder="Título del tema (ej. ¿Qué profesor recomiendan para Bases de Datos?)..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-transparent border-b border-outline-variant/40 focus:border-outline pb-2 text-on-surface placeholder-on-surface-variant/60 text-base font-semibold focus:outline-none"
                      />
                    )}
                    <textarea
                      rows={forumUser && newTitle ? 3 : 2}
                      onClick={() => { if (!forumUser) setShowAuthView(true); }}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 resize-none text-on-surface placeholder-on-surface-variant/60 p-0 text-sm sm:text-base min-h-[56px] focus:outline-none"
                      placeholder={forumUser ? "Inicia una nueva discusión... comparte análisis, dudas o aportes con la comunidad" : "Haz clic aquí e inicia sesión con tu cuenta BUAP para publicar un tema..."}
                    ></textarea>
                  </div>
                </div>

                <div className="bg-surface-container-low border-t border-outline-variant/30 px-4 py-3 flex flex-wrap gap-3 justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-metadata-label text-on-surface-variant hidden sm:inline">Categoría:</span>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      disabled={!forumUser}
                      className="text-xs bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-1.5 text-on-surface font-medium focus:border-outline focus:outline-none disabled:opacity-50"
                    >
                      {CATEGORIES.filter(c => c.id !== 'Todos').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    onClick={(e) => { if (!forumUser) { e.preventDefault(); setShowAuthView(true); } }}
                    className="bg-on-surface text-surface hover:opacity-90 px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all active:scale-95 shadow-xs ml-auto cursor-pointer"
                  >
                    Publicar Tema
                  </button>
                </div>
              </form>

              {/* Filter/Sort Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/30 pb-3.5 gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="serif-title font-bold text-on-surface text-xl">
                    Últimas Discusiones
                  </h3>
                  {selectedCategory !== 'Todos' && (
                    <span className="text-xs font-metadata-label px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface border border-outline-variant/40">
                      {CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[17px]">search</span>
                    <input
                      type="text"
                      placeholder="Buscar tema o autor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:border-outline w-40 sm:w-52"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-metadata-label text-on-surface-variant whitespace-nowrap hidden sm:inline">Orden:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value as any); setSidebarNav('discusiones'); }}
                      className="text-xs border border-outline-variant/40 rounded-xl focus:border-outline focus:outline-none text-on-surface py-1.5 pl-2.5 pr-6 bg-surface-container-low"
                    >
                      <option value="recientes">Más Recientes</option>
                      <option value="populares">Más Populares</option>
                      <option value="comentados">Más Comentados</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Posts List */}
              <div className="space-y-4">
                {loading && posts.length === 0 ? (
                  <div className="py-20 text-center text-on-surface-variant flex flex-col items-center gap-4 academic-card rounded-2xl">
                    <div className="w-8 h-8 border-2 border-on-surface border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium">Cargando discusiones de la comunidad...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="py-16 text-center text-on-surface-variant academic-card rounded-2xl p-8">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-2xl text-on-surface">forum</span>
                    </div>
                    <h4 className="serif-title text-lg font-bold text-on-surface">No se encontraron discusiones</h4>
                    <p className="text-sm mt-1 max-w-md mx-auto text-on-surface-variant">
                      Sé el primer miembro en iniciar una conversación en esta categoría o intenta con otros términos de búsqueda.
                    </p>
                  </div>
                ) : (
                  filteredPosts.map(post => {
                    const isExpanded = expandedPostId === post._id;
                    const hasLiked = forumUser ? post.likedBy?.includes(forumUser.emailHash) : false;
                    const authorInitials = post.author.slice(0, 2).toUpperCase();
                    const badgeClass = getBadgeClass(post.category);

                    return (
                      <article
                        key={post._id}
                        className="academic-card rounded-2xl p-5 sm:p-6 shadow-xs transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl shrink-0 bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-on-surface font-bold text-sm shadow-xs">
                            {authorInitials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-on-surface text-sm sm:text-base truncate">@{post.author}</h3>
                                <span
                                  className="inline-flex items-center text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold gap-1"
                                  title="Identidad BUAP verificada"
                                >
                                  <span className="material-symbols-outlined text-[12px]">verified</span>
                                  <span>BUAP</span>
                                </span>
                                <span className="text-xs font-metadata-label text-on-surface-variant">• {post.career || 'BUAP'}</span>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeClass}`}>
                                {post.category.replace(/^[🌟💬👨‍🏫💡🚀]\s*/, '')}
                              </span>
                            </div>

                            <h4 className="serif-title text-lg sm:text-xl font-bold text-on-surface mb-2 mt-1 leading-snug">
                              {post.title}
                            </h4>
                            <p className="text-on-surface-variant text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                              {post.content}
                            </p>

                            <div className="flex items-center gap-6 text-on-surface-variant pt-3 border-t border-outline-variant/30">
                              <button
                                onClick={() => handleLike(post)}
                                className={`flex items-center gap-1.5 transition-colors text-xs sm:text-sm font-medium cursor-pointer ${
                                  hasLiked ? 'text-amber-500 font-bold' : 'hover:text-on-surface'
                                }`}
                              >
                                <span
                                  className="material-symbols-outlined text-[18px]"
                                  style={hasLiked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                                >
                                  thumb_up
                                </span>
                                <span>{post.likes || 0}</span>
                              </button>

                              <button
                                onClick={() => setExpandedPostId(isExpanded ? null : (post._id || null))}
                                className={`flex items-center gap-1.5 transition-colors text-xs sm:text-sm cursor-pointer ${
                                  isExpanded ? 'text-on-surface font-semibold' : 'hover:text-on-surface'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                                <span>{post.comments?.length || 0} {post.comments?.length === 1 ? 'Respuesta' : 'Respuestas'}</span>
                              </button>

                              <span className="text-xs font-metadata-label text-on-surface-variant/70 ml-auto">
                                {new Date(post.createdAt || Date.now()).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            {/* Comments Section inside Card */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-outline-variant/30 space-y-3 animate-fadeIn">
                                <div className="space-y-2.5">
                                  {post.comments && post.comments.length > 0 ? (
                                    post.comments.map(c => (
                                      <div
                                        key={c.id}
                                        className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm space-y-1"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-on-surface">@{c.author}</span>
                                          <span className="text-[10px] font-metadata-label text-on-surface-variant">Comunidad BUAP</span>
                                        </div>
                                        <p className="text-on-surface-variant leading-relaxed">{c.content}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-on-surface-variant italic py-2">
                                      Aún no hay respuestas en esta discusión. ¡Sé el primero en aportar!
                                    </p>
                                  )}
                                </div>

                                <div className="flex gap-2 pt-1">
                                  <input
                                    type="text"
                                    placeholder={forumUser ? "Escribe una respuesta para la comunidad..." : "Inicia sesión para responder..."}
                                    disabled={!forumUser}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && post._id && handleAddComment(post._id)}
                                    className="flex-1 bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:border-outline disabled:opacity-50 text-on-surface placeholder-on-surface-variant/60"
                                  />
                                  <button
                                    onClick={() => post._id && handleAddComment(post._id)}
                                    disabled={!forumUser}
                                    className="px-4 py-2 rounded-xl bg-on-surface text-surface hover:opacity-90 font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
                                  >
                                    <span>Responder</span>
                                    <span className="material-symbols-outlined text-[16px]">send</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
