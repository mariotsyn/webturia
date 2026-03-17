// ════════════════════════════════════════════════════
// WebTuria v2 — IMMERSIVE 3D SCROLL EXPERIENCE
// Three.js desk scene · Scroll-linked camera · GSAP
// ════════════════════════════════════════════════════
(() => {
  'use strict';

  /* ═══ GLOBALS ═══ */
  let scene, camera, renderer, clock;
  let desk = {}, floaters = [], particles;
  let scrollProgress = 0;
  let mouseNorm = { x: 0, y: 0 };
  let contentRevealed = false;

  // Camera positions (start → end)
  const CAM_START = { x: 0, y: 4.5, z: 11 };
  const CAM_MID   = { x: 0, y: 2.2, z: 5 };
  const CAM_END   = { x: 0, y: 1.65, z: 0.6 };

  const LOOK_START = { x: 0, y: 1.2, z: 0 };
  const LOOK_END   = { x: 0, y: 1.6, z: -1 };

  window.addEventListener('DOMContentLoaded', init);

  function init() {
    // Preloader
    const pre = document.getElementById('preloader');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      if (pre) pre.classList.add('done');
      document.body.style.overflow = '';
      requestAnimationFrame(() => {
        setupThree();
        setupScrollCamera();
        setupNav();
        setupMobile();
        setupCursor();
        setupHeroGSAP();
        setupScrollReveals();
        setupCounters();
        setupMagnetic();
        setup3DTilt();
        setupSmooth();
        setupAstroScroll();
        animate();
      });
    }, 2300);
  }

  /* ═══════════════════════════════════════════════
     THREE.JS — 3D DESK SCENE
     ═══════════════════════════════════════════════ */
  function setupThree() {
    const canvas = document.getElementById('scene3d');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0A0A0F, 6, 25);

    clock = new THREE.Clock();

    // Camera
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(CAM_START.x, CAM_START.y, CAM_START.z);
    camera.lookAt(LOOK_START.x, LOOK_START.y, LOOK_START.z);

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0A0A0F, 1);
    renderer.shadowMap.enabled = false;

    // Lights
    const ambient = new THREE.AmbientLight(0x6366F1, 0.15);
    scene.add(ambient);

    const point1 = new THREE.PointLight(0x6366F1, 0.8, 20);
    point1.position.set(-3, 4, 4);
    scene.add(point1);

    const point2 = new THREE.PointLight(0x06B6D4, 0.6, 20);
    point2.position.set(3, 3, 2);
    scene.add(point2);

    const point3 = new THREE.PointLight(0x8B5CF6, 0.4, 15);
    point3.position.set(0, 2, -2);
    scene.add(point3);

    // Build the desk scene
    createDesk();
    createMonitor();
    createKeyboard();
    createFloaters();
    createGridFloor();
    createParticles();

    // Mouse tracking
    document.addEventListener('mousemove', e => {
      mouseNorm.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseNorm.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });
  }

  /* ─── DESK ─── */
  function createDesk() {
    // Desk surface — warm dark walnut / charcoal
    const deskGeo = new THREE.BoxGeometry(5, 0.08, 2.5);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x1C1410,
      metalness: 0.3,
      roughness: 0.65,
    });
    const deskMesh = new THREE.Mesh(deskGeo, deskMat);
    deskMesh.position.set(0, 0.7, 0);
    scene.add(deskMesh);
    desk.surface = deskMesh;

    // Desk edge accent (subtle light strip on front edge)
    const edgeGeo = new THREE.BoxGeometry(5, 0.005, 0.02);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x6366F1, transparent: true, opacity: 0.3 });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(0, 0.74, 1.25);
    scene.add(edge);

    // Desk legs — brushed chrome
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3A3A42, metalness: 0.9, roughness: 0.15 });
    const legPositions = [[-2.2, 0.35, -1], [2.2, 0.35, -1], [-2.2, 0.35, 1], [2.2, 0.35, 1]];
    legPositions.forEach(p => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(...p);
      scene.add(leg);
    });
  }

  /* ─── MONITOR ─── */
  function createMonitor() {
    // Monitor body (thin box) — silver/gray frame for contrast
    const bodyGeo = new THREE.BoxGeometry(3, 1.8, 0.1);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3A3A44,
      metalness: 0.8,
      roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.64, -0.35);
    scene.add(body);
    desk.monitorBody = body;

    // ── Screen with CanvasTexture (fake website UI) ──
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 600;
    const ctx = screenCanvas.getContext('2d');

    // Draw dark website UI on the canvas
    function drawScreenUI(time) {
      const w = screenCanvas.width;
      const h = screenCanvas.height;

      // Background
      ctx.fillStyle = '#0A0A0F';
      ctx.fillRect(0, 0, w, h);

      // Top nav bar
      ctx.fillStyle = 'rgba(18,18,26,0.9)';
      ctx.fillRect(0, 0, w, 44);
      // Nav brand
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#6366F1';
      ctx.fillText('W', 24, 28);
      ctx.fillStyle = '#F0F0F5';
      ctx.fillText('ebTuria', 36, 28);
      // Nav links
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(240,240,245,0.5)';
      ['Servicios', 'Proyectos', 'Nosotros', 'Contacto'].forEach((t, i) => {
        ctx.fillText(t, w - 340 + i * 80, 27);
      });
      // Nav CTA button
      const grad1 = ctx.createLinearGradient(w - 100, 12, w - 20, 32);
      grad1.addColorStop(0, '#6366F1');
      grad1.addColorStop(1, '#06B6D4');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.roundRect(w - 110, 12, 86, 22, 11);
      ctx.fill();
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('Hablemos →', w - 102, 27);

      // Hero section
      ctx.font = 'bold 48px sans-serif';
      ctx.fillStyle = '#F0F0F5';
      ctx.fillText('Creamos', 60, 140);
      ctx.fillText('experiencias', 60, 195);
      const grad2 = ctx.createLinearGradient(60, 210, 500, 250);
      grad2.addColorStop(0, '#6366F1');
      grad2.addColorStop(0.5, '#06B6D4');
      grad2.addColorStop(1, '#8B5CF6');
      ctx.fillStyle = grad2;
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText('inmersivas', 60, 250);

      // Stats row
      ctx.font = 'bold 20px sans-serif';
      const stats = [{ n: '50+', l: 'Proyectos' }, { n: '98%', l: 'Satisfacción' }, { n: '5', l: 'Años' }];
      stats.forEach((s, i) => {
        const sx = 80 + i * 160;
        ctx.fillStyle = '#6366F1';
        ctx.fillText(s.n, sx, 320);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(240,240,245,0.4)';
        ctx.fillText(s.l, sx, 336);
        ctx.font = 'bold 20px sans-serif';
      });

      // Cards on the right
      const cardColors = ['#6366F1', '#06B6D4', '#8B5CF6'];
      for (let i = 0; i < 3; i++) {
        const cx = 620;
        const cy = 70 + i * 115;
        ctx.fillStyle = 'rgba(18,18,26,0.8)';
        ctx.beginPath();
        ctx.roundRect(cx, cy, 360, 100, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Card accent
        ctx.fillStyle = cardColors[i];
        ctx.fillRect(cx, cy, 3, 100);
        // Card text
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#F0F0F5';
        const titles = ['Diseño Web Premium', 'Automatización con IA', 'E-commerce'];
        ctx.fillText(titles[i], cx + 20, cy + 30);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = 'rgba(240,240,245,0.4)';
        ctx.fillText('Tecnología de vanguardia', cx + 20, cy + 50);
        // Fake chart bars
        for (let b = 0; b < 5; b++) {
          const bh = 15 + Math.sin(time * 2 + b + i) * 8;
          ctx.fillStyle = cardColors[i] + '40';
          ctx.fillRect(cx + 20 + b * 30, cy + 85 - bh, 20, bh);
        }
      }

      // Animated scan line
      const scanY = (time * 80) % h;
      ctx.fillStyle = 'rgba(99,102,241,0.03)';
      ctx.fillRect(0, scanY, w, 2);
    }

    drawScreenUI(0);
    const screenTexture = new THREE.CanvasTexture(screenCanvas);

    const screenGeo = new THREE.PlaneGeometry(2.7, 1.55);
    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
      transparent: true,
      opacity: 0.9,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.64, -0.295);
    scene.add(screen);
    desk.screen = screen;
    desk.screenCanvas = screenCanvas;
    desk.screenTexture = screenTexture;
    desk.drawScreenUI = drawScreenUI;

    // Screen glow ring (edge highlight)
    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.72, 1.57, 0.01));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x6366F1, transparent: true, opacity: 0.5 });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    edgeLines.position.copy(screen.position);
    scene.add(edgeLines);
    desk.screenEdge = edgeLines;

    // Monitor stand — placed BEHIND the monitor body
    const standGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x2A2A32, metalness: 0.9, roughness: 0.12 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(0, 0.98, -0.55);
    scene.add(stand);

    // Stand base — behind monitor
    const baseGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.04, 16);
    const base = new THREE.Mesh(baseGeo, standMat);
    base.position.set(0, 0.75, -0.55);
    scene.add(base);
  }

  /* ─── KEYBOARD ─── */
  function createKeyboard() {
    const kbGroup = new THREE.Group();

    // Main body — lighter aluminum, visible against dark desk
    const kbGeo = new THREE.BoxGeometry(1.4, 0.04, 0.5);
    const kbMat = new THREE.MeshStandardMaterial({
      color: 0x3A3A44, metalness: 0.7, roughness: 0.3,
    });
    const kb = new THREE.Mesh(kbGeo, kbMat);
    kbGroup.add(kb);

    // Individual keys — lighter caps for visibility
    const keyGeo = new THREE.BoxGeometry(0.08, 0.025, 0.08);
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0x4A4A55, metalness: 0.5, roughness: 0.5,
    });

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 12; col++) {
        const key = new THREE.Mesh(keyGeo, keyMat);
        key.position.set(-0.56 + col * 0.1, 0.035, -0.16 + row * 0.1);
        kbGroup.add(key);
      }
    }

    kbGroup.position.set(0, 0.74, 0.55);
    scene.add(kbGroup);
    desk.keyboard = kbGroup;

    // Mouse — rounded capsule shape, lighter color
    const mouseGroup = new THREE.Group();
    // Mouse body (rounded)
    const mouseBodyGeo = new THREE.CapsuleGeometry(0.06, 0.12, 4, 12);
    const mouseMat = new THREE.MeshStandardMaterial({
      color: 0x3A3A44, metalness: 0.7, roughness: 0.3,
    });
    const mouseBody = new THREE.Mesh(mouseBodyGeo, mouseMat);
    mouseBody.rotation.x = Math.PI / 2;
    mouseBody.scale.set(1.4, 0.35, 1);
    mouseGroup.add(mouseBody);
    // Scroll wheel
    const wheelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x555560, metalness: 0.6, roughness: 0.4 });
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.025, -0.04);
    mouseGroup.add(wheel);
    mouseGroup.position.set(1.2, 0.74, 0.55);
    scene.add(mouseGroup);
    desk.mouse = mouseGroup;

    // Coffee mug — ceramic with handle
    const mugGroup = new THREE.Group();
    const mugGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.22, 16);
    const mugMat = new THREE.MeshStandardMaterial({
      color: 0xD5D0CA, metalness: 0.05, roughness: 0.85,
    });
    const mug = new THREE.Mesh(mugGeo, mugMat);
    mugGroup.add(mug);
    // Mug handle
    const handleGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 16, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xD5D0CA, metalness: 0.05, roughness: 0.85 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.13, 0.02, 0);
    handle.rotation.z = Math.PI / 2;
    mugGroup.add(handle);
    // Dark coffee inside
    const coffeeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16);
    const coffeeMat = new THREE.MeshStandardMaterial({ color: 0x2A1810, metalness: 0.1, roughness: 0.9 });
    const coffee = new THREE.Mesh(coffeeGeo, coffeeMat);
    coffee.position.y = 0.1;
    mugGroup.add(coffee);
    mugGroup.position.set(-1.8, 0.85, 0.4);
    scene.add(mugGroup);
    desk.mug = mug;
  }

  /* ─── FLOATING GEOMETRIC SHAPES ─── */
  function createFloaters() {
    const shapes = [
      { geo: new THREE.IcosahedronGeometry(0.25, 0), pos: [-2.5, 3.5, -1], color: 0x6366F1 },
      { geo: new THREE.OctahedronGeometry(0.18, 0), pos: [2.8, 2.8, 0.5], color: 0x06B6D4 },
      { geo: new THREE.TorusGeometry(0.2, 0.06, 8, 20), pos: [-1.5, 4.2, 2], color: 0x8B5CF6 },
      { geo: new THREE.TetrahedronGeometry(0.15, 0), pos: [1.8, 3.8, -2], color: 0x6366F1 },
      { geo: new THREE.DodecahedronGeometry(0.12, 0), pos: [3.5, 4, 1.5], color: 0x06B6D4 },
      { geo: new THREE.IcosahedronGeometry(0.15, 0), pos: [-3.2, 2.5, 2.5], color: 0x8B5CF6 },
    ];

    shapes.forEach(({ geo, pos, color }) => {
      // Wireframe version for futuristic look
      const wireGeo = new THREE.EdgesGeometry(geo);
      const wireMat = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0.6,
      });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      wire.position.set(...pos);
      wire.userData = {
        baseY: pos[1],
        speed: 0.3 + Math.random() * 0.5,
        rotSpeed: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      };
      scene.add(wire);
      floaters.push(wire);

      // Subtle solid inner
      const solidMat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.06,
      });
      const solid = new THREE.Mesh(geo, solidMat);
      solid.position.copy(wire.position);
      wire.userData.solid = solid;
      scene.add(solid);
    });
  }

  /* ─── GRID FLOOR ─── */
  function createGridFloor() {
    const gridHelper = new THREE.GridHelper(30, 60, 0x6366F1, 0x6366F1);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.04;
    gridHelper.position.y = 0;
    scene.add(gridHelper);
  }

  /* ─── PARTICLES ─── */
  function createParticles() {
    const count = window.innerWidth < 768 ? 150 : 400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      [99/255, 102/255, 241/255],
      [6/255, 182/255, 212/255],
      [139/255, 92/255, 246/255],
    ];

    for (let i = 0; i < count; i++) {
      positions[i*3]   = (Math.random() - 0.5) * 20;
      positions[i*3+1] = Math.random() * 10;
      positions[i*3+2] = (Math.random() - 0.5) * 20;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i*3]   = c[0];
      colors[i*3+1] = c[1];
      colors[i*3+2] = c[2];
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    particles = new THREE.Points(geo, mat);
    scene.add(particles);
  }

  /* ═══════════════════════════════════════════════
     SCROLL-LINKED CAMERA (GSAP ScrollTrigger)
     ═══════════════════════════════════════════════ */
  function setupScrollCamera() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const heroEl = document.getElementById('hero');
    const spacer = document.getElementById('zoom-spacer');
    const flashEl = document.getElementById('flash-overlay');
    const contentEl = document.getElementById('content');
    const canvasEl = document.getElementById('scene3d');

    // Hero: starts fully opaque, fades as you scroll
    heroEl.style.opacity = '1';
    gsap.to(heroEl, {
      opacity: 0,
      scale: 0.9,
      scrollTrigger: {
        trigger: heroEl,
        start: 'top+=100px top',
        end: 'bottom top',
        scrub: 0.8,
      }
    });

    // Main camera timeline driven by scroll
    ScrollTrigger.create({
      trigger: spacer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: self => {
        scrollProgress = self.progress;
      }
    });

    // Flash + content reveal at end of zoom
    ScrollTrigger.create({
      trigger: spacer,
      start: 'bottom-=300px bottom',
      end: 'bottom bottom',
      onEnter: () => {
        if (!contentRevealed) {
          contentRevealed = true;
          // Flash effect
          flashEl.classList.add('flash');
          setTimeout(() => flashEl.classList.remove('flash'), 400);
          // Reveal content
          setTimeout(() => {
            contentEl.classList.add('visible');
            canvasEl.classList.add('fade');
          }, 200);
        }
      },
      onLeaveBack: () => {
        contentRevealed = false;
        contentEl.classList.remove('visible');
        canvasEl.classList.remove('fade');
      }
    });
  }

  /* ═══════════════════════════════════════════════
     ANIMATE — Main render loop
     ═══════════════════════════════════════════════ */
  function animate() {
    requestAnimationFrame(animate);
    if (!scene || !camera || !renderer) return;

    const t = clock.getElapsedTime();

    // ── Camera position based on scroll progress ──
    // Phase 1: 0-0.3 → approach from above
    // Phase 2: 0.3-0.7 → zoom toward monitor
    // Phase 3: 0.7-1.0 → enter the screen
    const p = scrollProgress;

    let camX, camY, camZ, lookY;

    if (p < 0.4) {
      // Start → Mid
      const t2 = p / 0.4;
      const ease = t2 * t2 * (3 - 2 * t2); // smoothstep
      camX = lerp(CAM_START.x, CAM_MID.x, ease);
      camY = lerp(CAM_START.y, CAM_MID.y, ease);
      camZ = lerp(CAM_START.z, CAM_MID.z, ease);
      lookY = lerp(LOOK_START.y, 1.5, ease);
    } else {
      // Mid → End (into the screen)
      const t2 = (p - 0.4) / 0.6;
      const ease = t2 * t2 * (3 - 2 * t2);
      camX = lerp(CAM_MID.x, CAM_END.x, ease);
      camY = lerp(CAM_MID.y, CAM_END.y, ease);
      camZ = lerp(CAM_MID.z, CAM_END.z, ease);
      lookY = lerp(1.5, LOOK_END.y, ease);
    }

    // Add subtle mouse-based camera offset
    const mouseOffX = mouseNorm.x * 0.15 * (1 - p);
    const mouseOffY = mouseNorm.y * 0.1 * (1 - p);

    camera.position.x = camX + mouseOffX;
    camera.position.y = camY + mouseOffY;
    camera.position.z = camZ;
    camera.lookAt(mouseOffX * 0.3, lookY, -1);

    // ── Animate floaters ──
    floaters.forEach(f => {
      const d = f.userData;
      f.rotation.x += d.rotSpeed * 0.01;
      f.rotation.y += d.rotSpeed * 0.015;
      f.position.y = d.baseY + Math.sin(t * d.speed + d.phase) * 0.3;
      if (d.solid) {
        d.solid.position.copy(f.position);
        d.solid.rotation.copy(f.rotation);
      }
    });

    // ── Animate screen texture (update canvas) ──
    if (desk.drawScreenUI && desk.screenTexture) {
      desk.drawScreenUI(t);
      desk.screenTexture.needsUpdate = true;
      // Increase brightness as camera approaches
      desk.screen.material.opacity = 0.7 + p * 0.3;
    }
    if (desk.screenEdge) {
      desk.screenEdge.material.opacity = 0.4 + Math.sin(t * 3) * 0.1 + p * 0.3;
    }

    // ── Animate particles ──
    if (particles) {
      particles.rotation.y += 0.0003;
      const pos = particles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += Math.sin(t * 0.5 + i) * 0.0005;
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ═══ HERO GSAP ═══ */
  function setupHeroGSAP() {
    if (typeof gsap === 'undefined') return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-label', { opacity: 0, y: 20, duration: 0.7 }, 0)
      .from('.h-line', { y: '120%', opacity: 0, duration: 1, stagger: 0.12, ease: 'power4.out' }, 0.1)
      .from('.hero-p', { opacity: 0, y: 20, duration: 0.6 }, 0.7)
      .from('.scroll-hint', { opacity: 0, y: 15, duration: 0.5 }, 0.9);
  }

  /* ═══ NAV ═══ */
  function setupNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scroll', window.scrollY > 50);
    }, { passive: true });
  }

  /* ═══ MOBILE ═══ */
  function setupMobile() {
    const btn = document.getElementById('menuBtn');
    const menu = document.getElementById('mobMenu');
    if (!btn || !menu) return;
    function toggle(o) {
      menu.classList.toggle('open', o);
      btn.classList.toggle('open', o);
      btn.setAttribute('aria-expanded', o);
      document.body.style.overflow = o ? 'hidden' : '';
    }
    btn.addEventListener('click', () => toggle(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
  }

  /* ═══ CURSOR ═══ */
  function setupCursor() {
    if (window.matchMedia('(pointer:coarse)').matches || window.innerWidth <= 1024) return;
    const dot = document.getElementById('curDot');
    const ring = document.getElementById('curRing');
    if (!dot || !ring) return;

    let mx = -100, my = -100, rx = -100, ry = -100;
    requestAnimationFrame(() => { dot.style.opacity = '1'; ring.style.opacity = '1'; });

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    });

    (function moveRing() {
      rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(moveRing);
    })();

    document.querySelectorAll('a,button,.svc,.proj,.val,.ci,.tech-item').forEach(el => {
      el.addEventListener('mouseenter', () => { ring.classList.add('hov'); dot.classList.add('hov'); });
      el.addEventListener('mouseleave', () => { ring.classList.remove('hov'); dot.classList.remove('hov'); });
    });
    document.querySelectorAll('img,.proj-img,.about-img').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('exp'));
      el.addEventListener('mouseleave', () => ring.classList.remove('exp'));
    });
    document.body.style.cursor = 'none';
    document.querySelectorAll('a,button').forEach(el => el.style.cursor = 'none');
  }

  /* ═══ MAGNETIC ═══ */
  function setupMagnetic() {
    if (window.matchMedia('(pointer:coarse)').matches || typeof gsap === 'undefined') return;
    document.querySelectorAll('.btn,.n-cta').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width/2) * 0.2, y: (e.clientY - r.top - r.height/2) * 0.2, duration: 0.3, ease: 'power2.out' });
      });
      b.addEventListener('mouseleave', () => gsap.to(b, { x:0, y:0, duration:0.6, ease:'elastic.out(1,0.4)' }));
    });
  }

  /* ═══ 3D TILT ═══ */
  function setup3DTilt() {
    if (window.matchMedia('(pointer:coarse)').matches || typeof gsap === 'undefined') return;
    document.querySelectorAll('.svc,.proj').forEach(c => {
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left)/r.width - 0.5;
        const y = (e.clientY - r.top)/r.height - 0.5;
        gsap.to(c, { rotateY: x*8, rotateX: -y*8, duration:0.3, ease:'power2.out', transformPerspective:800 });
      });
      c.addEventListener('mouseleave', () => gsap.to(c, { rotateY:0, rotateX:0, duration:0.5, ease:'power3.out' }));
    });
  }

  /* ═══ COUNTERS ═══ */
  function setupCounters() {
    const nums = document.querySelectorAll('[data-count]');
    const obs = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const tgt = parseInt(el.dataset.count);
          const dur = 2000; const st = performance.now();
          const pct = el.nextElementSibling?.textContent?.includes('%');
          (function tick(now) {
            const p = Math.min((now - st) / dur, 1);
            const eased = 1 - Math.pow(1-p, 3);
            el.textContent = Math.round(tgt * eased) + (pct ? '' : '+');
            if (p < 1) requestAnimationFrame(tick);
          })(st);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(n => obs.observe(n));
  }

  /* ═══ SCROLL REVEALS ═══ */
  function setupScrollReveals() {
    const els = document.querySelectorAll('.reveal');
    const staggerGroups = [
      { sel: '.svc', stagger: 100 },
      { sel: '.proj', stagger: 120 },
      { sel: '.val', stagger: 80 },
      { sel: '.ci', stagger: 80 },
      { sel: '.stat', stagger: 100 },
    ];
    staggerGroups.forEach(({ sel, stagger }) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.dataset.revealDelay = String(i * stagger);
      });
    });

    const obs = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          const delay = parseInt(e.target.dataset.revealDelay || '0');
          setTimeout(() => e.target.classList.add('vis'), delay);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    els.forEach(el => obs.observe(el));
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
          window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 20, behavior: 'smooth' });
        }
      });
    });
  }

  /* ═══════════════════════════════════════════════
     ASTRONAUT SCROLLBAR
     ═══════════════════════════════════════════════ */
  function setupAstroScroll() {
    const container = document.getElementById('astro-scroll');
    const astro = document.getElementById('astroFloat');
    if (!container || !astro) return;

    // Show after a small delay
    setTimeout(() => container.classList.add('active'), 500);

    // Track boundaries (px from top/bottom of viewport)
    const TRACK_TOP = 70;   // below rocket
    const TRACK_BOTTOM = 55; // above moon

    function updateAstroPosition() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);

      // Map progress to track position
      const trackHeight = window.innerHeight - TRACK_TOP - TRACK_BOTTOM;
      const astroY = TRACK_TOP + progress * trackHeight;

      astro.style.top = astroY + 'px';
    }

    // Use passive listener for performance
    window.addEventListener('scroll', updateAstroPosition, { passive: true });
    updateAstroPosition(); // initial position
  }

})();
