// -----------------------------------------
// CONVOY — Single entry point
// Import all scripts here in the order they should run.
// -----------------------------------------

// Theme flash prevention — runs immediately at bundle load time
import './theme-toggle.js';

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
  // Prevent hash jumps from subscription swatch tab clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.sm-subscription-tab_option-group');
    if (link) e.preventDefault();
  }, true);

  // Handle all subscription-swatches on the page (product page + listing cards)
  document.querySelectorAll('subscription-swatches').forEach((swatchEl) => {
    new MutationObserver((_, obs) => {
      const tabs = swatchEl.querySelectorAll('.sm-subscription-tab_option-group');
      let depositTab = null;
      tabs.forEach(t => { if (t.textContent.trim() === 'Deposit') depositTab = t; });
      if (!depositTab) return;

      obs.disconnect();

      setTimeout(() => {
        const click = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        depositTab.dispatchEvent(click);

        setTimeout(() => {
          const label = swatchEl.querySelector('.sm-subscription-tab_pane.w--tab-active .sm-radio-label');
          if (label) label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }, 200);
      }, 100);
    }).observe(swatchEl, { childList: true, subtree: true, characterData: true });
  });
});
