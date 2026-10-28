(async () => {
  const els = [...document.querySelectorAll('.gallery-view-item')];
  const vh = window.innerHeight;
  return els.map((el, i) => {
    const r = el.getBoundingClientRect();
    const s = (r.y || r.top) + window.scrollY;
    const scroll = window.scrollY;
    return {
      i,
      cls: el.className,
      top: Math.round(s),
      h: el.offsetHeight,
      // replicate the original condition
      skipAbove: s >= scroll + 2 * vh,
      skipBelow: s + el.offsetHeight <= scroll,
    };
  });
})()
