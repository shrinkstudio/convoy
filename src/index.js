// -----------------------------------------
// CONVOY — Single entry point
// Import all scripts here in the order they should run.
// -----------------------------------------

// Theme flash prevention — runs immediately at bundle load time
import './theme-toggle.js';

// Prevent all Smootify hydration flashes — hide product content until ready,
// then fade in. Nav/footer stay visible so the page doesn't feel blank.
const readyStyle = document.createElement('style');
readyStyle.textContent = [
  'subscription-swatches{position:absolute!important;opacity:0!important;pointer-events:none!important;height:0!important;overflow:hidden!important}',
  'smootify-product{opacity:0;transition:opacity .3s ease}',
  'smootify-product.sm-ready{opacity:1}',
].join('');
(document.head || document.documentElement).appendChild(readyStyle);

// Reveal each product card once Smootify has populated it
window.addEventListener('smootify:product_loaded', () => {
  document.querySelectorAll('smootify-product:not(.sm-ready)').forEach(el => {
    // Check if title or price has been injected
    const hasContent = el.querySelector('[product="title"]')?.textContent?.trim()
      || el.querySelector('[data-prop="price"]')?.textContent?.trim();
    if (hasContent) el.classList.add('sm-ready');
  });
});
// Fallback — reveal everything after 4s in case event doesn't fire
setTimeout(() => {
  document.querySelectorAll('smootify-product:not(.sm-ready)').forEach(el => el.classList.add('sm-ready'));
}, 4000);

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
