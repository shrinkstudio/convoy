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
let selectedVariant = null; // Tracks Smootify's currently selected variant

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

// ---- Add to Cart (Product Page → PPcartSession) ----

function getSelectedVariantFromSmootify(button) {
  // Walk up to find the smootify-product wrapper
  const product = button.closest('smootify-product');
  if (!product) return null;

  // Try Smootify's custom element API (may expose product/variant data)
  if (product.selectedVariant) return product.selectedVariant;
  if (product.variant) return product.variant;

  // Try reading from the add-to-cart form's hidden input
  const addToCart = button.closest('smootify-add-to-cart');
  if (addToCart) {
    // Smootify may store the selected variant ID in a hidden input or property
    if (addToCart.selectedVariant) return addToCart.selectedVariant;
    if (addToCart.variantId) return { id: addToCart.variantId };

    const hiddenInput = addToCart.querySelector('input[name="id"], input[name="variant_id"]');
    if (hiddenInput && hiddenInput.value) {
      return { id: hiddenInput.value };
    }
  }

  // Use tracked variant from smootify:variant_changed event
  if (selectedVariant) return selectedVariant;

  return null;
}

function handleAddToCart(button) {
  const session = getSession();
  const variant = getSelectedVariantFromSmootify(button);

  // Debug logging (remove once confirmed working)
  console.log('[CONVOY Cart] Add to cart clicked');
  console.log('[CONVOY Cart] PPcartSession:', session ? 'ready' : 'NOT ready');
  console.log('[CONVOY Cart] Selected variant:', variant);

  // Also log what Smootify exposes on the product element
  const product = button.closest('smootify-product');
  if (product) {
    console.log('[CONVOY Cart] smootify-product keys:', Object.keys(product));
    console.log('[CONVOY Cart] smootify-product.product:', product.product);
    console.log('[CONVOY Cart] smootify-product.selectedVariant:', product.selectedVariant);
    console.log('[CONVOY Cart] smootify-product.variant:', product.variant);
  }
  const addToCart = button.closest('smootify-add-to-cart');
  if (addToCart) {
    console.log('[CONVOY Cart] smootify-add-to-cart keys:', Object.keys(addToCart));
    console.log('[CONVOY Cart] smootify-add-to-cart.selectedVariant:', addToCart.selectedVariant);
    console.log('[CONVOY Cart] smootify-add-to-cart.variantId:', addToCart.variantId);
  }

  if (!session) {
    console.warn('[CONVOY Cart] PPcartSession not available — is PreProduct script loaded?');
    return;
  }

  if (!variant || !variant.id) {
    console.warn('[CONVOY Cart] No variant selected');
    return;
  }

  // Build the item for PPcartSession
  const item = {
    variant_id: variant.id,
    quantity: 1,
    // Include product info for cart display
    title: variant.product_title || variant.title || product?.product?.title || '',
    price: variant.price || 0,
    image: variant.image?.src || variant.featured_image?.src || product?.product?.images?.[0]?.src || '',
    variant_title: variant.title || '',
    url: product?.product?.url || window.location.pathname,
  };

  console.log('[CONVOY Cart] Pushing to PPcartSession:', item);

  // Push to PreProduct cart
  if (typeof session.push === 'function') {
    session.push(item);
  } else if (typeof session.forcePush === 'function') {
    session.forcePush(item);
  }

  // Re-render and open drawer
  renderItems();
  openDrawer();
}

function onSmootifyVariantChanged(e) {
  // Track the selected variant from Smootify's event
  if (e.detail?.variant) {
    selectedVariant = e.detail.variant;
  } else if (e.detail) {
    selectedVariant = e.detail;
  }
  console.log('[CONVOY Cart] Variant changed:', selectedVariant);
}

// ---- Event delegation ----

function onCartClick(e) {
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
    case 'add':
      e.preventDefault();
      e.stopPropagation(); // Prevent Smootify from also handling this
      handleAddToCart(target);
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

  // Document-level delegation for ALL data-cart actions
  // (covers both drawer clicks AND product page add-to-cart button)
  document.addEventListener('click', onCartClick);
  listeners.push(['click', onCartClick, document]);

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

  // Also prevent Smootify's add-to-cart form from submitting to Shopify
  const productForms = root.querySelectorAll('smootify-add-to-cart form');
  productForms.forEach(form => {
    const onSubmit = (e) => {
      e.preventDefault();
      // Find the add button and trigger our handler
      const addBtn = form.querySelector('[data-cart="add"]');
      if (addBtn) handleAddToCart(addBtn);
    };
    form.addEventListener('submit', onSubmit);
    listeners.push(['submit', onSubmit, form]);
  });

  // Track Smootify variant changes
  document.addEventListener('smootify:variant_changed', onSmootifyVariantChanged);
  listeners.push(['smootify:variant_changed', onSmootifyVariantChanged, document]);

  // Also try the more common event name patterns
  document.addEventListener('variant:changed', onSmootifyVariantChanged);
  listeners.push(['variant:changed', onSmootifyVariantChanged, document]);

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
  selectedVariant = null;
}
