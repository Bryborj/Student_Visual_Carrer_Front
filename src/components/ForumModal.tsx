import React, { useState, useEffect } from 'react';
import { ForumPost, ForumUser } from '../types';

interface ForumModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCareer: string;
}

const CATEGORIES = [
  { id: 'Todos', label: 'Todos', color: 'bg-primary text-white', dot: 'bg-primary', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300' },
  { id: '💬 General', label: 'General', color: 'bg-blue-500 text-white', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' },
  { id: '👨‍🏫 Materias & Profesores', label: 'Materias & Profesores', color: 'bg-emerald-500 text-white', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' },
  { id: '💡 Dudas Académicas', label: 'Dudas Académicas', color: 'bg-amber-500 text-white', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' },
  { id: '🚀 Proyectos & Colaboración', label: 'Proyectos & Colaboración', color: 'bg-purple-500 text-white', dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300' }
];

const MOCK_POSTS: ForumPost[] = [];

export const ForumModal: React.FC<ForumModalProps> = ({ isOpen, onClose, currentCareer }) => {
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
    if (isOpen) {
      fetchPosts();
    }
  }, [isOpen, selectedCategory]);

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

  if (!isOpen) return null;

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
    return found?.badge || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#f8f6f6] dark:bg-surface-container-lowest border border-gray-200 dark:border-outline-variant rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-all relative font-body-md text-gray-800 dark:text-on-surface">
        
        {/* Auth Overlay Modal inside ForumModal */}
        {showAuthView && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
            <div className="bg-white dark:bg-surface-container-lowest border border-gray-200 dark:border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-2xl relative my-auto">
              <button
                onClick={() => { setShowAuthView(false); setAuthError(''); }}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-surface-container text-gray-500 dark:text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ec5b13] to-orange-500 mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-3">
                  🔐
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-on-surface">Acceso al Foro BUAP</h3>
                <p className="text-xs text-gray-600 dark:text-on-surface-variant mt-1">
                  Tu correo no se guardará. Solo almacenamos un hash criptográfico anónimo para verificar tu pertenencia a la BUAP.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-outline-variant mb-5">
                <button
                  onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all ${
                    authTab === 'login'
                      ? 'border-[#ec5b13] text-[#ec5b13]'
                      : 'border-transparent text-gray-500 dark:text-on-surface-variant hover:text-gray-800 dark:hover:text-on-surface'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
                  className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all ${
                    authTab === 'register'
                      ? 'border-[#ec5b13] text-[#ec5b13]'
                      : 'border-transparent text-gray-500 dark:text-on-surface-variant hover:text-gray-800 dark:hover:text-on-surface'
                  }`}
                >
                  Regístrate gratis
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-start gap-2">
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
                </div>
              )}

              {authTab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-on-surface-variant mb-1">CORREO INSTITUCIONAL O USUARIO</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: lobito123 o estudiante@alumno.buap.mx"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-surface border border-gray-300 dark:border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-[#ec5b13]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-on-surface-variant mb-1">CONTRASEÑA</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-surface border border-gray-300 dark:border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-[#ec5b13]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-[#ec5b13] hover:bg-orange-600 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {authLoading ? 'Verificando...' : 'Entrar al Foro'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-on-surface-variant mb-1">1. CORREO INSTITUCIONAL BUAP</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        disabled={pinSent}
                        placeholder="ejemplo@alumno.buap.mx"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-surface border border-gray-300 dark:border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-[#ec5b13] disabled:opacity-60"
                      />
                      {!pinSent && (
                        <button
                          type="button"
                          onClick={handleSendPin}
                          disabled={authLoading}
                          className="px-3 bg-[#ec5b13] hover:bg-orange-600 text-white font-semibold text-xs rounded-xl whitespace-nowrap transition-colors disabled:opacity-50"
                        >
                          {authLoading ? '...' : 'Enviar PIN'}
                        </button>
                      )}
                    </div>
                  </div>

                  {pinSent && (
                    <div className="space-y-4 animate-fadeIn border-t border-gray-200 dark:border-outline-variant/60 pt-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-on-surface-variant mb-1">2. PIN DE VERIFICACIÓN (6 DÍGITOS)</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="123456"
                          value={regPin}
                          onChange={(e) => setRegPin(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-surface border border-gray-300 dark:border-outline-variant rounded-xl p-3 text-sm tracking-widest font-bold text-center focus:outline-none focus:border-[#ec5b13]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-on-surface-variant mb-1">3. NOMBRE DE USUARIO (PÚBLICO)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: lobito_computacion"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-surface border border-gray-300 dark:border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-[#ec5b13]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-on-surface-variant mb-1">4. CONTRASEÑA</label>
                        <input
                          type="password"
                          required
                          placeholder="Mínimo 6 caracteres"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-surface border border-gray-300 dark:border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-[#ec5b13]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
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

        {/* Modal Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-surface-container-lowest border-b border-gray-200 dark:border-outline-variant shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-[#ec5b13]/15 text-[#ec5b13] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">forum</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-on-surface leading-tight">Foro Académico BUAP</h2>
              <p className="text-[10px] text-gray-500 dark:text-on-surface-variant uppercase font-semibold tracking-wider">Intercambio de Ideas y Consultas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {forumUser ? (
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-surface-container px-3 py-1.5 rounded-lg border border-gray-200 dark:border-outline-variant text-xs font-bold text-[#ec5b13]">
                <span>@{forumUser.username}</span>
                <button onClick={handleLogout} title="Cerrar sesión" className="text-gray-500 hover:text-rose-500 flex items-center ml-1">
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthView(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#ec5b13] hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Iniciar Sesión / Registro
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-surface-container hover:dark:bg-surface-container-high text-gray-700 dark:text-on-surface-variant transition-colors"
              title="Cerrar Foro"
            >
              <span className="material-symbols-outlined text-[20px] block">close</span>
            </button>
          </div>
        </header>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <nav className="bg-white dark:bg-surface-container-lowest rounded-xl shadow-sm border border-gray-100 dark:border-outline-variant p-4">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => { setSidebarNav('discusiones'); setSelectedCategory('Todos'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${
                        sidebarNav === 'discusiones' && selectedCategory === 'Todos'
                          ? 'bg-orange-50 dark:bg-[#ec5b13]/15 text-[#ec5b13]'
                          : 'text-gray-600 dark:text-on-surface-variant hover:bg-gray-50 dark:hover:bg-surface-container hover:text-gray-900 dark:hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">forum</span>
                      <span>Discusiones</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { setSidebarNav('populares'); setSortBy('populares'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${
                        sidebarNav === 'populares'
                          ? 'bg-orange-50 dark:bg-[#ec5b13]/15 text-[#ec5b13]'
                          : 'text-gray-600 dark:text-on-surface-variant hover:bg-gray-50 dark:hover:bg-surface-container hover:text-gray-900 dark:hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
                      <span>Populares</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { setSidebarNav('recientes'); setSortBy('recientes'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${
                        sidebarNav === 'recientes'
                          ? 'bg-orange-50 dark:bg-[#ec5b13]/15 text-[#ec5b13]'
                          : 'text-gray-600 dark:text-on-surface-variant hover:bg-gray-50 dark:hover:bg-surface-container hover:text-gray-900 dark:hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">history</span>
                      <span>Recientes</span>
                    </button>
                  </li>
                </ul>
              </nav>

              <div className="bg-white dark:bg-surface-container-lowest rounded-xl shadow-sm border border-gray-100 dark:border-outline-variant p-5">
                <h3 className="font-bold text-gray-900 dark:text-on-surface mb-4 uppercase tracking-wider text-xs">Categorías</h3>
                <ul className="space-y-3">
                  {CATEGORIES.map(cat => {
                    const active = selectedCategory === cat.id;
                    const count = getCategoryCount(cat.id);
                    return (
                      <li key={cat.id}>
                        <button
                          onClick={() => { setSelectedCategory(cat.id); setSidebarNav('discusiones'); }}
                          className={`w-full flex items-center justify-between group py-1.5 px-2 rounded-lg transition-all ${
                            active ? 'bg-orange-50 dark:bg-[#ec5b13]/15 font-semibold text-[#ec5b13]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-3 h-3 rounded-full ${cat.dot}`}></span>
                            <span className={`text-sm transition-colors ${
                              active
                                ? 'text-[#ec5b13] font-bold'
                                : 'text-gray-600 dark:text-on-surface-variant group-hover:text-gray-900 dark:group-hover:text-on-surface'
                            }`}>
                              {cat.label}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            active
                              ? 'bg-[#ec5b13] text-white'
                              : 'text-gray-500 dark:text-on-surface-variant bg-gray-100 dark:bg-surface-container'
                          }`}>
                            {count}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Main Feed */}
            <div className="lg:col-span-3 space-y-6">
              <form onSubmit={handleCreatePost} className="bg-white dark:bg-surface-container-lowest rounded-2xl shadow-sm border border-gray-200 dark:border-outline-variant overflow-hidden focus-within:ring-2 focus-within:ring-[#ec5b13]/20 focus-within:border-[#ec5b13] transition-all duration-200">
                <div className="flex items-start p-4 gap-4">
                  <div className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-tr from-[#ec5b13] to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {forumUser ? forumUser.username.slice(0, 2).toUpperCase() : '🐺'}
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {forumUser && (
                      <input
                        type="text"
                        placeholder="Título del tema (ej. ¿Qué profesor recomiendan para BD?)..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-transparent border-b border-gray-100 dark:border-outline-variant/60 focus:border-[#ec5b13] pb-2 text-gray-900 dark:text-on-surface placeholder-gray-400 dark:placeholder-on-surface-variant/60 text-base font-semibold focus:outline-none"
                      />
                    )}
                    <textarea
                      rows={forumUser && newTitle ? 3 : 2}
                      onClick={() => { if (!forumUser) setShowAuthView(true); }}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 resize-none text-gray-800 dark:text-on-surface placeholder-gray-400 dark:placeholder-on-surface-variant/60 p-0 text-sm sm:text-base min-h-[56px] focus:outline-none"
                      placeholder={forumUser ? "Inicia una nueva discusión... comparte análisis o dudas" : "Haz clic aquí e inicia sesión para iniciar una nueva discusión..."}
                    ></textarea>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-surface-container border-t border-gray-100 dark:border-outline-variant p-3 flex flex-wrap gap-3 justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 dark:text-on-surface-variant hidden sm:inline">Categoría:</span>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      disabled={!forumUser}
                      className="text-xs bg-white dark:bg-surface-container-lowest border border-gray-300 dark:border-outline-variant rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-on-surface font-medium focus:ring-[#ec5b13] focus:border-[#ec5b13] focus:outline-none disabled:opacity-50"
                    >
                      {CATEGORIES.filter(c => c.id !== 'Todos').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    onClick={(e) => { if (!forumUser) { e.preventDefault(); setShowAuthView(true); } }}
                    className="bg-[#ec5b13] hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm ml-auto"
                  >
                    Publicar
                  </button>
                </div>
              </form>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-outline-variant pb-3 gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-bold text-gray-800 dark:text-on-surface text-base">Últimas Discusiones</h2>
                  {selectedCategory !== 'Todos' && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-200 dark:bg-surface-container text-gray-700 dark:text-on-surface-variant">
                      {CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                    <input
                      type="text"
                      placeholder="Buscar en el foro..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white dark:bg-surface-container-lowest border border-gray-300 dark:border-outline-variant rounded-md pl-8 pr-3 py-1 text-xs text-gray-700 dark:text-on-surface focus:outline-none focus:border-[#ec5b13] w-40 sm:w-48"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value as any); setSidebarNav('discusiones'); }}
                    className="text-xs border border-gray-300 dark:border-outline-variant rounded-md focus:ring-[#ec5b13] focus:border-[#ec5b13] text-gray-700 dark:text-on-surface py-1 pl-2 pr-6 bg-white dark:bg-surface-container"
                  >
                    <option value="recientes">Recientes</option>
                    <option value="populares">Populares</option>
                    <option value="comentados">Comentados</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {loading && posts.length === 0 ? (
                  <div className="py-16 text-center text-gray-500 dark:text-on-surface-variant flex flex-col items-center gap-4 bg-white dark:bg-surface-container-lowest rounded-2xl border border-gray-100 dark:border-outline-variant">
                    <div className="w-8 h-8 border-3 border-[#ec5b13] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium">Cargando discusiones...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 dark:text-on-surface-variant bg-white dark:bg-surface-container-lowest rounded-2xl border border-gray-100 dark:border-outline-variant p-8">
                    <span className="material-symbols-outlined text-4xl text-[#ec5b13]/60 mb-2">forum</span>
                    <h4 className="text-base font-bold text-gray-800 dark:text-on-surface">No se encontraron discusiones</h4>
                    <p className="text-xs mt-1 text-gray-500 dark:text-on-surface-variant">Sé el primer miembro en iniciar una conversación aquí.</p>
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
                        className="bg-white dark:bg-surface-container-lowest rounded-2xl shadow-sm border border-gray-100 dark:border-outline-variant p-5 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-full shrink-0 bg-gradient-to-br from-[#ec5b13] to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {authorInitials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-gray-900 dark:text-on-surface truncate">@{post.author}</h3>
                                <span className="inline-flex items-center text-[10px] bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded font-semibold gap-0.5">
                                  <span className="material-symbols-outlined text-[12px]">verified</span>
                                  Verificado
                                </span>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                                {post.category.replace(/^[🌟💬👨‍🏫💡🚀]\s*/, '')}
                              </span>
                            </div>

                            <h4 className="text-base font-semibold text-gray-800 dark:text-on-surface mb-2 mt-1 leading-snug">{post.title}</h4>
                            <p className="text-gray-600 dark:text-on-surface-variant text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

                            <div className="flex items-center gap-6 text-gray-500 dark:text-on-surface-variant pt-1 border-t border-gray-100 dark:border-outline-variant/40">
                              <button
                                onClick={() => handleLike(post)}
                                className={`flex items-center gap-1.5 transition-colors text-xs font-medium ${
                                  hasLiked ? 'text-[#ec5b13] font-bold' : 'hover:text-[#ec5b13]'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                                <span>{post.likes || 0}</span>
                              </button>

                              <button
                                onClick={() => setExpandedPostId(isExpanded ? null : (post._id || null))}
                                className={`flex items-center gap-1.5 transition-colors text-xs ${
                                  isExpanded ? 'text-[#ec5b13] font-semibold' : 'hover:text-[#ec5b13]'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                                <span>{post.comments?.length || 0} {post.comments?.length === 1 ? 'Respuesta' : 'Respuestas'}</span>
                              </button>

                              <span className="text-xs text-gray-400 dark:text-on-surface-variant/60 ml-auto">
                                {new Date(post.createdAt || Date.now()).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-outline-variant space-y-3 animate-fadeIn">
                                <div className="space-y-2.5">
                                  {post.comments && post.comments.length > 0 ? (
                                    post.comments.map(c => (
                                      <div key={c.id} className="p-3.5 rounded-xl bg-gray-50 dark:bg-surface-container border border-gray-100 dark:border-outline-variant/60 text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-[#ec5b13]">@{c.author}</span>
                                          <span className="text-[11px] text-gray-400 dark:text-on-surface-variant font-medium">🐺 BUAP</span>
                                        </div>
                                        <p className="text-gray-700 dark:text-on-surface leading-relaxed">{c.content}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-gray-400 dark:text-on-surface-variant italic py-2">Aún no hay respuestas aquí.</p>
                                  )}
                                </div>

                                <div className="flex gap-2 pt-1">
                                  <input
                                    type="text"
                                    placeholder={forumUser ? "Escribe una respuesta..." : "Inicia sesión para responder..."}
                                    disabled={!forumUser}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && post._id && handleAddComment(post._id)}
                                    className="flex-1 bg-gray-50 dark:bg-surface border border-gray-300 dark:border-outline-variant rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#ec5b13] disabled:opacity-50 text-gray-800 dark:text-on-surface"
                                  />
                                  <button
                                    onClick={() => post._id && handleAddComment(post._id)}
                                    disabled={!forumUser}
                                    className="px-4 py-2 rounded-xl bg-[#ec5b13] hover:bg-orange-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
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

        {/* Modal Footer */}
        <footer className="p-3 bg-white dark:bg-surface-container-lowest border-t border-gray-200 dark:border-outline-variant text-center text-xs text-gray-400 dark:text-on-surface-variant shrink-0">
          <span>🔒 Privacidad Garantizada: Tu correo institucional se protege mediante hash criptográfico SHA-256.</span>
        </footer>
      </div>
    </div>
  );
};
