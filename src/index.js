// -----------------------------------------
// CONVOY — Single entry point
// Import all scripts here in the order they should run.
// -----------------------------------------

// Hide page content until Smootify is ready — fade in cleanly
const readyStyle = document.createElement('style');
readyStyle.textContent = '.page-main{opacity:0;transition:opacity .3s ease}.page-main.sm-ready{opacity:1}subscription-swatches{position:absolute!important;opacity:0!important;pointer-events:none!important;height:0!important;overflow:hidden!important}';
(document.head || document.documentElement).appendChild(readyStyle);

const reveal = () => {
  window.scrollTo(0, 0);
  if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
  document.querySelector('.page-main')?.classList.add('sm-ready');
};
window.addEventListener('smootify:loaded', reveal, { once: true });
setTimeout(reveal, 2000);

// Fade out page on internal navigation
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') return;
  const main = document.querySelector('.page-main');
  if (!main) return;
  e.preventDefault();
  main.classList.remove('sm-ready');
  setTimeout(() => { window.location.href = href; }, 300);
});

// Core init system — imports and registers all components
import './transitions.js';

// Smootify post-load fixes
document.addEventListener('DOMContentLoaded', () => {
  // Hide Smootify debugger — runs async so we observe for it
  const removeDebugger = () => {
    document.querySelectorAll('.sm-debugger, smootify-debugger, [class*="smootify-info"], [class*="sm-info"]').forEach(el => el.remove());
  };
  removeDebugger();
  new MutationObserver((_, obs) => {
    const found = document.querySelector('.sm-debugger, smootify-debugger, [class*="smootify-info"], [class*="sm-info"]');
    if (found) { removeDebugger(); obs.disconnect(); }
  }).observe(document.body, { childList: true, subtree: true });

  // Redraw Webflow sliders after Smootify injects product media slides
  window.addEventListener('smootify:product_loaded', () => {
    if (window.Webflow) window.Webflow.require('slider').redraw();
  });

  // Auto-select Deposit selling plan — watch for Smootify to hydrate the tabs
  // Strip hash jumps caused by Webflow tab anchors inside subscription swatches
  const cleanUrl = window.location.href.split('#')[0];
  window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('w-tabs')) {
      history.replaceState(null, '', cleanUrl);
    }
  });

  // Nuke any href on subscription tab links so they can't trigger scroll
  const nukeTabHrefs = () => {
    document.querySelectorAll('subscription-swatches a[href*="w-tabs"]').forEach(a => {
      a.removeAttribute('href');
    });
  };

  // Handle all subscription-swatches on the page (product page + listing cards)
  document.querySelectorAll('subscription-swatches').forEach((swatchEl) => {
    new MutationObserver((_, obs) => {
      const tabs = swatchEl.querySelectorAll('.sm-subscription-tab_option-group');
      let depositTab = null;
      tabs.forEach(t => { if (t.textContent.trim() === 'Deposit') depositTab = t; });
      if (!depositTab) return;

      obs.disconnect();
      nukeTabHrefs();

      setTimeout(() => {
        const click = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        depositTab.dispatchEvent(click);

        setTimeout(() => {
          const label = swatchEl.querySelector('.sm-subscription-tab_pane.w--tab-active .sm-radio-label');
          if (label) label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          // Final cleanup — strip any hash that snuck through
          if (window.location.hash) history.replaceState(null, '', cleanUrl);
        }, 200);
      }, 100);
    }).observe(swatchEl, { childList: true, subtree: true, characterData: true });
  });
});
