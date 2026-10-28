(async () => {
  const html = document.body.innerHTML;
  const head = [...document.querySelectorAll('head link, head meta, head title')].map((e) => e.outerHTML);
  return { len: html.length, head, html };
})()
