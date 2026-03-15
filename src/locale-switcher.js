// -----------------------------------------
// CONVOY — LOCALE SWITCHER
// Injects EN/DE toggle into nav with flag SVGs
// Works with Webflow Localization URL structure
// -----------------------------------------

const LOCALES = [
  {
    code: 'en',
    label: 'EN',
    prefix: '',
    flag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="16" height="12"><clipPath id="gb-s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="gb-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#gb-s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#gb-t)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>`,
  },
  {
    code: 'de',
    label: 'DE',
    prefix: '/de',
    flag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" width="16" height="12"><rect width="5" height="3" fill="#FFCE00"/><rect width="5" height="2" fill="#DD0000"/><rect width="5" height="1" fill="#000"/></svg>`,
  },
];

let switcherEl = null;

function getCurrentLocale() {
  const path = window.location.pathname;
  for (const locale of LOCALES) {
    if (locale.prefix && path.startsWith(locale.prefix + '/')) return locale.code;
    if (locale.prefix && path === locale.prefix) return locale.code;
  }
  return 'en';
}

function getLocalizedPath(targetLocale) {
  const path = window.location.pathname;
  const current = LOCALES.find(l => l.code === getCurrentLocale());
  const target = LOCALES.find(l => l.code === targetLocale);

  // Strip current locale prefix
  let basePath = path;
  if (current.prefix && basePath.startsWith(current.prefix)) {
    basePath = basePath.slice(current.prefix.length) || '/';
  }

  // Add target locale prefix
  if (target.prefix) {
    return target.prefix + (basePath === '/' ? '/' : basePath);
  }
  return basePath;
}

function buildSwitcher() {
  const wrap = document.createElement('div');
  wrap.className = 'locale-switcher';
  wrap.setAttribute('data-locale-switcher', '');

  const currentCode = getCurrentLocale();

  LOCALES.forEach(locale => {
    const btn = document.createElement('a');
    btn.className = 'locale-switcher__btn';
    if (locale.code === currentCode) btn.classList.add('is-active');
    btn.href = getLocalizedPath(locale.code);
    btn.setAttribute('data-locale', locale.code);
    btn.setAttribute('aria-label', `Switch to ${locale.label}`);

    // Flag
    const flag = document.createElement('span');
    flag.className = 'locale-switcher__flag';
    flag.innerHTML = locale.flag;
    btn.appendChild(flag);

    // Label
    const label = document.createTextNode(locale.label);
    btn.appendChild(label);

    wrap.appendChild(btn);
  });

  return wrap;
}

export function initLocaleSwitcher(scope) {
  const nav = (scope || document).querySelector('.nav');
  if (!nav) return;

  // Don't double-inject
  if (nav.querySelector('[data-locale-switcher]')) return;

  // Insert into .nav-cta-wrapper, before the cart component
  const ctaWrapper = nav.querySelector('.nav-cta-wrapper');

  switcherEl = buildSwitcher();

  if (ctaWrapper) {
    ctaWrapper.insertBefore(switcherEl, ctaWrapper.firstChild);
  } else {
    nav.appendChild(switcherEl);
  }
}

export function destroyLocaleSwitcher() {
  if (switcherEl) {
    switcherEl.remove();
    switcherEl = null;
  }
}
