// -----------------------------------------
// FOOTER PARALLAX — Scroll-driven footer reveal
// -----------------------------------------

let scrollTriggers = [];

export function initFooterParallax(scope) {
  if (typeof ScrollTrigger === 'undefined') return;
  scope = scope || document;

  scope.querySelectorAll("[data-footer-parallax]").forEach(function (el) {
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "clamp(top bottom)",
        end: "clamp(top top)",
        scrub: true
      }
    });

    var inner = el.querySelector("[data-footer-parallax-inner]");
    var dark = el.querySelector("[data-footer-parallax-dark]");

    if (inner) {
      tl.from(inner, {
        yPercent: -25,
        ease: "linear"
      });
    }

    if (dark) {
      tl.from(dark, {
        opacity: 0.5,
        ease: "linear"
      }, "<");
    }

    if (tl.scrollTrigger) {
      scrollTriggers.push(tl.scrollTrigger);
    }
  });
}

export function destroyFooterParallax() {
  scrollTriggers.forEach(function (st) {
    try { st.kill(); } catch (_) {}
  });
  scrollTriggers = [];
}
