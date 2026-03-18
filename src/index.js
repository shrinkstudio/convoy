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
  const swatchEl = document.querySelector('subscription-swatches');
  if (swatchEl) {
    new MutationObserver((_, obs) => {
      // Find the Deposit tab after Smootify populates it
      const tabs = swatchEl.querySelectorAll('.sm-subscription-tab_option-group');
      let depositTab = null;
      tabs.forEach(t => { if (t.textContent.trim() === 'Deposit') depositTab = t; });
      if (!depositTab) return;

      obs.disconnect();

      // 1. Click the Deposit tab to switch Webflow tabs
      depositTab.click();

      // 2. Find and check the radio inside the Deposit tab pane
      setTimeout(() => {
        const radio = swatchEl.querySelector('.sm-subscription-tab_pane.w--tab-active input[type="radio"]');
        if (radio && !radio.checked) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          radio.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 100);
    }).observe(swatchEl, { childList: true, subtree: true, characterData: true });
  }
});
