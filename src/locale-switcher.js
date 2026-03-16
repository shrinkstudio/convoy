// -----------------------------------------
// CONVOY — LOCALE SWITCHER
// Handles active state on Webflow-built locale switcher.
// Webflow elements use [data-locale-switcher] with
// [data-locale="en"] / [data-locale="de"] link blocks.
// -----------------------------------------

export function initLocaleSwitcher(scope) {
  const switcher = (scope || document).querySelector('[data-locale-switcher]');
  if (!switcher) return;

  const path = window.location.pathname;
  const isDE = path.startsWith('/de/') || path === '/de';
  const currentCode = isDE ? 'de' : 'en';

  switcher.querySelectorAll('[data-locale]').forEach(btn => {
    if (btn.dataset.locale === currentCode) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
  });

  // Inject flag SVGs into empty flag containers
  const flags = {
    en: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="16" height="12"><clipPath id="gb-s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="gb-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#gb-s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#gb-t)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>`,
    de: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" width="16" height="12"><rect width="5" height="3" fill="#FFCE00"/><rect width="5" height="2" fill="#DD0000"/><rect width="5" height="1" fill="#000"/></svg>`,
  };

  switcher.querySelectorAll('[data-locale-flag]').forEach(el => {
    const code = el.dataset.localeFlag;
    if (flags[code] && !el.innerHTML.trim()) {
      el.innerHTML = flags[code];
    }
  });
}

export function destroyLocaleSwitcher() {}
