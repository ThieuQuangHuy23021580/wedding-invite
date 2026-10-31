/* Interactive behaviour recreated for the self-hosted build. */
(function () {
  'use strict';

  /* ---------------------------------------------------------- lazy images */
  /* Mirrors the original WebCake behaviour: the .lazy class forces
     background to none, so revealing an element simply means dropping
     the class and letting the layout CSS take over. */
  var lazyNodes = [];
  var lazyObserver = null;

  function revealLazy(el) {
    if (el.classList.contains('lazy')) el.classList.remove('lazy');
    if (el.hasAttribute('data-src')) {
      if (el.tagName === 'IMG') {
        // The observer already gates when this image starts loading, so let
        // the browser fetch and decode it immediately once it is near view.
        el.loading = 'eager';
        el.decoding = 'async';
        if ('fetchPriority' in el) el.fetchPriority = 'auto';
      }
      el.src = el.getAttribute('data-src');
      el.removeAttribute('data-src');
    }
  }

  function collectLazy() {
    lazyNodes = Array.prototype.slice.call(document.querySelectorAll('.lazy, [data-src]'));
    // Original sorts by the --type custom property (paint order).
    lazyNodes.sort(function (a, b) {
      var av = getComputedStyle(a).getPropertyValue('--type') || 0;
      var bv = getComputedStyle(b).getPropertyValue('--type') || 0;
      return ~~av - ~~bv;
    });

    if ('IntersectionObserver' in window) {
      // Reveal images before they enter view, without measuring every lazy
      // element on every scroll frame.
      var margin = Math.max(window.innerHeight * 2, 1200);
      lazyObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          revealLazy(entry.target);
          lazyObserver.unobserve(entry.target);
        });
      }, { rootMargin: margin + 'px 0px' });
      lazyNodes.forEach(function (el) { lazyObserver.observe(el); });
      lazyNodes = [];
    }
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
      revealLazy(el);
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
    // 16:00 on 27.11.2026, Vietnam time (UTC+7)
    var target = new Date('2026-11-27T16:00:00+07:00').getTime();

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
    var candidates = document.querySelectorAll('.animation, .is-animation');
    var items = Array.prototype.filter.call(candidates, function (item) {
      // Scroll-revealed elements are scheduled in small batches by the page
      // reveal observer; don't let this observer reveal them simultaneously.
      return !item.classList.contains('scroll-reveal');
    });
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
    var form = document.getElementById('1l75m7by');
    if (!form) return;

    var customSubmit = form.querySelector('.com-button');

    if (customSubmit) {
      customSubmit.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;

        e.preventDefault();
        form.requestSubmit();
      });
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var data = {
        full_name: form.elements['full_name'].value.trim(),
        bancuadaure: form.elements['bancuadaure'].value.trim(),
        guiloichuc: form.elements['guiloichuc'].value.trim(),
        ban_se_tham_du_chu:
          form.elements['ban_se_tham_du_chu'].value
      };

      if (!data.full_name) {
        alert('Vui lòng nhập tên của bạn.');
        return;
      }

      if (!data.bancuadaure) {
        alert('Vui lòng chọn bạn là khách mời Nhà gái hay Nhà trai.');
        return;
      }

      if (!data.ban_se_tham_du_chu) {
        alert('Vui lòng xác nhận bạn có tham dự hay không.');
        return;
      }

      var buttonText = form.querySelector('.button-text');
      var originalText = buttonText
        ? buttonText.textContent
        : '';

      if (buttonText) buttonText.textContent = 'ĐANG GỬI...';

      try {
        var response = await fetch('/api/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        var result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || 'Không thể gửi thông tin.'
          );
        }

        // Hiển thị thông báo sau khi API xác nhận lưu thành công.
        var note = document.getElementById('rsvp-thanks');

        if (note) {
          note.textContent =
            'Cảm ơn bạn đã xác nhận tham dự và gửi lời chúc!';
          note.style.display = 'block';
        } else {
          alert('Gửi lời chúc thành công! Cảm ơn bạn.');
        }

        form.reset();

      } catch (err) {
        console.error('RSVP submission failed:', err);
        alert(
          err.message ||
          'Gửi thông tin thất bại. Vui lòng thử lại.'
        );

      } finally {
        if (buttonText) {
          buttonText.textContent = originalText;
        }
      }
    });
  }


  /* ---------------------------------------------------------- music icon */
  function initMusic() {
    var audio = document.getElementById('myAudio');
    var icon = document.getElementById('musicIcon');
    if (!audio || !icon) return;
    var playing = false;
    var playPending = false;
    var userStarted = false;

    function play() {
      if (playing || playPending) return;
      playPending = true;
      audio.play().then(function () {
        playing = true;
        icon.classList.add('playing');
        icon.classList.remove('paused');
        userStarted = true;
        ['pointerdown', 'touchstart', 'keydown', 'click', 'wheel'].forEach(function (evt) {
          document.removeEventListener(evt, onFirstGesture, true);
        });
      }).catch(function () {
        // Keep listening: the first play attempt may be rejected while the
        // browser is still loading or has not accepted this gesture.
      }).finally(function () { playPending = false; });
    }
    function pause() {
      audio.pause();
      playing = false;
      icon.classList.remove('playing');
      icon.classList.add('paused');
    }
    function onFirstGesture(event) {
      if (userStarted || icon.contains(event.target)) return;
      play();
    }
    icon.addEventListener('click', function (e) {
      e.stopPropagation();
      playing ? pause() : play();
    });
    ['pointerdown', 'touchstart', 'keydown', 'click', 'wheel'].forEach(function (evt) {
      document.addEventListener(evt, onFirstGesture, { capture: true, passive: true });
    });
    audio.addEventListener('ended', pause);

    // Best-effort autoplay on page open. If browser policy rejects it,
    // the first-gesture listeners above remain active and can retry.
    play();
  }

  /* --------------------------------------------------------------- boot */
  function boot() {
    collectLazy();
    if (!lazyObserver) {
      handleLazyLoad();
      window.addEventListener('scroll', handleLazyLoad, { passive: true });
      window.addEventListener('resize', handleLazyLoad);
    }

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
