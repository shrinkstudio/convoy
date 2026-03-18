// -----------------------------------------
// MARKET BRIDGE — Connects Smootify Markets Switcher to Webflow Localization
// When user picks a country in the Smootify dropdown, redirect to the
// matching Webflow locale subdirectory. Smootify then auto-detects the
// locale from the URL and switches the Shopify market.
//
// Smootify dropdown structure:
//   .sm-country_dropdown-list
//     a.sm-country_dropdown-link
//       span.sm-country[data-prop="name"]  → country name (translated!)
//       span.sm-currency-symbol[data-prop="currency-symbol"] → "€" / "£"
//
// We match on currency symbol (language-independent) rather than country
// name, since Smootify translates names based on current market language.
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

export function initMarketBridge() {
  const dropdownList = document.querySelector('.sm-country_dropdown-list');
  if (!dropdownList) return;

  dropdownList.addEventListener('click', (e) => {
    const link = e.target.closest('.sm-country_dropdown-link');
    if (!link) return;

    const currencyEl = link.querySelector('.sm-currency-symbol');
    if (!currencyEl) return;

    const symbol = currencyEl.textContent.trim();
    // £ = UK/English, € (or anything else) = EU/German
    const targetLocale = symbol === '£' ? 'en' : 'de';

    // Tell Smootify to switch language before we redirect
    // so it doesn't cache the wrong language across the page load
    if (typeof Smootify !== 'undefined' && Smootify.changeMarketLanguage) {
      Smootify.changeMarketLanguage(targetLocale === 'de' ? 'DE' : 'EN');
    }

    // Small delay to let Smootify process, then redirect
    setTimeout(() => redirectToLocale(targetLocale), 150);
  });
}

export function destroyMarketBridge() {}
