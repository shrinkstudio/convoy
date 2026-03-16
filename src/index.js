// -----------------------------------------
// CONVOY — Single entry point
// Import all scripts here in the order they should run.
// -----------------------------------------

// Theme flash prevention — runs immediately at bundle load time
import './theme-toggle.js';

// Core init system — imports and registers all components
import './transitions.js';

// Hide Smootify debugger
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sm-debugger, smootify-debugger').forEach(el => el.remove());
});
