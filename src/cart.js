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
let itemDisplayData = {};   // Local cache of product display info keyed by variant ID

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
  // PPcartSession.items is the confirmed accessor
  const items = session.items;
  if (Array.isArray(items)) {
    if (items.length > 0) {
      console.log('[CONVOY Cart] Items found:', items.length, items);
      console.log('[CONVOY Cart] First item keys:', Object.keys(items[0]));
      console.log('[CONVOY Cart] First item:', items[0]);
    }
    return items;
  }
  console.log('[CONVOY Cart] No items found on session');
  return [];
}

function formatPrice(amount) {
  if (typeof amount === 'string') {
    // If it's already formatted (e.g. "€2,299"), return as-is
    if (amount.match(/[€£$]/)) return amount;
    amount = parseFloat(amount);
  }
  if (!amount || isNaN(amount)) return '€0.00';
  // Smootify returns price as a decimal (e.g. 2299.0), not cents
  // If the value looks like cents (> 10000), divide by 100
  const value = amount > 10000 ? amount / 100 : amount;
  return `€${value.toFixed(2)}`;
}

function storeItemDisplayData(variantId, data) {
  itemDisplayData[variantId] = data;
}

function getItemDisplayData(variantId) {
  return itemDisplayData[variantId] || {};
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
    const price = item.unitPrice || item.unitDeposit || 0;
    const qty = item.quantity || 1;
    return sum + (price * qty);
  }, 0);
  const totalEl = q('total');
  if (totalEl) totalEl.textContent = formatPrice(total);
}

function renderItems() {
  const container = els.items;
  console.log('[CONVOY Cart] renderItems — container:', !!container, 'templateEl:', !!templateEl);
  if (!container || !templateEl) {
    console.warn('[CONVOY Cart] Missing container or template — cannot render');
    return;
  }

  const items = getItems();

  // Clear existing rendered items (but keep template hidden)
  container.querySelectorAll('[data-cart-rendered]').forEach(el => el.remove());

  // Toggle Smootify's is-empty-cart class (hides items/footer via CSS)
  if (items.length) {
    els.drawer.classList.remove('is-empty-cart');
  } else {
    els.drawer.classList.add('is-empty-cart');
  }

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

    const variantId = item.id;
    const display = getItemDisplayData(variantId);

    // PPcartSession field names: name, unitPrice, src, id, quantity
    const itemTitle = item.name || display.title || '';
    const itemImage = item.src || display.image || '';
    const itemPrice = item.unitPrice || item.unitDeposit || display.price || 0;
    const itemVariantTitle = display.variant_title || '';
    const itemUrl = display.url || '';
    const qty = item.quantity || 1;

    // Populate fields
    const img = clone.querySelector('[data-cart="item-image"]');
    if (img && itemImage) {
      img.src = itemImage;
      img.alt = itemTitle;
    }

    const title = clone.querySelector('[data-cart="item-title"]');
    if (title) {
      title.textContent = itemTitle;
      if (itemUrl) title.href = itemUrl;
    }

    const options = clone.querySelector('[data-cart="item-options"]');
    if (options) {
      if (itemVariantTitle && itemVariantTitle !== 'Default Title') {
        options.textContent = itemVariantTitle;
        options.style.display = '';
      } else {
        options.style.display = 'none';
      }
    }

    const price = itemPrice;

    const qtyEl = clone.querySelector('[data-cart="item-quantity"]');
    if (qtyEl) qtyEl.textContent = qty;

    const priceEl = clone.querySelector('[data-cart="item-price"]');
    if (priceEl) priceEl.textContent = formatPrice(price);

    const totalEl = clone.querySelector('[data-cart="item-total"]');
    if (totalEl) totalEl.textContent = formatPrice(price * qty);

    const qtyInput = clone.querySelector('.sm-quantity-field');
    if (qtyInput) qtyInput.value = qty;

    // Store variant ID on action buttons for this item
    clone.querySelectorAll('[data-cart="increment"]').forEach(btn => btn.dataset.variantId = variantId);
    clone.querySelectorAll('[data-cart="decrement"]').forEach(btn => btn.dataset.variantId = variantId);
    clone.querySelectorAll('[data-cart="remove"]').forEach(btn => btn.dataset.variantId = variantId);

    container.appendChild(clone);
    console.log('[CONVOY Cart] Appended item clone:', {
      variantId,
      title: itemTitle,
      price: itemPrice,
      image: itemImage,
      cloneDisplay: clone.style.display,
      cloneHTML: clone.outerHTML.substring(0, 200),
    });
  });

  console.log('[CONVOY Cart] Container children after render:', container.children.length);
  console.log('[CONVOY Cart] Container innerHTML preview:', container.innerHTML.substring(0, 500));

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

  // Smootify exposes .variant on the product element (confirmed working)
  if (product.variant) return product.variant;
  if (product.selectedVariant) return product.selectedVariant;

  // Try reading from the add-to-cart form's hidden input
  const addToCart = button.closest('smootify-add-to-cart');
  if (addToCart) {
    if (addToCart.variant) return addToCart.variant;
    if (addToCart.selectedVariant) return addToCart.selectedVariant;

    const hiddenInput = addToCart.querySelector('input[name="id"], input[name="variant_id"]');
    if (hiddenInput && hiddenInput.value) {
      return { id: hiddenInput.value };
    }
  }

  // Use tracked variant from smootify:variant_changed event
  if (selectedVariant) return selectedVariant;

  return null;
}

function getProductDataFromSmootify(button) {
  const product = button.closest('smootify-product');
  if (!product || !product.product) return {};
  const p = product.product;

  // Try multiple image sources — Smootify structures vary
  let image = '';
  if (p.featuredImage?.src) image = p.featuredImage.src;
  else if (p.images?.[0]?.src) image = p.images[0].src;
  else if (typeof p.images?.[0] === 'string') image = p.images[0];

  // Fallback: grab from the page's product image element
  if (!image) {
    const imgEl = product.querySelector('img');
    if (imgEl) image = imgEl.src || imgEl.dataset.src || '';
  }

  return {
    title: p.title || '',
    handle: p.handle || '',
    url: p.url || `/product/${p.handle}`,
    image,
  };
}

function handleAddToCart(button) {
  const session = getSession();
  const variant = getSelectedVariantFromSmootify(button);
  const productData = getProductDataFromSmootify(button);

  console.log('[CONVOY Cart] Add to cart clicked');
  console.log('[CONVOY Cart] PPcartSession:', session ? 'ready' : 'NOT ready');
  console.log('[CONVOY Cart] Variant:', variant);
  console.log('[CONVOY Cart] Product:', productData);

  if (!session) {
    console.warn('[CONVOY Cart] PPcartSession not available — is PreProduct script loaded?');
    return;
  }

  if (!variant || !variant.id) {
    console.warn('[CONVOY Cart] No variant selected');
    return;
  }

  // Extract the numeric variant ID from Shopify GID if needed
  // e.g. "gid://shopify/ProductVariant/12345" → "12345"
  let variantId = String(variant.id);
  if (variantId.includes('gid://')) {
    variantId = variantId.split('/').pop();
  }
  console.log('[CONVOY Cart] Resolved variant ID:', variantId);

  // Extract unit price from Smootify variant
  // variant.price can be { amount: "2299.0", currencyCode: "EUR" } or a number
  let unitPrice = 0;
  if (variant.price?.amount) {
    unitPrice = parseFloat(variant.price.amount);
  } else if (typeof variant.price === 'number') {
    unitPrice = variant.price;
  } else if (typeof variant.price === 'string') {
    unitPrice = parseFloat(variant.price);
  }
  console.log('[CONVOY Cart] Unit price:', unitPrice);

  // Resolve selling plan ID — required for pre-order items
  // 1. Try Smootify variant's sellingPlanAllocations
  // 2. Try PreProduct headless embed on the page
  // 3. Try PPcartSession's own config
  let sellingPlanId = null;

  // Smootify returns GraphQL-style: { nodes: [{ sellingPlan: { id, name } }] }
  const allocations = variant.sellingPlanAllocations?.nodes
    || variant.sellingPlanAllocations;

  if (Array.isArray(allocations) && allocations.length > 0) {
    const spa = allocations[0];
    sellingPlanId = spa.sellingPlan?.id || spa.sellingPlanId || spa.id;
    // Extract numeric ID from GID if needed
    if (sellingPlanId && String(sellingPlanId).includes('gid://')) {
      sellingPlanId = String(sellingPlanId).split('/').pop();
    }
  }

  // Fallback: check PreProduct headless embed for selling plan
  if (!sellingPlanId) {
    const ppEmbed = document.querySelector('[data-selling-plan]');
    if (ppEmbed) sellingPlanId = ppEmbed.dataset.sellingPlan;
  }

  // Fallback: check PPcartSession for a default selling plan
  if (!sellingPlanId && session.sellingPlan) {
    sellingPlanId = session.sellingPlan;
  }

  console.log('[CONVOY Cart] Selling plan ID:', sellingPlanId);
  console.log('[CONVOY Cart] Variant sellingPlanAllocations:', variant.sellingPlanAllocations);

  // Build the item for PPcartSession
  // PPcartSession.push() requires `id` and `unitPrice`
  const item = {
    id: variantId,
    variant_id: variantId,
    unitPrice: unitPrice,
    quantity: 1,
  };

  // Add selling plan if found (PPcartSession uses camelCase `sellingPlan`)
  if (sellingPlanId) {
    item.sellingPlan = sellingPlanId;
  }

  console.log('[CONVOY Cart] Pushing to PPcartSession:', item);

  // Push to PreProduct cart
  if (typeof session.push === 'function') {
    session.push(item);
  } else if (typeof session.forcePush === 'function') {
    session.forcePush(item);
  }

  // Store product display data locally for cart rendering
  // (PPcartSession may not return rich product info)
  // Resolve variant image — try variant-specific first, then product-level
  const variantImage = variant.image?.src
    || variant.featured_image?.src
    || (typeof variant.image === 'string' ? variant.image : '')
    || productData.image;

  storeItemDisplayData(variantId, {
    title: productData.title,
    variant_title: variant.title || '',
    price: variant.price?.amount || variant.price || 0,
    image: variantImage,
    url: productData.url,
  });

  // Debug: inspect PPcartSession after push
  setTimeout(() => {
    const s = getSession();
    console.log('[CONVOY Cart] PPcartSession after push:', s);
    console.log('[CONVOY Cart] PPcartSession keys:', Object.keys(s));
    console.log('[CONVOY Cart] PPcartSession.items:', s.items);
    console.log('[CONVOY Cart] PPcartSession.cart:', s.cart);
    console.log('[CONVOY Cart] PPcartSession.getItems:', typeof s.getItems === 'function' ? s.getItems() : 'not a function');
    console.log('[CONVOY Cart] PPcartSession.line_items:', s.line_items);
    console.log('[CONVOY Cart] PPcartSession.products:', s.products);
    // Try iterating over all enumerable properties
    for (const key in s) {
      if (Array.isArray(s[key]) && s[key].length > 0) {
        console.log(`[CONVOY Cart] PPcartSession.${key} (array):`, s[key]);
      }
    }
    renderItems();
  }, 500);
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
  // Don't clear itemDisplayData — persist across page transitions
}
