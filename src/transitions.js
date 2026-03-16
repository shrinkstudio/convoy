// -----------------------------------------
// CONVOY — SCRIPT INITIALISATION
// No page transitions for MVP — full page reloads.
// Barba transition code preserved in git history.
// -----------------------------------------

import { initThemeToggle } from './theme-toggle.js';
import { initAccordions } from './accordion.js';
import { initTabs } from './tabs.js';
import { initSliders } from './slider.js';
import { initInlineVideos } from './inline-video.js';
import { initModalDelegation, initModals } from './modal.js';
import { initFontSizeDetect, initFooterYear, initSkipLink } from './utilities.js';
import { initNavScrollHide } from './nav.js';
import { initBunnyBackground } from './bunny-video.js';
import { initParallax } from './parallax.js';
import { initStackingCards } from './stacking-cards.js';
import { initFooterParallax } from './footer-parallax.js';
import { initCopyClip } from './copy-clip.js';
import { initProductGallery } from './product-gallery.js';
import { initCart } from './cart.js';
import { initLocaleSwitcher } from './locale-switcher.js';
import { initHoverList } from './hover-list.js';

gsap.registerPlugin(CustomEase);
if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
if (typeof Flip !== 'undefined') gsap.registerPlugin(Flip);

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });

const has = (s) => !!document.querySelector(s);


// -----------------------------------------
// INIT ON LOAD
// -----------------------------------------

function initAll() {
  // One-time setup
  // Lenis disabled for MVP — no Barba lifecycle to manage start/stop
  // initLenis();
  initModalDelegation();
  initFontSizeDetect();
  initSkipLink();

  // Per-page components
  if (has('.nav'))                       initNavScrollHide(document);
  if (has('[data-theme-toggle]'))       initThemeToggle(document);
  if (has('details'))                   initAccordions(document);
  if (has('[data-tabs-component]'))     initTabs(document);
  if (has('[data-slider]'))             initSliders(document);
  if (has('[data-video]'))              initInlineVideos(document);
  if (has('[data-bunny-background-init]')) initBunnyBackground(document);
  if (has('dialog'))                    initModals(document);
  if (has('[data-parallax="trigger"]')) initParallax(document);
  if (has('[data-stacking-cards-item]')) initStackingCards(document);
  if (has('[data-footer-parallax]'))    initFooterParallax(document);
  if (has('[data-footer-year]'))        initFooterYear(document);
  if (has('[data-copy="trigger"]'))     initCopyClip(document);
  if (has('[data-slideshow="wrap"]'))   initProductGallery(document);
  if (has('[data-cart="drawer"]'))      initCart(document);
  if (has('.nav'))                      initLocaleSwitcher(document);
  if (has('[data-hover-list]'))         initHoverList(document);
}

initAll();


// -----------------------------------------
// LENIS SMOOTH SCROLL
// -----------------------------------------

let lenis = null;

function initLenis() {
  if (lenis) return;
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  window.__convoyLenis = lenis;

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}
