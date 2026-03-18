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
  // + Auto-select the Deposit selling plan tab on product pages
  window.addEventListener('smootify:product_loaded', () => {
    if (window.Webflow) window.Webflow.require('slider').redraw();

    // Click the "Deposit" tab in subscription swatches
    document.querySelectorAll('.sm-subscription-tab_option-group').forEach(tab => {
      if (tab.textContent.trim() === 'Deposit') tab.click();
    });
  });
});
