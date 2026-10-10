// intro.js - Portfolio landing page intro sequence
// Stage 1: log-textured Rubik's cube solves itself, paced by real page-load timings
// Stage 2: the solved cube unfolds into a net on hinges (live quaternion HUD)
// Stage 3: terminal window with typewriter welcome + keystroke sounds
//
// Needs: Three.js r128 + GSAP (loaded from cdnjs below if not already on the page).
// Debug: sessionStorage.removeItem('introPlayed') then reload to replay.

(() => {
  'use strict';

  const FONT = '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace';
  const GREEN = '#0f0';
  const STEP = 1.05;          // spacing between cubies (size 1 + gap 0.05)
  const S = 3.15;             // size of one full face (3 cubies + gaps)

  // Face order matches THREE.BoxGeometry material order: +x, -x, +y, -y, +z, -z
  const FACES = [
    { n: [1, 0, 0],  color: '#2ecc40', name: 'R' },
    { n: [-1, 0, 0], color: '#ff851b', name: 'L' },
    { n: [0, 1, 0],  color: '#eeeeee', name: 'U' },
    { n: [0, -1, 0], color: '#ffdc00', name: 'D' },
    { n: [0, 0, 1],  color: '#ff4136', name: 'F' },
    { n: [0, 0, -1], color: '#0074d9', name: 'B' }
  ];

  const liveStages = [];

  // ---------- entry ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  function start() {
    try {
      if (sessionStorage.getItem('introPlayed') === 'true') return;
    } catch (e) { /* storage blocked: just play */ }
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    run();
  }

  async function run() {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // NOTE: we do NOT hide the body. `visibility` is inherited, so hiding it
    // would hide this overlay too. The fixed, opaque overlay covers the page.
    const overlay = el('div', { id: 'intro-overlay' }, {
      position: 'fixed', inset: '0', background: '#000', zIndex: '9999',
      overflow: 'hidden', fontFamily: FONT, transition: 'opacity .6s ease'
    });
    const container = el('div', {}, { position: 'absolute', inset: '0' });
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const state = { skipped: false, audio: null, hooks: [] };

    const skip = el('button', { textContent: 'Skip \u203A' }, {
      position: 'absolute', right: '20px', bottom: '20px', zIndex: '2',
      background: 'transparent', color: GREEN, border: '1px solid ' + GREEN,
      padding: '6px 12px', fontFamily: FONT, fontSize: '13px', cursor: 'pointer', opacity: '.7'
    });
    skip.onclick = () => { state.skipped = true; state.hooks.forEach(h => h()); };
    overlay.appendChild(skip);

    try {
      const libs = loadLibraries();

      // "Click to Enter" gives us a user gesture so audio is allowed
      const enter = el('button', { textContent: 'Click to Enter' }, {
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        padding: '12px 24px', background: '#000', color: GREEN, border: '2px solid ' + GREEN,
        fontFamily: FONT, fontSize: '18px', cursor: 'pointer', letterSpacing: '1px', outline: 'none'
      });
      container.appendChild(enter);
      await new Promise(resolve => {
        const t = setTimeout(resolve, 5000); // no click: start anyway, without audio
        state.hooks.push(resolve);
        enter.onclick = () => {
          clearTimeout(t);
          try {
            state.audio = new (window.AudioContext || window.webkitAudioContext)();
            state.audio.resume();
          } catch (e) { /* no audio, fine */ }
          resolve();
        };
      });
      enter.remove();
      if (state.skipped) return;

      await libs;
      const log = buildLog();

      await stage1(container, log, state);
      if (!state.skipped) await stage2(container, log, state);
      if (!state.skipped) await stage3(container, state);
    } catch (err) {
      console.error('Intro failed, skipping:', err);
    } finally {
      liveStages.splice(0).forEach(s => s.destroy());
      try { sessionStorage.setItem('introPlayed', 'true'); } catch (e) {}
      if (state.audio) { try { state.audio.close(); } catch (e) {} }
      overlay.style.opacity = '0';
      document.body.style.overflow = prevOverflow;
      setTimeout(() => overlay.remove(), 650);
    }
  }

  // ---------- helpers ----------
  function el(tag, props, style) {
    const e = document.createElement(tag);
    Object.assign(e, props || {});
    Object.assign(e.style, style || {});
    return e;
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function loadScript(src, isReady) {
    return new Promise((resolve, reject) => {
      if (isReady()) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  function loadLibraries() {
    return Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', () => typeof THREE !== 'undefined'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js', () => typeof gsap !== 'undefined')
    ]);
  }

  // Build log lines + phase list from the real page-load timings
  function buildLog() {
    const entries = [];
    const add = (label, v) => entries.push([label, Math.max(0, v || 0)]);
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      add('DNS lookup', nav.domainLookupEnd - nav.domainLookupStart);
      add('TCP connect', nav.connectEnd - nav.connectStart);
      add('TLS handshake', nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0);
      add('TTFB', nav.responseStart - nav.requestStart);
      add('Download', nav.responseEnd - nav.responseStart);
      add('DOMContentLoaded', nav.domContentLoadedEventEnd - nav.fetchStart);
    }
    performance.getEntriesByType('resource').slice(0, 8).forEach(r => {
      const name = (r.name.split('/').pop().split('?')[0] || r.name).slice(0, 18);
      add(name, r.duration);
    });
    if (!entries.length) add('boot', 12);

    const lines = entries.map(([l, v], i) => `[${(i * 0.013).toFixed(3)}] ${l} ${Math.round(v)}ms`);
    while (lines.length < 54) {
      lines.push(`[${(lines.length * 0.013).toFixed(3)}] proc ${String(lines.length * 7 % 100).padStart(2, '0')} ok`);
    }
    return { lines, phases: entries };
  }

  // Which of the 9 cells of a face a cubie's sticker is
  function cellIndex(face, x, y, z) {
    let col, row;
    switch (face) {
      case 0: col = 1 - z; row = 1 - y; break;
      case 1: col = z + 1; row = 1 - y; break;
      case 2: col = x + 1; row = z + 1; break;
      case 3: col = x + 1; row = 1 - z; break;
      case 4: col = x + 1; row = 1 - y; break;
      default: col = 1 - x; row = 1 - y;
    }
    return row * 3 + col;
  }

  function drawCell(ctx, x, y, w, h, color, text, fs) {
    ctx.fillStyle = '#050805';
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = color;
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, w / 32);
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = GREEN;
    ctx.font = `${fs}px ${FONT}`;
    ctx.textBaseline = 'top';
    const per = Math.max(6, Math.floor((w - 14) / (fs * 0.62)));
    const chunks = text.match(new RegExp('.{1,' + per + '}', 'g')) || [];
    const maxRows = Math.floor((h - 12) / (fs * 1.25));
    chunks.slice(0, maxRows).forEach((c, i) => ctx.fillText(c, x + 8, y + 8 + i * fs * 1.25));
  }

  function cellTexture(color, text) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    drawCell(c.getContext('2d'), 0, 0, 128, 128, color, text, 15);
    return new THREE.CanvasTexture(c);
  }

  function faceTexture(faceIdx, lines) {
    const c = document.createElement('canvas');
    c.width = c.height = 513;
    const ctx = c.getContext('2d');
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 3; col++) {
        const text = lines[(faceIdx * 9 + r * 3 + col) % lines.length];
        drawCell(ctx, col * 171, r * 171, 171, 171, FACES[faceIdx].color, text, 18);
      }
    }
    return new THREE.CanvasTexture(c);
  }

  function disposeScene(scene) {
    scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
  }

  // Shared scene/camera/renderer/loop setup. halfW/halfH = half-extent to keep in view.
  function makeStage(container, halfW, halfH) {
    const w = () => container.clientWidth || window.innerWidth;
    const h = () => container.clientHeight || window.innerHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(45, w() / h(), 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w(), h(), false);
    Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
    container.appendChild(renderer.domElement);

    const t = Math.tan(THREE.MathUtils.degToRad(22.5));
    const fitDistance = (hw, hh) => Math.max(hh / t, hw / (t * camera.aspect)) * 1.12;

    const stage = { scene, camera, renderer, tickers: [], fitLocked: false, dead: false, raf: 0 };
    stage.fitDistance = fitDistance;
    camera.position.set(0, 0, fitDistance(halfW, halfH));

    const loop = time => {
      if (stage.dead) return;
      stage.raf = requestAnimationFrame(loop);
      stage.tickers.forEach(f => f(time));
      renderer.render(scene, camera);
    };
    const onResize = () => {
      camera.aspect = w() / h();
      camera.updateProjectionMatrix();
      renderer.setSize(w(), h(), false);
      if (!stage.fitLocked) camera.position.z = fitDistance(halfW, halfH);
    };
    window.addEventListener('resize', onResize);
    stage.raf = requestAnimationFrame(loop);

    stage.destroy = () => {
      if (stage.dead) return;
      stage.dead = true;
      cancelAnimationFrame(stage.raf);
      window.removeEventListener('resize', onResize);
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
    liveStages.push(stage);
    return stage;
  }

  function tickSound(ctx, pitch) {
    if (!ctx || ctx.state === 'closed') return;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 0.03);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    const f = pitch + Math.random() * pitch;
    for (let i = 0; i < len; i++) d[i] = Math.exp(-(i / len) * 8) * Math.sin(2 * Math.PI * f * i / sr) * 0.25;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
  }

  // ---------- Rubik's cube ----------
  class RubiksCube {
    constructor(scene, lines) {
      this.group = new THREE.Group();
      scene.add(this.group);
      this.cubies = [];
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const inner = new THREE.MeshBasicMaterial({ color: 0x050505 });
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const mats = FACES.map((f, i) => {
              const outward = (f.n[0] !== 0 && f.n[0] === x) ||
                              (f.n[1] !== 0 && f.n[1] === y) ||
                              (f.n[2] !== 0 && f.n[2] === z);
              if (!outward) return inner;
              const text = lines[(i * 9 + cellIndex(i, x, y, z)) % lines.length];
              return new THREE.MeshBasicMaterial({ map: cellTexture(f.color, text) });
            });
            const mesh = new THREE.Mesh(geo, mats);
            mesh.position.set(x * STEP, y * STEP, z * STEP);
            this.group.add(mesh);
            this.cubies.push(mesh);
          }
        }
      }
    }

    // move = { axis: 'x'|'y'|'z', layer: -1|0|1, dir: 1|-1 }  (one quarter turn)
    turn(move, ms, done) {
      const layer = this.cubies.filter(c => Math.abs(c.position[move.axis] - move.layer * STEP) < 0.01);
      const pivot = new THREE.Group();
      this.group.add(pivot);
      layer.forEach(c => pivot.attach(c));
      const target = move.dir * Math.PI / 2;
      const end = () => {
        pivot.updateMatrixWorld(true);
        layer.forEach(c => {
          this.group.attach(c);
          c.position.set(
            Math.round(c.position.x / STEP) * STEP,
            Math.round(c.position.y / STEP) * STEP,
            Math.round(c.position.z / STEP) * STEP
          );
        });
        this.group.remove(pivot);
        if (done) done();
      };
      if (!ms) { pivot.rotation[move.axis] = target; end(); return; }
      gsap.to(pivot.rotation, { [move.axis]: target, duration: ms / 1000, ease: 'power2.inOut', onComplete: end });
    }

    static randomMove(last) {
      let m;
      do {
        m = {
          axis: ['x', 'y', 'z'][Math.floor(Math.random() * 3)],
          layer: [-1, 0, 1][Math.floor(Math.random() * 3)],
          dir: Math.random() < 0.5 ? 1 : -1
        };
      } while (last && last.axis === m.axis && last.layer === m.layer);
      return m;
    }
  }

  // ---------- Stage 1: scramble, then solve at the pace of the load timings ----------
  async function stage1(container, log, state) {
    const stage = makeStage(container, 2.9, 2.9);
    const cube = new RubiksCube(stage.scene, log.lines);
    cube.group.rotation.set(0.5, -0.7, 0);
    stage.tickers.push(() => { cube.group.rotation.y += 0.004; });

    const moves = [];
    let last = null;
    for (let i = 0; i < 16; i++) {
      last = RubiksCube.randomMove(last);
      moves.push(last);
      cube.turn(last, 0);               // instant scramble
    }
    const solve = moves.slice().reverse().map(m => Object.assign({}, m, { dir: -m.dir }));

    const status = el('div', {}, {
      position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      color: GREEN, fontFamily: FONT, fontSize: '14px', whiteSpace: 'nowrap'
    });
    container.appendChild(status);

    await new Promise(resolve => {
      let i = 0, done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      state.hooks.push(finish);
      const next = () => {
        if (done) return;
        if (i >= solve.length) { status.textContent = '[ OK ] ready'; setTimeout(finish, 700); return; }
        const [name, val] = log.phases[i % log.phases.length];
        status.textContent = `[ ${String(i + 1).padStart(2, '0')}/${solve.length} ] ${name} ${Math.round(val)}ms`;
        tickSound(state.audio, 300);
        cube.turn(solve[i], clamp(val * 6, 170, 380), () => { i++; next(); });
      };
      next();
    });

    status.remove();
    stage.destroy();
  }

  // ---------- Stage 2: unfold into a net on hinges ----------
  async function stage2(container, log, state) {
    const stage = makeStage(container, 2 * S, 1.5 * S);
    stage.fitLocked = true;
    const { scene, camera } = stage;
    const netZ = stage.fitDistance(2 * S, 1.5 * S);
    const cubeZ = stage.fitDistance(2.9, 2.9);
    camera.position.z = cubeZ;

    const panel = idx => new THREE.Mesh(
      new THREE.PlaneGeometry(S, S),
      new THREE.MeshBasicMaterial({ map: faceTexture(idx, log.lines), side: THREE.DoubleSide })
    );
    const hinge = (pos, idx, axis, folded, parent, meshPos) => {
      const p = new THREE.Group();
      p.position.set(pos[0], pos[1], pos[2]);
      parent.add(p);
      const m = panel(idx);
      m.position.set(meshPos[0], meshPos[1], meshPos[2]);
      p.add(m);
      p.rotation[axis] = folded;
      return p;
    };

    // Net layout:    U
    //              L F R B
    //                D
    const root = new THREE.Group();
    scene.add(root);
    const front = new THREE.Group();
    front.position.z = S / 2;
    root.add(front);
    front.add(panel(4));
    const H = Math.PI / 2;
    const hU = hinge([0, S / 2, 0],  2, 'x', -H, front, [0, S / 2, 0]);
    const hD = hinge([0, -S / 2, 0], 3, 'x',  H, front, [0, -S / 2, 0]);
    const hL = hinge([-S / 2, 0, 0], 1, 'y', -H, front, [-S / 2, 0, 0]);
    const hR = hinge([S / 2, 0, 0],  0, 'y',  H, front, [S / 2, 0, 0]);
    const hB = hinge([S, 0, 0],      5, 'y',  H, hR,    [S / 2, 0, 0]);
    root.rotation.set(0.5, -0.7, 0);

    const hud = el('pre', {}, {
      position: 'absolute', top: '20px', right: '20px', margin: '0', background: 'rgba(0,0,0,.7)',
      color: GREEN, border: '1px solid ' + GREEN, fontFamily: FONT, padding: '10px',
      borderRadius: '4px', fontSize: '12px', lineHeight: '1.5'
    });
    container.appendChild(hud);
    const hinges = [['U', hU], ['D', hD], ['L', hL], ['R', hR], ['B', hB]];
    const updateHud = () => {
      hud.textContent = 'HINGE   ANGLE  QUATERNION (x, y, z, w)\n' + hinges.map(([n, h]) => {
        const q = h.quaternion;
        const deg = THREE.MathUtils.radToDeg(2 * Math.acos(Math.min(1, Math.abs(q.w))));
        return `${n}  ${deg.toFixed(1).padStart(7)}\u00B0  ${q.x.toFixed(3)}, ${q.y.toFixed(3)}, ${q.z.toFixed(3)}, ${q.w.toFixed(3)}`;
      }).join('\n');
    };
    updateHud();

    await new Promise(resolve => {
      let done = false;
      const tl = gsap.timeline({ onUpdate: updateHud, onComplete: () => setTimeout(finish, 800) });
      function finish() { if (!done) { done = true; tl.kill(); resolve(); } }
      state.hooks.push(finish);

      const open = (h, axis, at, dur) => tl.to(h.rotation, { [axis]: 0, duration: dur, ease: 'power2.inOut' }, at);
      tl.to(root.rotation, { x: 0.35, y: 0.6, duration: 0.9, ease: 'power1.inOut' }, 0);
      open(hU, 'x', 0.5, 1.1);
      open(hD, 'x', 0.65, 1.1);
      open(hL, 'y', 0.8, 1.1);
      open(hR, 'y', 0.95, 1.1);
      open(hB, 'y', 2.05, 1.1);
      tl.to(root.rotation, { x: 0, y: 0, z: 0, duration: 1.3, ease: 'power2.inOut' }, 2.1);
      tl.to(root.position, { x: -S / 2, duration: 1.3, ease: 'power2.inOut' }, 2.1);
      tl.to(camera.position, { z: netZ, duration: 2.0, ease: 'power2.inOut' }, 1.4);
    });

    hud.remove();
    stage.destroy();
  }

  // ---------- Stage 3: terminal reveal ----------
  function stage3(container, state) {
    return new Promise(resolve => {
      if (!document.getElementById('intro-blink-style')) {
        const style = el('style', { id: 'intro-blink-style' });
        style.textContent = '@keyframes introBlink{0%,49%{opacity:1}50%,100%{opacity:0}}';
        document.head.appendChild(style);
      }

      const term = el('div', {}, {
        position: 'absolute', top: '50%', left: '50%', width: '80%', maxWidth: '600px',
        height: '60%', maxHeight: '400px', background: '#000', border: '2px solid ' + GREEN,
        borderRadius: '12px', color: GREEN, padding: '16px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', fontFamily: FONT, overflow: 'hidden',
        opacity: '0', transform: 'translate(-50%,-50%) scale(.8)',
        transition: 'opacity .5s ease, transform .5s ease'
      });
      container.appendChild(term);

      const bar = el('div', {}, {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 4px 8px', borderBottom: '1px solid ' + GREEN, marginBottom: '10px'
      });
      bar.appendChild(el('div', { textContent: 'PORTFOLIO TERMINAL' }, { fontSize: '14px', fontWeight: 'bold' }));
      const dots = el('div', {}, { display: 'flex', gap: '8px' });
      ['#ff5f56', '#ffbd2e', '#27c93f'].forEach(c =>
        dots.appendChild(el('div', { textContent: '\u25CF' }, { color: c, fontSize: '12px' })));
      bar.appendChild(dots);
      term.appendChild(bar);

      const content = el('div', {}, { flex: '1', overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '1.5' });
      const txt = document.createTextNode('');
      const cursor = el('span', { textContent: '\u258A' }, { animation: 'introBlink 1s step-end infinite' });
      content.append(txt, cursor);
      term.appendChild(content);

      requestAnimationFrame(() => requestAnimationFrame(() => {
        term.style.opacity = '1';
        term.style.transform = 'translate(-50%,-50%) scale(1)';
      }));

      const message = "welcome to my portfolio\ntype 'help' for commands\n";
      let i = 0, done = false, iv = 0, t1 = 0;
      const finish = () => {
        if (done) return;
        done = true;
        clearInterval(iv);
        clearTimeout(t1);
        term.style.opacity = '0';
        term.style.transform = 'translate(-50%,-50%) scale(.8)';
        setTimeout(() => { term.remove(); resolve(); }, 500);
      };
      state.hooks.push(finish);

      iv = setInterval(() => {
        if (i < message.length) {
          txt.nodeValue += message[i++];
          tickSound(state.audio, 800);
        } else {
          clearInterval(iv);
          t1 = setTimeout(finish, 1500);
        }
      }, 40);
    });
  }
})();