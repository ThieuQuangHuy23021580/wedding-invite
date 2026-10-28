(async () => {
  const files = ['img-00.webp','img-01.webp','img-02.webp','img-03.webp','img-04.webp','img-05.webp',
                 'img-06.webp','img-07.webp','img-08.png','img-09.webp','img-10.webp','img-11.webp',
                 'img-12.webp','img-13.webp','img-14.webp','img-15.png','img-16.webp','texture-paper.webp'];
  const out = {};
  for (const f of files) {
    out[f] = await new Promise((res) => {
      const img = new Image();
      img.onload = () => res({ ok: true, w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => res({ ok: false });
      img.src = '/assets/img/' + f;
    });
  }
  return out;
})()
