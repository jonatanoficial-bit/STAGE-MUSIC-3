(function () {
  const STORAGE_KEY = 'stage_music_auth';
  const REDIRECT_AFTER_LOGIN = 'stage_music_after_login';

  const safeParse = (value) => {
    try { return JSON.parse(value); } catch { return null; }
  };

  const readState = () => safeParse(localStorage.getItem(STORAGE_KEY)) || {
    isAuthenticated: false,
    mode: 'guest',
    provider: null,
    name: '',
    email: ''
  };

  const writeState = (state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.StageMusicAuth.state = state;
  };

  const firebaseConfig = window.STAGE_MUSIC_FIREBASE || {};
  const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);

  const authApi = {
    state: readState(),
    isFirebaseConfigured,
    getState() { return readState(); },
    async loginLocal() {
      const state = {
        isAuthenticated: true,
        mode: 'local',
        provider: 'device',
        name: 'Modo local',
        email: 'offline@stage-music.local'
      };
      writeState(state);
      return state;
    },
    async loginDemoEmail(email) {
      const cleanEmail = (email || '').trim();
      const inferredName = cleanEmail.split('@')[0] || 'Usuário';
      const state = {
        isAuthenticated: true,
        mode: 'online',
        provider: 'demo',
        name: inferredName.charAt(0).toUpperCase() + inferredName.slice(1),
        email: cleanEmail
      };
      writeState(state);
      return state;
    },
    logout() {
      const state = { isAuthenticated: false, mode: 'guest', provider: null, name: '', email: '' };
      writeState(state);
      return state;
    },
    requireAuth(targetPath) {
      const state = readState();
      if (state.isAuthenticated) return true;
      if (targetPath) sessionStorage.setItem(REDIRECT_AFTER_LOGIN, targetPath);
      window.location.href = 'login-cifra.html';
      return false;
    },
    consumeRedirect(defaultPath) {
      const redirect = sessionStorage.getItem(REDIRECT_AFTER_LOGIN);
      sessionStorage.removeItem(REDIRECT_AFTER_LOGIN);
      return redirect || defaultPath || 'inserir-cifra.html';
    },
    async loginWithFirebaseEmail(email, password) {
      if (!isFirebaseConfigured) throw new Error('Firebase não configurado.');
      const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
      const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
      const app = getApps()[0] || initializeApp(firebaseConfig);
      const auth = getAuth(app);
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;
        const state = { isAuthenticated: true, mode: 'online', provider: 'firebase-email', name: user.displayName || user.email.split('@')[0], email: user.email || email };
        writeState(state);
        return state;
      } catch (error) {
        if (error && error.code === 'auth/user-not-found') {
          const created = await createUserWithEmailAndPassword(auth, email, password);
          const newUser = created.user;
          const displayName = email.split('@')[0];
          await updateProfile(newUser, { displayName });
          const state = { isAuthenticated: true, mode: 'online', provider: 'firebase-email', name: displayName, email: newUser.email || email };
          writeState(state);
          return state;
        }
        throw error;
      }
    },
    async loginWithGoogle() {
      if (!isFirebaseConfigured) throw new Error('Firebase não configurado.');
      const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
      const { getAuth, signInWithPopup, GoogleAuthProvider } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
      const app = getApps()[0] || initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const state = { isAuthenticated: true, mode: 'online', provider: 'google', name: user.displayName || 'Usuário Google', email: user.email || '' };
      writeState(state);
      return state;
    }
  };

  window.StageMusicAuth = authApi;

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-auth-logout]').forEach((button) => {
      button.addEventListener('click', () => {
        authApi.logout();
        window.location.href = 'login-cifra.html';
      });
    });

    document.querySelectorAll('[data-auth-guard]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href) return;
        const state = authApi.getState();
        if (!state.isAuthenticated) {
          event.preventDefault();
          sessionStorage.setItem(REDIRECT_AFTER_LOGIN, href);
          window.location.href = 'login-cifra.html';
        }
      });
    });

    const state = authApi.getState();
    document.querySelectorAll('[data-session-badge]').forEach((badge) => {
      badge.textContent = state.isAuthenticated
        ? `${state.mode === 'local' ? 'Modo local ativo' : 'Conta ativa'} • ${state.name || state.email}`
        : 'Sem sessão ativa';
    });
  });
})();
