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
  const items = session.items;
  return Array.isArray(items) ? items : [];
}

function formatPrice(amount) {
  if (typeof amount === 'string') {
    if (amount.match(/[€£$]/)) return amount;
    amount = parseFloat(amount);
  }
  if (!amount || isNaN(amount)) return '€0.00';
  // Format with locale — handles thousands separators
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
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
  if (!container || !templateEl) return;

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

  // Force-show all intermediate containers that Smootify CSS may hide
  if (items.length) {
    const formBlock = els.drawer?.querySelector('.sm-mini-cart-form-block');
    if (formBlock) formBlock.style.display = 'block';

    const form = els.drawer?.querySelector('.sm-mini-cart_form');
    if (form) form.style.display = 'block';

    const footerEl = els.drawer?.querySelector('.sm-mini-cart_footer');
    if (footerEl) footerEl.style.display = '';

    if (container) container.style.display = '';
  } else {
    const footerEl = els.drawer?.querySelector('.sm-mini-cart_footer');
    if (footerEl) footerEl.style.display = 'none';
    if (container) container.style.display = 'none';
  }

  items.forEach((item) => {
    const clone = templateEl.cloneNode(true);
    clone.setAttribute('data-cart-rendered', '');
    clone.removeAttribute('data-cart');
    clone.style.display = 'block';

    const variantId = item.id;
    const display = getItemDisplayData(variantId);

    // PPcartSession field names: name, unitPrice, src, id, quantity
    const itemTitle = item.name || display.title || '';
    const itemImage = item.src || display.image || '';
    const itemPrice = item.unitPrice || item.unitDeposit || display.price || 0;
    const itemVariantTitle = display.variant_title || '';
    const itemUrl = display.url || '';
    const qty = item.quantity || 1;

    // --- Populate fields ---

    const img = clone.querySelector('[data-cart="item-image"]');
    if (img) {
      if (itemImage) {
        img.src = itemImage;
        img.alt = itemTitle;
      } else {
        // Hide broken image placeholder
        img.style.display = 'none';
      }
    }

    const title = clone.querySelector('[data-cart="item-title"]');
    if (title) {
      title.textContent = itemTitle;
      if (itemUrl) title.href = itemUrl;
    }

    // Variant options — replace child content structure
    const options = clone.querySelector('[data-cart="item-options"]');
    if (options) {
      if (itemVariantTitle && itemVariantTitle !== 'Default Title') {
        // Clear Smootify's Name: value structure, replace with variant title
        options.innerHTML = '';
        options.textContent = itemVariantTitle;
        options.style.display = '';
      } else {
        options.style.display = 'none';
      }
    }

    const qtyEl = clone.querySelector('[data-cart="item-quantity"]');
    if (qtyEl) qtyEl.textContent = qty;

    const priceEl = clone.querySelector('[data-cart="item-price"]');
    if (priceEl) priceEl.textContent = formatPrice(itemPrice);

    const totalEl = clone.querySelector('[data-cart="item-total"]');
    if (totalEl) totalEl.textContent = formatPrice(itemPrice * qty);

    const qtyInput = clone.querySelector('.sm-quantity-field');
    if (qtyInput) qtyInput.value = qty;

    // --- Hide Smootify-specific elements ---

    // Box items (Smootify bundle feature — not used)
    const boxItems = clone.querySelector('.sm-box-items');
    if (boxItems) boxItems.style.display = 'none';

    // Store variant ID on action buttons for this item
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
  if (typeof session.remove === 'function') {
    session.remove(variantId);
  } else if (typeof session.decrement === 'function') {
    // Fallback: decrement to 0
    const items = getItems();
    const item = items.find(i => i.id == variantId);
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
  const product = button.closest('smootify-product');
  if (!product) return null;

  if (product.variant) return product.variant;
  if (product.selectedVariant) return product.selectedVariant;

  const addToCart = button.closest('smootify-add-to-cart');
  if (addToCart) {
    if (addToCart.variant) return addToCart.variant;
    if (addToCart.selectedVariant) return addToCart.selectedVariant;

    const hiddenInput = addToCart.querySelector('input[name="id"], input[name="variant_id"]');
    if (hiddenInput && hiddenInput.value) {
      return { id: hiddenInput.value };
    }
  }

  if (selectedVariant) return selectedVariant;
  return null;
}

function getProductDataFromSmootify(button) {
  const product = button.closest('smootify-product');
  if (!product || !product.product) return {};
  const p = product.product;

  let image = '';
  if (p.featuredImage?.src) image = p.featuredImage.src;
  else if (p.images?.nodes?.[0]?.src) image = p.images.nodes[0].src;
  else if (p.images?.[0]?.src) image = p.images[0].src;
  else if (typeof p.images?.[0] === 'string') image = p.images[0];

  // Fallback: grab from the page's visible product image
  if (!image) {
    const imgEl = product.querySelector('img[src*="shopify"], img[src*="cdn."]');
    if (imgEl) image = imgEl.src || '';
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

  if (!session) {
    console.warn('[CONVOY Cart] PPcartSession not available — is PreProduct script loaded?');
    return;
  }

  if (!variant || !variant.id) {
    console.warn('[CONVOY Cart] No variant selected');
    return;
  }

  // Extract numeric variant ID from Shopify GID
  let variantId = String(variant.id);
  if (variantId.includes('gid://')) {
    variantId = variantId.split('/').pop();
  }

  // Extract unit price from Smootify variant
  let unitPrice = 0;
  if (variant.price?.amount) {
    unitPrice = parseFloat(variant.price.amount);
  } else if (typeof variant.price === 'number') {
    unitPrice = variant.price;
  } else if (typeof variant.price === 'string') {
    unitPrice = parseFloat(variant.price);
  }

  // Resolve selling plan ID — required for pre-order items
  let sellingPlanId = null;

  // Smootify returns GraphQL-style: { nodes: [{ sellingPlan: { id, name } }] }
  const allocations = variant.sellingPlanAllocations?.nodes
    || variant.sellingPlanAllocations;

  if (Array.isArray(allocations) && allocations.length > 0) {
    const spa = allocations[0];
    sellingPlanId = spa.sellingPlan?.id || spa.sellingPlanId || spa.id;
    if (sellingPlanId && String(sellingPlanId).includes('gid://')) {
      sellingPlanId = String(sellingPlanId).split('/').pop();
    }
  }

  // Fallback: check PreProduct headless embed on the page
  if (!sellingPlanId) {
    const ppEmbed = document.querySelector('[data-selling-plan]');
    if (ppEmbed) sellingPlanId = ppEmbed.dataset.sellingPlan;
  }

  // Fallback: check PPcartSession for a default selling plan
  if (!sellingPlanId && session.sellingPlan) {
    sellingPlanId = session.sellingPlan;
  }

  // Debug — keep until selling plan is confirmed working
  console.log('[CONVOY Cart] Add:', { variantId, unitPrice, sellingPlanId });
  console.log('[CONVOY Cart] Allocations:', allocations);

  // Build the item for PPcartSession
  const item = {
    id: variantId,
    unitPrice: unitPrice,
    quantity: 1,
  };

  if (sellingPlanId) {
    item.sellingPlan = sellingPlanId;
  }

  // Push to PreProduct cart
  if (typeof session.push === 'function') {
    session.push(item);
  } else if (typeof session.forcePush === 'function') {
    session.forcePush(item);
  }

  // Resolve variant image
  const variantImage = variant.image?.src
    || variant.featured_image?.src
    || (typeof variant.image === 'string' ? variant.image : '')
    || productData.image;

  // Cache product display data for cart rendering
  storeItemDisplayData(variantId, {
    title: productData.title,
    variant_title: variant.title || '',
    price: unitPrice,
    image: variantImage,
    url: productData.url,
  });

  // Render after a brief delay to let PPcartSession process the push
  setTimeout(() => {
    renderItems();
  }, 300);

  openDrawer();
}

function onSmootifyVariantChanged(e) {
  if (e.detail?.variant) {
    selectedVariant = e.detail.variant;
  } else if (e.detail) {
    selectedVariant = e.detail;
  }
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
      renderItems(); // Refresh before opening
      openDrawer();
      break;
    case 'close':
      e.preventDefault();
      closeDrawer();
      break;
    case 'add':
      e.preventDefault();
      e.stopPropagation();
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
  if (e.target.tagName === 'DIALOG') {
    closeDrawer();
  }
}

// ---- PPcartSession listener ----

function onPPCartReady() {
  ppReady = true;
  renderItems();

  const session = getSession();
  if (session && typeof session.on === 'function') {
    session.on('change', renderItems);
  }
}

// ---- Init / Destroy ----

function hideSmootifyCruft(drawer) {
  // Hide Smootify-specific elements that we don't use
  const selectors = [
    'urgent-cart-countdown',      // Countdown timer
    '.sm-urgent-cart-countdown',
    'free-shipping-bar',          // Shipping bar
    '.sm-free-shipping-bar',
    '.sm-mini-cart_header',       // Contains countdown + shipping bar
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
  els.drawer = q('drawer', root) || q('drawer');

  if (!els.drawer) return;

  els.items = q('items', els.drawer);

  // Grab the template item and hide it
  templateEl = q('item-template', els.drawer);
  if (templateEl) {
    templateEl.style.display = 'none';
  }

  // Hide Smootify elements we don't need
  hideSmootifyCruft(els.drawer);

  // Document-level delegation for ALL data-cart actions
  document.addEventListener('click', onCartClick);
  listeners.push(['click', onCartClick, document]);

  // Dialog backdrop click to close
  const dialog = els.drawer.querySelector('dialog');
  if (dialog) {
    dialog.addEventListener('click', onDialogBackdropClick);
    listeners.push(['click', onDialogBackdropClick, dialog]);

    const form = dialog.querySelector('form');
    if (form) {
      const onSubmit = (e) => e.preventDefault();
      form.addEventListener('submit', onSubmit);
      listeners.push(['submit', onSubmit, form]);
    }
  }

  // Prevent Smootify's add-to-cart form from submitting to Shopify
  const productForms = root.querySelectorAll('smootify-add-to-cart form');
  productForms.forEach(form => {
    const onSubmit = (e) => {
      e.preventDefault();
      const addBtn = form.querySelector('[data-cart="add"]');
      if (addBtn) handleAddToCart(addBtn);
    };
    form.addEventListener('submit', onSubmit);
    listeners.push(['submit', onSubmit, form]);
  });

  // Track Smootify variant changes
  document.addEventListener('smootify:variant_changed', onSmootifyVariantChanged);
  listeners.push(['smootify:variant_changed', onSmootifyVariantChanged, document]);

  document.addEventListener('variant:changed', onSmootifyVariantChanged);
  listeners.push(['variant:changed', onSmootifyVariantChanged, document]);

  // If PPcartSession already available, render immediately
  if (window.PPcartSession) {
    onPPCartReady();
  }

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
