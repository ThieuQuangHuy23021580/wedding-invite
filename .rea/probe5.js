(async () => {
  const out = [];
  document.querySelectorAll('script').forEach((s, i) => {
    const t = s.textContent || '';
    if (t.trim().length > 200) {
      out.push({ i, len: t.length, src: s.src, code: t });
    }
  });
  return out;
})()
