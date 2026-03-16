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
import { initLocaleSwitcher } from './locale-switcher.js';
import { initHoverList } from './hover-list.js';

const has = (s) => !!document.querySelector(s);


// -----------------------------------------
// REGISTER PLUGINS & INIT ON LOAD
// -----------------------------------------

function registerPlugins() {
  gsap.registerPlugin(CustomEase);
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  if (typeof Flip !== 'undefined') gsap.registerPlugin(Flip);
  if (typeof Observer !== 'undefined') gsap.registerPlugin(Observer);

  CustomEase.create("osmo", "0.625, 0.05, 0, 1");
  gsap.defaults({ ease: "osmo", duration: 0.6 });
}

function initAll() {
  registerPlugins();

  // One-time setup
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
  if (has('.nav'))                      initLocaleSwitcher(document);
  if (has('[data-hover-list]'))         initHoverList(document);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}


