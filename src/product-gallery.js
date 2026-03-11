// -----------------------------------------
// PRODUCT GALLERY
// Fetches Shopify product media via Smootify,
// builds Osmo parallax slideshow dynamically
// -----------------------------------------

let instances = [];
let productLoadedHandler = null;

function buildGallery(wrapper, images) {
  const slideList = wrapper.querySelector('.img-slider__list');
  const thumbNav = wrapper.querySelector('.img-slider__nav');

  if (!slideList || !thumbNav) return null;

  // Grab templates (first slide + first thumb), then clear containers
  const slideTemplate = slideList.querySelector('.img-slide');
  const thumbTemplate = thumbNav.querySelector('.img-slider__thumb');

  if (!slideTemplate || !thumbTemplate) return null;

  // Clear existing placeholder content
  slideList.innerHTML = '';
  thumbNav.innerHTML = '';

  images.forEach((img, i) => {
    // Build slide
    const slide = slideTemplate.cloneNode(true);
    slide.classList.remove('is--current');
    slide.setAttribute('data-slideshow', 'slide');
    const slideImg = slide.querySelector('.img-slide__inner');
    if (slideImg) {
      slideImg.src = img.url;
      slideImg.alt = img.altText || '';
      slideImg.setAttribute('data-slideshow', 'parallax');
      slideImg.setAttribute('draggable', 'false');
      slideImg.removeAttribute('srcset');
      slideImg.removeAttribute('sizes');
      // Use Shopify CDN image transforms for performance
      slideImg.setAttribute('width', '960');
      slideImg.setAttribute('loading', i === 0 ? 'eager' : 'lazy');
    }
    slideList.appendChild(slide);

    // Build thumb
    const thumb = thumbTemplate.cloneNode(true);
    thumb.classList.remove('is--current');
    thumb.setAttribute('data-slideshow', 'thumb');
    const thumbImg = thumb.querySelector('.slider-thumb__img');
    if (thumbImg) {
      // Use smaller Shopify CDN size for thumbnails
      thumbImg.src = resizeShopifyImage(img.url, '200x');
      thumbImg.alt = img.altText || '';
      thumbImg.removeAttribute('srcset');
      thumbImg.removeAttribute('sizes');
      thumbImg.setAttribute('loading', 'lazy');
    }
    thumbNav.appendChild(thumb);
  });

  // Init Osmo slideshow on this wrapper
  return initSlideShow(wrapper);
}

function resizeShopifyImage(url, size) {
  // Shopify CDN image transform: insert _SIZEx before extension
  // e.g. image.png → image_200x.png
  if (!url) return url;
  const match = url.match(/(.+)(\.[a-zA-Z]+)(\?.*)?$/);
  if (match) {
    return `${match[1]}_${size}${match[2]}${match[3] || ''}`;
  }
  return url;
}

function initSlideShow(el) {
  gsap.registerPlugin(Observer, CustomEase);

  // Only create the ease if it doesn't exist yet
  if (!CustomEase.get('slideshow-wipe')) {
    CustomEase.create('slideshow-wipe', '0.6, 0.08, 0.02, 0.99');
  }

  const ui = {
    el,
    slides: Array.from(el.querySelectorAll('[data-slideshow="slide"]')),
    inner: Array.from(el.querySelectorAll('[data-slideshow="parallax"]')),
    thumbs: Array.from(el.querySelectorAll('[data-slideshow="thumb"]'))
  };

  if (ui.slides.length === 0) return null;

  let current = 0;
  const length = ui.slides.length;
  let animating = false;
  let observer;
  const animationDuration = 0.9;

  ui.slides.forEach((slide, index) => {
    slide.setAttribute('data-index', index);
  });
  ui.thumbs.forEach((thumb, index) => {
    thumb.setAttribute('data-index', index);
  });

  ui.slides[current].classList.add('is--current');
  if (ui.thumbs[current]) ui.thumbs[current].classList.add('is--current');

  function navigate(direction, targetIndex = null) {
    if (animating) return;
    animating = true;
    observer.disable();

    const previous = current;
    current =
      targetIndex !== null && targetIndex !== undefined
        ? targetIndex
        : direction === 1
          ? current < length - 1 ? current + 1 : 0
          : current > 0 ? current - 1 : length - 1;

    const currentSlide = ui.slides[previous];
    const currentInner = ui.inner[previous];
    const upcomingSlide = ui.slides[current];
    const upcomingInner = ui.inner[current];

    gsap.timeline({
      defaults: {
        duration: animationDuration,
        ease: 'slideshow-wipe'
      },
      onStart() {
        upcomingSlide.classList.add('is--current');
        if (ui.thumbs[previous]) ui.thumbs[previous].classList.remove('is--current');
        if (ui.thumbs[current]) ui.thumbs[current].classList.add('is--current');
      },
      onComplete() {
        currentSlide.classList.remove('is--current');
        animating = false;
        setTimeout(() => observer.enable(), animationDuration);
      }
    })
      .to(currentSlide, { xPercent: -direction * 100 }, 0)
      .to(currentInner, { xPercent: direction * 50 }, 0)
      .fromTo(upcomingSlide, { xPercent: direction * 100 }, { xPercent: 0 }, 0)
      .fromTo(upcomingInner, { xPercent: -direction * 50 }, { xPercent: 0 }, 0);
  }

  function onClick(event) {
    const targetIndex = parseInt(event.currentTarget.getAttribute('data-index'), 10);
    if (targetIndex === current || animating) return;
    const direction = targetIndex > current ? 1 : -1;
    navigate(direction, targetIndex);
  }

  ui.thumbs.forEach(thumb => {
    thumb.addEventListener('click', onClick);
  });

  observer = Observer.create({
    target: el,
    type: 'wheel,touch,pointer',
    onLeft: () => { if (!animating) navigate(1); },
    onRight: () => { if (!animating) navigate(-1); },
    onWheel: (event) => {
      if (animating) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        if (event.deltaX > 50) navigate(1);
        else if (event.deltaX < -50) navigate(-1);
      }
    },
    wheelSpeed: -1,
    tolerance: 10
  });

  return {
    destroy() {
      if (observer) observer.kill();
      ui.thumbs.forEach(thumb => {
        thumb.removeEventListener('click', onClick);
      });
    }
  };
}

function extractImages(product) {
  // Smootify product object — try media array first, then images
  if (product.media?.edges) {
    return product.media.edges
      .filter(e => e.node.mediaContentType === 'IMAGE')
      .map(e => e.node.image);
  }
  if (product.media && Array.isArray(product.media)) {
    return product.media
      .filter(m => m.mediaContentType === 'IMAGE' || m.media_type === 'image')
      .map(m => m.image || m);
  }
  if (product.images?.edges) {
    return product.images.edges.map(e => e.node);
  }
  if (product.images && Array.isArray(product.images)) {
    return product.images.map(img =>
      typeof img === 'string' ? { url: img } : img
    );
  }
  return [];
}

function handleProductLoaded(wrappers, event) {
  const { product } = event.detail || {};
  if (!product) return;

  const images = extractImages(product);
  if (!images.length) return;

  wrappers.forEach(wrap => {
    const instance = buildGallery(wrap, images);
    if (instance) instances.push(instance);
  });
}

export function initProductGallery(scope) {
  const root = scope || document;
  const wrappers = root.querySelectorAll('[data-slideshow="wrap"]');
  if (!wrappers.length) return;

  // Listen for Smootify product data
  productLoadedHandler = (e) => handleProductLoaded(wrappers, e);
  document.addEventListener('smootify:product_loaded', productLoadedHandler);

  // Fallback: if no Smootify event fires within 4s, init with static images
  const fallbackTimer = setTimeout(() => {
    if (instances.length === 0) {
      wrappers.forEach(wrap => {
        const instance = initSlideShow(wrap);
        if (instance) instances.push(instance);
      });
    }
  }, 4000);

  // Cancel fallback if gallery was built via Smootify
  const origPush = instances.push.bind(instances);
  instances.push = function (...args) {
    clearTimeout(fallbackTimer);
    return origPush(...args);
  };
}

export function destroyProductGallery() {
  if (productLoadedHandler) {
    document.removeEventListener('smootify:product_loaded', productLoadedHandler);
    productLoadedHandler = null;
  }
  instances.forEach(inst => inst.destroy());
  instances = [];
}
