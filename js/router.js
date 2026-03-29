
'use strict';

const Router = (() => {
  const routes = {};
  let _current = null;

  function navigate(hash) {
    window.location.hash = hash;
  }

  function register(hash, fn) {
    routes[hash] = fn;
  }

  function resolve() {
    const hash = window.location.hash.replace('#','') || 'dashboard';

    // Guard: if not onboarded, always go to onboarding
    if (!Store.isOnboarded() && hash !== 'onboarding') {
      navigate('onboarding');
      return;
    }
    if (Store.isOnboarded() && hash === 'onboarding') {
      navigate('dashboard');
      return;
    }

    if (_current === hash) { render(hash); return; }
    _current = hash;
    render(hash);
    updateNav(hash);
  }

  function render(hash) {
    const fn = routes[hash];
    if (fn) fn();
  }

  function updateNav(hash) {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === hash);
    });
  }

  window.addEventListener('hashchange', resolve);

  return { navigate, register, resolve, updateNav };
})();

window.Router = Router;
