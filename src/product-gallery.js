// -----------------------------------------
// PRODUCT GALLERY
// Reads Smootify-duplicated images, restructures
// into Osmo parallax slideshow with thumbnails
// -----------------------------------------

let instances = [];
let pollTimer = null;

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

  ui.slides.forEach((slide, i) => slide.setAttribute('data-index', i));
  ui.thumbs.forEach((thumb, i) => thumb.setAttribute('data-index', i));

  ui.slides[0].classList.add('is--current');
  if (ui.thumbs[0]) ui.thumbs[0].classList.add('is--current');

  function navigate(direction, targetIndex = null) {
    if (animating) return;
    animating = true;
    obs.disable();

    const previous = current;
    current = targetIndex != null
      ? targetIndex
      : direction === 1
        ? (current + 1) % length
        : (current - 1 + length) % length;

    gsap.timeline({
      defaults: { duration: animationDuration, ease: 'slideshow-wipe' },
      onStart() {
        ui.slides[current].classList.add('is--current');
        if (ui.thumbs[previous]) ui.thumbs[previous].classList.remove('is--current');
        if (ui.thumbs[current]) ui.thumbs[current].classList.add('is--current');
      },
      onComplete() {
        ui.slides[previous].classList.remove('is--current');
        animating = false;
        setTimeout(() => obs.enable(), animationDuration);
      }
    })
      .to(ui.slides[previous], { xPercent: -direction * 100 }, 0)
      .to(ui.inner[previous], { xPercent: direction * 50 }, 0)
      .fromTo(ui.slides[current], { xPercent: direction * 100 }, { xPercent: 0 }, 0)
      .fromTo(ui.inner[current], { xPercent: -direction * 50 }, { xPercent: 0 }, 0);
  }

  ui.thumbs.forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      if (idx === current || animating) return;
      navigate(idx > current ? 1 : -1, idx);
    });
  });

  obs = Observer.create({
    target: el,
    type: 'wheel,touch,pointer',
    onLeft: () => { if (!animating) navigate(1); },
    onRight: () => { if (!animating) navigate(-1); },
    onWheel: (e) => {
      if (animating) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (e.deltaX > 50) navigate(1);
        else if (e.deltaX < -50) navigate(-1);
      }
    },
    wheelSpeed: -1,
    tolerance: 10
  });

  return {
    destroy() {
      if (obs) obs.kill();
    }
  };
}

function restructureGallery(wrapper) {
  const slideList = wrapper.querySelector('.img-slider__list');
  const thumbNav = wrapper.querySelector('.img-slider__nav');
  if (!slideList || !thumbNav) return null;

  // Smootify duplicated imgs inside the single .img-slide
  const sourceSlide = slideList.querySelector('.img-slide');
  if (!sourceSlide) return null;

  const imgs = Array.from(sourceSlide.querySelectorAll('.img-slide__inner'));
  if (imgs.length <= 1) return null; // Not yet duplicated or only 1 image

  // Get all image URLs
  const urls = imgs.map(img => img.getAttribute('src')).filter(Boolean);
  if (urls.length === 0) return null;

  // Get the thumb template
  const thumbTemplate = thumbNav.querySelector('.img-slider__thumb');

  // Clear containers
  slideList.innerHTML = '';
  thumbNav.innerHTML = '';

  urls.forEach((url, i) => {
    // Build slide
    const slide = document.createElement('div');
    slide.className = 'img-slide';
    slide.setAttribute('data-slideshow', 'slide');

    const img = document.createElement('img');
    img.className = 'img-slide__inner';
    img.setAttribute('data-slideshow', 'parallax');
    img.setAttribute('draggable', 'false');
    img.setAttribute('loading', i === 0 ? 'eager' : 'lazy');
    img.src = url;
    slide.appendChild(img);
    slideList.appendChild(slide);

    // Build thumb
    if (thumbTemplate) {
      const thumb = thumbTemplate.cloneNode(true);
      thumb.classList.remove('is--current');
      thumb.setAttribute('data-slideshow', 'thumb');
      const thumbImg = thumb.querySelector('.slider-thumb__img') || thumb.querySelector('img');
      if (thumbImg) {
        thumbImg.src = url;
        thumbImg.removeAttribute('srcset');
        thumbImg.removeAttribute('sizes');
      }
      thumbNav.appendChild(thumb);
    }
  });

  return initSlideShow(wrapper);
}

export function initProductGallery(scope) {
  const root = scope || document;
  const wrappers = root.querySelectorAll('[data-slideshow="wrap"]');
  if (!wrappers.length) return;

  // Poll until Smootify has duplicated the images (they appear as multiple .img-slide__inner)
  let attempts = 0;
  const maxAttempts = 30; // 30 × 200ms = 6s max wait

  pollTimer = setInterval(() => {
    attempts++;
    const firstSlide = root.querySelector('.img-slide');
    const imgCount = firstSlide ? firstSlide.querySelectorAll('.img-slide__inner').length : 0;

    if (imgCount > 1 || attempts >= maxAttempts) {
      clearInterval(pollTimer);
      pollTimer = null;

      wrappers.forEach(wrap => {
        const instance = imgCount > 1 ? restructureGallery(wrap) : initSlideShow(wrap);
        if (instance) instances.push(instance);
      });
    }
  }, 200);
}

export function destroyProductGallery() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  instances.forEach(inst => inst.destroy());
  instances = [];
}
