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
  let isMobile = false;

  // Camera positions (start → end)
  const CAM_START = { x: 0, y: 4.5, z: 11 };
  const CAM_MID   = { x: 0, y: 2.2, z: 5 };
  const CAM_END   = { x: 0, y: 1.65, z: 0.6 };

  // Mobile camera positions — centered front → rise above → descend into phone
  const MOB_CAM_START = { x: 0, y: 1.8, z: 6 };
  const MOB_CAM_MID   = { x: 0, y: 3.5, z: 0.5 };
  const MOB_CAM_END   = { x: 0, y: 1.6, z: 0.1 };
  const MOB_LOOK_START = { y: 0.78, z: -1 };
  const MOB_LOOK_MID   = { y: 0.78, z: 0.1 };
  const MOB_LOOK_END   = { y: 0.78, z: 0.1 };

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
    }, 1955);
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

    // Desk spotlight — white light aimed at the setup so it pops
    const deskSpot = new THREE.SpotLight(0xFFFFFF, 1.2, 12, Math.PI / 5, 0.4, 1);
    deskSpot.position.set(0, 5, 2);
    deskSpot.target.position.set(0, 0.75, 0.2);
    scene.add(deskSpot);
    scene.add(deskSpot.target);

    // Detect mobile viewport
    isMobile = window.innerWidth < 768;

    // Build the scene
    createDesk();
    if (isMobile) {
      createPhoneSetup();
    } else {
      createMonitor();
      createKeyboard();
      createGamingPC();
    }
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
    // Monitor body (thin box) — near-white aluminum frame
    const bodyGeo = new THREE.BoxGeometry(3, 1.8, 0.1);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xE0E0E8,
      metalness: 0.6,
      roughness: 0.25,
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

    // Draw screen content — changes based on scroll progress
    function drawScreenUI(time) {
      const w = screenCanvas.width;
      const h = screenCanvas.height;
      const sp = scrollProgress; // 0–1

      // ── PHASE 1: Normal website UI (0–55%) ──
      if (sp < 0.55) {
        drawNormalUI(time, w, h);
      }
      // ── PHASE 2: Glitch + distortion (55–80%) ──
      else if (sp < 0.80) {
        const glitchPct = (sp - 0.55) / 0.25; // 0→1
        drawNormalUI(time, w, h);
        drawGlitchEffect(time, w, h, glitchPct);
      }
      // ── PHASE 3: Hyperspace star warp (80–100%) ──
      else {
        const warpPct = (sp - 0.80) / 0.20; // 0→1
        drawStarWarp(time, w, h, warpPct);
      }
    }

    // ── Normal Website UI (unchanged from original) ──
    function drawNormalUI(time, w, h) {
      ctx.fillStyle = '#0A0A0F';
      ctx.fillRect(0, 0, w, h);

      // Nav bar
      ctx.fillStyle = 'rgba(18,18,26,0.9)';
      ctx.fillRect(0, 0, w, 44);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#6366F1';
      ctx.fillText('W', 24, 28);
      ctx.fillStyle = '#F0F0F5';
      ctx.fillText('ebTuria', 36, 28);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(240,240,245,0.5)';
      ['Servicios', 'Proyectos', 'Nosotros', 'Contacto'].forEach((t, i) => {
        ctx.fillText(t, w - 340 + i * 80, 27);
      });
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

      // Hero text
      ctx.font = 'bold 48px sans-serif';
      ctx.fillStyle = '#F0F0F5';
      ctx.fillText('Diseño Web', 60, 140);
      ctx.fillText('en Valencia', 60, 195);
      const grad2 = ctx.createLinearGradient(60, 210, 500, 250);
      grad2.addColorStop(0, '#6366F1');
      grad2.addColorStop(0.5, '#06B6D4');
      grad2.addColorStop(1, '#8B5CF6');
      ctx.fillStyle = grad2;
      ctx.fillText('a otro nivel', 60, 250);

      // Stats
      ctx.font = 'bold 20px sans-serif';
      [{ n: '50+', l: 'Proyectos' }, { n: '98%', l: 'Satisfacción' }, { n: '5', l: 'Años' }].forEach((s, i) => {
        const sx = 80 + i * 160;
        ctx.fillStyle = '#6366F1';
        ctx.fillText(s.n, sx, 320);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(240,240,245,0.4)';
        ctx.fillText(s.l, sx, 336);
        ctx.font = 'bold 20px sans-serif';
      });

      // Cards
      const cardColors = ['#6366F1', '#06B6D4', '#8B5CF6'];
      for (let i = 0; i < 3; i++) {
        const cx = 620, cy = 70 + i * 115;
        ctx.fillStyle = 'rgba(18,18,26,0.8)';
        ctx.beginPath();
        ctx.roundRect(cx, cy, 360, 100, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = cardColors[i];
        ctx.fillRect(cx, cy, 3, 100);
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#F0F0F5';
        ctx.fillText(['Diseño Web Premium', 'Automatización con IA', 'E-commerce'][i], cx + 20, cy + 30);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = 'rgba(240,240,245,0.4)';
        ctx.fillText('Tecnología de vanguardia', cx + 20, cy + 50);
        for (let b = 0; b < 5; b++) {
          const bh = 15 + Math.sin(time * 2 + b + i) * 8;
          ctx.fillStyle = cardColors[i] + '40';
          ctx.fillRect(cx + 20 + b * 30, cy + 85 - bh, 20, bh);
        }
      }

      // Scan line
      const scanY = (time * 80) % h;
      ctx.fillStyle = 'rgba(99,102,241,0.03)';
      ctx.fillRect(0, scanY, w, 2);
    }

    // ── Glitch overlay effect ──
    function drawGlitchEffect(time, w, h, intensity) {
      // Horizontal displacement bars
      const numBars = Math.floor(3 + intensity * 15);
      for (let i = 0; i < numBars; i++) {
        const y = Math.floor(Math.random() * h);
        const barH = 1 + Math.floor(Math.random() * (4 + intensity * 12));
        const shift = (Math.random() - 0.5) * intensity * 60;
        // Grab and shift a strip
        const imgData = ctx.getImageData(0, y, w, barH);
        ctx.putImageData(imgData, shift, y);
      }

      // RGB split — shift red channel
      if (intensity > 0.3) {
        const splitAmt = Math.floor(intensity * 8);
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = intensity * 0.15;
        ctx.drawImage(screenCanvas, splitAmt, 0);
        ctx.drawImage(screenCanvas, -splitAmt, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }

      // Random corruption blocks
      const numBlocks = Math.floor(intensity * 8);
      for (let i = 0; i < numBlocks; i++) {
        const bx = Math.random() * w;
        const by = Math.random() * h;
        const bw = 20 + Math.random() * 80 * intensity;
        const bh2 = 2 + Math.random() * 10;
        ctx.fillStyle = ['#6366F1', '#06B6D4', '#8B5CF6', '#000'][Math.floor(Math.random() * 4)];
        ctx.globalAlpha = 0.3 + intensity * 0.4;
        ctx.fillRect(bx, by, bw, bh2);
        ctx.globalAlpha = 1;
      }

      // Aggressive scan lines
      for (let y = 0; y < h; y += 3) {
        ctx.fillStyle = `rgba(0,0,0,${0.05 + intensity * 0.15})`;
        ctx.fillRect(0, y, w, 1);
      }

      // Random flicker to black
      if (Math.random() < intensity * 0.15) {
        ctx.fillStyle = `rgba(0,0,0,${0.4 + intensity * 0.4})`;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // ── Star Warp / Hyperspace ──
    // Pre-generate star field (persistent across frames)
    const warpStars = [];
    for (let i = 0; i < 300; i++) {
      warpStars.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random(),
        speed: 0.3 + Math.random() * 0.7,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }

    function drawStarWarp(time, w, h, intensity) {
      // Black background
      ctx.fillStyle = '#000005';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);

      // Draw stars streaking from center outward
      warpStars.forEach(star => {
        // Stars move outward over time
        const moveDist = ((star.dist + time * star.speed * 0.3) % 1);
        const len = 2 + moveDist * (20 + intensity * 80); // streak length
        const dist = moveDist * maxDist;

        const x1 = cx + Math.cos(star.angle) * dist;
        const y1 = cy + Math.sin(star.angle) * dist;
        const x2 = cx + Math.cos(star.angle) * Math.max(0, dist - len);
        const y2 = cy + Math.sin(star.angle) * Math.max(0, dist - len);

        // Color shifts from white to blue/cyan as intensity increases
        const alpha = star.brightness * (0.3 + intensity * 0.7) * moveDist;
        const r = Math.floor(180 + 75 * (1 - intensity));
        const g = Math.floor(180 + 75 * (1 - intensity * 0.5));
        const b = 255;

        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = 0.5 + moveDist * (1 + intensity * 2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Central bright glow that intensifies
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 + intensity * 120);
      glowGrad.addColorStop(0, `rgba(99,102,241,${0.1 + intensity * 0.3})`);
      glowGrad.addColorStop(0.3, `rgba(6,182,212,${0.05 + intensity * 0.15})`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // Edge vignette
      const vigGrad = ctx.createRadialGradient(cx, cy, maxDist * 0.3, cx, cy, maxDist);
      vigGrad.addColorStop(0, 'transparent');
      vigGrad.addColorStop(1, `rgba(0,0,10,${0.5 + intensity * 0.4})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, w, h);

      // "ENTERING" text at high intensity
      if (intensity > 0.6) {
        const textAlpha = (intensity - 0.6) / 0.4;
        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = `rgba(6,182,212,${textAlpha * 0.6})`;
        ctx.textAlign = 'center';
        ctx.fillText('E N T E R I N G', cx, cy + 100);
        ctx.textAlign = 'start';
      }
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
      color: 0xE8E8EE, metalness: 0.5, roughness: 0.25,
    });
    const kb = new THREE.Mesh(kbGeo, kbMat);
    kbGroup.add(kb);

    // Individual keys — lighter caps for visibility
    const keyGeo = new THREE.BoxGeometry(0.08, 0.025, 0.08);
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0xF2F2F6, metalness: 0.3, roughness: 0.4,
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
    // Mouse body (rounded using scaled sphere — r128 compat)
    const mouseBodyGeo = new THREE.SphereGeometry(0.1, 16, 12);
    const mouseMat = new THREE.MeshStandardMaterial({
      color: 0xE8E8EE, metalness: 0.5, roughness: 0.25,
    });
    const mouseBody = new THREE.Mesh(mouseBodyGeo, mouseMat);
    mouseBody.scale.set(1, 0.3, 1.5);
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

    // Coffee mug — white ceramic, open top to show coffee
    const mugGroup = new THREE.Group();
    const mugMat = new THREE.MeshStandardMaterial({
      color: 0xE8E4E0, metalness: 0.08, roughness: 0.75,
    });

    // Mug body — openEnded=true removes top AND bottom caps so coffee is visible
    const mugGeo = new THREE.CylinderGeometry(0.12, 0.10, 0.22, 24, 1, true);
    const mug = new THREE.Mesh(mugGeo, mugMat);
    mugGroup.add(mug);

    // Manual bottom cap (since openEnded removes both)
    const bottomCap = new THREE.Mesh(
      new THREE.CircleGeometry(0.10, 24),
      mugMat
    );
    bottomCap.rotation.x = Math.PI / 2;
    bottomCap.position.y = -0.11;
    mugGroup.add(bottomCap);

    // Rim ring at top
    const rimGeo = new THREE.TorusGeometry(0.12, 0.012, 8, 24);
    const rim = new THREE.Mesh(rimGeo, mugMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.11;
    mugGroup.add(rim);

    // Café con leche — warm brown, MeshBasicMaterial so lighting can't wash it out
    const coffee = new THREE.Mesh(
      new THREE.CircleGeometry(0.105, 24),
      new THREE.MeshBasicMaterial({ color: 0xC4956A, side: THREE.DoubleSide })
    );
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.08;
    mugGroup.add(coffee);

    mugGroup.position.set(-1.8, 0.85, 0.4);
    scene.add(mugGroup);
    desk.mug = mug;
  }

  /* ─── GAMING PC TOWER ─── */
  function createGamingPC() {
    const pcGroup = new THREE.Group();

    // Case body — matte dark metal
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x1A1A22, metalness: 0.6, roughness: 0.4,
    });

    // Main case box
    const caseGeo = new THREE.BoxGeometry(0.35, 0.7, 0.55);
    const caseBody = new THREE.Mesh(caseGeo, caseMat);
    pcGroup.add(caseBody);

    // Tempered glass side panel (facing camera)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1A1A3A, metalness: 0.9, roughness: 0.05,
      transparent: true, opacity: 0.35,
    });
    const glassGeo = new THREE.PlaneGeometry(0.30, 0.58);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0.176, 0.02, 0);
    glass.rotation.y = Math.PI / 2;
    pcGroup.add(glass);

    // Internal RGB glow (visible through glass)
    const innerGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.54),
      new THREE.MeshBasicMaterial({
        color: 0x6366F1, transparent: true, opacity: 0.12,
        side: THREE.DoubleSide,
      })
    );
    innerGlow.position.set(0.17, 0.02, 0);
    innerGlow.rotation.y = Math.PI / 2;
    pcGroup.add(innerGlow);
    desk.pcInnerGlow = innerGlow;

    // RGB LED strip — top edge (horizontal line)
    const ledTopGeo = new THREE.BoxGeometry(0.005, 0.005, 0.50);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4 });
    const ledTop = new THREE.Mesh(ledTopGeo, ledMat);
    ledTop.position.set(0.175, 0.33, 0);
    pcGroup.add(ledTop);
    desk.pcLedTop = ledTop;

    // RGB LED strip — bottom edge
    const ledBot = new THREE.Mesh(ledTopGeo, ledMat.clone());
    ledBot.position.set(0.175, -0.29, 0);
    pcGroup.add(ledBot);
    desk.pcLedBot = ledBot;

    // RGB LED strip — vertical front edge
    const ledSideGeo = new THREE.BoxGeometry(0.005, 0.62, 0.005);
    const ledSide = new THREE.Mesh(ledSideGeo, ledMat.clone());
    ledSide.position.set(0.175, 0.02, 0.25);
    pcGroup.add(ledSide);
    desk.pcLedSide = ledSide;

    // Front panel — darker face with ventilation lines
    const frontMat = new THREE.MeshStandardMaterial({
      color: 0x111118, metalness: 0.5, roughness: 0.6,
    });
    const frontPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.33, 0.68),
      frontMat
    );
    frontPanel.position.set(0, 0, 0.276);
    pcGroup.add(frontPanel);

    // Front mesh/vent lines
    const ventMat = new THREE.MeshBasicMaterial({ color: 0x2A2A35 });
    for (let i = 0; i < 8; i++) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.008, 0.002),
        ventMat
      );
      vent.position.set(0, 0.22 - i * 0.055, 0.278);
      pcGroup.add(vent);
    }

    // Power button (small circle with LED)
    const pwrGeo = new THREE.CircleGeometry(0.012, 12);
    const pwrMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4 });
    const pwrBtn = new THREE.Mesh(pwrGeo, pwrMat);
    pwrBtn.position.set(0, -0.25, 0.278);
    pcGroup.add(pwrBtn);

    // USB ports (small rectangles on front)
    const usbMat = new THREE.MeshBasicMaterial({ color: 0x0A0A12 });
    for (let i = 0; i < 2; i++) {
      const usb = new THREE.Mesh(
        new THREE.PlaneGeometry(0.02, 0.008),
        usbMat
      );
      usb.position.set(-0.03 + i * 0.06, -0.22, 0.278);
      pcGroup.add(usb);
    }

    // Position on desk — right side of monitor
    pcGroup.position.set(1.8, 1.09, -0.15);
    scene.add(pcGroup);
    desk.pc = pcGroup;
  }

  /* ─── MOBILE PHONE SETUP ─── */
  function createPhoneSetup() {
    const phoneGroup = new THREE.Group();

    // Phone body — dark metallic
    const phoneMat = new THREE.MeshStandardMaterial({
      color: 0x1A1A22, metalness: 0.7, roughness: 0.3,
    });

    // Main body (portrait rectangle)
    const bodyGeo = new THREE.BoxGeometry(0.75, 1.5, 0.05);
    const body = new THREE.Mesh(bodyGeo, phoneMat);
    phoneGroup.add(body);

    // Side frame edges (slightly lighter)
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x3A3A44, metalness: 0.8, roughness: 0.2,
    });

    // Volume button (right side)
    const volBtn = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.08, 0.02),
      frameMat
    );
    volBtn.position.set(0.38, 0.2, 0);
    phoneGroup.add(volBtn);

    // Power button (right side)
    const pwrBtn = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.05, 0.02),
      frameMat
    );
    pwrBtn.position.set(0.38, -0.05, 0);
    phoneGroup.add(pwrBtn);

    // Camera notch (top center)
    const notch = new THREE.Mesh(
      new THREE.CircleGeometry(0.018, 12),
      new THREE.MeshBasicMaterial({ color: 0x111118 })
    );
    notch.position.set(0, 0.68, 0.026);
    phoneGroup.add(notch);

    // ── Screen with CanvasTexture (portrait) ──
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 600;
    screenCanvas.height = 1024;
    const ctx = screenCanvas.getContext('2d');

    // Portrait screen UI drawing
    function drawPhoneScreenUI(time) {
      const w = screenCanvas.width;
      const h = screenCanvas.height;
      const sp = scrollProgress;

      if (sp < 0.55) {
        drawPhoneNormalUI(time, w, h);
      } else if (sp < 0.80) {
        const glitchPct = (sp - 0.55) / 0.25;
        drawPhoneNormalUI(time, w, h);
        drawPhoneGlitch(time, w, h, glitchPct);
      } else {
        const warpPct = (sp - 0.80) / 0.20;
        drawPhoneWarp(time, w, h, warpPct);
      }
    }

    function drawPhoneNormalUI(time, w, h) {
      ctx.fillStyle = '#0A0A0F';
      ctx.fillRect(0, 0, w, h);

      // Status bar
      ctx.fillStyle = 'rgba(18,18,26,0.9)';
      ctx.fillRect(0, 0, w, 50);
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('9:41', 24, 34);
      ctx.fillText('100%', w - 60, 34);

      // Nav bar
      ctx.fillStyle = 'rgba(18,18,26,0.9)';
      ctx.fillRect(0, 50, w, 48);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#6366F1';
      ctx.fillText('W', 20, 82);
      ctx.fillStyle = '#F0F0F5';
      ctx.fillText('ebTuria', 34, 82);
      // CTA button
      const grad1 = ctx.createLinearGradient(w - 110, 62, w - 20, 82);
      grad1.addColorStop(0, '#6366F1');
      grad1.addColorStop(1, '#06B6D4');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.roundRect(w - 120, 62, 100, 26, 13);
      ctx.fill();
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('Hablemos →', w - 112, 80);

      // Hero text (stacked for portrait)
      ctx.font = 'bold 42px sans-serif';
      ctx.fillStyle = '#F0F0F5';
      ctx.fillText('Diseño Web', 30, 170);
      ctx.fillText('en Valencia', 30, 220);
      const grad2 = ctx.createLinearGradient(30, 230, 400, 270);
      grad2.addColorStop(0, '#6366F1');
      grad2.addColorStop(0.5, '#06B6D4');
      grad2.addColorStop(1, '#8B5CF6');
      ctx.fillStyle = grad2;
      ctx.fillText('a otro nivel', 30, 270);

      // Stats row
      ctx.font = 'bold 18px sans-serif';
      const stats = [{ n: '50+', l: 'Proyectos' }, { n: '98%', l: 'Satisfacción' }, { n: '5', l: 'Años' }];
      stats.forEach((s, i) => {
        const sx = 50 + i * 180;
        ctx.fillStyle = '#6366F1';
        ctx.fillText(s.n, sx, 340);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(240,240,245,0.4)';
        ctx.fillText(s.l, sx, 356);
        ctx.font = 'bold 18px sans-serif';
      });

      // Cards stacked vertically (portrait layout)
      const cardColors = ['#6366F1', '#06B6D4', '#8B5CF6'];
      const titles = ['Diseño Web Premium', 'Automatización con IA', 'E-commerce'];
      for (let i = 0; i < 3; i++) {
        const cx = 20, cy = 400 + i * 95;
        ctx.fillStyle = 'rgba(18,18,26,0.8)';
        ctx.beginPath();
        ctx.roundRect(cx, cy, w - 40, 80, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = cardColors[i];
        ctx.fillRect(cx, cy, 3, 80);
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#F0F0F5';
        ctx.fillText(titles[i], cx + 18, cy + 28);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = 'rgba(240,240,245,0.4)';
        ctx.fillText('Tecnología de vanguardia', cx + 18, cy + 48);
        for (let b = 0; b < 5; b++) {
          const bh = 12 + Math.sin(time * 2 + b + i) * 6;
          ctx.fillStyle = cardColors[i] + '40';
          ctx.fillRect(cx + 18 + b * 28, cy + 70 - bh, 18, bh);
        }
      }

      // Scan line
      const scanY = (time * 80) % h;
      ctx.fillStyle = 'rgba(99,102,241,0.03)';
      ctx.fillRect(0, scanY, w, 2);
    }

    function drawPhoneGlitch(time, w, h, intensity) {
      const numBars = Math.floor(3 + intensity * 12);
      for (let i = 0; i < numBars; i++) {
        const y = Math.floor(Math.random() * h);
        const barH = 1 + Math.floor(Math.random() * (4 + intensity * 10));
        const shift = (Math.random() - 0.5) * intensity * 50;
        const imgData = ctx.getImageData(0, y, w, barH);
        ctx.putImageData(imgData, shift, y);
      }
      if (intensity > 0.3) {
        const splitAmt = Math.floor(intensity * 6);
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = intensity * 0.12;
        ctx.drawImage(screenCanvas, splitAmt, 0);
        ctx.drawImage(screenCanvas, -splitAmt, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      const numBlocks = Math.floor(intensity * 6);
      for (let i = 0; i < numBlocks; i++) {
        ctx.fillStyle = ['#6366F1', '#06B6D4', '#8B5CF6', '#000'][Math.floor(Math.random() * 4)];
        ctx.globalAlpha = 0.3 + intensity * 0.4;
        ctx.fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 60, 2 + Math.random() * 8);
        ctx.globalAlpha = 1;
      }
      for (let y = 0; y < h; y += 3) {
        ctx.fillStyle = `rgba(0,0,0,${0.05 + intensity * 0.12})`;
        ctx.fillRect(0, y, w, 1);
      }
      if (Math.random() < intensity * 0.12) {
        ctx.fillStyle = `rgba(0,0,0,${0.4 + intensity * 0.4})`;
        ctx.fillRect(0, 0, w, h);
      }
    }

    const phoneWarpStars = [];
    for (let i = 0; i < 200; i++) {
      phoneWarpStars.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random(),
        speed: 0.3 + Math.random() * 0.7,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }

    function drawPhoneWarp(time, w, h, intensity) {
      ctx.fillStyle = '#000005';
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      phoneWarpStars.forEach(star => {
        const moveDist = ((star.dist + time * star.speed * 0.3) % 1);
        const len = 2 + moveDist * (15 + intensity * 60);
        const dist = moveDist * maxDist;
        const x1 = cx + Math.cos(star.angle) * dist;
        const y1 = cy + Math.sin(star.angle) * dist;
        const x2 = cx + Math.cos(star.angle) * Math.max(0, dist - len);
        const y2 = cy + Math.sin(star.angle) * Math.max(0, dist - len);
        const alpha = star.brightness * (0.3 + intensity * 0.7) * moveDist;
        ctx.strokeStyle = `rgba(${Math.floor(180 + 75 * (1 - intensity))},${Math.floor(180 + 75 * (1 - intensity * 0.5))},255,${alpha})`;
        ctx.lineWidth = 0.5 + moveDist * (1 + intensity * 1.5);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 + intensity * 100);
      glowGrad.addColorStop(0, `rgba(99,102,241,${0.1 + intensity * 0.3})`);
      glowGrad.addColorStop(0.3, `rgba(6,182,212,${0.05 + intensity * 0.15})`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);
      if (intensity > 0.6) {
        const textAlpha = (intensity - 0.6) / 0.4;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = `rgba(6,182,212,${textAlpha * 0.6})`;
        ctx.textAlign = 'center';
        ctx.fillText('E N T E R I N G', cx, cy + 80);
        ctx.textAlign = 'start';
      }
    }

    drawPhoneScreenUI(0);
    const screenTexture = new THREE.CanvasTexture(screenCanvas);

    // Screen plane (portrait, slightly inset from body)
    const screenGeo = new THREE.PlaneGeometry(0.68, 1.38);
    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
      transparent: true,
      opacity: 0.95,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 0.026;
    phoneGroup.add(screen);

    // Store references for animation
    desk.screen = screen;
    desk.screenTexture = screenTexture;
    desk.drawScreenUI = drawPhoneScreenUI;
    desk.screenEdge = null;

    // Small dock/stand under the phone
    const dockMat = new THREE.MeshStandardMaterial({
      color: 0x2A2A35, metalness: 0.6, roughness: 0.4,
    });
    const dock = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.06, 0.15),
      dockMat
    );
    dock.position.set(0, -0.78, 0.02);
    phoneGroup.add(dock);

    // Position phone lying flat on desk (face up)
    phoneGroup.position.set(0, 0.78, 0.1);
    phoneGroup.rotation.x = -Math.PI / 2; // flat, face up
    scene.add(phoneGroup);
    desk.phone = phoneGroup;
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
    const warpEl = document.getElementById('warp-overlay');
    const biosEl = document.getElementById('bios-overlay');
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

        // Activate warp overlay at 65%+ (but only before content is revealed)
        if (self.progress > 0.65 && !contentRevealed) {
          warpEl.classList.add('active');
          if (self.progress > 0.82) {
            warpEl.classList.add('intense');
          } else {
            warpEl.classList.remove('intense');
          }
        } else {
          warpEl.classList.remove('active', 'intense');
        }
      }
    });

    // BIOS boot + content reveal at end of zoom
    let biosRunning = false;
    ScrollTrigger.create({
      trigger: spacer,
      start: 'bottom-=200px bottom',
      end: 'bottom bottom',
      onEnter: () => {
        if (!contentRevealed && !biosRunning) {
          biosRunning = true;
          contentRevealed = true;

          // Lock scroll during animation
          document.body.style.overflow = 'hidden';

          // Start BIOS boot sequence
          warpEl.classList.remove('active', 'intense');
          biosEl.classList.add('active');
          canvasEl.classList.add('fade');

          // Type out BIOS lines one by one
          const lines = biosEl.querySelectorAll('.bios-line');
          lines.forEach(line => {
            const delay = parseInt(line.dataset.delay) || 0;
            setTimeout(() => line.classList.add('vis'), delay);
          });

          // After all lines are shown → flash → reveal content
          const lastDelay = parseInt(lines[lines.length - 1].dataset.delay) || 2400;
          setTimeout(() => {
            // Flash
            flashEl.classList.add('flash');
            setTimeout(() => flashEl.classList.remove('flash'), 400);
            // Hide BIOS, show content, scroll to top of content
            setTimeout(() => {
              biosEl.classList.remove('active');
              contentEl.classList.add('visible');
              // Scroll to end of spacer so content starts at top
              const spacerBottom = spacer.offsetTop + spacer.offsetHeight;
              window.scrollTo({ top: spacerBottom, behavior: 'instant' });
              // Unlock scroll
              document.body.style.overflow = '';
              ScrollTrigger.refresh();
            }, 200);
          }, lastDelay + 600);
        }
      }
    });

    // Detect scroll-back: when user scrolls above spacer bottom, reset everything
    function resetToScene() {
      if (!contentRevealed) return;
      const spacerBottom = spacer.offsetTop + spacer.offsetHeight;
      if (window.scrollY < spacerBottom - 300) {
        contentRevealed = false;
        biosRunning = false;
        contentEl.classList.remove('visible');
        canvasEl.classList.remove('fade');
        biosEl.classList.remove('active');
        flashEl.classList.remove('flash');
        warpEl.classList.remove('active', 'intense');
        document.body.style.overflow = '';
        biosEl.querySelectorAll('.bios-line').forEach(l => l.classList.remove('vis'));
        ScrollTrigger.refresh();
      }
    }
    window.addEventListener('scroll', resetToScene, { passive: true });
  }

  /* ═══════════════════════════════════════════════
     ANIMATE — Main render loop
     ═══════════════════════════════════════════════ */
  function animate() {
    requestAnimationFrame(animate);
    if (!scene || !camera || !renderer) return;

    const t = clock.getElapsedTime();

    // ── Camera position based on scroll progress ──
    const p = scrollProgress;

    let camX, camY, camZ, lookY;

    if (isMobile) {
      // Mobile: side approach → rise above → descend into phone
      if (p < 0.35) {
        // Phase 1: Approach from side, moving toward center
        const t2 = p / 0.35;
        const ease = t2 * t2 * (3 - 2 * t2);
        camX = lerp(MOB_CAM_START.x, MOB_CAM_MID.x, ease);
        camY = lerp(MOB_CAM_START.y, MOB_CAM_MID.y, ease);
        camZ = lerp(MOB_CAM_START.z, MOB_CAM_MID.z, ease);
        lookY = lerp(MOB_LOOK_START.y, MOB_LOOK_MID.y, ease);
      } else {
        // Phase 2: From above, descend into the phone screen
        const t2 = (p - 0.35) / 0.65;
        const ease = t2 * t2 * (3 - 2 * t2);
        camX = lerp(MOB_CAM_MID.x, MOB_CAM_END.x, ease);
        camY = lerp(MOB_CAM_MID.y, MOB_CAM_END.y, ease);
        camZ = lerp(MOB_CAM_MID.z, MOB_CAM_END.z, ease);
        lookY = lerp(MOB_LOOK_MID.y, MOB_LOOK_END.y, ease);
      }
    } else {
      // Desktop: original camera path
      const cStart = CAM_START;
      const cMid   = CAM_MID;
      const cEnd   = CAM_END;

      if (p < 0.4) {
        const t2 = p / 0.4;
        const ease = t2 * t2 * (3 - 2 * t2);
        camX = lerp(cStart.x, cMid.x, ease);
        camY = lerp(cStart.y, cMid.y, ease);
        camZ = lerp(cStart.z, cMid.z, ease);
        lookY = lerp(LOOK_START.y, 1.5, ease);
      } else {
        const t2 = (p - 0.4) / 0.6;
        const ease = t2 * t2 * (3 - 2 * t2);
        camX = lerp(cMid.x, cEnd.x, ease);
        camY = lerp(cMid.y, cEnd.y, ease);
        camZ = lerp(cMid.z, cEnd.z, ease);
        lookY = lerp(1.5, LOOK_END.y, ease);
      }
    }

    // Add subtle mouse-based camera offset
    const mouseOffX = mouseNorm.x * 0.15 * (1 - p);
    const mouseOffY = mouseNorm.y * 0.1 * (1 - p);

    camera.position.x = camX + mouseOffX;
    camera.position.y = camY + mouseOffY;
    camera.position.z = camZ;
    if (isMobile) {
      // Mobile: lookAt transitions from front-on to straight down at phone
      const lookZ = lerp(
        MOB_LOOK_START.z,
        p < 0.35 ? MOB_LOOK_MID.z : MOB_LOOK_END.z,
        Math.min(p / 0.35, 1)
      );
      camera.lookAt(mouseOffX * 0.3, lookY, lookZ);
    } else {
      camera.lookAt(mouseOffX * 0.3, lookY, -1);
    }

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

    // ── Animate PC RGB LEDs ──
    if (desk.pcLedTop) {
      const r = Math.sin(t * 0.8) * 0.5 + 0.5;
      const g = Math.sin(t * 0.8 + 2.1) * 0.5 + 0.5;
      const b = Math.sin(t * 0.8 + 4.2) * 0.5 + 0.5;
      const rgbColor = new THREE.Color(r * 0.4 + 0.1, g * 0.3, b * 0.8 + 0.2);
      desk.pcLedTop.material.color.copy(rgbColor);
      desk.pcLedBot.material.color.copy(rgbColor);
      desk.pcLedSide.material.color.copy(rgbColor);
      desk.pcInnerGlow.material.opacity = 0.08 + Math.sin(t * 1.5) * 0.06;
      desk.pcInnerGlow.material.color.copy(rgbColor);
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
