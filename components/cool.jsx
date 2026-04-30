/* global React, THREE */
const { useEffect, useRef, useState } = React;

// =====================================================
// Tile: 3D rotující objekt (různé geometrie)
// =====================================================
function Tile3D({ kind = 'icosa' }) {
  const ref = useRef(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount || !window.THREE) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    cam.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    const getAccent = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee';
    const getFg = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#fff';

    let geo;
    if (kind === 'icosa') geo = new THREE.IcosahedronGeometry(1.1, 0);
    else if (kind === 'octa') geo = new THREE.OctahedronGeometry(1.1, 0);
    else if (kind === 'dodeca') geo = new THREE.DodecahedronGeometry(1.1, 0);
    else if (kind === 'cube') geo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    else geo = new THREE.TorusGeometry(0.9, 0.35, 16, 32);

    const wireGeo = new THREE.WireframeGeometry(geo);
    const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(getFg()), transparent: true, opacity: 0.7 });
    const wire = new THREE.LineSegments(wireGeo, mat);

    const innerMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(getAccent()),
      transparent: true,
      opacity: 0.08,
      wireframe: false,
    });
    const inner = new THREE.Mesh(geo, innerMat);

    const grp = new THREE.Group();
    grp.add(inner);
    grp.add(wire);
    scene.add(grp);

    const observer = new MutationObserver(() => {
      mat.color = new THREE.Color(getFg());
      innerMat.color = new THREE.Color(getAccent());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    let raf;
    let mx = 0, my = 0;
    const onMove = (e) => {
      const r = mount.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    mount.addEventListener('mousemove', onMove);

    const onResize = () => {
      const w2 = mount.clientWidth, h2 = mount.clientHeight;
      cam.aspect = w2 / h2;
      cam.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    const clock = new THREE.Clock();
    const animate = () => {
      const dt = clock.getDelta();
      grp.rotation.y += dt * 0.4 + mx * 0.01;
      grp.rotation.x += dt * 0.2 + my * 0.01;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      observer.disconnect();
      mount.removeEventListener('mousemove', onMove);
      renderer.dispose();
      geo.dispose();
      wireGeo.dispose();
      mat.dispose();
      innerMat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [kind]);

  return <div ref={ref} className="cool-tile-canvas" />;
}

// =====================================================
// Tile: Shader (vlnící se gradient)
// =====================================================
function TileShader() {
  const ref = useRef(null);
  useEffect(() => {
    const mount = ref.current;
    if (!mount || !window.THREE) return;

    const w = mount.clientWidth, h = mount.clientHeight;
    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    const getAccent = () => {
      const c = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee');
      return new THREE.Vector3(c.r, c.g, c.b);
    };

    const uniforms = {
      u_time: { value: 0 },
      u_res: { value: new THREE.Vector2(w, h) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_accent: { value: getAccent() },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: `void main(){ gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_res;
        uniform vec2 u_mouse;
        uniform vec3 u_accent;

        // simple 2d noise
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){
          vec2 i=floor(p), f=fract(p);
          float a=hash(i), b=hash(i+vec2(1.0,0.0)),
                c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
          vec2 u=f*f*(3.0-2.0*f);
          return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
        }
        float fbm(vec2 p){
          float v=0.0, a=0.5;
          for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
          return v;
        }
        void main(){
          vec2 uv = gl_FragCoord.xy / u_res;
          vec2 p = uv*2.5;
          p.x += u_time*0.1;
          float n = fbm(p + fbm(p + u_time*0.15));
          float dist = distance(uv, u_mouse);
          n += (1.0 - dist) * 0.15;
          vec3 col = mix(vec3(0.04,0.04,0.05), u_accent, smoothstep(0.3, 0.85, n));
          // scanlines
          col *= 0.95 + 0.05 * sin(gl_FragCoord.y*0.7);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const geo = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const observer = new MutationObserver(() => { uniforms.u_accent.value = getAccent(); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const onMove = (e) => {
      const r = mount.getBoundingClientRect();
      uniforms.u_mouse.value.set((e.clientX - r.left) / r.width, 1.0 - (e.clientY - r.top) / r.height);
    };
    mount.addEventListener('mousemove', onMove);

    const ro = new ResizeObserver(() => {
      const w2 = mount.clientWidth, h2 = mount.clientHeight;
      renderer.setSize(w2, h2);
      uniforms.u_res.value.set(w2, h2);
    });
    ro.observe(mount);

    let raf;
    const start = performance.now();
    const animate = () => {
      uniforms.u_time.value = (performance.now() - start) / 1000;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      observer.disconnect();
      mount.removeEventListener('mousemove', onMove);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);
  return <div ref={ref} className="cool-tile-canvas" />;
}

// =====================================================
// Tile: Particle field (klikací)
// =====================================================
function TileParticles() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let w, h, dpr = Math.min(window.devicePixelRatio, 2);
    const particles = [];
    const N = 60;

    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(() => { ctx.setTransform(1,0,0,1,0,0); resize(); });
    ro.observe(c);

    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      });
    }

    const mouse = { x: -1000, y: -1000 };
    const onMove = (e) => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -1000; mouse.y = -1000; };
    c.addEventListener('mousemove', onMove);
    c.addEventListener('mouseleave', onLeave);

    let raf;
    const draw = () => {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee';
      const fg = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#fff';
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < 8000) {
          const f = (8000 - d2) / 8000 * 0.05;
          p.vx -= dx * f * 0.01;
          p.vy -= dy * f * 0.01;
        }
        p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      }

      // links
      ctx.lineWidth = 0.5;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < 6000) {
            ctx.strokeStyle = accent;
            ctx.globalAlpha = (1 - d2 / 6000) * 0.4;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // dots
      ctx.fillStyle = fg;
      for (const p of particles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      c.removeEventListener('mousemove', onMove);
      c.removeEventListener('mouseleave', onLeave);
    };
  }, []);
  return <canvas ref={ref} className="cool-tile-canvas" style={{ width: '100%', height: '100%' }} />;
}

// =====================================================
// Tile: Mini hra — Reaction (klikni na kruh)
// =====================================================
function TileReaction() {
  const [target, setTarget] = useState(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(null);
  const startRef = useRef(0);
  const ref = useRef(null);

  const spawn = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTarget({
      x: 30 + Math.random() * (r.width - 60),
      y: 30 + Math.random() * (r.height - 60),
    });
    startRef.current = performance.now();
  };

  const hit = (e) => {
    e.stopPropagation();
    if (!target) return;
    const ms = Math.round(performance.now() - startRef.current);
    setScore(score + 1);
    setBest((b) => (b === null ? ms : Math.min(b, ms)));
    setTarget(null);
    setTimeout(spawn, 400 + Math.random() * 600);
  };

  return (
    <div
      ref={ref}
      className="cool-tile-canvas"
      style={{ pointerEvents: 'auto' }}
      onClick={(e) => { if (!target) { spawn(); e.stopPropagation(); } }}
    >
      {!target && score === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--fg-muted)', letterSpacing: '0.1em', textTransform: 'uppercase'
        }}>
          [ click to start ]
        </div>
      )}
      {target && (
        <button
          onClick={hit}
          style={{
            position: 'absolute',
            left: target.x - 18, top: target.y - 18,
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent)', cursor: 'crosshair',
            boxShadow: '0 0 24px var(--accent)',
            animation: 'pulse 0.8s ease-in-out infinite',
            border: 'none',
          }}
        />
      )}
      {(score > 0 || best) && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--fg-muted)', letterSpacing: '0.1em',
          textTransform: 'uppercase', textAlign: 'right',
        }}>
          <div>hits: <span style={{ color: 'var(--fg)' }}>{score}</span></div>
          {best && <div>best: <span style={{ color: 'var(--accent)' }}>{best}ms</span></div>}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Tile: ASCII rain
// =====================================================
function TileMatrix() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let w, h, cols = 0, drops = [];
    const fs = 14;
    const chars = '01アイウエオカキクケコサシスセソタチツテト'.split('');

    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w; c.height = h;
      cols = Math.floor(w / fs);
      drops = new Array(cols).fill(0).map(() => Math.random() * h / fs);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(c);

    let raf;
    const draw = () => {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee';
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#111';
      ctx.fillStyle = bg + 'cc'; // semi-transparent fade
      ctx.globalAlpha = 0.15;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent;
      ctx.font = `${fs}px monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * fs, drops[i] * fs);
        if (drops[i] * fs > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="cool-tile-canvas" style={{ width: '100%', height: '100%', opacity: 0.7 }} />;
}

// =====================================================
// Tile: 3D wave terrain (animated mesh grid)
// =====================================================
function TileWave() {
  const ref = useRef(null);
  useEffect(() => {
    const mount = ref.current;
    if (!mount || !window.THREE) return;
    const w = mount.clientWidth, h = mount.clientHeight;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    cam.position.set(0, 2.2, 4);
    cam.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    const getAccent = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee';

    const SEG = 40;
    const geo = new THREE.PlaneGeometry(6, 6, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const wireGeo = new THREE.WireframeGeometry(geo);
    const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(getAccent()), transparent: true, opacity: 0.7 });
    const wire = new THREE.LineSegments(wireGeo, mat);
    scene.add(wire);

    const observer = new MutationObserver(() => { mat.color = new THREE.Color(getAccent()); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const ro = new ResizeObserver(() => {
      const w2 = mount.clientWidth, h2 = mount.clientHeight;
      cam.aspect = w2 / h2; cam.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    });
    ro.observe(mount);

    let mx = 0;
    const onMove = (e) => {
      const r = mount.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    };
    mount.addEventListener('mousemove', onMove);

    let raf;
    const start = performance.now();
    const animate = () => {
      const t = (performance.now() - start) / 1000;
      // Animate vertices on the original geo, then rebuild wireframe
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const y = Math.sin(x * 1.2 + t * 1.5) * 0.25 + Math.cos(z * 1.3 + t * 1.1) * 0.25;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      wire.geometry.dispose();
      wire.geometry = new THREE.WireframeGeometry(geo);
      wire.rotation.y = mx * 0.4 + t * 0.1;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      observer.disconnect();
      mount.removeEventListener('mousemove', onMove);
      renderer.dispose();
      geo.dispose();
      wire.geometry.dispose();
      mat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);
  return <div ref={ref} className="cool-tile-canvas" />;
}

// =====================================================
// Tile: Oscilloscope / waveform visualizer (synthetic)
// =====================================================
function TileScope() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let w, h;
    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w; c.height = h;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(c);

    let raf;
    const start = performance.now();
    const draw = () => {
      const t = (performance.now() - start) / 1000;
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee';
      const fg = getComputedStyle(document.documentElement).getPropertyValue('--fg-dim').trim() || '#555';

      ctx.clearRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = fg;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      // center line
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
      ctx.globalAlpha = 1;

      // glow waveform
      const drawWave = (amp, freq, phase, alpha, lw) => {
        ctx.strokeStyle = accent;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const u = x / w;
          const env = Math.sin(u * Math.PI); // taper at edges
          const y = h/2 +
            Math.sin(u * freq + phase) * amp * env +
            Math.sin(u * freq * 2.3 + phase * 1.7) * amp * 0.4 * env;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      // glow layers
      drawWave(h * 0.35, 8 + Math.sin(t * 0.3) * 4, t * 2, 0.15, 8);
      drawWave(h * 0.32, 8 + Math.sin(t * 0.3) * 4, t * 2, 0.3, 4);
      drawWave(h * 0.3, 8 + Math.sin(t * 0.3) * 4, t * 2, 1, 1.5);

      // bars at bottom
      const bars = 24;
      for (let i = 0; i < bars; i++) {
        const bh = (Math.sin(t * 3 + i * 0.4) * 0.5 + 0.5) * h * 0.18;
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.4 + (i / bars) * 0.4;
        const bw = w / bars - 2;
        ctx.fillRect(i * (w / bars) + 1, h - bh - 4, bw, bh);
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="cool-tile-canvas" style={{ width: '100%', height: '100%' }} />;
}

// =====================================================
// COOL SECTION
// =====================================================
function Cool() {
  const tiles = [
    { key: 'icosa', span: 'span-5 row-2', title: 'Icosahedron', label: '3D / wireframe', status: 'live', body: <Tile3D kind="icosa" /> },
    { key: 'shader', span: 'span-7', title: 'Liquid shader', label: 'GLSL / fragment', status: 'experiment', body: <TileShader /> },
    { key: 'particles', span: 'span-4', title: 'Constellation', label: 'Canvas / particles', status: 'interactive', body: <TileParticles /> },
    { key: 'reaction', span: 'span-3', title: 'Reaction test', label: 'Mini game', status: 'play', body: <TileReaction /> },
    { key: 'wave', span: 'span-4', title: 'Wave terrain', label: '3D / mesh', status: 'live', body: <TileWave /> },
    { key: 'octa', span: 'span-3', title: 'Octahedron', label: '3D / wireframe', status: 'live', body: <Tile3D kind="octa" /> },
    { key: 'matrix', span: 'span-3', title: 'Code rain', label: 'Canvas', status: 'ambient', body: <TileMatrix /> },
    { key: 'scope', span: 'span-3', title: 'Oscilloscope', label: 'Audio viz', status: 'live', body: <TileScope /> },
    { key: 'torus', span: 'span-3', title: 'Torus', label: '3D / wireframe', status: 'live', body: <Tile3D kind="torus" /> },
  ];

  return (
    <section className="cool" id="cool" data-screen-label="03 Cool">
      <div className="section-head reveal">
        <div className="section-head-left">
          <div className="section-meta">
            <span className="section-meta-bar"></span>
            <span>// LAB</span>
          </div>
          <h2 className="h2">LAB</h2>
        </div>
      </div>

      <div className="cool-grid">
        {tiles.map((t, i) => (
          <div
            key={t.key}
            className={`cool-tile reveal ${t.span}`}
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            {t.body}
            <div className="cool-tile-content">
              <div className="cool-tile-bottom">
                <h3 className="cool-tile-title">{t.title}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

window.Cool = Cool;
