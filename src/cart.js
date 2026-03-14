// -----------------------------------------
// CONVOY — CART DRAWER (PreProduct PPcartSession)
// -----------------------------------------
// Uses Smootify's HTML shell (classes for styling) but powered
// entirely by PreProduct's PPcartSession API.
//
// Webflow attributes used:
//   data-cart="drawer"        – root wrapper (replaces <smootify-cart>)
//   data-cart="trigger"       – open button
//   data-cart="count"         – item count badge
//   data-cart="close"         – close button
//   data-cart="items"         – line-item container
//   data-cart="item-template" – single item (cloned per line)
//   data-cart="item-image"    – product image
//   data-cart="item-title"    – product title link
//   data-cart="item-options"  – variant options line
//   data-cart="item-quantity" – quantity display
//   data-cart="item-price"    – unit price
//   data-cart="item-total"    – line total
//   data-cart="increment"     – +1 button
//   data-cart="decrement"     – -1 button
//   data-cart="remove"        – remove item button
//   data-cart="total"         – cart total display
//   data-cart="checkout"      – checkout / submit button
//   data-cart="empty"         – empty-cart state wrapper
//   data-cart="error"         – error state wrapper
// -----------------------------------------

let els = {};
let templateEl = null;
let ppReady = false;
let listeners = [];

// ---- Helpers ----

function q(attr, scope) {
  return (scope || document).querySelector(`[data-cart="${attr}"]`);
}

function qAll(attr, scope) {
  return (scope || document).querySelectorAll(`[data-cart="${attr}"]`);
}

function getSession() {
  return window.PPcartSession;
}

function getItems() {
  const session = getSession();
  if (!session) return [];
  // PPcartSession stores items — try common accessors
  if (typeof session.getItems === 'function') return session.getItems();
  if (Array.isArray(session.items)) return session.items;
  if (session.cart && Array.isArray(session.cart.items)) return session.cart.items;
  return [];
}

function formatPrice(cents) {
  if (typeof cents === 'string') return cents;
  const value = (cents / 100).toFixed(2);
  return `£${value}`;
}

// ---- Open / Close ----

function openDrawer() {
  const dialog = els.drawer?.querySelector('dialog');
  if (!dialog) return;
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  // Pause Lenis if available
  if (window.__convoyLenis) window.__convoyLenis.stop();
}

function closeDrawer() {
  const dialog = els.drawer?.querySelector('dialog');
  if (!dialog) return;
  dialog.close();
  document.body.style.overflow = '';
  if (window.__convoyLenis) window.__convoyLenis.start();
}

// ---- Render ----

function updateCount() {
  const items = getItems();
  const total = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const countEl = q('count');
  if (countEl) countEl.textContent = total;
}

function updateTotal() {
  const items = getItems();
  const total = items.reduce((sum, item) => {
    const price = item.price || item.unit_price || 0;
    const qty = item.quantity || 1;
    return sum + (price * qty);
  }, 0);
  const totalEl = q('total');
  if (totalEl) totalEl.textContent = formatPrice(total);
}

function renderItems() {
  const container = els.items;
  if (!container || !templateEl) return;

  const items = getItems();

  // Clear existing rendered items (but keep template hidden)
  container.querySelectorAll('[data-cart-rendered]').forEach(el => el.remove());

  // Toggle empty state
  const emptyEl = q('empty');
  if (emptyEl) emptyEl.style.display = items.length ? 'none' : '';

  // Toggle items + footer visibility
  const footerEl = els.drawer?.querySelector('.sm-mini-cart_footer');
  if (footerEl) footerEl.style.display = items.length ? '' : 'none';
  if (container) container.style.display = items.length ? '' : 'none';

  items.forEach((item) => {
    const clone = templateEl.cloneNode(true);
    clone.setAttribute('data-cart-rendered', '');
    clone.removeAttribute('data-cart');
    clone.style.display = '';

    // Populate fields
    const img = clone.querySelector('[data-cart="item-image"]');
    if (img && item.image) {
      img.src = item.image;
      img.alt = item.title || '';
    }

    const title = clone.querySelector('[data-cart="item-title"]');
    if (title) {
      title.textContent = item.title || item.product_title || '';
      if (item.url) title.href = item.url;
    }

    const options = clone.querySelector('[data-cart="item-options"]');
    if (options) {
      const variantTitle = item.variant_title || item.variant || '';
      if (variantTitle && variantTitle !== 'Default Title') {
        options.textContent = variantTitle;
        options.style.display = '';
      } else {
        options.style.display = 'none';
      }
    }

    const qtyEl = clone.querySelector('[data-cart="item-quantity"]');
    if (qtyEl) qtyEl.textContent = item.quantity || 1;

    const priceEl = clone.querySelector('[data-cart="item-price"]');
    if (priceEl) priceEl.textContent = formatPrice(item.price || item.unit_price || 0);

    const totalEl = clone.querySelector('[data-cart="item-total"]');
    if (totalEl) {
      const lineTotal = (item.price || item.unit_price || 0) * (item.quantity || 1);
      totalEl.textContent = formatPrice(lineTotal);
    }

    const qtyInput = clone.querySelector('.sm-quantity-field');
    if (qtyInput) qtyInput.value = item.quantity || 1;

    // Store variant ID on action buttons for this item
    const variantId = item.variant_id || item.id;
    clone.querySelectorAll('[data-cart="increment"]').forEach(btn => btn.dataset.variantId = variantId);
    clone.querySelectorAll('[data-cart="decrement"]').forEach(btn => btn.dataset.variantId = variantId);
    clone.querySelectorAll('[data-cart="remove"]').forEach(btn => btn.dataset.variantId = variantId);

    container.appendChild(clone);
  });

  updateCount();
  updateTotal();
}

// ---- Actions ----

function handleIncrement(variantId) {
  const session = getSession();
  if (!session || !variantId) return;
  if (typeof session.increment === 'function') {
    session.increment(variantId);
  }
  renderItems();
}

function handleDecrement(variantId) {
  const session = getSession();
  if (!session || !variantId) return;
  if (typeof session.decrement === 'function') {
    session.decrement(variantId);
  }
  renderItems();
}

function handleRemove(variantId) {
  const session = getSession();
  if (!session || !variantId) return;
  // Try common remove methods
  if (typeof session.remove === 'function') {
    session.remove(variantId);
  } else if (typeof session.decrement === 'function') {
    // Fallback: decrement to 0
    const items = getItems();
    const item = items.find(i => (i.variant_id || i.id) == variantId);
    if (item) {
      for (let i = 0; i < (item.quantity || 1); i++) {
        session.decrement(variantId);
      }
    }
  }
  renderItems();
}

function handleCheckout() {
  const session = getSession();
  if (!session) return;
  if (typeof session.submit === 'function') {
    session.submit();
  }
}

// ---- Event delegation ----

function onDrawerClick(e) {
  const target = e.target.closest('[data-cart]');
  if (!target) return;

  const action = target.dataset.cart;
  const variantId = target.dataset.variantId;

  switch (action) {
    case 'trigger':
      e.preventDefault();
      openDrawer();
      break;
    case 'close':
      e.preventDefault();
      closeDrawer();
      break;
    case 'increment':
      e.preventDefault();
      handleIncrement(variantId);
      break;
    case 'decrement':
      e.preventDefault();
      handleDecrement(variantId);
      break;
    case 'remove':
      e.preventDefault();
      handleRemove(variantId);
      break;
    case 'checkout':
      e.preventDefault();
      handleCheckout();
      break;
  }
}

function onDialogBackdropClick(e) {
  // Close on backdrop click (click on <dialog> itself, not content)
  if (e.target.tagName === 'DIALOG') {
    closeDrawer();
  }
}

// ---- PPcartSession listener ----

function onPPCartReady() {
  ppReady = true;
  renderItems();

  // Listen for cart changes if the session supports it
  const session = getSession();
  if (session && typeof session.on === 'function') {
    session.on('change', renderItems);
  }
}

// ---- Init / Destroy ----

export function initCart(scope) {
  const root = scope || document;
  els.drawer = q('drawer', root) || q('drawer');

  if (!els.drawer) return;

  els.items = q('items', els.drawer);

  // Grab the template item and hide it
  templateEl = q('item-template', els.drawer);
  if (templateEl) {
    templateEl.style.display = 'none';
  }

  // Delegation on the drawer root
  els.drawer.addEventListener('click', onDrawerClick);
  listeners.push(['click', onDrawerClick, els.drawer]);

  // Dialog backdrop click to close
  const dialog = els.drawer.querySelector('dialog');
  if (dialog) {
    dialog.addEventListener('click', onDialogBackdropClick);
    listeners.push(['click', onDialogBackdropClick, dialog]);

    // Remove the Webflow form wrapper's default submit behaviour
    const form = dialog.querySelector('form');
    if (form) {
      const onSubmit = (e) => e.preventDefault();
      form.addEventListener('submit', onSubmit);
      listeners.push(['submit', onSubmit, form]);
    }
  }

  // If PPcartSession already available, render immediately
  if (window.PPcartSession) {
    onPPCartReady();
  }

  // Listen for PPcartSession launch
  window.addEventListener('ppCartSessionLaunched', onPPCartReady);
  listeners.push(['ppCartSessionLaunched', onPPCartReady, window]);

  // Initial render (show empty state if no session yet)
  renderItems();
}

export function destroyCart() {
  listeners.forEach(([evt, fn, target]) => {
    target.removeEventListener(evt, fn);
  });
  listeners = [];
  els = {};
  templateEl = null;
  ppReady = false;
}
