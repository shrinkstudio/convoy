// -----------------------------------------
// CONVOY — CART (Smootify Native + Dialog Bridge)
// -----------------------------------------
// Smootify handles all cart logic: add, remove, quantities, checkout.
// CONVOY uses a <dialog> for the cart drawer instead of Smootify's
// default dropdown. This module bridges that gap:
//   1. Opens/closes the dialog (Smootify doesn't manage dialogs natively)
//   2. Syncs Lenis smooth scroll with cart state
//   3. Hides Smootify UI elements we don't use
// -----------------------------------------

let dialog = null;
let drawer = null;
let observer = null;
let listeners = [];

// ---- Dialog open/close ----

function openCart() {
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();
  document.body.style.overflow = 'hidden';
  if (window.__convoyLenis) window.__convoyLenis.stop();
}

function closeCart() {
  if (!dialog) return;
  if (dialog.open) dialog.close();
  document.body.style.overflow = '';
  if (window.__convoyLenis) window.__convoyLenis.start();
}

// ---- Hide unused Smootify elements ----

function hideSmootifyCruft() {
  if (!drawer) return;
  const selectors = [
    'urgent-cart-countdown',
    '.sm-urgent-cart-countdown',
    'free-shipping-bar',
    '.sm-free-shipping-bar',
    '.sm-mini-cart_header',
  ];

  selectors.forEach(sel => {
    const el = drawer.querySelector(sel);
    if (el) el.style.display = 'none';
  });

  // Hide "View Cart" link — no cart page for V1
  const viewCartLink = drawer.querySelector('.sm-button.sm-button--outline');
  if (viewCartLink) viewCartLink.style.display = 'none';
}

// ---- Init / Destroy ----

function listen(target, evt, fn, opts) {
  target.addEventListener(evt, fn, opts);
  listeners.push([target, evt, fn, opts]);
}

export function initCart(scope) {
  const root = scope || document;
  drawer = root.querySelector('[data-cart="drawer"]')
    || document.querySelector('[data-cart="drawer"]');
  if (!drawer) return;

  dialog = drawer.querySelector('dialog');
  if (!dialog) return;

  hideSmootifyCruft();

  // Cart trigger (nav icon) — open the dialog
  const triggers = document.querySelectorAll('[data-cart="trigger"]');
  triggers.forEach(btn => {
    listen(btn, 'click', (e) => {
      e.preventDefault();
      openCart();
    });
  });

  // Close button inside cart
  const closeBtns = drawer.querySelectorAll('[data-cart="close"], [data-action="close-cart"]');
  closeBtns.forEach(btn => {
    listen(btn, 'click', (e) => {
      e.preventDefault();
      closeCart();
    });
  });

  // Backdrop click to close
  listen(dialog, 'click', (e) => {
    if (e.target === dialog) closeCart();
  });

  // Open cart when Smootify adds an item
  listen(document, 'smootify:item_added', () => openCart());
  listen(document, 'smootify:cart_updated', () => openCart());

  // Sync Lenis if dialog is opened/closed by other means
  observer = new MutationObserver(() => {
    if (dialog.open) {
      document.body.style.overflow = 'hidden';
      if (window.__convoyLenis) window.__convoyLenis.stop();
    } else {
      document.body.style.overflow = '';
      if (window.__convoyLenis) window.__convoyLenis.start();
    }
  });
  observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
}

export function destroyCart() {
  listeners.forEach(([target, evt, fn, opts]) => target.removeEventListener(evt, fn, opts));
  listeners = [];
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  dialog = null;
  drawer = null;
}
