// -----------------------------------------
// MARKET BRIDGE — Connects Smootify Markets Switcher to Webflow Localization
// When user picks a country in the Smootify dropdown, redirect to the
// matching Webflow locale subdirectory. Smootify then auto-detects the
// locale from the URL and switches the Shopify market.
//
// Smootify dropdown structure:
//   .sm-country_dropdown-list
//     a.sm-country_dropdown-link
//       span.sm-country[data-prop="name"]  → country name (e.g. "Germany")
//       span.sm-currency-symbol[data-prop="currency-symbol"] → "€" / "£"
// -----------------------------------------

// Countries in the Europe market that should route to /de/
const DE_COUNTRIES = new Set([
  'germany', 'deutschland',
  'austria', 'österreich',
  'switzerland', 'schweiz',
]);

// Countries that stay on root / (English)
const EN_COUNTRIES = new Set([
  'united kingdom', 'uk',
]);

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

function getLocaleForCountry(countryName) {
  const name = countryName.toLowerCase().trim();
  if (EN_COUNTRIES.has(name)) return 'en';
  if (DE_COUNTRIES.has(name)) return 'de';
  // Default: any other EU country → German locale (since that's the only secondary)
  // If the currency is €, it's an EU country
  return 'de';
}

export function initMarketBridge() {
  const dropdownList = document.querySelector('.sm-country_dropdown-list');
  if (!dropdownList) return;

  dropdownList.addEventListener('click', (e) => {
    const link = e.target.closest('.sm-country_dropdown-link');
    if (!link) return;

    // Read the country name from the Smootify-populated span
    const nameEl = link.querySelector('.sm-country');
    if (!nameEl) return;

    const countryName = nameEl.textContent;
    const targetLocale = getLocaleForCountry(countryName);

    // Small delay to let Smootify process the market switch first
    setTimeout(() => redirectToLocale(targetLocale), 150);
  });
}

export function destroyMarketBridge() {}
