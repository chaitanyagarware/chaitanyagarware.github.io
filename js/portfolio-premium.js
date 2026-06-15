(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  // Mobile nav
  const menuButton = document.querySelector('.menu-toggle');
  menuButton?.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('menu-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      menuButton?.setAttribute('aria-expanded', 'false');
    });
  });

  // Cursor glow + spotlight tracking
  const glow = document.querySelector('.cursor-glow');
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let glowX = pointerX;
  let glowY = pointerY;

  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;

    document.querySelectorAll('.spotlight:hover, .lift-card:hover').forEach((card) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  }, { passive: true });

  const animateGlow = () => {
    glowX += (pointerX - glowX) * 0.08;
    glowY += (pointerY - glowY) * 0.08;
    if (glow) glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(animateGlow);
  };
  if (!prefersReduced) animateGlow();

  // Scroll reveal
  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));

  // Count up metrics
  const counters = [...document.querySelectorAll('[data-count]')];
  const animateCounter = (el) => {
    const target = Number(el.dataset.count);
    const decimal = Number(el.dataset.decimal || 0);
    const duration = 1300;
    const start = performance.now();
    const formatter = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: decimal,
      minimumFractionDigits: decimal
    });

    const tick = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = formatter.format(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = formatter.format(target);
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.dataset.done) {
        entry.target.dataset.done = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.45 });
  counters.forEach((counter) => counterObserver.observe(counter));

  // Magnetic buttons only. Cards use CSS lift, no tilt.
  if (!prefersReduced) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.018)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  // Copy email with toast
  const copyButton = document.getElementById('copy-email');
  const toast = document.getElementById('toast');
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1800);
  };

  copyButton?.addEventListener('click', async () => {
    const email = copyButton.dataset.email || 'chaitanya.garware27@gmail.com';
    try {
      await navigator.clipboard.writeText(email);
      showToast('Email copied to clipboard');
    } catch {
      const input = document.createElement('input');
      input.value = email;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      showToast('Email copied to clipboard');
    }
  });

  // Ambient water-drop mesh
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas?.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const blobs = Array.from({ length: 7 }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    r: 150 + Math.random() * 240,
    vx: (Math.random() - 0.5) * 0.00032,
    vy: (Math.random() - 0.5) * 0.00024,
    hue: index % 2 ? '110,231,255' : '139,92,246'
  }));

  const resizeCanvas = () => {
    if (!canvas || !ctx) return;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawCanvas = () => {
    if (!canvas || !ctx || prefersReduced) return;
    ctx.clearRect(0, 0, width, height);

    const mouseInfluenceX = (pointerX / Math.max(window.innerWidth, 1) - 0.5) * 20;
    const mouseInfluenceY = (pointerY / Math.max(window.innerHeight, 1) - 0.5) * 20;

    blobs.forEach((blob, i) => {
      blob.x += blob.vx;
      blob.y += blob.vy;
      if (blob.x < -0.1 || blob.x > 1.1) blob.vx *= -1;
      if (blob.y < -0.1 || blob.y > 1.1) blob.vy *= -1;

      const x = blob.x * width + Math.sin(Date.now() * 0.00035 + i) * 18 + mouseInfluenceX;
      const y = blob.y * height + Math.cos(Date.now() * 0.0003 + i) * 18 + mouseInfluenceY;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, blob.r);
      gradient.addColorStop(0, `rgba(${blob.hue},0.13)`);
      gradient.addColorStop(0.45, `rgba(${blob.hue},0.045)`);
      gradient.addColorStop(1, `rgba(${blob.hue},0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, blob.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(drawCanvas);
  };

  if (canvas && ctx && !prefersReduced) {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    drawCanvas();
  }
})();