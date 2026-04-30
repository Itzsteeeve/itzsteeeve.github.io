/* global React, ReactDOM */
const { useState, useEffect } = React;

function App() {
  const [theme, setTheme] = useState('dark');
  const [loaded, setLoaded] = useState(false);

  // Tweaks
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "#22d3ee",
    "intensity": 1,
    "glitch": 1,
    "showLoader": true
  }/*EDITMODE-END*/;
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accent);
    const hex = tweaks.accent.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0,2), 16);
      const g = parseInt(hex.slice(2,4), 16);
      const b = parseInt(hex.slice(4,6), 16);
      document.documentElement.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.15)`);
    }
  }, [tweaks.accent]);

  useEffect(() => {
    document.documentElement.style.setProperty('--glitch', String(tweaks.glitch));
    document.documentElement.setAttribute('data-glitch', tweaks.glitch === 0 ? '0' : '1');
  }, [tweaks.glitch]);

  return (
    <>
      {tweaks.showLoader && <window.Loader onDone={() => setLoaded(true)} />}
      <div className="bg-grid"></div>
      <window.Nav theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />

      <main>
        <window.Hero intensity={tweaks.intensity} />
        <window.Cool />
        <window.GithubSection />
      </main>

      <window.Footer />

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Vzhled">
          <window.TweakColor
            label="Akcent"
            value={tweaks.accent}
            onChange={(v) => setTweak('accent', v)}
          />
          <window.TweakSlider
            label="Intenzita 3D animací"
            min={0} max={3} step={0.1}
            value={tweaks.intensity}
            onChange={(v) => setTweak('intensity', v)}
          />
          <window.TweakSlider
            label="Glitch level"
            min={0} max={3} step={0.1}
            value={tweaks.glitch}
            onChange={(v) => setTweak('glitch', v)}
          />
        </window.TweakSection>
        <window.TweakSection label="Komponenty">
          <window.TweakToggle
            label="Loading screen"
            value={tweaks.showLoader}
            onChange={(v) => setTweak('showLoader', v)}
          />
        </window.TweakSection>
        <window.TweakSection label="Téma">
          <window.TweakRadio
            label="Mode"
            value={theme}
            options={[{value: 'dark', label: 'Dark'}, {value: 'light', label: 'Light'}]}
            onChange={setTheme}
          />
        </window.TweakSection>
      </window.TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
