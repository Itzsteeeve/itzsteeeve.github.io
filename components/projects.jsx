/* global React */
const { useState, useEffect } = React;

const PROJECTS = [
  { num: '01', title: 'SYNTHWAVE_OS', desc: 'Experimentální desktop prostředí postavené v TypeScriptu s vlastním window managerem.', tags: ['React', 'TS', 'WebGL'], year: '2026' },
  { num: '02', title: 'NEURAL_SKETCH', desc: 'Real-time kolaborativní whiteboard s ML asistencí pro rozpoznávání tvarů.', tags: ['Next.js', 'WebSocket', 'ML'], year: '2025' },
  { num: '03', title: 'PIXEL_FORGE', desc: 'Engine pro 2D pixel art hry napsaný v Rustu s WASM frontendem.', tags: ['Rust', 'WASM', 'Canvas'], year: '2025' },
  { num: '04', title: 'LUMEN_PLAYER', desc: 'Minimalistický hudební přehrávač s vizualizací audia přes WebAudio API.', tags: ['Vue', 'WebAudio'], year: '2025' },
  { num: '05', title: 'TESSERA', desc: 'Generativní mozaikový generátor — input fotka, output skleněná mozaika.', tags: ['Three.js', 'GLSL'], year: '2025' },
  { num: '06', title: 'TERMINA', desc: 'Browser-based terminal s vlastními příkazy a fake filesystem.', tags: ['JS', 'Web Components'], year: '2024' },
  { num: '07', title: 'DRIFT', desc: 'Realtime multiplayer top-down závodní hra postavená nad WebRTC.', tags: ['Phaser', 'WebRTC', 'Node'], year: '2024' },
  { num: '08', title: 'GLYPH', desc: 'Knihovna pro animované SVG ikony reagující na scroll a kurzor.', tags: ['SVG', 'TS'], year: '2024' },
];

function Projects() {
  const [loaded] = useState(true);

  return (
    <section className="projects" id="projects" data-screen-label="02 Projects">
      <div className="section-head reveal">
        <div className="section-head-left">
          <div className="section-meta">
            <span className="section-meta-bar"></span>
            <span>02 // PROJECTS</span>
            <span>{PROJECTS.length.toString().padStart(3, '0')} ENTRIES</span>
          </div>
          <h2 className="h2">// VYBRANÉ <span className="hero-accent">_</span>PRÁCE</h2>
        </div>
        <div className="section-meta">
          <span>2024 — 2026</span>
        </div>
      </div>

      <div className="projects-list">
        {!loaded && Array.from({ length: 8 }).map((_, i) => (
          <div key={`sk-${i}`} className="project-row is-skeleton">
            <span className="project-num mono">{String(i + 1).padStart(2, '0')}</span>
            <span className="skeleton" style={{ width: '60%' }}></span>
            <span className="skeleton" style={{ width: '80%' }}></span>
            <span className="skeleton" style={{ width: '40%' }}></span>
            <span className="project-arrow" style={{ opacity: 0.3 }}>...</span>
          </div>
        ))}

        {loaded && PROJECTS.map((p, i) => (
          <div
            key={p.num}
            className="project-row reveal"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <span className="project-num mono">{p.num}</span>
            <h3 className="project-title">{p.title}</h3>
            <p className="project-desc">{p.desc}</p>
            <div className="project-tags">
              {p.tags.map((t) => (
                <span key={t} className="project-tag">{t}</span>
              ))}
            </div>
            <span className="project-arrow">→</span>
          </div>
        ))}
      </div>
    </section>
  );
}

window.Projects = Projects;
