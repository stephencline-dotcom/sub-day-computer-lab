/* Small DOM helpers shared by the visual K1 activities. */
(function () {
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(className, label, onClick) {
    const node = element("button", className);
    node.type = "button";
    node.setAttribute("aria-label", label);
    if (onClick) node.addEventListener("click", onClick);
    return node;
  }

  function shuffled(items) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  /* Varied, slightly jittered spots so scene objects never look like a grid. */
  const SCATTER_POOL = [
    { x: 14, y: 24 }, { x: 82, y: 20 }, { x: 50, y: 14 }, { x: 24, y: 62 },
    { x: 72, y: 66 }, { x: 46, y: 70 }, { x: 10, y: 54 }, { x: 88, y: 56 },
    { x: 34, y: 40 }, { x: 64, y: 36 }
  ];

  function scatterPositions(count) {
    return shuffled(SCATTER_POOL).slice(0, count).map((spot) => ({
      x: Math.min(92, Math.max(8, spot.x + (Math.random() * 8 - 4))),
      y: Math.min(88, Math.max(10, spot.y + (Math.random() * 6 - 3)))
    }));
  }

  function pulse(el, className) {
    if (!el) return;
    const cls = className || "scene-pulse";
    el.classList.remove(cls);
    // eslint-disable-next-line no-void
    void el.offsetWidth;
    el.classList.add(cls);
  }

  window.SubDay = window.SubDay || {};
  window.SubDay.K1ActivityUtils = { element, button, shuffled, scatterPositions, pulse };
}());