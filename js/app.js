document.addEventListener('DOMContentLoaded', () => {
  const current = document.body.dataset.page;
  document.querySelectorAll('.side-nav a, .bottom-nav a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if ((current === 'home' && href === 'index.html') || href.includes(current)) {
      link.classList.add('active');
    }
  });

  const optionCards = document.querySelectorAll('.option-card');
  const modePanels = document.querySelectorAll('[data-auth-mode-panel]');
  const setActiveMode = (mode) => {
    optionCards.forEach((item) => item.classList.toggle('active', item.dataset.mode === mode));
    modePanels.forEach((panel) => {
      panel.hidden = panel.dataset.authModePanel !== mode;
    });
  };

  optionCards.forEach((card) => {
    card.addEventListener('click', () => setActiveMode(card.dataset.mode || 'online'));
  });

  if (optionCards.length) {
    setActiveMode(document.querySelector('.option-card.active')?.dataset.mode || 'online');
  }

  document.querySelectorAll('[data-fill-search]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-fill-search') || '';
      const target = document.querySelector('[data-home-search]');
      if (target) {
        target.value = value;
        target.focus();
      }
    });
  });

  document.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-scroll-target');
      const target = id ? document.getElementById(id) : null;
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('[data-auth-launch]').forEach((button) => {
    button.addEventListener('click', () => {
      const authState = window.StageMusicAuth?.getState?.() || { isAuthenticated: false };
      window.location.href = authState.isAuthenticated ? 'inserir-cifra.html' : 'login-cifra.html';
    });
  });
});

// Instalação PWA segura para GitHub Pages, Firebase Hosting e servidores locais.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('Stage Music: service worker não registrado.', error);
    });
  });
}
