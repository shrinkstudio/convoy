// -----------------------------------------
// STACKING CARDS PARALLAX
// Sections stack on top of each other with parallax + rotation
// Uses GSAP ScrollTrigger
// -----------------------------------------

let scrollTriggers = [];

export function initStackingCards(scope) {
  if (typeof ScrollTrigger === 'undefined') return;
  scope = scope || document;

  const cards = scope.querySelectorAll('[data-stacking-cards-item]');
  if (cards.length < 2) return;

  cards.forEach((card, i) => {
    // Skip the first card — it has nothing before it
    if (i === 0) return;

    const previousCard = cards[i - 1];
    if (!previousCard) return;

    const previousCardImage = previousCard.querySelector('[data-stacking-cards-img]');

    const tl = gsap.timeline({
      defaults: { ease: 'none', duration: 1 },
      scrollTrigger: {
        trigger: card,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    tl.fromTo(previousCard, { yPercent: 0 }, { yPercent: 50 });

    if (previousCardImage) {
      tl.fromTo(
        previousCardImage,
        { rotate: 0, yPercent: 0 },
        { rotate: -5, yPercent: -25 },
        '<'
      );
    }

    // Store for cleanup
    if (tl.scrollTrigger) {
      scrollTriggers.push(tl.scrollTrigger);
    }
  });
}

export function destroyStackingCards() {
  scrollTriggers.forEach((st) => {
    try { st.kill(); } catch (_) {}
  });
  scrollTriggers = [];
}
