/* ==========================================================================
   Thiệp cưới DŨNG & UYÊN — interactions
   ========================================================================== */
(() => {
  'use strict';

  /* ---------------------------------------------------------------- Config */
  const WEDDING_DATE = new Date('2026-01-20T11:30:00+07:00');
  const WEDDING_DAY = 20; // highlighted day in the January calendar

  /* ------------------------------------------------------------- Utilities */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const pad = (n) => String(n).padStart(2, '0');

  /* ------------------------------------------------------- Hero entrance */
  const hero = $('#s-hero');
  requestAnimationFrame(() => {
    setTimeout(() => hero.classList.add('ready'), 80);
  });

  /* ------------------------------------------------- Scroll reveal (IO) */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );

  $$('[data-anim]').forEach((el, i) => {
    // stagger siblings inside the same section
    const siblings = $$('[data-anim]', el.closest('.sec') || document);
    el.style.setProperty('--d', `${siblings.indexOf(el) * 110}ms`);
    revealObserver.observe(el);
  });

  /* ------------------------------------------------------- Scroll hint */
  const hint = $('#scrollHint');
  if (hint) {
    hint.addEventListener('click', () => {
      $('#s-ceremony')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    const hideHint = () => {
      if (window.scrollY > 40) {
        hint.style.opacity = '0';
        hint.style.pointerEvents = 'none';
      } else {
        hint.style.opacity = '';
        hint.style.pointerEvents = '';
      }
    };
    window.addEventListener('scroll', hideHint, { passive: true });
    hideHint();
  }

  /* --------------------------------------------------------- Calendar */
  function buildCalendar() {
    const grid = $('#calGrid');
    if (!grid) return;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // January 2026 starts on a Thursday (Mon-first grid => index 3)
    const firstWeekday = 3;
    const daysInMonth = 31;

    const frag = document.createDocumentFragment();

    days.forEach((d) => {
      const cell = document.createElement('div');
      cell.className = 'cal-cell dow';
      cell.textContent = d;
      frag.appendChild(cell);
    });

    for (let i = 0; i < firstWeekday; i++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell empty';
      cell.textContent = '0';
      frag.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell' + (day === WEDDING_DAY ? ' wedding' : '');
      cell.textContent = String(day);
      frag.appendChild(cell);
    }

    grid.appendChild(frag);
  }
  buildCalendar();

  /* --------------------------------------------------------- Countdown */
  function tickCountdown() {
    const root = $('#countdown');
    if (!root) return;

    const diff = WEDDING_DATE - Date.now();
    const clamp = (v) => (diff > 0 ? v : 0);

    const totalSec = Math.floor(clamp(diff) / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    const set = (key, val) => {
      const el = $(`[data-cd="${key}"]`, root);
      if (el && el.textContent !== pad(val)) el.textContent = pad(val);
    };

    set('d', d);
    set('h', h);
    set('m', m);
    set('s', s);
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ----------------------------------------------------------- Gallery */
  const galleryPhotos = [
    'assets/img/img-09.webp',
    'assets/img/img-10.webp',
    'assets/img/img-11.webp',
    'assets/img/img-12.webp',
    'assets/img/img-14.webp',
    'assets/img/img-16.webp',
    'assets/img/img-02.webp',
    'assets/img/img-04.webp',
  ];

  function buildGallery() {
    const track = $('#galleryTrack');
    const dots = $('#galleryDots');
    if (!track || !dots) return;

    galleryPhotos.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'gallery-slide';
      slide.style.backgroundImage = `url("${src}")`;
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-label', `${i + 1} / ${galleryPhotos.length}`);
      track.appendChild(slide);

      const dot = document.createElement('button');
      dot.className = 'gallery-dot' + (i === 0 ? ' on' : '');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Ảnh ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dots.appendChild(dot);
    });

    let index = 0;
    let timer = null;

    function goTo(i) {
      index = (i + galleryPhotos.length) % galleryPhotos.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      $$('.gallery-dot', dots).forEach((d, di) => d.classList.toggle('on', di === index));
    }

    function start() {
      stop();
      timer = setInterval(() => goTo(index + 1), 4000);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    // Swipe support
    let startX = null;
    let startT = 0;
    track.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startT = Date.now();
      stop();
    });
    track.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const dt = Date.now() - startT;
      if (Math.abs(dx) > 36 && dt < 800) goTo(index + (dx < 0 ? 1 : -1));
      startX = null;
      start();
    });
    track.addEventListener('pointercancel', () => {
      startX = null;
      start();
    });

    // Arrow navigation
    $('#galPrev')?.addEventListener('click', () => {
      goTo(index - 1);
      start();
    });
    $('#galNext')?.addEventListener('click', () => {
      goTo(index + 1);
      start();
    });

    const gallerySection = $('#s-gallery');    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.35 }
    );
    io.observe(gallerySection);

    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : start();
    });

    goTo(0);
  }
  buildGallery();

  /* ------------------------------------------------------------- Music */
  const audio = $('#bgm');
  const musicBtn = $('#musicBtn');
  let musicWanted = false;

  function setMusicUI(on) {
    musicBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  async function playMusic() {
    try {
      audio.volume = 0.55;
      await audio.play();
      musicWanted = true;
      setMusicUI(true);
    } catch {
      musicWanted = false;
      setMusicUI(false);
    }
  }

  function pauseMusic() {
    audio.pause();
    musicWanted = false;
    setMusicUI(false);
  }

  musicBtn.addEventListener('click', () => {
    if (audio.paused) playMusic();
    else pauseMusic();
  });

  // Autoplay attempt on first interaction anywhere (browsers require a gesture)
  const kickstart = () => {
    if (audio.paused && !musicWanted) playMusic();
    window.removeEventListener('pointerdown', kickstart);
    window.removeEventListener('keydown', kickstart);
  };
  window.addEventListener('pointerdown', kickstart, { once: true });
  window.addEventListener('keydown', kickstart, { once: true });

  /* -------------------------------------------------------- RSVP modal */
  const modal = $('#rsvpModal');
  const form = $('#rsvpForm');
  const formStep = $('[data-step="form"]', modal);
  const doneStep = $('[data-step="done"]', modal);
  const doneMsg = $('#doneMsg');

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('input[name="name"]', form)?.focus(), 220);
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  $('#rsvpBtn')?.addEventListener('click', openModal);

  $$('[data-close]', modal).forEach((el) => el.addEventListener('click', closeModal));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const attend = data.get('attend');
    const guests = data.get('guests');

    if (!name) return;

    doneMsg.textContent =
      attend === 'yes'
        ? `Cảm ơn ${name}! Chúng mình rất vui được đón bạn cùng ${guests} người trong ngày trọng đại.`
        : `Cảm ơn ${name} đã hồi đáp. Chúng mình rất tiếc khi bạn không thể đến, nhưng luôn trân trọng tình cảm của bạn.`;

    formStep.hidden = true;
    doneStep.hidden = false;

    try {
      const key = 'wedding-rsvp-dung-uyen';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      prev.push({ name, guests, attend, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(prev));
    } catch {
      /* storage may be unavailable — the confirmation still shows */
    }
  });

  // Reset the modal back to the form when reopened
  $('#rsvpBtn')?.addEventListener('click', () => {
    formStep.hidden = false;
    doneStep.hidden = true;
    form?.reset();
  });

  /* --------------------------------------------- Parallax on hero photo */
  const heroPhoto = $('.photo-hero');
  if (heroPhoto && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let raf = null;
    window.addEventListener(
      'scroll',
      () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const y = Math.min(window.scrollY, 713);
          heroPhoto.style.transform = `translateY(${y * 0.14}px)`;
          raf = null;
        });
      },
      { passive: true }
    );
  }
})();
