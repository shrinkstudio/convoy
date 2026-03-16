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
  // Hide Smootify debugger
  document.querySelectorAll('.sm-debugger, smootify-debugger').forEach(el => el.remove());

  // Redraw Webflow sliders after Smootify injects product media slides
  window.addEventListener('smootify:product_loaded', () => {
    if (window.Webflow) window.Webflow.require('slider').redraw();
  });
});
