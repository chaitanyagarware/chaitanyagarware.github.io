(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-blur-header]');
  const nav = document.querySelector('[data-nav]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const toast = document.querySelector('[data-toast]');

  const onScroll = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  navToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(Boolean(open)));
  });
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
  }));

  const revealItems = [...document.querySelectorAll('.reveal')];
  const counters = [...document.querySelectorAll('[data-count]')];
  const counterSet = new WeakSet();

  const animateCounter = (el) => {
    if (counterSet.has(el)) return;
    counterSet.add(el);
    const target = Number(el.dataset.count || 0);
    const decimal = Number(el.dataset.decimal || 0);
    const prefix = el.dataset.prefix || '';
    const suffix = prefix ? '%' : '';
    if (prefersReduced) {
      el.textContent = `${prefix}${target.toFixed(decimal)}${suffix}`;
      return;
    }
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const value = target * eased;
      el.textContent = `${prefix}${value.toFixed(decimal)}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = `${prefix}${target.toFixed(decimal)}${suffix}`;
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      if (entry.target.matches('[data-count]')) animateCounter(entry.target);
      entry.target.querySelectorAll?.('[data-count]').forEach(animateCounter);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

  revealItems.forEach((el) => observer.observe(el));
  counters.forEach((el) => observer.observe(el));

  document.querySelectorAll('[data-accordion] .timeline-button').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.timeline-item');
      const panel = item?.querySelector('.timeline-panel');
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      item?.classList.toggle('is-open', !open);
      if (panel) panel.hidden = open;
    });
  });

  document.querySelectorAll('[data-copy-email]').forEach((button) => {
    button.addEventListener('click', async () => {
      const email = button.getAttribute('data-copy-email');
      try {
        await navigator.clipboard.writeText(email);
        if (toast) {
          toast.textContent = 'Email copied to clipboard';
          toast.classList.add('is-visible');
          window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
        }
      } catch {
        window.location.href = `mailto:${email}`;
      }
    });
  });

  if (!prefersReduced) {
    document.querySelectorAll('[data-tilt], .signal-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', `${x}%`);
        card.style.setProperty('--my', `${y}%`);
      });
    });
  }

  const canvas = document.getElementById('ambient-canvas');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, px = 0.5, py = 0.3;
    const nodes = Array.from({ length: 28 }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2, vx: (Math.random() - 0.5) * 0.0004, vy: (Math.random() - 0.5) * 0.0004 }));
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = window.innerWidth;
      h = window.innerHeight;
    };
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', (e) => { px = e.clientX / w; py = e.clientY / h; }, { passive: true });
    resize();
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const gx = w * (0.45 + (px - 0.5) * 0.06);
      const gy = h * (0.20 + (py - 0.5) * 0.05);
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * 0.56);
      grad.addColorStop(0, 'rgba(79, 140, 255, 0.20)');
      grad.addColorStop(0.45, 'rgba(139, 92, 246, 0.08)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x * w, n.y * h, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,.16)';
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
})();
