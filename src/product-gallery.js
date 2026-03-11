// -----------------------------------------
// PRODUCT GALLERY
// Piggybacks on Smootify's product="media" rendering,
// then builds Osmo parallax slideshow from the injected images
// -----------------------------------------

let instances = [];
let observer = null;

function buildGallery(wrapper, imageUrls) {
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

  imageUrls.forEach((url, i) => {
    // Build slide
    const slide = slideTemplate.cloneNode(true);
    slide.classList.remove('is--current');
    slide.setAttribute('data-slideshow', 'slide');
    const slideImg = slide.querySelector('.img-slide__inner');
    if (slideImg) {
      slideImg.src = url;
      slideImg.alt = '';
      slideImg.setAttribute('data-slideshow', 'parallax');
      slideImg.setAttribute('draggable', 'false');
      slideImg.removeAttribute('srcset');
      slideImg.removeAttribute('sizes');
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
      thumbImg.src = resizeShopifyImage(url, '200x');
      thumbImg.alt = '';
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
  if (!url) return url;
  const match = url.match(/(.+)(\.[a-zA-Z]+)(\?.*)?$/);
  if (match) {
    return `${match[1]}_${size}${match[2]}${match[3] || ''}`;
  }
  return url;
}

function initSlideShow(el) {
  gsap.registerPlugin(Observer, CustomEase);

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
  let obs;
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
    obs.disable();

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
        setTimeout(() => obs.enable(), animationDuration);
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

  obs = Observer.create({
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
      if (obs) obs.kill();
      ui.thumbs.forEach(thumb => {
        thumb.removeEventListener('click', onClick);
      });
    }
  };
}

// Create a hidden Smootify media source — Smootify will clone
// the img[product="media"] element for each product image
function createMediaSource() {
  const existing = document.getElementById('product-gallery-source');
  if (existing) return existing;

  const source = document.createElement('div');
  source.id = 'product-gallery-source';
  source.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';

  const img = document.createElement('img');
  img.setAttribute('product', 'media');
  img.setAttribute('skeleton', 'image');
  source.appendChild(img);

  // Insert inside the nearest smootify-product element, or body
  const smootifyProduct = document.querySelector('smootify-product');
  if (smootifyProduct) {
    smootifyProduct.appendChild(source);
  } else {
    document.body.appendChild(source);
  }

  return source;
}

// Watch for Smootify to clone images into the source container
function watchForMedia(source, wrappers) {
  // Check if images are already there (Smootify may have already run)
  const existingImages = collectImageUrls(source);
  if (existingImages.length > 0) {
    wrappers.forEach(wrap => {
      const instance = buildGallery(wrap, existingImages);
      if (instance) instances.push(instance);
    });
    return;
  }

  // Watch for Smootify to add/modify images
  let settled = false;
  let settleTimer = null;

  observer = new MutationObserver(() => {
    if (settled) return;

    // Debounce — wait for Smootify to finish adding all images
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const urls = collectImageUrls(source);
      if (urls.length > 0) {
        settled = true;
        if (observer) { observer.disconnect(); observer = null; }
        wrappers.forEach(wrap => {
          const instance = buildGallery(wrap, urls);
          if (instance) instances.push(instance);
        });
      }
    }, 300);
  });

  observer.observe(source, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

  // Fallback: if nothing after 5s, init with static images
  setTimeout(() => {
    if (!settled) {
      settled = true;
      if (observer) { observer.disconnect(); observer = null; }
      wrappers.forEach(wrap => {
        const instance = initSlideShow(wrap);
        if (instance) instances.push(instance);
      });
    }
  }, 5000);
}

function collectImageUrls(source) {
  const imgs = source.querySelectorAll('img[src]');
  const urls = [];
  imgs.forEach(img => {
    const src = img.getAttribute('src');
    if (src && src !== '' && !src.includes('data:') && !src.includes('website-files.com')) {
      urls.push(src);
    }
  });
  return urls;
}

export function initProductGallery(scope) {
  const root = scope || document;
  const wrappers = root.querySelectorAll('[data-slideshow="wrap"]');
  if (!wrappers.length) return;

  // Check if we're on a product page
  const isProductPage = window.location.pathname.match(/\/product\//);
  if (!isProductPage) {
    // Not a product page — init with static images
    wrappers.forEach(wrap => {
      const instance = initSlideShow(wrap);
      if (instance) instances.push(instance);
    });
    return;
  }

  // Create hidden media source for Smootify to populate
  const source = createMediaSource();
  watchForMedia(source, wrappers);
}

export function destroyProductGallery() {
  if (observer) { observer.disconnect(); observer = null; }
  const source = document.getElementById('product-gallery-source');
  if (source) source.remove();
  instances.forEach(inst => inst.destroy());
  instances = [];
}
