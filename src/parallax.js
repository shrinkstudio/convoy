// -----------------------------------------
// GLOBAL PARALLAX — Data-attribute driven
// Uses GSAP ScrollTrigger, works with Lenis smooth scroll
// -----------------------------------------

let matchMediaInstance = null;

export function initParallax(scope) {
  if (typeof ScrollTrigger === 'undefined') return;
  scope = scope || document;

  const triggers = scope.querySelectorAll('[data-parallax="trigger"]');
  if (!triggers.length) return;

  matchMediaInstance = gsap.matchMedia();

  matchMediaInstance.add(
    {
      isMobile: '(max-width:479px)',
      isMobileLandscape: '(max-width:767px)',
      isTablet: '(max-width:991px)',
      isDesktop: '(min-width:992px)',
    },
    (context) => {
      const { isMobile, isMobileLandscape, isTablet } = context.conditions;

      const ctx = gsap.context(() => {
        triggers.forEach((trigger) => {
          // Breakpoint disabling
          const disable = trigger.getAttribute('data-parallax-disable');
          if (
            (disable === 'mobile' && isMobile) ||
            (disable === 'mobileLandscape' && isMobileLandscape) ||
            (disable === 'tablet' && isTablet)
          ) {
            return;
          }

          // Optional inner target
          const target = trigger.querySelector('[data-parallax="target"]') || trigger;

          // Direction: vertical (yPercent) or horizontal (xPercent)
          const direction = trigger.getAttribute('data-parallax-direction') || 'vertical';
          const prop = direction === 'horizontal' ? 'xPercent' : 'yPercent';

          // Scrub value
          const scrubAttr = trigger.getAttribute('data-parallax-scrub');
          const scrub = scrubAttr ? parseFloat(scrubAttr) : true;

          // Start/end positions (%)
          const startAttr = trigger.getAttribute('data-parallax-start');
          const startVal = startAttr !== null ? parseFloat(startAttr) : 20;

          const endAttr = trigger.getAttribute('data-parallax-end');
          const endVal = endAttr !== null ? parseFloat(endAttr) : -20;

          // ScrollTrigger start/end
          const scrollStartRaw = trigger.getAttribute('data-parallax-scroll-start') || 'top bottom';
          const scrollStart = 'clamp(' + scrollStartRaw + ')';

          const scrollEndRaw = trigger.getAttribute('data-parallax-scroll-end') || 'bottom top';
          const scrollEnd = 'clamp(' + scrollEndRaw + ')';

          gsap.fromTo(
            target,
            { [prop]: startVal },
            {
              [prop]: endVal,
              ease: 'none',
              scrollTrigger: {
                trigger,
                start: scrollStart,
                end: scrollEnd,
                scrub,
              },
            }
          );
        });
      });

      return () => ctx.revert();
    }
  );
}

export function destroyParallax() {
  if (matchMediaInstance) {
    matchMediaInstance.revert();
    matchMediaInstance = null;
  }
}
