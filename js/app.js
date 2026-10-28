/* Interactive behaviour recreated for the self-hosted build. */
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
