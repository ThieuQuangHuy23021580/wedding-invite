(async () => {
  // Force-load every lazy background by reading computed style
  const lazy = [...document.querySelectorAll('.lazy')];
  let loaded = 0, missing = 0;
  const broken = [];
  for (const el of lazy) {
    const bg = getComputedStyle(el).backgroundImage;
    if (!bg || bg === 'none') { missing++; continue; }
    const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
    if (!m) { missing++; continue; }
    const url = m[1];
    const ok = await new Promise((res) => {
      const i = new Image();
      i.onload = () => res(true);
      i.onerror = () => res(false);
      i.src = url;
    });
    if (ok) loaded++; else broken.push(url);
  }
  // Also check <img> tags
  const imgs = [...document.querySelectorAll('img')].map((i) => ({
    src: i.getAttribute('src'), nw: i.naturalWidth,
  }));
  return { lazyTotal: lazy.length, loaded, missing, broken, imgs,
           docH: document.body.scrollHeight };
})()
