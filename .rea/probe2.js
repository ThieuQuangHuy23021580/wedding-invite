(async () => {
  const out = { fonts: [], sheets: [], anchors: [], gallery: [], calendar: [], inputs: [] };

  // 1. @font-face rules from same-origin stylesheets
  for (const sheet of document.styleSheets) {
    let rules = null;
    try { rules = sheet.cssRules; } catch (e) { out.sheets.push({ href: sheet.href, blocked: true }); continue; }
    if (!rules) continue;
    out.sheets.push({ href: sheet.href, rules: rules.length });
    for (const r of rules) {
      if (r.type === CSSRule.FONT_FACE_RULE) {
        out.fonts.push({
          family: r.style.getPropertyValue('font-family').replace(/["']/g, ''),
          weight: r.style.getPropertyValue('font-weight'),
          style: r.style.getPropertyValue('font-style'),
          src: r.style.getPropertyValue('src'),
        });
      }
    }
  }

  // 2. anchors
  document.querySelectorAll('a').forEach((a) => {
    out.anchors.push({ text: a.innerText.trim().slice(0, 40), href: a.getAttribute('href'), cls: a.className });
  });

  // 3. gallery items
  const gv = document.querySelector('.gallery-view');
  if (gv) {
    [...gv.children].forEach((it, i) => {
      const r = it.getBoundingClientRect();
      out.gallery.push({
        i, cls: it.className,
        w: Math.round(r.width), h: Math.round(r.height),
        bg: getComputedStyle(it).backgroundImage.slice(0, 120),
      });
    });
  }

  // 4. calendar structure
  const cal = document.querySelector('[class*="calendar"]');
  if (cal) {
    out.calendar.push({ cls: cal.className, html: cal.outerHTML.slice(0, 4000) });
  }
  const calCells = [...document.querySelectorAll('[class*="calendar"] div')]
    .slice(0, 60)
    .map((d) => ({ cls: d.className, txt: d.innerText.trim().slice(0, 12) }));
  out.calendar.push({ cells: calCells });

  // 5. form controls
  document.querySelectorAll('input, select, textarea').forEach((el) => {
    out.inputs.push({
      tag: el.tagName.toLowerCase(), type: el.type || '', name: el.name || '',
      placeholder: el.placeholder || '', value: (el.value || '').slice(0, 30),
      cls: el.className,
    });
  });

  // 6. loaded font families actually used
  out.used = [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style} ${f.status}`);

  return out;
})()
