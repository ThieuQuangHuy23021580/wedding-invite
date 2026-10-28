import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2]; // project root
const manifest = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const body = fs.readFileSync(process.argv[4], 'utf8');
const styles = fs.readFileSync(process.argv[5], 'utf8');

const relOf = (url) => {
  const clean = url.replace(/&quot;$/, '').replace(/&amp;$/, '');
  if (manifest[clean]) return '/assets/' + manifest[clean].replace(/\\/g, '/');
  if (manifest[url]) return '/assets/' + manifest[url].replace(/\\/g, '/');
  return null;
};

const rewrite = (text) =>
  text.replace(/https?:\/\/[^\s"')]+/g, (url) => relOf(url) || url);

const cssOut = rewrite(styles);
const htmlOut = rewrite(body);

/* ------------------------------------------------------------ page shell */
const fontFaces = [
  ['KD-Aureligena-Script.ttf', 'fonts/thiep-6.ttf', 'truetype'],
  ['thiep 1.otf', 'fonts/thiep-1.otf', 'opentype'],
  ['thiep 4.ttf', 'fonts/thiep-4.ttf', 'truetype'],
  ['thiep 6.ttf', 'fonts/thiep-6.ttf', 'truetype'],
];

const localCss = fontFaces
  .map(
    ([fam, file, fmt]) =>
      `@font-face{font-family:"${fam}";src:url("/assets/${file}") format("${fmt}");font-display:swap;}`
  )
  .join('\n');

const cssDir = path.join(OUT, 'css');
fs.mkdirSync(cssDir, { recursive: true });
fs.writeFileSync(path.join(cssDir, 'layout.css'), localCss + '\n' + cssOut, 'utf8');

/* ------------------------------------------------------- custom behaviour */
const appJs = `/* Interactive behaviour recreated for the self-hosted build. */
(function () {
  'use strict';

  /* ---------------------------------------------------------- lazy images */
  /* Mirrors the original WebCake behaviour: the .lazy class forces
     background to none, so revealing an element simply means dropping
     the class and letting the layout CSS take over. */
  var lazyNodes = [];

  function collectLazy() {
    lazyNodes = Array.prototype.slice.call(document.querySelectorAll('.lazy, [data-src]'));
    // Original sorts by the --type custom property (paint order).
    lazyNodes.sort(function (a, b) {
      var av = getComputedStyle(a).getPropertyValue('--type') || 0;
      var bv = getComputedStyle(b).getPropertyValue('--type') || 0;
      return ~~av - ~~bv;
    });
  }

  function handleLazyLoad() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    var viewport = window.innerHeight || document.documentElement.clientHeight || 0;
    var remaining = [];

    for (var i = 0; i < lazyNodes.length; i++) {
      var el = lazyNodes[i];
      var r = el.getBoundingClientRect();
      if (!r.top && !r.left && !r.right && !r.bottom) { remaining.push(el); continue; }
      var top = (r.y || r.top) + scrollTop;
      // Skip elements that are not rendered yet (display:none slides) — they
      // are revealed by the gallery when they become active.
      if (!el.offsetHeight && !el.offsetWidth) { remaining.push(el); continue; }
      if (top >= scrollTop + 2 * viewport || top + el.offsetHeight <= scrollTop) {
        remaining.push(el);
        continue;
      }
      if (el.classList.contains('lazy')) el.classList.remove('lazy');
      if (el.hasAttribute('data-src')) {
        el.src = el.getAttribute('data-src');
        el.removeAttribute('data-src');
      }
    }

    lazyNodes = remaining;
    if (!lazyNodes.length) {
      window.removeEventListener('scroll', handleLazyLoad, { passive: true });
    }
  }

  /* ------------------------------------------------------------- gallery */
  function initGallery(root) {
    var items = root.querySelectorAll('.gallery-view-item');
    var controls = root.querySelectorAll('.gallery-controls-item');
    var wrap = root.querySelector('.gallery-controls-wrap');
    var nextBtn = root.querySelector('.gallery-view-icon-next');
    var prevBtn = root.querySelector('.gallery-view-icon-prev');
    var cNext = root.querySelector('.gallery-controls-icon-next');
    var cPrev = root.querySelector('.gallery-controls-icon-prev');
    if (!items.length) return;

    var current = -1;

    function reveal(el) {
      if (el && el.classList.contains('lazy')) el.classList.remove('lazy');
    }

    function paint() {
      for (var i = 0; i < items.length; i++) {
        var on = i === current;
        items[i].classList.toggle('active', on);
        items[i].classList.remove('right', 'left', 'origin');
        if (on) reveal(items[i]);
      }
      for (var j = 0; j < controls.length; j++) {
        var active = j === current;
        controls[j].classList.toggle('active', active);
        if (active) reveal(controls[j]);
      }
      if (wrap) {
        var target = controls[current];
        var amount = target ? target.offsetLeft - controls[0].offsetLeft : 0;
        wrap.style.transform = 'translate3d(' + -amount + 'px,0,0)';
      }
    }

    function go(step) {
      current = (current + step + items.length) % items.length;
      paint();
    }

    function jumpTo(index) {
      current = index;
      paint();
    }

    if (nextBtn) nextBtn.addEventListener('click', function () { go(1); });
    if (prevBtn) prevBtn.addEventListener('click', function () { go(-1); });
    if (cNext) cNext.addEventListener('click', function () { go(1); });
    if (cPrev) cPrev.addEventListener('click', function () { go(-1); });

    for (var k = 0; k < controls.length; k++) {
      (function (idx) {
        controls[idx].addEventListener('click', function () { jumpTo(idx); });
      })(k);
    }

    var startX = 0;
    var dragging = false;
    root.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      dragging = true;
    }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (!dragging) return;
      dragging = false;
      var dx = e.changedTouches[0].clientX - startX;
      if (dx < -40) go(1);
      else if (dx > 40) go(-1);
    });

    // Start on the first slide, matching the original.
    jumpTo(0);
  }

  /* ----------------------------------------------------------- countdown */
  function initCountdown() {
    var root = document.querySelector('.com-countdown');
    if (!root) return;
    // 11:30 on 20.01.2026, Vietnam time (UTC+7)
    var target = new Date('2026-01-20T11:30:00+07:00').getTime();

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function tick() {
      var diff = target - Date.now();
      if (diff < 0) diff = 0;
      var s = Math.floor(diff / 1000);
      var map = {
        day: Math.floor(s / 86400),
        hour: Math.floor((s % 86400) / 3600),
        minute: Math.floor((s % 3600) / 60),
        second: s % 60,
      };
      Object.keys(map).forEach(function (key) {
        var el = root.querySelector('.countdown-item-' + key + ' > div');
        if (el) el.textContent = pad(map[key]);
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* --------------------------------------------------------- reveal anim */
  function initReveal() {
    var items = document.querySelectorAll('.animation, .is-animation');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-visible');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* ---------------------------------------------------------- RSVP form */
  function initForm() {
    var form = document.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {};
      var fields = form.querySelectorAll('input, select, textarea');
      for (var i = 0; i < fields.length; i++) {
        data[fields[i].getAttribute('name') || 'field' + i] = fields[i].value;
      }
      data.submittedAt = new Date().toISOString();
      try {
        var list = JSON.parse(localStorage.getItem('wedding-rsvp') || '[]');
        list.push(data);
        localStorage.setItem('wedding-rsvp', JSON.stringify(list));
      } catch (err) { /* storage unavailable */ }

      var note = document.getElementById('rsvp-thanks');
      if (note) {
        note.textContent = 'Cảm ơn bạn đã xác nhận sự mặt của bạn!';
        note.style.display = 'block';
      }
      form.reset();
    });
  }

  /* ---------------------------------------------------------- music icon */
  function initMusic() {
    var audio = document.getElementById('myAudio');
    var icon = document.getElementById('musicIcon');
    if (!audio || !icon) return;
    var playing = false;

    function play() {
      audio.play().then(function () {
        playing = true;
        icon.classList.add('playing');
        icon.classList.remove('paused');
      }).catch(function () { /* blocked until user gesture */ });
    }
    function pause() {
      audio.pause();
      playing = false;
      icon.classList.remove('playing');
      icon.classList.add('paused');
    }
    icon.addEventListener('click', function (e) {
      e.stopPropagation();
      playing ? pause() : play();
    });
    audio.addEventListener('ended', pause);
    ['scroll', 'touchstart', 'wheel'].forEach(function (evt) {
      window.addEventListener(evt, function once() {
        window.removeEventListener(evt, once);
        if (!playing) play();
      }, { once: true, passive: true });
    });
  }

  /* --------------------------------------------------------------- boot */
  function boot() {
    collectLazy();
    handleLazyLoad();
    window.addEventListener('scroll', handleLazyLoad, { passive: true });
    window.addEventListener('resize', handleLazyLoad);

    initReveal();
    initCountdown();
    initForm();
    initMusic();
    var galleries = document.querySelectorAll('.com-gallery');
    for (var i = 0; i < galleries.length; i++) initGallery(galleries[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`;
const jsDir = path.join(OUT, 'js');
fs.mkdirSync(jsDir, { recursive: true });
fs.writeFileSync(path.join(jsDir, 'app.js'), appJs, 'utf8');

/* ------------------------------------------------------------ index.html */
const page = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=420, user-scalable=no, initial-scale=1.0">
<title>Trung Dũng &amp; Ngọc Uyên | Thiệp cưới online</title>
<meta name="description" content="Thiệp cưới online của Trung Dũng &amp; Ngọc Uyên - 20.01.2026">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,700,900|Trirong:100,300,400,700,900|Tinos:100,300,400,700,900|Noto%20Serif:100,300,400,700,900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/vendor/animatev4.css">
<link rel="stylesheet" href="/assets/vendor/iconfont.css">
<link rel="stylesheet" href="/css/layout.css">
</head>
<body>
${htmlOut}
<script>
/* Lazy asset reveal — same behaviour as the original WebCake runtime. */
(function () {
  var elements = [];
  function handleLazyLoad() {
    var seen = new WeakMap();
    elements.forEach(function (t) {
      var a = window.scrollY || window.scrollTop || 0;
      var l = window.innerHeight || window.clientHeight || 0;
      var r = t.getBoundingClientRect();
      if (!r.top && !r.left && !r.right && !r.bottom) return;
      var s = (r.y || r.top) + a;
      if (!(s >= a + 2 * l || s + t.offsetHeight <= a)) {
        seen.set(t, 1);
        if (t.classList.contains('lazy')) t.classList.remove('lazy');
        if (t.hasAttribute('data-src')) {
          t.src = t.getAttribute('data-src');
          t.removeAttribute('data-src');
        }
      }
    });
    elements = elements.filter(function (t) { return !seen.get(t); });
    if (!elements.length) {
      window.removeEventListener('scroll', handleLazyLoad, { passive: true });
    }
  }
  document.querySelectorAll('.lazy, [data-src]').forEach(function (e) { elements.push(e); });
  elements.sort(function (e, t) {
    return ~~getComputedStyle(e).getPropertyValue('--type') -
           ~~getComputedStyle(t).getPropertyValue('--type');
  });
  window.addEventListener('scroll', handleLazyLoad, { passive: true });
  if (document.readyState === 'interactive') handleLazyLoad();
  else document.addEventListener('DOMContentLoaded', function () { handleLazyLoad(); });
})();
</script>
<script src="/js/app.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(OUT, 'index.html'), page, 'utf8');
console.log('index.html:', page.length, 'bytes');
console.log('css/layout.css:', cssOut.length + localCss.length, 'bytes');
console.log('js/app.js:', appJs.length, 'bytes');
