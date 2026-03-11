// -----------------------------------------
// PRODUCT GALLERY
// Waits for Smootify to duplicate slides, syncs
// thumbnails, then inits Osmo parallax slideshow
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

  // Set initial state: first slide visible, rest hidden
  // Uses opacity/pointerEvents to match Webflow's approach (not visibility)
  ui.slides.forEach((s, i) => {
    s.classList.remove('is--current');
    gsap.set(s, { opacity: i === 0 ? 1 : 0, pointerEvents: i === 0 ? 'auto' : 'none', xPercent: 0 });
  });
  ui.slides[0].classList.add('is--current');

  ui.thumbs.forEach((t, i) => {
    t.classList.remove('is--current');
    if (i === 0) t.classList.add('is--current');
  });

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
        // Make upcoming slide visible before animation
        gsap.set(ui.slides[current], { opacity: 1, pointerEvents: 'auto' });
        ui.slides[current].classList.add('is--current');
        ui.thumbs.forEach(t => t.classList.remove('is--current'));
        if (ui.thumbs[current]) ui.thumbs[current].classList.add('is--current');
      },
      onComplete() {
        // Hide previous slide after animation
        gsap.set(ui.slides[previous], { opacity: 0, pointerEvents: 'none' });
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

// Sync thumbs to match the number of slides.
// Smootify may over-duplicate thumbs (one per image × original count).
// We keep only as many thumbs as there are slides.
function syncThumbs(wrapper) {
  const slides = wrapper.querySelectorAll('[data-slideshow="slide"]');
  const thumbNav = wrapper.querySelector('.img-slider__nav');
  if (!thumbNav || slides.length === 0) return;

  const thumbs = Array.from(thumbNav.querySelectorAll('[data-slideshow="thumb"]'));
  const slideCount = slides.length;

  if (thumbs.length > slideCount) {
    thumbs.slice(slideCount).forEach(t => t.remove());
  } else if (thumbs.length < slideCount && thumbs.length > 0) {
    const template = thumbs[0];
    for (let i = thumbs.length; i < slideCount; i++) {
      const clone = template.cloneNode(true);
      clone.classList.remove('is--current');
      const slideImg = slides[i].querySelector('img');
      const thumbImg = clone.querySelector('img');
      if (slideImg && thumbImg) {
        thumbImg.src = slideImg.src;
        thumbImg.removeAttribute('srcset');
        thumbImg.removeAttribute('sizes');
      }
      thumbNav.appendChild(clone);
    }
  }

  // Update each thumb's image to match its corresponding slide
  const finalThumbs = thumbNav.querySelectorAll('[data-slideshow="thumb"]');
  finalThumbs.forEach((thumb, i) => {
    if (i >= slideCount) return;
    const slideImg = slides[i].querySelector('img');
    const thumbImg = thumb.querySelector('img');
    if (slideImg && thumbImg && thumbImg.src !== slideImg.src) {
      thumbImg.src = slideImg.src;
      thumbImg.removeAttribute('srcset');
      thumbImg.removeAttribute('sizes');
    }
  });
}

export function initProductGallery(scope) {
  const root = scope || document;
  const wrappers = root.querySelectorAll('[data-slideshow="wrap"]');
  if (!wrappers.length) return;

  // Poll until Smootify has duplicated slides (multiple .img-slide elements)
  let attempts = 0;
  const maxAttempts = 30; // 30 × 200ms = 6s max wait

  pollTimer = setInterval(() => {
    attempts++;
    const slideCount = root.querySelectorAll('[data-slideshow="slide"]').length;

    if (slideCount > 1 || attempts >= maxAttempts) {
      clearInterval(pollTimer);
      pollTimer = null;

      wrappers.forEach(wrap => {
        syncThumbs(wrap);
        const instance = initSlideShow(wrap);
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
