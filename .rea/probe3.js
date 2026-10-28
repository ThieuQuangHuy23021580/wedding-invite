(async () => {
  const out = { styles: [], bodyChain: [], secBg: [], gradients: [], htmlLen: 0 };

  document.querySelectorAll('style').forEach((s, i) => {
    out.styles.push({ i, len: s.textContent.length, css: s.textContent });
  });

  let el = document.querySelector('.com-section');
  const chain = [];
  while (el && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    chain.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      cls: (el.className || '').toString(),
      w: Math.round(el.getBoundingClientRect().width),
      bg: cs.backgroundColor,
      bgImg: cs.backgroundImage.slice(0, 80),
      overflow: cs.overflow,
    });
    el = el.parentElement;
  }
  out.bodyChain = chain;

  document.querySelectorAll('.com-section').forEach((sec, i) => {
    const bg = sec.querySelector('.section-background');
    const cs = getComputedStyle(sec);
    out.secBg.push({
      i,
      id: sec.id,
      h: Math.round(sec.getBoundingClientRect().height),
      secBg: cs.backgroundColor,
      secBgImg: cs.backgroundImage.slice(0, 100),
      wrapperBg: bg ? getComputedStyle(bg).backgroundColor : null,
      wrapperBgImg: bg ? getComputedStyle(bg).backgroundImage.slice(0, 100) : null,
    });
  });

  document.querySelectorAll('.image-gradient-border').forEach((d) => {
    const cs = getComputedStyle(d);
    const r = d.getBoundingClientRect();
    out.gradients.push({
      w: Math.round(r.width), h: Math.round(r.height),
      bg: cs.backgroundImage.slice(0, 160),
      borderImage: cs.borderImageSource.slice(0, 160),
      borderW: cs.borderWidth,
      radius: cs.borderRadius,
      boxShadow: cs.boxShadow.slice(0, 120),
      opacity: cs.opacity,
    });
  });

  out.htmlLen = document.documentElement.outerHTML.length;
  return out;
})()
