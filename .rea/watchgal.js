(async () => {
  const snap = () => {
    const items = [...document.querySelectorAll('.gallery-view-item')];
    return {
      active: items.findIndex((i) => i.classList.contains('active')),
      classes: items.map((i) => i.className.replace('gallery-view-item p-absolute', '').trim()),
    };
  };
  const out = [];
  for (let i = 0; i < 7; i++) {
    out.push(snap());
    await new Promise((r) => setTimeout(r, 2000));
  }
  return out;
})()
