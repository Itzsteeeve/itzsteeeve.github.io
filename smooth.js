// Smooth scroll (Lenis-like, lightweight)
(function () {
  let target = window.scrollY;
  let current = window.scrollY;
  let raf;
  let active = false;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    current = lerp(current, target, 0.09);
    if (Math.abs(target - current) < 0.5) {
      current = target;
      window.scrollTo(0, current);
      active = false;
      return;
    }
    window.scrollTo(0, current);
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener('wheel', (e) => {
    // skip if scrolling inside a tile that scrolls
    e.preventDefault();
    target += e.deltaY;
    target = Math.max(0, Math.min(target, document.documentElement.scrollHeight - window.innerHeight));
    if (!active) { active = true; tick(); }
  }, { passive: false });

  // Resync on resize / direct scroll (e.g. anchor click)
  window.addEventListener('resize', () => { target = window.scrollY; current = window.scrollY; });
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY;
    target = top;
    if (!active) { active = true; tick(); }
  });
})();

// Reveal on scroll — position-based (works with custom smooth scroll)
(function () {
  let pending = false;

  const check = () => {
    pending = false;
    const trigger = window.innerHeight * 0.92;
    document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < trigger && r.bottom > 0) {
        el.classList.add('in');
      }
    });
  };

  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(check);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);

  // Run continuously for a bit (covers React mount + smooth scroll lerp updates)
  let ticks = 0;
  const loop = () => {
    check();
    ticks++;
    if (ticks < 240) requestAnimationFrame(loop); // ~4s of frames
  };
  loop();

  // Also re-check whenever DOM changes (React mounts new .reveal nodes)
  const mo = new MutationObserver(schedule);
  mo.observe(document.body, { childList: true, subtree: true });
})();
