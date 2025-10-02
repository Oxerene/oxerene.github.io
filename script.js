// Smooth, accessible interactions (staggered reveals, parallax, tilt)
(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Theme toggle (light/dark/system)
  const root = document.documentElement;
  const toggle = $('#themeToggle');
  const savedTheme = localStorage.getItem('theme'); // 'light' | 'dark' | null

  const applyTheme = (mode) => {
    if (!mode || mode === 'system') {
      root.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', mode);
    }
  };
  applyTheme(savedTheme);

  toggle?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });

  // React to system changes if user hasn’t locked a preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!localStorage.getItem('theme')) applyTheme('system');
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Assign stagger delays to reveal groups
  const setStaggerDelays = () => {
    const groups = $$('.hero-inner, .section-header, .grid, .two-col, .timeline, .contact, .footer-inner');
    groups.forEach(group => {
      const children = $$('[data-reveal]', group);
      children.forEach((el, i) => {
        el.style.setProperty('--reveal-delay', `${Math.min(i * 90, 540)}ms`);
      });
    });
  };
  setStaggerDelays();

  // Reveal-on-scroll (with stagger)
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    $$('[data-reveal]').forEach(el => io.observe(el));
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('revealed'));
  }

  // Active nav highlighting on scroll
  const sections = ['projects','about','experience','contact'];
  const anchors = sections
    .map(id => ({ id, el: document.querySelector(`.primary-nav a[href="#${id}"]`) }))
    .filter(x => x.el);

  const onScrollHighlight = () => {
    let current = null;
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 100) current = id;
    });
    anchors.forEach(a => a.el.setAttribute('aria-current', a.id === current ? 'page' : 'false'));
  };
  document.addEventListener('scroll', onScrollHighlight, { passive: true });
  onScrollHighlight();

  // Subtle parallax on hero media
  if (!prefersReducedMotion) {
    const heroCard = $('.hero-media .media-card');
    if (heroCard) {
      let rafId = null;
      const max = 18; // px
      const update = () => {
        const y = Math.max(-max, Math.min(max, window.scrollY * 0.05));
        heroCard.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
        rafId = null;
      };
      const onScrollParallax = () => { if (rafId) return; rafId = requestAnimationFrame(update); };
      document.addEventListener('scroll', onScrollParallax, { passive: true });
      update();
    }
  }

  // Subtle 3D tilt on cards for pointer devices
  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    const cards = $$('.card');
    cards.forEach(card => {
      let rafId = null;
      const reset = () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      };
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;  // -0.5..0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        const ry = px * 8;  // degrees
        const rx = -py * 8;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          card.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
          card.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
        });
      });
      card.addEventListener('pointerleave', reset);
      card.addEventListener('pointerdown', reset);
    });
  }

  // Copy email
  const copyBtn = $('#copyEmail');
  copyBtn?.addEventListener('click', async () => {
    const text = copyBtn.getAttribute('data-copy') || '';
    try {
      await navigator.clipboard.writeText(text);
      const label = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = label), 1200);
    } catch {
      prompt('Copy to clipboard:', text);
    }
  });

  // Footer year
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
