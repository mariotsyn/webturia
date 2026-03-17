// ============================================================
// WEBTURIA — PREMIUM DARK AGENCY
// Canvas particles · Custom cursor · GSAP hero
// IntersectionObserver reveals · Counter animation
// ============================================================
(() => {
  'use strict';
  window.addEventListener('DOMContentLoaded', init);

  function init() {
    setupCanvas();
    setupNav();
    setupMobile();
    setupSmooth();
    setupCursor();

    // Preloader
    const pre = document.getElementById('preloader');
    const PRELOADER_MS = 2200;

    if (pre) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        pre.classList.add('hidden');
        document.body.style.overflow = '';
        setTimeout(() => {
          setupHero();
          setupScrollReveals();
          setupCounters();
          setupMagnetic();
          setup3DTilt();
        }, 100);
      }, PRELOADER_MS);
    } else {
      setupHero();
      setupScrollReveals();
      setupCounters();
      setupMagnetic();
      setup3DTilt();
    }
  }

  /* ═══════════════════════════════════════════════════
     CANVAS — Particle network background
     ═══════════════════════════════════════════════════ */
  function setupCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;
    let particles = [];
    let mouseX = -1000, mouseY = -1000;
    const PARTICLE_COUNT = window.innerWidth < 768 ? 35 : 65;
    const CONNECTION_DIST = 150;
    const MOUSE_DIST = 200;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Track mouse for interactivity
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.r = Math.random() * 1.5 + 0.5;
        // Color: mix of accent colors
        const colors = [
          [99, 102, 241],   // Indigo
          [6, 182, 212],    // Cyan
          [139, 92, 246],   // Violet
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = Math.random() * 0.5 + 0.15;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Mouse repulsion
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST) {
          const force = (MOUSE_DIST - dist) / MOUSE_DIST * 0.02;
          this.vx += dx * force;
          this.vy += dy * force;
        }

        // Damping
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Wrap
        if (this.x < -10) this.x = w + 10;
        if (this.x > w + 10) this.x = -10;
        if (this.y < -10) this.y = h + 10;
        if (this.y > h + 10) this.y = -10;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color[0]},${this.color[1]},${this.color[2]},${this.alpha})`;
        ctx.fill();
      }
    }

    // Init particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ═══ NAV ═══ */
  function setupNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  /* ═══ MOBILE MENU ═══ */
  function setupMobile() {
    const btn = document.getElementById('menuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    function toggle(open) {
      menu.classList.toggle('open', open);
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    btn.addEventListener('click', () => toggle(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
  }

  /* ═══ CUSTOM CURSOR ═══ */
  function setupCursor() {
    if (window.matchMedia('(pointer:coarse)').matches || window.innerWidth <= 1024) return;

    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;

    requestAnimationFrame(() => {
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    });

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.1;
      ringY += (mouseY - ringY) * 0.1;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover states
    document.querySelectorAll('a, button, .svc-card, .project-card, .tech-item, .av, .ci').forEach(el => {
      el.addEventListener('mouseenter', () => {
        ring.classList.add('hover');
        dot.classList.add('hover');
      });
      el.addEventListener('mouseleave', () => {
        ring.classList.remove('hover');
        dot.classList.remove('hover');
      });
    });

    document.querySelectorAll('img, .pc-img, .about-img-wrap').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('expand'));
      el.addEventListener('mouseleave', () => ring.classList.remove('expand'));
    });

    document.body.style.cursor = 'none';
    document.querySelectorAll('a, button').forEach(el => el.style.cursor = 'none');
  }

  /* ═══ MAGNETIC BUTTONS ═══ */
  function setupMagnetic() {
    if (window.matchMedia('(pointer:coarse)').matches) return;
    if (typeof gsap === 'undefined') return;

    document.querySelectorAll('.btn, .nav-cta').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ═══ 3D TILT ═══ */
  function setup3DTilt() {
    if (window.matchMedia('(pointer:coarse)').matches) return;
    if (typeof gsap === 'undefined') return;

    document.querySelectorAll('.svc-card, .project-card, .tech-item').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
          rotateY: x * 8, rotateX: -y * 8,
          duration: 0.3, ease: 'power2.out',
          transformPerspective: 800
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateY: 0, rotateX: 0,
          duration: 0.5, ease: 'power3.out'
        });
      });
    });
  }

  /* ═══ HERO ANIMATIONS ═══ */
  function setupHero() {
    if (typeof gsap === 'undefined') return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.hero-label', { opacity: 0, y: 20, duration: 0.7 }, 0)
      .from('.ht-word', {
        y: '110%', duration: 1.2,
        stagger: 0.1,
        ease: 'power4.out'
      }, 0.1)
      .from('.hero-sub', { opacity: 0, y: 30, duration: 0.8 }, 0.6)
      .from('.hero-btns', { opacity: 0, y: 25, duration: 0.7 }, 0.8)
      .from('.hero-stats', { opacity: 0, y: 20, duration: 0.6 }, 1);
  }

  /* ═══ COUNTER ANIMATION ═══ */
  function setupCounters() {
    const nums = document.querySelectorAll('.hs-num[data-count]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count);
          animateCount(el, target);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    nums.forEach(n => observer.observe(n));

    function animateCount(el, target) {
      const duration = 2000;
      const start = performance.now();
      const isPercent = el.nextElementSibling?.textContent?.includes('%');

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        el.textContent = current + (isPercent ? '' : '+');
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  /* ═══ SCROLL REVEALS (IntersectionObserver) ═══ */
  function setupScrollReveals() {
    const revealEls = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.revealDelay || '0');
          setTimeout(() => el.classList.add('revealed'), delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    // Auto-detect stagger groups
    const staggerGroups = [
      { sel: '.svc-card', stagger: 100 },
      { sel: '.tech-item', stagger: 80 },
      { sel: '.project-card', stagger: 120 },
      { sel: '.ci', stagger: 80 },
      { sel: '.av', stagger: 80 },
    ];

    staggerGroups.forEach(({ sel, stagger }) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.dataset.revealDelay = String(i * stagger);
      });
    });

    revealEls.forEach(el => observer.observe(el));
  }

  /* ═══ SMOOTH ANCHORS ═══ */
  function setupSmooth() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          const navH = document.getElementById('nav')?.offsetHeight || 0;
          const pos = target.getBoundingClientRect().top + window.scrollY - navH - 20;
          window.scrollTo({ top: pos, behavior: 'smooth' });
        }
      });
    });
  }

})();
