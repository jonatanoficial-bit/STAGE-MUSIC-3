(function () {
  const STORAGE_KEY = 'stage_music_auth';
  const REDIRECT_AFTER_LOGIN = 'stage_music_after_login';
  const safeParse = (value) => { try { return JSON.parse(value); } catch { return null; } };
  const guest = { isAuthenticated:false, mode:'guest', provider:null, uid:'', name:'', email:'' };
  const readState = () => Object.assign({}, guest, safeParse(localStorage.getItem(STORAGE_KEY)) || {});
  const writeState = (state) => {
    const next = Object.assign({}, guest, state || {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.StageMusicAuth.state = next;
    window.dispatchEvent(new CustomEvent('stage-music-auth-changed', { detail: next }));
    return next;
  };
  const firebaseConfig = window.STAGE_MUSIC_FIREBASE || {};
  const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
  let authRuntime = null;
  let restorePromise = null;

  async function getAuthRuntime() {
    if (authRuntime) return authRuntime;
    if (!isFirebaseConfigured) throw new Error('Firebase não configurado.');
    const [{ initializeApp, getApps }, { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged }] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js')
    ]);
    const app = getApps()[0] || initializeApp(firebaseConfig);
    const auth = getAuth(app);
    try { await setPersistence(auth, browserLocalPersistence); }
    catch (error) { console.warn('Persistência do login:', error?.message || error); }
    authRuntime = { app, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged };
    return authRuntime;
  }

  const stateFromUser = (user, provider) => ({
    isAuthenticated:true,
    mode:'online',
    provider,
    uid:user.uid || '',
    name:user.displayName || user.email?.split('@')[0] || 'Usuário',
    email:user.email || ''
  });

  async function restoreFirebaseSession() {
    if (!isFirebaseConfigured) return readState();
    if (restorePromise) return restorePromise;
    restorePromise = (async () => {
      try {
        const rt = await getAuthRuntime();
        return await new Promise((resolve) => {
          const stop = rt.onAuthStateChanged(rt.auth, (user) => {
            stop();
            if (user) {
              const provider = user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'firebase-email';
              resolve(writeState(stateFromUser(user, provider)));
              return;
            }
            const cached = readState();
            if (cached.mode === 'local') resolve(cached);
            else resolve(writeState(guest));
          });
        });
      } catch (error) {
        console.warn('Restauração da sessão Firebase:', error?.message || error);
        return readState();
      }
    })().finally(() => {
      window.dispatchEvent(new CustomEvent('stage-music-auth-ready', { detail: readState() }));
    });
    return restorePromise;
  }

  const redirectToLogin = (targetPath) => {
    if (targetPath) sessionStorage.setItem(REDIRECT_AFTER_LOGIN, targetPath);
    window.location.href = 'login-cifra.html';
    return false;
  };

  const authApi = {
    state: readState(),
    isFirebaseConfigured,
    getState() { return readState(); },
    ready() { return restoreFirebaseSession(); },
    async ensureAuthenticated(targetPath) {
      const cached = readState();
      if (cached.isAuthenticated) {
        if (cached.mode === 'online' && isFirebaseConfigured) await restoreFirebaseSession();
        return !!readState().isAuthenticated;
      }
      const restored = await restoreFirebaseSession();
      if (restored?.isAuthenticated) return true;
      return redirectToLogin(targetPath);
    },
    async loginLocal() {
      return writeState({ isAuthenticated:true, mode:'local', provider:'device', uid:'local-device', name:'Modo local', email:'offline@stage-music.local' });
    },
    async loginDemoEmail(email) {
      const clean = (email || '').trim();
      const name = clean.split('@')[0] || 'Usuário';
      return writeState({ isAuthenticated:true, mode:'online', provider:'demo', uid:`demo_${name}`, name:name.charAt(0).toUpperCase() + name.slice(1), email:clean });
    },
    async logout() {
      if (isFirebaseConfigured) {
        try { const rt = await getAuthRuntime(); await rt.signOut(rt.auth); }
        catch (error) { console.warn('Logout Firebase:', error?.message || error); }
      }
      restorePromise = null;
      return writeState(guest);
    },
    requireAuth(targetPath) {
      const state = readState();
      if (state.isAuthenticated) return true;
      this.ensureAuthenticated(targetPath).catch(() => redirectToLogin(targetPath));
      return false;
    },
    consumeRedirect(defaultPath) {
      const redirect = sessionStorage.getItem(REDIRECT_AFTER_LOGIN);
      sessionStorage.removeItem(REDIRECT_AFTER_LOGIN);
      return redirect || defaultPath || 'inserir-cifra.html';
    },
    async loginWithFirebaseEmail(email, password) {
      const rt = await getAuthRuntime();
      let result;
      try { result = await rt.signInWithEmailAndPassword(rt.auth, email, password); }
      catch (error) {
        if (['auth/invalid-credential', 'auth/user-not-found'].includes(error?.code)) {
          try {
            result = await rt.createUserWithEmailAndPassword(rt.auth, email, password);
            const displayName = email.split('@')[0];
            await rt.updateProfile(result.user, { displayName });
          } catch (createError) {
            if (createError?.code === 'auth/email-already-in-use') throw new Error('A conta existe, mas a senha está incorreta.');
            throw createError;
          }
        } else throw error;
      }
      restorePromise = Promise.resolve(writeState(stateFromUser(result.user, 'firebase-email')));
      return restorePromise;
    },
    async loginWithGoogle() {
      const rt = await getAuthRuntime();
      const provider = new rt.GoogleAuthProvider();
      const result = await rt.signInWithPopup(rt.auth, provider);
      restorePromise = Promise.resolve(writeState(stateFromUser(result.user, 'google')));
      return restorePromise;
    },
    restoreFirebaseSession
  };

  window.StageMusicAuth = authApi;

  document.addEventListener('DOMContentLoaded', async () => {
    if (isFirebaseConfigured) authApi.ready().catch(() => {});
    document.querySelectorAll('[data-auth-logout]').forEach((button) => button.addEventListener('click', async () => {
      await authApi.logout();
      window.location.href = 'login-cifra.html';
    }));
    document.querySelectorAll('[data-auth-guard]').forEach((link) => link.addEventListener('click', async (event) => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (!authApi.getState().isAuthenticated) {
        event.preventDefault();
        const ok = await authApi.ensureAuthenticated(href);
        if (ok) window.location.href = href;
      }
    }));
    const updateBadges = () => {
      const state = authApi.getState();
      document.querySelectorAll('[data-session-badge]').forEach((badge) => {
        badge.textContent = state.isAuthenticated ? `${state.mode === 'local' ? 'Modo local ativo' : 'Conta ativa'} • ${state.name || state.email}` : 'Sem sessão ativa';
      });
    };
    updateBadges();
    window.addEventListener('stage-music-auth-changed', updateBadges);
  });
})();
