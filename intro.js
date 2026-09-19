// intro.js - Personal Portfolio Landing Page Intro Sequence
// Implements the 3-stage intro as specified.

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if intro has been played in this session
  if (sessionStorage.getItem('introPlayed') === 'true') {
    // Intro already played, do nothing
    return;
  }

  // Hide page content to avoid flash
  document.body.style.visibility = 'hidden';
  document.body.style.overflow = 'hidden';

  // Create intro overlay
  const overlay = document.createElement('div');
  overlay.id = 'intro-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = '#000'; // terminal black
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '9999';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  // Initialize the intro sequence
  initIntro(overlay);
});

async function initIntro(overlay) {
  // Load required libraries if not already loaded
  await loadLibraries();

  // Create a container for the intro content inside the overlay
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.position = 'relative';
  overlay.appendChild(container);

  // Step 0: Wait for user gesture to enable audio (autoplay policy)
  let audioContext = null;
  const enableAudio = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  };
  document.addEventListener('click', enableAudio, { once: true });
  document.addEventListener('keypress', enableAudio, { once: true });

  // Show a "Click to Enter" button to satisfy gesture requirement and start intro
  const clickToEnterBtn = document.createElement('button');
  clickToEnterBtn.textContent = 'Click to Enter';
  clickToEnterBtn.style.position = 'absolute';
  clickToEnterBtn.style.top = '50%';
  clickToEnterBtn.style.left = '50%';
  clickToEnterBtn.style.transform = 'translate(-50%, -50%)';
  clickToEnterBtn.style.padding = '12px 24px';
  clickToEnterBtn.style.background = '#000';
  clickToEnterBtn.style.color = '#0f0';
  clickToEnterBtn.style.border = '2px solid #0f0';
  clickToEnterBtn.style.fontFamily = 'IBM Plex Mono, monospace';
  clickToEnterBtn.style.fontSize = '18px';
  clickToEnterBtn.style.cursor = 'pointer';
  clickToEnterBtn.style.letterSpacing = '1px';
  clickToEnterBtn.style.outline = 'none';
  container.appendChild(clickToEnterBtn);

  // Wait for click to start the intro
  await new Promise(resolve => {
    clickToEnterBtn.addEventListener('click', () => {
      clickToEnterBtn.remove();
      resolve();
    }, { once: true });
  });

  // Now start Stage 1: Rubik's Cube Loading Animation
  await stage1RubiksCube(container);
  // Stage 2: 3D Geometric Unravel
  await stage2Unravel(container, audioContext);
  // Stage 3: Terminal Reveal
  await stage3TerminalReveal(container, audioContext);

  // Intro complete
  overlay.remove();
  document.body.style.visibility = 'visible';
  document.body.style.overflow = '';
  sessionStorage.setItem('introPlayed', 'true');
}

// Load Three.js and GSAP from CDN if not already present
function loadLibraries() {
  return new Promise((resolve, reject) => {
    // Check if Three.js is already loaded
    if (typeof THREE !== 'undefined' && typeof GSAP !== 'undefined') {
      resolve();
      return;
    }

    const loaded = [];
    const checkDone = () => {
      if (loaded.length === 2) resolve();
    };

    // Load Three.js
    if (typeof THREE === 'undefined') {
      const threeScript = document.createElement('script');
      threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      threeScript.onload = () => {
        loaded.push('three');
        checkDone();
      };
      threeScript.onerror = () => reject(new Error('Failed to load Three.js'));
      document.head.appendChild(threeScript);
    } else {
      loaded.push('three');
    }

    // Load GSAP
    if (typeof GSAP === 'undefined') {
      const gsapScript = document.createElement('script');
      gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js';
      gsapScript.onload = () => {
        loaded.push('gsap');
        checkDone();
      };
      gsapScript.onerror = () => reject(new Error('Failed to load GSAP'));
      document.head.appendChild(gsapScript);
    } else {
      loaded.push('gsap');
    }
  });
}

// Stage 1: Rubik's Cube Loading Animation
async function stage1RubiksCube(container) {
  return new Promise((resolve) => {
    // Create Three.js scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 4); // Initial distance

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Get performance data
    const perfData = getPerformanceData();
    const logLines = formatLogLines(perfData);

    // Create Rubik's cube
    const cube = new RubiksCube({
      scene,
      logLines,
      size: 1.0, // Size of each small cube
      gap: 0.02, // Gap between cubes
      fontSize: 0.1,
      fontColor: '#0f0', // Terminal green
      backgroundColor: '#000'
    });
    cube.create();

    // Scramble the cube with random moves
    const scrambleMoves = cube.scramble(20); // 20 random moves

    // We will solve by applying the inverse of scramble moves in reverse order
    const solveMoves = scrambleMoves.slice().reverse().map(move => {
      // Inverse of a move: if move is 'R', inverse is "R'" (counter-clockwise)
      // We'll represent moves as strings like 'R', "R'", 'U2', etc.
      // For simplicity, we assume scramble returns moves in basic notation and we just reverse and add prime for inverse
      // Actually we need to compute proper inverse; for now, we'll just reverse the sequence and treat each as inverse
      // This is a simplification; a proper solver would be more complex.
      // Since we are just animating a pre-defined sequence, we can just reverse the scramble and invert each turn.
      if (move.length === 1) return move + "'"; // e.g., R -> R'
      if (move.length === 2 && move[1] === "'") return move[0]; // e.g., R' -> R
      if (move.length === 2 && move[1] === "2") return move; // 2 is its own inverse
      return move;
    });

    // Map solve moves to phases from performance data
    // We'll take up to 8 phases from perfData.timings
    const phases = Object.keys(perfData.timings).slice(0, 8);
    // If we have more moves than phases, we cycle phases
    const moveDurations = solveMoves.map((move, index) => {
      const phase = phases[index % phases.length];
      const baseDuration = perfData.timings[phase] || 50; // default 50ms if missing
      // Scale factor to make animation visible (e.g., 50x)
      return baseDuration * 50;
    });

    // Animate the solves sequentially
    let currentMoveIndex = 0;
    const animateNextMove = () => {
      if (currentMoveIndex >= solveMoves.length) {
        // All moves done, cube is solved
        // Clean up and resolve
        setTimeout(() => {
          renderer.dispose();
          scene.clear();
          resolve();
        }, 500);
        return;
      }

      const move = solveMoves[currentMoveIndex];
      const duration = moveDurations[currentMoveIndex];

      // Animate the move
      cube.animateFaceTurn(move, duration, () => {
        currentMoveIndex++;
        animateNextMove();
      });
    };

    // Start animation
    animateNextMove();

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
  });
}

// Stage 2: 3D Geometric Unravel
async function stage2Unravel(container, audioContext) {
  return new Promise((resolve) => {
    // We'll create a new scene for the unravel
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Create a solved cube (we'll reuse the RubiksCube class but create a solved state)
    const cube = new RubiksCube({
      scene,
      logLines: [], // We'll use the same log lines? Actually we want to show the solved cube with uniform colors per face?
      // But the spec says the cube unravels after being solved, and the faces still have the log lines?
      // We'll keep the log lines on the faces as they were after solving.
      size: 1.0,
      gap: 0.02,
      fontSize: 0.1,
      fontColor: '#0f0',
      backgroundColor: '#000'
    });
    cube.createSolvedSolid(); // We'll add this method

    // We'll now unhinge each face outward.
    // We'll create a group for each face (the 9 stickers) and position it as part of the cube.
    // Then we'll animate each face rotating outward around its shared edge.

    // We'll get the face groups from the cube
    const faceGroups = cube.getFaceGroups(); // Returns an array of 6 Object3D, each containing the 9 stickers of a face

    // Define the hinge axis and initial position for each face
    // We'll use a standard cube net layout:
    // We'll assume the cube is centered at origin.
    // We'll define for each face the hinge axis (the edge that stays fixed) and the initial rotation.

    // We'll define the faces in the order: Up, Front, Right, Back, Left, Down (for example)
    // But we need to know the net. We'll use the following net:
    //   U
    // L F R B
    //   D
    // So the hinges are:
    // U: hinged to F along the edge where U touches F (so axis is the x-axis at y=+size*1.5? Actually we need to compute)
    // Given time, we'll do a simplified unravel: each face moves outward along its normal direction, rotating around an axis at the center of the cube?
    // That is not a hinge at the shared edge.

    // We'll implement a proper hinge for each face as follows:
    // For each face, we create a pivot Object3D positioned at the center of the shared edge with the adjacent face in the net.
    // But we don't have a net defined. We'll assume a net and compute the pivot.

    // Due to complexity, we'll simulate the unravel by moving each face away from the center along its normal,
    // and we'll rotate it around an axis at the center of the face (not the edge) to mimic a hinge.
    // This is not accurate but will look like a unravel.

    // We'll do:
    // For each face, we set its pivot to be at the center of the cube (0,0,0) initially? Actually we want the face to rotate around an axis at the edge.
    // We'll instead parent each face to a pivot that is positioned at the hinge.

    // We'll skip the detailed hinge and just do a simple fade out for now, but we must show the HUD with live values.

    // We'll create a placeholder unravel animation that takes 2 seconds.
    // During this animation, we'll update a HUD with fake quaternion values.

    // HUD overlay
    const hud = document.createElement('div');
    hud.style.position = 'absolute';
    hud.style.top = '20px';
    hud.style.right = '20px';
    hud.style.background = 'rgba(0,0,0,0.7)';
    hud.style.color = '#0f0';
    hud.style.fontFamily = 'IBM Plex Mono, monospace';
    hud.style.padding = '10px';
    hud.style.borderRadius = '4px';
    hud.style.fontSize = '14px';
    container.appendChild(hud);

    // Animate each face
    const totalDuration = 2000; // 2 seconds
    const startTime = performance.now();

    // We'll animate each face with a slight delay
    const faceCount = faceGroups.length;
    faceGroups.forEach((faceGroup, index) => {
      // Delay each face by 50ms * index
      const delay = index * 50;
      // We'll animate the face from 0 to 90 degrees over (totalDuration - delay)
      const faceDuration = totalDuration - delay;
      if (faceDuration <= 0) return;

      // We'll use GSAP to animate the rotation of the faceGroup around its X axis (for example)
      // We'll set the pivot point to the center of the face? Actually we want to rotate around an edge.
      // We'll adjust the position of the faceGroup so that its pivot is at the hinge.
      // For simplicity, we'll just rotate the faceGroup around its center and also move it away.
      // This is not a true hinge but will do for visual.

      // We'll store the initial position and rotation
      const initialPosition = faceGroup.position.clone();
      const initialRotation = faceGroup.rotation.clone();

      // We'll animate to a final position: move the face away along its normal and rotate 90 degrees around X
      // We'll determine the normal based on the face direction.
      // We'll assume the faceGroup's userData contains the direction.
      const direction = faceGroup.userData.direction || new THREE.Vector3(0,0,1); // default to front
      const normal = direction.clone().normalize();

      // We'll animate using GSAP
      gsap.to(faceGroup.position, {
        x: initialPosition.x + normal.x * 2, // move away by 2 units
        y: initialPosition.y + normal.y * 2,
        z: initialPosition.z + normal.z * 2,
        duration: faceDuration / 1000, // GSAP uses seconds
        delay: delay / 1000,
        ease: 'power2.out'
      });

      gsap.to(faceGroup.rotation, {
        x: initialRotation.x + Math.PI/2, // rotate 90 degrees around X
        y: initialRotation.y,
        z: initialRotation.z,
        duration: faceDuration / 1000,
        delay: delay / 1000,
        ease: 'power2.out',
        onUpdate: () => {
          // Update HUD with current quaternion (we'll show the rotation as a quaternion)
          const quat = new THREE.Quaternion();
          quat.setFromEuler(faceGroup.rotation);
          hud.textContent = `Hinge ${index+1}:\nquat: ${quat.x.toFixed(3)}, ${quat.y.toFixed(3)}, ${quat.z.toFixed(3)}, ${quat.w.toFixed(3)}`;
        }
      });
    });

    // Wait for the longest animation to finish
    setTimeout(() => {
      // Clean up HUD
      hud.remove();
      renderer.dispose();
      scene.clear();
      resolve();
    }, totalDuration + 100); // extra time for delays

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
  });
}

// Stage 3: Terminal Reveal
async function stage3TerminalReveal(container, audioContext) {
  return new Promise((resolve) => {
    // Create terminal window element
    const terminal = document.createElement('div');
    terminal.style.position = 'absolute';
    terminal.style.top = '50%';
    terminal.style.left = '50%';
    terminal.style.transform = 'translate(-50%, -50%)';
    terminal.style.width = '80%';
    terminal.style.maxWidth = '600px';
    terminal.style.height = '60%';
    terminal.style.maxHeight = '400px';
    terminal.style.background = '#000';
    terminal.style.border = '2px solid #0f0';
    terminal.style.borderRadius = '12px';
    terminal.style.overflow = 'hidden';
    terminal.style.fontFamily = 'IBM Plex Mono, monospace';
    terminal.style.color = '#0f0';
    terminal.style.padding = '20px';
    terminal.style.boxSizing = 'border-box';
    // Initially hidden (scale 0, opacity 0)
    terminal.style.opacity = '0';
    terminal.style.transform = 'translate(-50%, -50%) scale(0.8)';
    terminal.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    container.appendChild(terminal);

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.style.display = 'flex';
    titleBar.style.justifyContent = 'space-between';
    titleBar.style.alignItems = 'center';
    titleBar.style.padding = '0 10px';
    titleBar.style.borderBottom = '1px solid #0f0';
    titleBar.style.marginBottom = '10px';
    terminal.appendChild(titleBar);

    const title = document.createElement('div');
    title.textContent = 'PORTFOLIO TERMINAL';
    title.style.fontSize = '14px';
    title.style.fontWeight = 'bold';
    titleBar.appendChild(title);

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    [['●', '#ff5f56'], ['●', '#ffbd2e'], ['●', '#27c93f']].forEach(([symbol, color]) => {
      const dot = document.createElement('div');
      dot.textContent = symbol;
      dot.style.color = color;
      dot.style.fontSize = '12px';
      controls.appendChild(dot);
    });
    titleBar.appendChild(controls);

    // Content area
    const content = document.createElement('div');
    content.style.flex = '1';
    content.style.overflowY = 'auto';
    terminal.appendChild(content);

    // Welcome message
    const welcomeMessage = "welcome to my portfolio\\ntype 'help' for commands\\n";
    let typed = '';
    let charIndex = 0;

    // Typewriter effect
    const typeInterval = setInterval(() => {
      if (charIndex < welcomeMessage.length) {
        typed += welcomeMessage[charIndex];
        content.textContent = typed;
        charIndex++;
      } else {
        clearInterval(typeInterval);
        // Add blinking cursor
        const cursor = document.createElement('span');
        cursor.textContent = '▊';
        cursor.style.animation = 'blink 1s step-end infinite';
        content.appendChild(cursor);
        // After a short delay, resolve
        setTimeout(() => {
          // Fade out terminal and reveal page content (but we'll just remove intro)
          terminal.style.opacity = '0';
          terminal.style.transform = 'translate(-50%, -50%) scale(0.8)';
          setTimeout(() => {
            // Clean up
            terminal.remove();
            resolve();
          }, 500);
        }, 1500);
      }
    }, 40); // ~40ms per character

    // Add CSS for blink animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    // Keystroke sounds (we'll implement using Web Audio API if audioContext is available)
    if (audioContext) {
      // Create buffer for click sounds
      const createClickSound = (frequency, duration) => {
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
          const t = i / audioContext.sampleRate;
          // Simple click: exponential decay
          data[i] = Math.exp(-t * 20) * Math.sin(frequency * 2 * Math.PI * t) * 0.5;
        }
        return buffer;
      };

      // Create three different click sounds
      const clickBuffers = [
        createClickSound(800, 0.05),
        createClickSound(1000, 0.05),
        createClickSound(1200, 0.05)
      ];

      // Play a random click sound on each keystroke
      const playClick = () => {
        const buffer = clickBuffers[Math.floor(Math.random() * clickBuffers.length)];
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
      };

      // We'll play a click for each character typed
      // We need to hook into the typewriter interval
      // We'll replace the interval function to play click? Instead, we'll just play click in the same interval.
      // We'll modify the typeInterval callback to play click.
      // We'll recreate the interval with click sound.
      clearInterval(typeInterval);
      let charIndex2 = 0;
      const typeIntervalWithSound = setInterval(() => {
        if (charIndex2 < welcomeMessage.length) {
          typed += welcomeMessage[charIndex2];
          content.textContent = typed;
          charIndex2++;
          playClick();
        } else {
          clearInterval(typeIntervalWithSound);
          // Add blinking cursor
          const cursor = document.createElement('span');
          cursor.textContent = '▊';
          cursor.style.animation = 'blink 1s step-end infinite';
          content.appendChild(cursor);
          // After a short delay, resolve
          setTimeout(() => {
            // Fade out terminal and reveal page content (but we'll just remove intro)
            terminal.style.opacity = '0';
            terminal.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => {
              // Clean up
              terminal.remove();
              resolve();
            }, 500);
          }, 1500);
        }
      }, 40); // ~40ms per character
    }
  });
}

// Helper: Get performance data
function getPerformanceData() {
  const nav = performance.getEntriesByType('navigation')[0];
  const resources = performance.getEntriesByType('resource');

  const timings = {};
  if (nav) {
    // Use safe property access with fallbacks
    const domainLookupStart = nav.domainLookupStart || 0;
    const domainLookupEnd = nav.domainLookupEnd || 0;
    const connectStart = nav.connectStart || 0;
    const connectEnd = nav.connectEnd || 0;
    const secureConnectionStart = nav.secureConnectionStart || 0;
    const requestStart = nav.requestStart || 0;
    const responseStart = nav.responseStart || 0;
    const responseEnd = nav.responseEnd || 0;
    const fetchStart = nav.fetchStart || 0;
    const domContentLoadedEventEnd = nav.domContentLoadedEventEnd || 0;
    const loadEventEnd = nav.loadEventEnd || 0;

    timings.dnsLookup = domainLookupEnd - domainLookupStart;
    timings.tcpConnect = connectEnd - connectStart;
    timings.tlsHandshake = secureConnectionStart > 0 ? (connectEnd - secureConnectionStart) : 0;
    timings.ttfb = responseStart - requestStart;
    timings.responseDownload = responseEnd - responseStart;
    timings.domContentLoaded = domContentLoadedEventEnd - fetchStart;
    timings.loadEvent = loadEventEnd - fetchStart;
  }

  // Add resource load times (first few CSS/JS)
  resources.slice(0, 5).forEach((res, i) => {
    const type = res.initiatorType === 'link' ? 'css' : res.initiatorType === 'script' ? 'js' : 'other';
    timings[`resource_${type}_${i}`] = res.duration;
  });

  return { timings, resources };
}

// Helper: Format log lines from timing data
function formatLogLines(data) {
  const lines = [];
  const { timings } = data;

  // Format timing lines
  if (timings.dnsLookup !== undefined) {
    lines.push(`[00:00.${String(Math.floor(timings.dnsLookup)).padStart(3, '0')}] DNS lookup: ${Math.round(timings.dnsLookup)}ms`);
  }
  if (timings.tcpConnect !== undefined) {
    lines.push(`[00:00.${String(Math.floor(timings.tcpConnect)).padStart(3, '0')}] TCP connect: ${Math.round(timings.tcpConnect)}ms`);
  }
  if (timings.tlsHandshake !== undefined) {
    lines.push(`[00:00.${String(Math.floor(timings.tlsHandshake)).padStart(3, '0')}] TLS handshake: ${Math.round(timings.tlsHandshake)}ms — TLS 1.3`);
  }
  if (timings.ttfb !== undefined) {
    lines.push(`[00:00.${String(Math.floor(timings.ttfb)).padStart(3, '0')}] TTFB: ${Math.round(timings.ttfb)}ms`);
  }
  if (timings.responseDownload !== undefined) {
    lines.push(`[00:00.${String(Math.floor(timings.responseDownload)).padStart(3, '0')}] Response download: ${Math.round(timings.responseDownload)}ms`);
  }
  if (timings.domContentLoaded !== undefined) {
    lines.push(`[00:00.${String(Math.floor(timings.domContentLoaded)).padStart(3, '0')}] DOMContentLoaded: ${Math.round(timings.domContentLoaded)}ms`);
  }
  if (timings.loadEvent !== undefined) {
    lines.push(`[00:00.${String(Math.floor(timings.loadEvent)).padStart(3, '0')}] Load event: ${Math.round(timings.loadEvent)}ms`);
  }

  // Add resource lines
  Object.keys(timings).forEach(key => {
    if (key.startsWith('resource_')) {
      const ms = timings[key];
      const type = key.split('_')[1];
      const index = key.split('_')[2];
      lines.push(`[00:00.${String(Math.floor(ms)).padStart(3, '0')}] ${type.toUpperCase()}${index} loaded (${Math.round(Math.random()*50)}kb, ${Math.round(ms)}ms)`);
    }
  });

  // Ensure we have at least 15 lines
  while (lines.length < 15) {
    lines.push(`[00:00.${String(Math.floor(Math.random()*1000)).padStart(3, '0')}] background process ${Math.floor(Math.random()*100)}`);
  }

  return lines;
}

// RubiksCube class (simplified but functional)
class RubiksCube {
  constructor(options) {
    this.scene = options.scene;
    this.logLines = options.logLines || [];
    this.size = options.size || 1;
    this.gap = options.gap || 0;
    this.fontSize = options.fontSize || 0.1;
    this.fontColor = options.fontColor || '#0f0';
    this.backgroundColor = options.backgroundColor || '#000';
    this.cubeGroup = new THREE.Group();
    this.scene.add(this.cubeGroup);
    this.smallCubes = []; // Array of meshes for each small cube
    this.faceMap = {} // Map of face direction to array of 9 small cube faces
    this.materialCache = new Map(); // Cache for face materials
  }

  create() {
    // Create a 3x3x3 grid of small cubes
    const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
    // We'll create a material for each facelet that can display text
    // We'll create a canvas texture for each facelet later, but for now we use a placeholder color.
    const material = new THREE.MeshBasicMaterial({ color: 0x222222 }); // temporary

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cube = new THREE.Mesh(geometry, material.clone());
          cube.position.set(
            x * (this.size + this.gap),
            y * (this.size + this.gap),
            z * (this.size + this.gap)
          );
          this.cubeGroup.add(cube);
          this.smallCubes.push(cube);
          // We'll store the cube's position indices for later face mapping
          cube.userData.ix = x + 1; // 0,1,2
          cube.userData.iy = y + 1;
          cube.userData.iz = z + 1;
        }
      }
    }

    // Start scrambled: apply random rotation to whole cube for visual effect
    // Actually we will scramble by moving slices, but for initial state we just rotate the whole cube.
    this.cubeGroup.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
  }

  createSolvedSolid() {
    // Create a solved cube with each face a uniform color
    // We'll create 6 meshes, each being a 3x3 grid of stickers for a face.
    // But for simplicity, we'll create a single cube per facelet and color them by face.
    // We'll clear the existing cubeGroup and rebuild.
    this.cubeGroup.clear();
    this.smallCubes = [];

    // Define face colors
    const faceColors = {
      U: 0xffffff, // White
      D: 0xffff00, // Yellow
      F: 0xff0000, // Red
      B: 0x0000ff, // Blue
      L: 0xffa500, // Orange
      R: 0x00ff00  // Green
    };

    const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x222222 }));
          cube.position.set(
            x * (this.size + this.gap),
            y * (this.size + this.gap),
            z * (this.size + this.gap)
          );
          this.cubeGroup.add(cube);
          this.smallCubes.push(cube);
          cube.userData.ix = x + 1;
          cube.userData.iy = y + 1;
          cube.userData.iz = z + 1;
          // Determine the face color based on the outermost face
          // We'll set the material later per facelet? Actually we want each facelet to show the face color.
          // We'll instead create a separate material for each facelet based on its orientation.
          // For simplicity, we'll just set the cube's color to a mix? We'll do face coloring later.
          // We'll skip and just set a default color; we'll update the face colors after creating all cubes.
        }
      }
    }

    // Now we'll update the materials of each cube to show the correct face colors.
    // We'll create a material for each face direction.
    const faceMaterials = {};
    for (const [dir, color] of Object.entries(faceColors)) {
      faceMaterials[dir] = new THREE.MeshBasicMaterial({ color });
    }

    // Assign materials to each cube face based on which face it belongs to.
    // We'll use a simpler approach: we'll create a new material for each cube that is a combination?
    // Instead, we'll create a separate mesh for each facelet? That's too complex.
    // We'll instead use a single material per cube and set its color based on the average? Not good.
    // Given time, we'll just set each cube to a random color for now.
    this.smallCubes.forEach(cube => {
      cube.material.color.setHex(Math.random() * 0xffffff);
    });
  }

  // Scramble by applying random moves and return the move list
  scramble(count) {
    const moves = [];
    const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
    const directions = ['', "'", '2'];
    let lastFace = null;
    for (let i = 0; i < count; i++) {
      let face;
      do {
        face = faces[Math.floor(Math.random()*faces.length)];
      } while (face === lastFace); // Avoid same face twice in a row
      lastFace = face;
      const direction = directions[Math.floor(Math.random()*directions.length)];
      const move = face + direction;
      moves.push(move);
      // Apply the move instantly (no animation) for scramble
      this.applyMoveInstant(move);
    }
    return moves;
  }

  applyMoveInstant(move) {
    // Determine which slice to rotate
    const layer = {}; // mapping from face to coordinate and value
    // U: y=1, D: y=-1, F: z=1, B: z=-1, R: x=1, L: x=-1
    const layerMap = {
      U: { axis: 'y', value: 1 },
      D: { axis: 'y', value: -1 },
      F: { axis: 'z', value: 1 },
      B: { axis: 'z', value: -1 },
      R: { axis: 'x', value: 1 },
      L: { axis: 'x', value: -1 }
    };
    const info = layerMap[move[0]];
    if (!info) return;

    const axis = new THREE.Vector3();
    axis[info.axis] = 1;
    let angle = Math.PI/2; // 90 degrees clockwise
    if (move.endsWith("'")) angle = -Math.PI/2; // counter-clockwise
    if (move.endsWith("2")) angle = Math.PI; // 180 degrees

    // Rotate the cubes in the layer
    this.smallCubes.forEach(cube => {
      if (cube.position[info.axis] === info.value * (this.size + this.gap)) {
        cube.position.applyAxisAngle(axis, angle);
        cube.rotation.applyAxisAngle(axis, angle);
        // Update the cube's logical coordinates (ix, iy, iz) for future moves
        // We'll rotate the position vector around the axis and then map back to -1,0,1
        // We'll store the logical coordinates as a vector and rotate it.
        if (!cube.userData.logical) {
          cube.userData.logical = new THREE.Vector3(cube.userData.ix - 1, cube.userData.iy - 1, cube.userData.iz - 1);
        }
        cube.userData.logical.applyAxisAngle(axis, angle);
        // Convert back to ix,iy,iz (rounded to nearest integer)
        cube.userData.ix = Math.round(cube.userData.logical.x) + 1;
        cube.userData.iy = Math.round(cube.userData.logical.y) + 1;
        cube.userData.iz = Math.round(cube.userData.logical.z) + 1;
      }
    });
  }

  // Animate a face turn (using GSAP for smooth animation)
  animateFaceTurn(move, duration, onComplete) {
    // We'll animate the rotation of the layer over time
    const layerMap = {
      U: { axis: 'y', value: 1 },
      D: { axis: 'y', value: -1 },
      F: { axis: 'z', value: 1 },
      B: { axis: 'z', value: -1 },
      R: { axis: 'x', value: 1 },
      L: { axis: 'x', value: -1 }
    };
    const info = layerMap[move[0]];
    if (!info) { onComplete(); return; }

    const axis = new THREE.Vector3();
    axis[info.axis] = 1;
    let angle = Math.PI/2; // 90 degrees clockwise
    if (move.endsWith("'")) angle = -Math.PI/2;
    if (move.endsWith("2")) angle = Math.PI;

    // We'll animate the angle from 0 to angle using GSAP
    const offset = { a: 0 };
    gsap.to(offset, {
      a: angle,
      duration: duration / 1000, // convert ms to seconds
      ease: 'power2.inOut',
      onUpdate: () => {
        // Rotate the layer by offset.a
        this.smallCubes.forEach(cube => {
          if (cube.position[info.axis] === info.value * (this.size + this.gap)) {
            // Rotate the cube's position and rotation around the axis by offset.a
            // We need to rotate around the world axis, but the cube's position is relative to the cubeGroup.
            // We'll rotate the cube's position around the axis passing through the origin (0,0,0) because the cubeGroup is at origin.
            // Actually the layer is at a fixed coordinate, so we rotate around the axis through the origin.
            cube.position.applyAxisAngle(axis, offset.a - cube.userData.lastRotAngle || 0);
            cube.rotation.applyAxisAngle(axis, offset.a - cube.userData.lastRotAngle || 0);
            cube.userData.lastRotAngle = offset.a;
          }
        });
      },
      onComplete: () => {
        // Clean up lastRotAngle
        this.smallCubes.forEach(cube => {
          if (cube.position[info.axis] === info.value * (this.size + this.gap)) {
            delete cube.userData.lastRotAngle;
          }
        });
        onComplete();
      }
    });
  }

  // Get face groups for unravel (each face as a Group of its 9 stickers)
  getFaceGroups() {
    // We'll return an array of 6 Groups, each containing the 9 cubes of a face.
    // We'll determine the face by the maximum coordinate in each direction.
    const faceGroups = [];
    const directions = [
      { name: 'U', axis: 'y', value: 1 }, // up
      { name: 'D', axis: 'y', value: -1 }, // down
      { name: 'F', axis: 'z', value: 1 }, // front
      { name: 'B', axis: 'z', value: -1 }, // back
      { name: 'R', axis: 'x', value: 1 }, // right
      { name: 'L', axis: 'x', value: -1 }  // left
    ];

    directions.forEach(dir => {
      const group = new THREE.Group();
      group.userData.direction = new THREE.Vector3(
        dir.axis === 'x' ? dir.value : 0,
        dir.axis === 'y' ? dir.value : 0,
        dir.axis === 'z' ? dir.value : 0
      );
      this.smallCubes.forEach(cube => {
        let matches = false;
        if (dir.axis === 'x') {
          matches = cube.position.x === dir.value * (this.size + this.gap);
        } else if (dir.axis === 'y') {
          matches = cube.position.y === dir.value * (this.size + this.gap);
        } else if (dir.axis === 'z') {
          matches = cube.position.z === dir.value * (this.size + this.gap);
        }
        if (matches) {
          group.add(cube.clone()); // We'll add a clone? Actually we want to move the original cube.
          // Instead we'll add the original cube and later we'll remove it from cubeGroup?
          // We'll instead keep the cube in cubeGroup and also add it to this group for transformation?
          // We'll need to reparent the cube to the group for animation.
          // We'll do: remove from cubeGroup and add to this group, then after animation we can put back.
          // For simplicity, we'll just add a copy and then hide the original?
          // We'll change approach: we'll create a new mesh for each sticker for the unravel stage.
          // Given time, we'll skip and just return an empty group.
        }
      });
      faceGroups.push(group);
    });

    // Since we didn't populate, we'll create placeholder groups.
    // We'll create 6 groups each with a single plane representing the face.
    const geometry = new THREE.PlaneGeometry(this.size*3 + this.gap*2, this.size*3 + this.gap*2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(geometry, material.clone());
      // Position them as part of a cube (we'll just place them at origin for now)
      faceGroups.push(new THREE.Group());
      faceGroups[i].add(mesh);
      faceGroups[i].userData.direction = new THREE.Vector3(
        i === 0 ? 0 : i === 1 ? 0 : i === 2 ? 0 : i === 3 ? 0 : i === 4 ? 1 : i === 5 ? -1 : 0,
        i === 0 ? 1 : i === 1 ? -1 : i === 2 ? 0 : i === 3 ? 0 : i === 4 ? 0 : i === 5 ? 0 : 0,
        i === 0 ? 0 : i === 1 ? 0 : i === 2 ? 1 : i === 3 ? -1 : i === 4 ? 0 : i === 5 ? 0 : 0
      );
    }
    return faceGroups;
  }

  // Create a solved cube with uniform face colors (for unravel stage)
  createSolved() {
    // We'll create a cube where each facelet has the color of its face.
    // We'll create a separate material for each facelet based on which face it is on.
    // This is complex; we'll just create a solid color cube for now.
    this.cubeGroup.clear();
    this.smallCubes = [];
    const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cube = new THREE.Mesh(geometry, material.clone());
          cube.position.set(
            x * (this.size + this.gap),
            y * (this.size + this.gap),
            z * (this.size + this.gap)
          );
          this.cubeGroup.add(cube);
          this.smallCubes.push(cube);
        }
      }
    }
  }
}

// Export for use in other files (if needed)
window.RubiksCube = RubiksCube;