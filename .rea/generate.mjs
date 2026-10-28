/**
 * Rebuilds index.html + css/style.css from the measured layout model of the
 * original page. Every position, rotation, clip and text style below comes
 * from `.rea/orig/model.json` (REA DOM measurement of the live site).
 */
import fs from 'node:fs';

const model = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const assetMap = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));

const urlToLocal = {};
for (const [url, info] of Object.entries(assetMap)) {
  urlToLocal[url] = `../assets/${info.dir}/${info.name}`;
}
Object.assign(urlToLocal, {
  'https://content.pancake.vn/1/fwebp90/63/9e/fc/73/d234953c97a20f05f071a057a6aa90497843a634f9f2be8df6d9d7fc-w:640-h:1136-l:735352-t:image/png.png':
    '../assets/img/texture-paper.webp',
  'https://content.pancake.vn/1/08/3f/7a/e9/be9a053a77ec7cdb461246a62779525962247b7146d4dcccce9c1cfb.png':
    '../assets/img/social-1.png',
  'https://content.pancake.vn/1/be/ad/61/25/69ccff4bf9c533a8297ad940b8f871b8bc7057593d2ec6f7d9c9066b.png':
    '../assets/img/social-2.png',
  'https://content.pancake.vn/1/de/96/e1/6c/a9e20124a7f7f7418ba5112ef7a2f82d1967983b21065c77895a7f10.png':
    '../assets/img/social-3.png',
});

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cssFor = (n) => {
  const decls = [];
  const px = (v) => `${v}px`;

  decls.push(`left:${px(n.left)}`);
  decls.push(`top:${px(n.top)}`);
  decls.push(`width:${px(n.w)}`);
  decls.push(`height:${px(n.h)}`);

  if (n.rot) decls.push(`transform:rotate(${n.rot}deg)`);
  if (n.z !== null && n.z !== undefined) decls.push(`z-index:${n.z}`);
  if (n.op && n.op !== '1') decls.push(`opacity:${n.op}`);
  if (n.radius && n.radius !== '0px') decls.push(`border-radius:${n.radius}`);

  if (n.bgUrl) {
    const local = urlToLocal[n.bgUrl];
    if (local) {
      decls.push(`background-image:url("${local}")`);
      decls.push(`background-size:${n.bgSize || 'cover'}`);
      decls.push(`background-position:${n.bgPos || '50% 50%'}`);
      decls.push(`background-repeat:no-repeat`);
    }
  }
  if (n.maskUrl) {
    const local = urlToLocal[n.maskUrl];
    if (local) {
      decls.push(`mask-image:url("${local}")`);
      decls.push(`-webkit-mask-image:url("${local}")`);
      decls.push(`mask-size:${n.maskSize || 'auto'}`);
      decls.push(`-webkit-mask-size:${n.maskSize || 'auto'}`);
      decls.push(`mask-position:${n.maskPos || '50% 50%'}`);
      decls.push(`-webkit-mask-position:${n.maskPos || '50% 50%'}`);
      decls.push(`mask-repeat:no-repeat`);
      decls.push(`-webkit-mask-repeat:no-repeat`);
    }
  }
  if (n.borderUrl) {
    const local = urlToLocal[n.borderUrl];
    if (local) {
      decls.push(`border-image:url("${local}") 1 stretch`);
      decls.push(`border-style:solid`);
      decls.push(`border-width:1px`);
    }
  }
  if (n.overflow && n.overflow !== 'visible') decls.push(`overflow:${n.overflow}`);

  if (n.text) {
    decls.push(`font-family:${n.font}`);
    decls.push(`font-size:${n.size}px`);
    decls.push(`font-weight:${n.weight}`);
    decls.push(`color:${n.color}`);
    if (n.italic && n.italic !== 'normal') decls.push(`font-style:${n.italic}`);
    if (n.ls && n.ls !== 'normal') decls.push(`letter-spacing:${n.ls}`);
    if (n.lh) decls.push(`line-height:${n.lh}px`);
    if (n.align && n.align !== 'start') decls.push(`text-align:${n.align}`);
    if (n.textTransform && n.textTransform !== 'none') decls.push(`text-transform:${n.textTransform}`);
    decls.push('margin:0');
    decls.push('padding:0');
  }

  return decls.join(';');
};

const sections = [];

model.sections.forEach((sec, si) => {
  const byParent = new Map();
  sec.nodes.forEach((n) => {
    if (!byParent.has(n.parent)) byParent.set(n.parent, []);
    byParent.get(n.parent).push(n);
  });

  const roots = sec.nodes.filter((n) => n.parent === 0 || n.parent === 1 || n.parent === 3);

  let html = '';
  let css = '';

  function emit(n, indent) {
    const id = `n${si}_${n.i}`;
    const isText = !!n.text;
    const cls = [];
    if (n.cls) {
      const keep = n.cls
        .split(/\s+/)
        .filter((c) => /image-gradient-border|text-block|com-text-block|button|rectangle/.test(c));
      cls.push(...keep);
    }
    cls.push(`m${n.i}`);
    if (n.overflow && n.overflow !== 'visible') cls.push('clip');

    const style = cssFor(n);
    const inner = isText ? esc(n.text) : '';

    html += `${indent}<div id="${id}" class="${cls.join(' ')}" style="${style}">${inner}</div>\n`;
    css += `.m${n.i}{${style}}\n`;

    const kids = byParent.get(n.i) || [];
    kids.forEach((k) => emit(k, indent + '  '));
  }

  roots.forEach((r) => emit(r, '    '));

  sections.push({ sec, html, css });
});

fs.writeFileSync(
  process.argv[4] || '.rea/generated.json',
  JSON.stringify(sections, null, 2),
  'utf8'
);
console.log('sections built:', sections.length);
sections.forEach((s) => console.log(`  [${s.sec.i}] ${s.sec.id} h=${s.sec.h} html=${s.html.length}B css=${s.css.length}B`));
