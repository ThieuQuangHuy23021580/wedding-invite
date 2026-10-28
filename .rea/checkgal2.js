(async () => {
  const total = document.body.scrollHeight;
  for (let y = 0; y <= total; y += 300) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 800));

  const items = [...document.querySelectorAll('.gallery-view-item')];
  const controls = [...document.querySelectorAll('.gallery-controls-item')];
  const stillLazy = document.querySelectorAll('.lazy').length;
  return {
    lazyRemaining: stillLazy,
    firstItem: {
      cls: items[0].className,
      bg: getComputedStyle(items[0]).backgroundImage.slice(0, 120),
    },
    control0: {
      cls: controls[0].className,
      bg: getComputedStyle(controls[0]).backgroundImage.slice(0, 120),
    },
    activeItemIdx: items.findIndex((i) => i.classList.contains('active')),
  };
})()
