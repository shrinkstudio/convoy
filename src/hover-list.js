// -----------------------------------------
// HOVER LIST — Flip-powered hover highlight
// -----------------------------------------

let timelines = [];
let listeners = [];

export function initHoverList(scope) {
  scope = scope || document;

  scope.querySelectorAll("[data-hover-list]").forEach(function (component) {
    if (component.hasAttribute("data-hover-init")) return;
    component.setAttribute("data-hover-init", "");

    const items = component.querySelectorAll("[data-hover-item]");
    component.querySelectorAll("[data-hover-background]").forEach((el, i) => i && el.remove());
    const background = component.querySelector("[data-hover-background]");
    const fill = component.querySelector("[data-hover-fill]");
    let hoverBetween = false;

    const tl = gsap.timeline({ paused: true, onReverseComplete: () => hoverBetween = false });
    tl.fromTo(fill, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2 });
    timelines.push(tl);

    function flipInto(item) {
      const state = Flip.getState(background);
      item.querySelector("[data-hover-visual]")?.prepend(background);
      if (hoverBetween) Flip.from(state, { duration: 0.3, ease: "power1.inOut" });
    }

    items.forEach(function (item) {
      const handler = function () {
        flipInto(item);
        hoverBetween = true;
      };
      item.addEventListener("mouseenter", handler);
      listeners.push({ element: item, type: "mouseenter", handler });
    });

    const enterHandler = () => tl.play();
    const leaveHandler = () => tl.reverse();
    component.addEventListener("mouseenter", enterHandler);
    component.addEventListener("mouseleave", leaveHandler);
    listeners.push(
      { element: component, type: "mouseenter", handler: enterHandler },
      { element: component, type: "mouseleave", handler: leaveHandler }
    );
  });
}

export function destroyHoverList() {
  timelines.forEach(tl => { try { tl.kill(); } catch (_) {} });
  timelines = [];

  listeners.forEach(({ element, type, handler }) => {
    element.removeEventListener(type, handler);
  });
  listeners = [];

  document.querySelectorAll("[data-hover-init]").forEach(el => {
    el.removeAttribute("data-hover-init");
  });
}
