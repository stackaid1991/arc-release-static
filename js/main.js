/* ============================================================
   ArcRelease — Static Site Main JS
   - Animated multi-layer background canvas
   - Navbar scroll effect & mobile menu
   - Marquee populator (integrations)
   - Modal (Book a Demo) open/close
   - Form validation + toast notifications
   ============================================================ */

(function () {
  'use strict';

  /* ====================================================
     Footer year
     ==================================================== */
  document.getElementById('footer-year').textContent = new Date().getFullYear();

  /* ====================================================
     Navbar scroll + Mobile menu
     ==================================================== */
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    if (window.scrollY > 12) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  /* ====================================================
     Integrations marquee
     ==================================================== */
  const TOOLS = [
    { name: 'Jira', color: '#0052CC' },
    { name: 'GitHub', color: '#ffffff' },
    { name: 'GitLab', color: '#FC6D26' },
    { name: 'Jenkins', color: '#D24939' },
    { name: 'CircleCI', color: '#A4A4A4' },
    { name: 'ServiceNow', color: '#62D84E' },
    { name: 'Slack', color: '#E01E5A' },
    { name: 'PagerDuty', color: '#06AC38' },
    { name: 'Datadog', color: '#8E5BC1' },
    { name: 'Splunk', color: '#FF5500' },
    { name: 'AWS', color: '#FF9900' },
    { name: 'Azure', color: '#0078D4' },
    { name: 'Terraform', color: '#7B42BC' },
    { name: 'Kubernetes', color: '#326CE5' },
    { name: 'Confluence', color: '#2684FF' },
    { name: 'Bitbucket', color: '#2684FF' },
  ];

  const buildToolPill = (tool) => {
    const c = tool.color;
    return `
      <div class="tool-pill">
        <div class="tool-letter" style="background: linear-gradient(135deg, ${c}25, ${c}10); border: 1px solid ${c}40; color: ${c === '#ffffff' ? '#ffffff' : c};">
          ${tool.name.charAt(0)}
        </div>
        <span class="tool-name">${tool.name}</span>
      </div>
    `;
  };

  const buildMarquee = (id, items) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Duplicate items for seamless loop
    const html = [...items, ...items].map(buildToolPill).join('');
    el.innerHTML = html;
  };

  buildMarquee('marquee-1', TOOLS.slice(0, 8));
  buildMarquee('marquee-2', TOOLS.slice(8, 16));

  /* ====================================================
     Modal (Book a Demo)
     ==================================================== */
  const modal = document.getElementById('demo-modal');
  const modalClose = document.getElementById('modal-close');
  const openButtons = document.querySelectorAll('[data-open-demo]');

  const openModal = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openButtons.forEach((btn) => btn.addEventListener('click', openModal));
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  /* ====================================================
     Toast
     ==================================================== */
  const toastContainer = document.getElementById('toast-container');
  const showToast = ({ title, desc, type }) => {
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' error' : '');
    t.innerHTML = `
      <div class="toast-title">${title}</div>
      ${desc ? `<div class="toast-desc">${desc}</div>` : ''}
    `;
    toastContainer.appendChild(t);
    setTimeout(() => {
      t.classList.add('fade-out');
      setTimeout(() => t.remove(), 320);
    }, 3500);
  };

  /* ====================================================
     Demo Form — FormSubmit.co via native form POST + hidden iframe
     - Avoids CORS / CORB entirely (never reads the response)
     - Form posts natively to https://formsubmit.co/<recipient-email>
     - The hidden <iframe name="fs-iframe"> receives the response
     - We listen to that iframe's `load` event to know when the
       submission completed
     - First submission triggers a one-time confirmation email to the
       recipient. Click the link inside, then submissions go through.
     ==================================================== */
  const form = document.getElementById('demo-form');
  const iframe = document.getElementById('fs-iframe');
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitBtnHTML = submitBtn.innerHTML;
  const subjectInput = document.getElementById('hidden-subject');

  let submissionInProgress = false;
  let submissionTimeoutId = null;

  const setSubmitting = (isSubmitting) => {
    submitBtn.disabled = isSubmitting;
    submitBtn.style.opacity = isSubmitting ? '0.7' : '1';
    submitBtn.style.cursor = isSubmitting ? 'not-allowed' : 'pointer';
    submitBtn.innerHTML = isSubmitting
      ? '<span class="spinner" aria-hidden="true"></span> Sending...'
      : submitBtnHTML;
  };

  const finishSubmission = (success, firstName) => {
    if (!submissionInProgress) return;
    submissionInProgress = false;
    if (submissionTimeoutId) {
      clearTimeout(submissionTimeoutId);
      submissionTimeoutId = null;
    }
    setSubmitting(false);
    if (success) {
      showToast({
        title: 'Request received!',
        desc: `Thanks ${firstName}, we'll be in touch within 24 hours.`,
      });
      form.reset();
      closeModal();
    } else {
      showToast({
        title: 'Submission timed out',
        desc: 'Please try again, or email us directly.',
        type: 'error',
      });
    }
  };

  // The iframe fires `load` once when the page first renders (initial blank
  // page). We ignore that and only treat subsequent loads as "submission
  // complete".
  iframe.addEventListener('load', () => {
    if (!submissionInProgress) return;
    const firstName = (document.getElementById('firstName').value || '').trim() || 'there';
    finishSubmission(true, firstName);
  });

  form.addEventListener('submit', (e) => {
    // Validate before letting the native submission proceed
    const required = ['firstName', 'lastName', 'email', 'mobile'];
    let valid = true;
    required.forEach((id) => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.classList.add('error');
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });

    const emailEl = document.getElementById('email');
    if (emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      emailEl.classList.add('error');
      valid = false;
    }

    if (!valid) {
      // Block the native submission and show error
      e.preventDefault();
      showToast({
        title: 'Please fill required fields',
        desc: 'First name, last name, valid email, and mobile are required.',
        type: 'error',
      });
      return;
    }

    // Set a dynamic, useful subject line
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    if (subjectInput) {
      subjectInput.value = `New ArcRelease Demo Request — ${firstName} ${lastName}`;
    }

    // Mark as submitting and start a safety timeout
    submissionInProgress = true;
    setSubmitting(true);
    submissionTimeoutId = setTimeout(() => {
      // If the iframe never loads back, still let the user retry
      finishSubmission(false, firstName);
    }, 12000);

    // IMPORTANT: do NOT preventDefault here. The browser will do a native
    // POST submission of all form fields (including the hidden access_key,
    // subject, from_name, redirect, botcheck) targeting our hidden iframe.
  });

  // Clear error on input
  form.querySelectorAll('input, textarea').forEach((el) => {
    el.addEventListener('input', () => el.classList.remove('error'));
  });

  /* ============================================================
     Animated Background — Cinematic Multi-Layer Canvas
     ============================================================ */
  const canvas = document.getElementById('bg-canvas');
  const spotlight = document.getElementById('spotlight');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let W = 0, H = 0, DPR = 1;
  const mouse = { x: -9999, y: -9999, active: false };
  let lastTime = performance.now();
  let raf;

  const TEAL = { r: 94, g: 234, b: 212 };
  const TEAL_DEEP = { r: 45, g: 212, b: 191 };
  const AMBER = { r: 251, g: 191, b: 36 };

  const orbs = [
    { x: 0.18, y: 0.28, r: 360, c: TEAL_DEEP, a: 0.18, sx: 0.00010, sy: 0.00012 },
    { x: 0.82, y: 0.22, r: 420, c: TEAL,      a: 0.13, sx: -0.00008, sy: 0.00014 },
    { x: 0.55, y: 0.78, r: 480, c: TEAL_DEEP, a: 0.10, sx: 0.00007, sy: -0.00010 },
    { x: 0.12, y: 0.72, r: 320, c: TEAL,      a: 0.10, sx: 0.00012, sy: -0.00009 },
    { x: 0.88, y: 0.62, r: 280, c: TEAL_DEEP, a: 0.09, sx: -0.00011, sy: 0.00008 },
  ];

  let dust = [], nodes = [], flowParticles = [], streams = [];
  const DUST_COUNT = 110;
  const NODE_COUNT = 55;
  const LINK_DIST = 160;
  const FLOW_COUNT = 90;
  let noiseTime = 0;

  const resize = () => {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(DPR, DPR);
  };

  const initLayers = () => {
    dust = [];
    for (let i = 0; i < DUST_COUNT; i++) {
      dust.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 0.9 + 0.2,
        a: Math.random() * 0.35 + 0.1,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        tw: Math.random() * Math.PI * 2,
      });
    }
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.8,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.025,
      });
    }
    flowParticles = [];
    for (let i = 0; i < FLOW_COUNT; i++) {
      flowParticles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        life: Math.random() * 200,
        maxLife: 140 + Math.random() * 200,
        history: [],
      });
    }
  };

  const fieldAngle = (x, y, t) => (
    Math.sin(x * 0.0035 + t * 0.0006) * 0.9 +
    Math.cos(y * 0.0040 + t * 0.0005) * 0.9 +
    Math.sin((x + y) * 0.0020 + t * 0.0008) * 0.6
  ) * Math.PI;

  const drawOrbs = (now) => {
    orbs.forEach((o) => {
      const px = (o.x + Math.sin(now * o.sx) * 0.08) * W;
      const py = (o.y + Math.cos(now * o.sy) * 0.08) * H;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, o.r);
      grad.addColorStop(0, `rgba(${o.c.r},${o.c.g},${o.c.b},${o.a})`);
      grad.addColorStop(1, `rgba(${o.c.r},${o.c.g},${o.c.b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawGrid = (now) => {
    const spacing = 70;
    const offset = (now * 0.010) % spacing;
    const baseAlpha = 0.045 + Math.sin(now * 0.0008) * 0.012;
    ctx.strokeStyle = `rgba(94, 234, 212, ${baseAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -spacing + offset; x < W + spacing; x += spacing) {
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
    }
    for (let y = -spacing + offset; y < H + spacing; y += spacing) {
      ctx.moveTo(0, y); ctx.lineTo(W, y);
    }
    ctx.stroke();

    if (mouse.active) {
      const gx = Math.round((mouse.x - offset) / spacing) * spacing + offset;
      const gy = Math.round((mouse.y - offset) / spacing) * spacing + offset;
      ctx.fillStyle = 'rgba(94, 234, 212, 0.55)';
      ctx.beginPath();
      ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawDust = (dt) => {
    dust.forEach((d) => {
      d.x += d.vx * dt * 0.06;
      d.y += d.vy * dt * 0.06;
      d.tw += 0.02;
      if (d.x < -10) d.x = W + 10;
      if (d.x > W + 10) d.x = -10;
      if (d.y < -10) d.y = H + 10;
      if (d.y > H + 10) d.y = -10;
      const tw = (Math.sin(d.tw) + 1) * 0.5;
      ctx.fillStyle = `rgba(180, 220, 230, ${d.a * (0.4 + tw * 0.6)})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawConstellation = (dt) => {
    nodes.forEach((n) => {
      n.x += n.vx * dt * 0.06;
      n.y += n.vy * dt * 0.06;
      if (n.x < 0) n.x = W;
      if (n.x > W) n.x = 0;
      if (n.y < 0) n.y = H;
      if (n.y > H) n.y = 0;
      n.pulse += n.pulseSpeed;
      if (mouse.active) {
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 0) {
          const force = (1 - dist / 180) * 0.6;
          n.x += (dx / dist) * force;
          n.y += (dy / dist) * force;
        }
      }
    });

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const dist = Math.sqrt(d2);
          const t = 1 - dist / LINK_DIST;
          ctx.strokeStyle = `rgba(94, 234, 212, ${t * 0.22})`;
          ctx.lineWidth = 0.65;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (mouse.active) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 220 * 220) {
          const dist = Math.sqrt(d2);
          const t = 1 - dist / 220;
          ctx.strokeStyle = `rgba(94, 234, 212, ${t * 0.45})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    nodes.forEach((n) => {
      const pulse = (Math.sin(n.pulse) + 1) * 0.5;
      const glowR = n.r + 3 + pulse * 3;
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
      grad.addColorStop(0, `rgba(94, 234, 212, ${0.5 + pulse * 0.3})`);
      grad.addColorStop(1, 'rgba(94, 234, 212, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(180, 250, 240, 0.85)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawFlowField = (dt) => {
    noiseTime += dt * 0.6;
    flowParticles.forEach((p) => {
      const angle = fieldAngle(p.x, p.y, noiseTime);
      const speed = 0.5;
      p.x += Math.cos(angle) * speed * dt * 0.06;
      p.y += Math.sin(angle) * speed * dt * 0.06;
      p.life += dt * 0.06;
      p.history.push({ x: p.x, y: p.y });
      if (p.history.length > 18) p.history.shift();
      if (p.life > p.maxLife || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
        p.life = 0;
        p.maxLife = 140 + Math.random() * 200;
        p.history = [];
      }
      if (p.history.length > 2) {
        ctx.beginPath();
        ctx.moveTo(p.history[0].x, p.history[0].y);
        for (let i = 1; i < p.history.length; i++) {
          ctx.lineTo(p.history[i].x, p.history[i].y);
        }
        const fade = 1 - p.life / p.maxLife;
        ctx.strokeStyle = `rgba(94, 234, 212, ${0.10 * fade})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    });
  };

  const spawnStream = () => {
    const fromLeft = Math.random() > 0.5;
    const startY = Math.random() * H * 0.85;
    const angle = (Math.random() * 0.4 - 0.2) + (fromLeft ? 0.18 : Math.PI - 0.18);
    streams.push({
      x: fromLeft ? -50 : W + 50,
      y: startY,
      vx: Math.cos(angle) * (5 + Math.random() * 4),
      vy: Math.sin(angle) * (5 + Math.random() * 4),
      len: 80 + Math.random() * 80,
      life: 1,
      color: Math.random() > 0.85 ? AMBER : TEAL,
    });
  };

  const drawStreams = () => {
    if (Math.random() < 0.012) spawnStream();
    streams = streams.filter((s) => {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.006;
      if (s.life <= 0) return false;
      const mag = Math.hypot(s.vx, s.vy);
      const tailX = s.x - (s.vx / mag) * s.len;
      const tailY = s.y - (s.vy / mag) * s.len;
      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, `rgba(${s.color.r},${s.color.g},${s.color.b},0)`);
      grad.addColorStop(1, `rgba(${s.color.r},${s.color.g},${s.color.b},${0.85 * s.life})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 8);
      hg.addColorStop(0, `rgba(${s.color.r},${s.color.g},${s.color.b},${s.life})`);
      hg.addColorStop(1, `rgba(${s.color.r},${s.color.g},${s.color.b},0)`);
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
      ctx.fill();
      return s.x > -100 && s.x < W + 100;
    });
  };

  const render = (now) => {
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;
    ctx.clearRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    drawOrbs(now);
    ctx.globalCompositeOperation = 'source-over';

    drawGrid(now);
    drawDust(dt);

    ctx.globalCompositeOperation = 'lighter';
    drawFlowField(dt);
    drawConstellation(dt);
    drawStreams();
    ctx.globalCompositeOperation = 'source-over';

    raf = requestAnimationFrame(render);
  };

  const onMouse = (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
    if (spotlight) {
      spotlight.style.setProperty('--mx', `${e.clientX}px`);
      spotlight.style.setProperty('--my', `${e.clientY}px`);
      spotlight.style.opacity = '1';
    }
  };
  const onLeave = () => {
    mouse.active = false;
    mouse.x = -9999; mouse.y = -9999;
    if (spotlight) spotlight.style.opacity = '0';
  };
  const onResize = () => { resize(); initLayers(); };

  resize();
  initLayers();
  raf = requestAnimationFrame(render);
  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouse);
  window.addEventListener('mouseleave', onLeave);

  // Reduce motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cancelAnimationFrame(raf);
  }
})();
