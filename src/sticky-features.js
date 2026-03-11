// -----------------------------------------
// STICKY FEATURES — Scroll-pinned step transitions with pagination
// -----------------------------------------
// Based on Osmo Sticky Features, extended with:
//   - Clickable pagination indicators
//   - Per-step progress ring on active dot
//
// Attributes:
//   [data-sticky-feature-wrap]          — outer pinned section
//   [data-sticky-feature-visual-wrap]   — each visual panel (stacked, clip-path reveal)
//   [data-sticky-feature-item]          — each text block (matched 1:1 with visuals)
//   [data-sticky-feature-text]          — child elements that fade/slide per step
//   [data-sticky-feature-progress]      — overall progress bar (scaleX)
//   [data-sticky-feature-page]          — pagination dot (one per step, DOM order)
//   [data-sticky-feature-page-progress] — SVG circle inside each dot for step progress ring

let scrollTriggers = [];
let clickListeners = [];

export function initStickyFeatures(scope) {
  scope = scope || document;
  var wraps = Array.from(scope.querySelectorAll("[data-sticky-feature-wrap]"));
  if (!wraps.length) return;

  var rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DURATION = rm ? 0.01 : 0.75;
  var EASE = "power4.inOut";
  var SCROLL_AMOUNT = 0.9;

  wraps.forEach(function (w) {
    var visualWraps = Array.from(w.querySelectorAll("[data-sticky-feature-visual-wrap]"));
    var items = Array.from(w.querySelectorAll("[data-sticky-feature-item]"));
    var progressBar = w.querySelector("[data-sticky-feature-progress]");
    var pages = Array.from(w.querySelectorAll("[data-sticky-feature-page]"));
    var pageRings = Array.from(w.querySelectorAll("[data-sticky-feature-page-progress]"));

    var count = Math.min(visualWraps.length, items.length);
    if (count < 1) return;

    var steps = Math.max(1, count - 1);
    var currentIndex = 0;
    var st = null;

    function getTexts(el) {
      return Array.from(el.querySelectorAll("[data-sticky-feature-text]"));
    }

    // Initial state
    gsap.set(w, { position: "relative", zIndex: 10 });
    if (visualWraps[0]) gsap.set(visualWraps[0], { clipPath: "inset(0% round 0.75em)" });
    gsap.set(items[0], { autoAlpha: 1 });
    if (pages[0]) pages[0].classList.add("is-active");

    // --- Transitions ---

    function transition(fromIndex, toIndex) {
      if (fromIndex === toIndex) return;
      var tl = gsap.timeline({ defaults: { overwrite: "auto" } });

      if (fromIndex < toIndex) {
        tl.to(visualWraps[toIndex], {
          clipPath: "inset(0% round 0.75em)",
          duration: DURATION,
          ease: EASE
        }, 0);
      } else {
        tl.to(visualWraps[fromIndex], {
          clipPath: "inset(50% round 0.75em)",
          duration: DURATION,
          ease: EASE
        }, 0);
      }

      animateOut(items[fromIndex]);
      animateIn(items[toIndex]);
    }

    function animateOut(itemEl) {
      var texts = getTexts(itemEl);
      gsap.to(texts, {
        autoAlpha: 0,
        y: -30,
        ease: "power4.out",
        duration: 0.4,
        onComplete: function () { gsap.set(itemEl, { autoAlpha: 0 }); }
      });
    }

    function animateIn(itemEl) {
      var texts = getTexts(itemEl);
      gsap.set(itemEl, { autoAlpha: 1 });
      gsap.fromTo(texts,
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, ease: "power4.out", duration: DURATION, stagger: 0.1 }
      );
    }

    // --- Pagination ---

    function updatePages(idx, stepProgress) {
      pages.forEach(function (page, i) {
        if (i === idx) {
          page.classList.add("is-active");
        } else {
          page.classList.remove("is-active");
        }
      });

      // Progress ring on active dot
      pageRings.forEach(function (ring, i) {
        if (i === idx) {
          // stepProgress 0→1 maps to full circle
          var circumference = parseFloat(ring.getAttribute("data-circumference") || ring.getTotalLength());
          gsap.set(ring, { strokeDashoffset: circumference * (1 - stepProgress) });
        } else {
          // Reset non-active rings
          var c = parseFloat(ring.getAttribute("data-circumference") || ring.getTotalLength());
          gsap.set(ring, { strokeDashoffset: c });
        }
      });
    }

    // Click handler — scroll to the step's scroll position
    function handlePageClick(targetIndex) {
      if (!st || targetIndex === currentIndex) return;

      // Each step occupies 1/steps of the SCROLL_AMOUNT band
      var targetProgress = (targetIndex / steps) * SCROLL_AMOUNT;
      var scrollStart = st.start;
      var scrollEnd = st.end;
      var targetScroll = scrollStart + targetProgress * (scrollEnd - scrollStart);

      // Use Lenis if available, otherwise native scroll
      if (window.__convoyLenis) {
        window.__convoyLenis.scrollTo(targetScroll, { immediate: false });
      } else {
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    }

    pages.forEach(function (page, i) {
      var handler = function () { handlePageClick(i); };
      page.addEventListener("click", handler);
      page.style.cursor = "pointer";
      clickListeners.push({ el: page, handler: handler });
    });

    // --- ScrollTrigger ---

    st = ScrollTrigger.create({
      trigger: w,
      start: "center center",
      end: function () { return "+=" + (steps * 100) + "%"; },
      pin: true,
      pinType: "transform",
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        var p = Math.min(self.progress, SCROLL_AMOUNT) / SCROLL_AMOUNT;
        var idx = Math.floor(p * steps + 1e-6);
        idx = Math.max(0, Math.min(steps, idx));

        // Overall progress bar
        if (progressBar) {
          gsap.to(progressBar, { scaleX: p, ease: "none" });
        }

        // Per-step progress (0→1 within current step)
        var stepStart = idx / steps;
        var stepEnd = (idx + 1) / steps;
        var stepProgress = stepEnd > stepStart
          ? Math.min(1, Math.max(0, (p - stepStart) / (stepEnd - stepStart)))
          : 0;

        // Update pagination
        updatePages(idx, stepProgress);

        // Step transition
        if (idx !== currentIndex) {
          transition(currentIndex, idx);
          currentIndex = idx;
        }
      }
    });

    scrollTriggers.push(st);
  });
}

export function destroyStickyFeatures() {
  scrollTriggers.forEach(function (st) {
    try { st.kill(); } catch (_) {}
  });
  scrollTriggers = [];

  clickListeners.forEach(function (entry) {
    entry.el.removeEventListener("click", entry.handler);
  });
  clickListeners = [];
}
