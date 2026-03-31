// -----------------------------------------
// FLICKITY SLIDER — Card carousel
// Requires Flickity loaded externally via CDN
// -----------------------------------------

let initializedSliders = [];

function initFlickityComponent(slider, index) {
  const sliderIndexID = 'flickity-type-cards-id-' + index;
  slider.id = sliderIndexID;

  const slidesCount = slider.querySelectorAll('[data-flickity-item]').length;
  slider.setAttribute('data-flickity-count', slidesCount);
  slider.setAttribute('data-flickity-status', 'active');

  const sliderEl = slider.querySelector('[data-flickity-list]');
  if (!sliderEl) return;

  const flickitySlider = new Flickity(sliderEl, {
    watchCSS: true,
    contain: true,
    wrapAround: false,
    dragThreshold: 10,
    prevNextButtons: false,
    pageDots: false,
    cellAlign: 'left',
    selectedAttraction: 0.015,
    friction: 0.25,
    percentPosition: true,
    freeScroll: false,
    on: {
      dragStart: () => {
        sliderEl.style.pointerEvents = 'none';
      },
      dragEnd: () => {
        sliderEl.style.pointerEvents = 'auto';
      },
      change: function () {
        updateArrows();
        updateDots();
      }
    }
  });

  const flickity = Flickity.data(sliderEl);

  // Previous button
  const prevButton = slider.querySelector('[data-flickity-control="prev"]');
  if (prevButton) {
    prevButton.setAttribute('disabled', '');
    prevButton.addEventListener('click', function () {
      flickity.previous();
    });
  }

  // Next button
  const nextButton = slider.querySelector('[data-flickity-control="next"]');
  if (nextButton) {
    nextButton.addEventListener('click', function () {
      flickity.next();
    });
  }

  // Update arrow disabled states based on visible columns
  function updateArrows() {
    const inviewColumns = parseInt(window.getComputedStyle(sliderEl).getPropertyValue('--flick-col'), 10);
    if (!flickity.cells[flickity.selectedIndex - 1]) {
      if (prevButton) prevButton.setAttribute('disabled', 'disabled');
      if (nextButton) nextButton.removeAttribute('disabled');
    } else if (!flickity.cells[flickity.selectedIndex + inviewColumns]) {
      if (nextButton) nextButton.setAttribute('disabled', 'disabled');
      if (prevButton) prevButton.removeAttribute('disabled');
    } else {
      if (prevButton) prevButton.removeAttribute('disabled');
      if (nextButton) nextButton.removeAttribute('disabled');
    }
  }

  // Dot navigation
  const dots = slider.querySelectorAll('[data-flickity-dot]');
  if (dots.length) {
    dots.forEach((dot, dotIndex) => {
      dot.addEventListener('click', function () {
        const inviewColumns = parseInt(window.getComputedStyle(sliderEl).getPropertyValue('--flick-col'), 10);
        const maxIndex = flickity.cells.length - inviewColumns;
        let targetIndex = dotIndex;
        if (targetIndex > maxIndex) targetIndex = maxIndex;
        flickity.select(targetIndex);
      });
    });
  }

  // Update active dot based on visible columns
  function updateDots() {
    const inviewColumns = parseInt(window.getComputedStyle(sliderEl).getPropertyValue('--flick-col'), 10);
    const maxIndex = flickity.cells.length - inviewColumns;
    const activeIndex = flickity.selectedIndex < maxIndex ? flickity.selectedIndex : maxIndex;
    const allDots = slider.querySelectorAll('[data-flickity-dot]');
    allDots.forEach((dot, i) => {
      dot.setAttribute('data-flickity-dot', i === activeIndex ? 'active' : '');
    });
  }

  initializedSliders.push({ slider, sliderEl, flickity });
}

export function initFlickitySliders(scope) {
  scope = scope || document;
  const sliders = scope.querySelectorAll('[data-flickity-type="cards"]');
  if (!sliders.length) return;
  sliders.forEach(initFlickityComponent);
}

export function destroyFlickitySliders() {
  initializedSliders.forEach(({ slider, flickity }) => {
    if (flickity && typeof flickity.destroy === 'function') {
      flickity.destroy();
    }
    slider.removeAttribute('data-flickity-status');
    slider.removeAttribute('data-flickity-count');
    slider.removeAttribute('id');
  });
  initializedSliders = [];
}
