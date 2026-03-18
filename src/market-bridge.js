// -----------------------------------------
// MARKET BRIDGE — Connects Smootify Markets Switcher to Webflow Localization
//
// Two jobs:
// 1. On page load, force Smootify market to match the URL locale
//    (overrides Smootify's geo-detection)
// 2. On dropdown click, redirect to the correct Webflow locale
//
// Smootify dropdown structure:
//   .sm-country_dropdown-list
//     a.sm-country_dropdown-link
//       span.sm-country[data-prop="name"]  → country name (translated!)
//       span.sm-currency-symbol[data-prop="currency-symbol"] → "€" / "£"
// -----------------------------------------

function stripLocalePrefix(path) {
  if (path.startsWith('/de/')) return path.slice(3);
  if (path === '/de') return '/';
  return path;
}

function getCurrentLocale() {
  const path = window.location.pathname;
  if (path.startsWith('/de/') || path === '/de') return 'de';
  return 'en';
}

function redirectToLocale(targetLocale) {
  const currentLocale = getCurrentLocale();
  if (targetLocale === currentLocale) return;

  const basePath = stripLocalePrefix(window.location.pathname);
  const newPath = targetLocale === 'de'
    ? '/de' + (basePath === '/' ? '/' : basePath)
    : basePath;

  window.location.href = newPath + window.location.search;
}

// --- Job 1: Force Smootify market to match URL locale on load ---
function syncMarketOnLoad() {
  const locale = getCurrentLocale();
  document.addEventListener('smootify:loaded', () => {
    if (typeof Smootify === 'undefined') return;

    if (locale === 'de') {
      Smootify.changeCountryByIsoCode('DE');
      Smootify.changeMarketLanguage('DE');
    } else {
      Smootify.changeCountryByIsoCode('GB');
      Smootify.changeMarketLanguage('EN');
    }
  }, { once: true });
}

// --- Job 2: Dropdown click → redirect to correct locale ---
function bindDropdownSwitcher() {
  const dropdownList = document.querySelector('.sm-country_dropdown-list');
  if (!dropdownList) return;

  dropdownList.addEventListener('click', (e) => {
    const link = e.target.closest('.sm-country_dropdown-link');
    if (!link) return;

    const currencyEl = link.querySelector('.sm-currency-symbol');
    if (!currencyEl) return;

    const symbol = currencyEl.textContent.trim();
    const targetLocale = symbol === '£' ? 'en' : 'de';

    if (typeof Smootify !== 'undefined' && Smootify.changeMarketLanguage) {
      Smootify.changeMarketLanguage(targetLocale === 'de' ? 'DE' : 'EN');
    }

    setTimeout(() => redirectToLocale(targetLocale), 150);
  });
}

export function initMarketBridge() {
  syncMarketOnLoad();
  bindDropdownSwitcher();
}

export function destroyMarketBridge() {}
