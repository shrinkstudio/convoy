// -----------------------------------------
// CONVOY — CART (Smootify Native)
// -----------------------------------------
// Smootify handles all cart logic: add, remove, quantities, checkout.
// This module only:
//   1. Syncs Lenis smooth scroll with cart open/close
//   2. Hides Smootify UI elements we don't use
// -----------------------------------------

let observer = null;

function hideSmootifyCruft(drawer) {
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

export function initCart(scope) {
  const root = scope || document;
  const drawer = root.querySelector('[data-cart="drawer"]')
    || document.querySelector('[data-cart="drawer"]');
  if (!drawer) return;

  hideSmootifyCruft(drawer);

  // Sync Lenis with cart dialog open/close
  const dialog = drawer.querySelector('dialog');
  if (dialog) {
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
}

export function destroyCart() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
