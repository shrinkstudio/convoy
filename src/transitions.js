// -----------------------------------------
// CONVOY — PAGE TRANSITION BOILERPLATE
// Barba.js + GSAP + Lenis + Card-Stack Transition
// -----------------------------------------

import { initThemeToggle } from './theme-toggle.js';
import { initAccordions, destroyAccordions } from './accordion.js';
import { initTabs, destroyTabs } from './tabs.js';
import { initSliders, destroySliders } from './slider.js';
import { initInlineVideos, destroyInlineVideos } from './inline-video.js';
import { initModalDelegation, initModals, destroyModals } from './modal.js';
import { initFontSizeDetect, initFooterYear, initSkipLink } from './utilities.js';
import { initNavScrollHide, destroyNavScrollHide } from './nav.js';

gsap.registerPlugin(CustomEase);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });


// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Document-level delegation (bind once)
  initModalDelegation();
  initFontSizeDetect();
  initSkipLink();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // Destroy old instances before new page enters
  destroyNavScrollHide();
  destroyAccordions();
  destroyTabs();
  destroySliders();
  destroyInlineVideos();
  destroyModals();
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  // Init components on new page
  if (has('.nav'))                     initNavScrollHide(nextPage);
  if (has('[data-theme-toggle]'))     initThemeToggle(nextPage);
  if (has('details'))                 initAccordions(nextPage);
  if (has('[data-tabs-component]'))   initTabs(nextPage);
  if (has('[data-slider]'))           initSliders(nextPage);
  if (has('[data-video]'))            initInlineVideos(nextPage);
  if (has('dialog'))                  initModals(nextPage);
  if (has('[data-footer-year]'))       initFooterYear(nextPage);

  // Webflow IX2 reinit — fixes native nav dropdowns
  if (window.Webflow && window.Webflow.ready) {
    window.Webflow.ready();
  }

  if(hasLenis){
    lenis.resize();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
}


// -----------------------------------------
// PAGE TRANSITIONS (Card-Stack)
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next)
  }, null, 0);

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const parent = current.parentElement || document.body;

  const { wrapper } = prepareForTransition(parent, current, next);

  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionMiddle = transitionWrap.querySelector("[data-transition-middle]");
  const navigation = next.querySelector(".nav");

  const tl = gsap.timeline({
    onComplete: () => {
      wrapper.remove();
      gsap.set(parent, { clearProps: "perspective,transformStyle,overflow" });
      gsap.set(next, { clearProps: "position,inset,width,height,zIndex,transformStyle,willChange,backfaceVisibility,transform" });
      gsap.set(transitionWrap, { autoAlpha: 0, pointerEvents: "none", zIndex: -1 });
      gsap.set(transitionMiddle, { clearProps: "willChange,scale,yPercent,clipPath" });
    },
  });

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.to([wrapper, transitionMiddle, next], {
    clipPath: "rect(0% 100% 100% 0% round 1em)",
    duration: 0.8,
  }, 0);

  tl.to(wrapper, {
    scale: "0.95",
    duration: 1.2,
    yPercent: 20,
    ease: "expo.inOut",
    overwrite: "auto"
  }, "<");

  tl.to(transitionMiddle, {
    scale: "0.875",
    yPercent: 10,
    duration: 1.2,
    ease: "expo.inOut",
    overwrite: "auto"
  }, "<");

  tl.to(next, {
    scale: "0.8",
    yPercent: 0,
    duration: 1.2,
    ease: "expo.inOut",
    overwrite: "auto"
  }, "<");

  tl.to(wrapper, {
    yPercent: 130,
    duration: 1.2,
    ease: "osmo",
  }, "< 0.9");

  tl.to(transitionMiddle, {
    yPercent: 120,
    duration: 1.2,
    ease: "osmo",
  }, "< 0.15");

  tl.to(next, {
    scale: "1",
    yPercent: 0,
    duration: 1.2,
    ease: "expo.inOut",
    overwrite: "auto"
  }, "< 0.15");

  tl.to([wrapper, transitionMiddle, next], {
    clipPath: "rect(0% 100% 100% 0% round 0em)",
    duration: 0.8,
    ease: "osmo",
  }, "> -0.8");

  if (navigation) {
    tl.from(navigation, {
      yPercent: -100,
      duration: 1.2,
      ease: "osmo",
    }, "< -0.1");
  }

  return tl;
}

function runPageEnterAnimation(next){
  const tl = gsap.timeline();

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady")
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}

function prepareForTransition(parent, current, next){
  const wrapper = document.createElement("div");
  wrapper.className = "page-transition__wrapper";

  parent.insertBefore(wrapper, current);
  wrapper.appendChild(current);

  const scrollY = window.scrollY || 0;
  window.scrollTo(0, 0);

  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionMiddle = transitionWrap.querySelector("[data-transition-middle]");

  gsap.set(parent, {
    perspective: "100vw",
    transformStyle: "preserve-3d",
    overflow: "clip",
  });

  gsap.set(wrapper, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: "100vh",
    overflow: "clip",
    zIndex: 3,
    transformStyle: "preserve-3d",
    willChange: "transform",
    clipPath: "rect(0% 100% 100% 0% round 0em)"
  });

  gsap.set(current, {
    position: "absolute",
    top: -scrollY,
    left: 0,
    width: "100%",
    willChange: "transform, opacity",
    backfaceVisibility: "hidden",
  });

  gsap.set(transitionWrap, {
    zIndex: 2,
    autoAlpha: 1,
    pointerEvents: "auto",
  });

  gsap.set(transitionMiddle, {
    willChange: "transform, opacity",
    autoAlpha: 1,
    yPercent: 0,
    scale: 1,
    clipPath: "rect(0% 100% 100% 0% round 0em)"
  });

  gsap.set(next, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: "100vh",
    overflow: "clip",
    zIndex: 1,
    transformStyle: "preserve-3d",
    willChange: "transform, opacity",
    backfaceVisibility: "hidden",
    autoAlpha: 1,
    yPercent: 0,
    scale: 1,
    clipPath: "rect(0% 100% 100% 0% round 0em)"
  });

  return { wrapper, scrollY };
}


// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.beforeEnter(data => {
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if(hasScrollTrigger){
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
})

barba.hooks.afterEnter(data => {
  initAfterEnterFunctions(data.next.container);

  if(hasLenis){
    lenis.resize();
    lenis.start();
  }

  if(hasScrollTrigger){
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: false,
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      async once(data) {
        initOnceFunctions();
        return runPageOnceAnimation(data.next.container);
      },

      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    }
  ],
});


// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

const themeConfig = {
  light: {
    nav: "dark",
    transition: "light"
  },
  dark: {
    nav: "light",
    transition: "dark"
  }
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector('[data-theme-transition]');
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector('[data-theme-nav]');
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function initLenis() {
  if (lenis) return;
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  // Expose for nav scroll hide and other scripts
  window.__convoyLenis = lenis;

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container){
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if(hasLenis){
    lenis.resize();
    lenis.start();
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth,
    timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement('template');
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
  var currentNodes = document.querySelectorAll('nav [data-barba-update]');

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    var newStatus = next.getAttribute('aria-current');
    if (newStatus !== null) {
      curr.setAttribute('aria-current', newStatus);
    } else {
      curr.removeAttribute('aria-current');
    }

    var newClassList = next.getAttribute('class') || '';
    curr.setAttribute('class', newClassList);
  });
}


// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------
