/* global React, THREE */
const { useEffect, useRef, useState } = React;

// =====================================================
// HERO 3D — rotating torus knot wireframe
// =====================================================
function Hero3D({ intensity = 1 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !window.THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Read theme color
    const getAccent = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      return v || '#22d3ee';
    };

    // Torus knot
    const geo = new THREE.TorusKnotGeometry(1.3, 0.42, 200, 32);
    const wireGeo = new THREE.WireframeGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(getAccent()),
      transparent: true,
      opacity: 0.8,
    });
    const wireframe = new THREE.LineSegments(wireGeo, lineMat);

    // Inner solid (very subtle)
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
    });
    const inner = new THREE.Mesh(geo, innerMat);

    const group = new THREE.Group();
    group.add(inner);
    group.add(wireframe);
    scene.add(group);

    // Particles
    const pCount = 800;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 4 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.015,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Mouse parallax
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);

    // Resize
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Theme observer — update color when theme switches
    const observer = new MutationObserver(() => {
      lineMat.color = new THREE.Color(getAccent());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    let raf;
    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });

    const clock = new THREE.Clock();
    const animate = () => {
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      group.rotation.x = mouse.y * 0.3 + Math.sin(t * 0.2) * 0.1;
      group.rotation.y += dt * 0.3 * intensity + mouse.x * 0.005;
      group.position.y = -scrollY * 0.001;
      group.scale.setScalar(1 - Math.min(scrollY / 1000, 0.3));

      particles.rotation.y += dt * 0.02;
      particles.rotation.x += dt * 0.01;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
      renderer.dispose();
      geo.dispose();
      wireGeo.dispose();
      lineMat.dispose();
      innerMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [intensity]);

  return <div ref={mountRef} className="hero-canvas" />;
}

// =====================================================
// HERO SECTION
// =====================================================
function Hero({ intensity }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      setTime(`${hh}:${mm}:${ss}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero" id="home" data-screen-label="01 Hero">
      <Hero3D intensity={intensity} />

      <div className="hero-content">
        <div className="hero-tag">
          <span className="hero-tag-dot"></span>
          <span>v.01 / 2026</span>
        </div>

        <h1 className="display">
          <span className="hero-title-line"><span className="glitch-target" data-text="STÍV">STÍV</span></span>
          <span className="hero-title-line"><span><span className="hero-accent">_</span>WEB</span></span>
        </h1>
      </div>

      <div className="scroll-hint">
        <span>scroll ↓</span>
        <span className="scroll-hint-line"></span>
      </div>

      <div className="hero-bottom">
        <div className="hero-bottom-cell">
          <span>// github</span>
          <a href="https://github.com/Itzsteeeve" target="_blank" rel="noopener noreferrer" className="hero-github-link">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{ flexShrink: 0 }}>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <strong>Itzsteeeve</strong>
          </a>
        </div>
        <div className="hero-bottom-cell">
          <span>Verze</span>
          <strong>v.01 / 2026</strong>
        </div>
        <div className="hero-bottom-cell">
          <span>Lokální čas</span>
          <strong className="mono">{time}</strong>
        </div>
      </div>
    </section>
  );
}

window.Hero = Hero;
