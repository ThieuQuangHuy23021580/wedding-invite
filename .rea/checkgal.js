(async () => {
  const items = [...document.querySelectorAll('.gallery-view-item')];
  const controls = [...document.querySelectorAll('.gallery-controls-item')];
  return {
    itemCount: items.length,
    controlCount: controls.length,
    items: items.slice(0, 4).map((el) => ({
      cls: el.className,
      bg: getComputedStyle(el).backgroundImage.slice(0, 130),
      w: Math.round(el.getBoundingClientRect().width),
      h: Math.round(el.getBoundingClientRect().height),
    })),
    controls: controls.slice(0, 3).map((el) => ({
      cls: el.className,
      bg: getComputedStyle(el).backgroundImage.slice(0, 130),
    })),
  };
})()
