import { useEffect } from 'react';
import { SayrProvider, SCREENS, useSayr } from './state';
import { fmtClock } from './engine/types';
import { PlayIcon } from './ui/common';
import { About } from './ui/About';
import { SystemInMotion } from './screens/SystemInMotion';
import { ControlRoom } from './screens/ControlRoom';
import { JourneyLines } from './screens/JourneyLines';
import { ResourceBoard } from './screens/ResourceBoard';
import { StressControls } from './screens/StressControls';
import { ReflowStudio } from './screens/ReflowStudio';
import { RippleTrace } from './screens/RippleTrace';
import { ActionDesk } from './screens/ActionDesk';
import { MinutesLedger } from './screens/MinutesLedger';
import { MyJourney } from './screens/MyJourney';
import { SCHOOL } from './references';

function Transport() {
  const { now, setNow, playing, setPlaying, speed, setSpeed, sc, go, startReflow, reflowUi, liveRun, t } = useSayr();
  const max = Math.ceil(liveRun.final.t / 5) * 5 + 5;
  const pctOf = (t: number) => `${Math.min(100, (t / max) * 100)}%`;
  const d = sc.disruptions[0];
  const busy = reflowUi.phase === 'running';
  return (
    <div className="transport" role="group" aria-label="Simulation clock">
      <button className="btn icon" onClick={() => (now >= max ? (setNow(0), setPlaying(true)) : setPlaying(!playing))} aria-label={playing ? 'Pause' : 'Play'}>
        <PlayIcon playing={playing} />
      </button>
      <div className="clock num">
        {fmtClock(now)}
        <small>{t('simulation time')}</small>
      </div>
      <div className="scrub">
        <div className="scrub-track" />
        <div className="scrub-fill" style={{ width: pctOf(now) }} />
        {d && <div className="scrub-mark" style={{ left: pctOf(d.from), width: `calc(${pctOf(d.until)} - ${pctOf(d.from)})`, background: 'var(--copper-2)', opacity: 0.55 }} title={d.label} />}
        <div className="scrub-mark" style={{ left: pctOf(sc.shiftEnd), background: 'var(--copper)' }} title="Shift ends" />
        {[0, 120, 240, 360, 480].map((t) => (
          <span className="scrub-lbl" key={t} style={{ left: pctOf(t), top: 24 }}>{fmtClock(t)}</span>
        ))}
        <div className="scrub-thumb" style={{ left: pctOf(now) }} />
        <input type="range" min={0} max={max} step={1} value={now} onChange={(e) => setNow(Number(e.target.value))} aria-label="Simulation time" />
      </div>
      <div className="speed" role="group" aria-label="Speed">
        {[2, 6, 15, 40].map((s) => (
          <button key={s} aria-pressed={speed === s} onClick={() => setSpeed(s)}>{s}×</button>
        ))}
      </div>
      <button
        className="btn copper"
        disabled={busy}
        onClick={() => {
          startReflow();
          go('reflow');
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M2 4h7M2 8h12M2 12h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" /><path d="M10 2l4 2-4 2M10 10l4 2-4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
        {busy ? t('Reflowing…') : t('Reflow')}
      </button>
    </div>
  );
}

function Screen() {
  const { screen } = useSayr();
  switch (screen) {
    case 'motion': return <SystemInMotion />;
    case 'control': return <ControlRoom />;
    case 'journeys': return <JourneyLines />;
    case 'board': return <ResourceBoard />;
    case 'stress': return <StressControls />;
    case 'reflow': return <ReflowStudio />;
    case 'ripple': return <RippleTrace />;
    case 'desk': return <ActionDesk />;
    case 'ledger': return <MinutesLedger />;
    case 'my': return <MyJourney />;
  }
}

function Shell() {
  const { screen, go, setAbout, interventions, t, lang, setLang } = useSayr();
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
  return (
    <div className="app">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <pattern id="hatch-copper" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#f2dfd0" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#cf8250" strokeWidth="2" opacity="0.7" />
          </pattern>
        </defs>
      </svg>
      <nav className="rail" aria-label="Screens">
        <div className="brand">
          <div className="brand-mark">
            <span className="brand-word">SAYR</span>
            <span className="brand-ai">AI</span>
          </div>
          <div className="brand-sub">{t('Care in Motion')}</div>
          <div className="lang" role="group" aria-label={t('Language')}>
            <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
            <button aria-pressed={lang === 'ar'} onClick={() => setLang('ar')} lang="ar">العربية</button>
          </div>
        </div>
        <ul className="nav">
          {SCREENS.map((s, i) => (
            <li key={s.id}>
              <button aria-current={screen === s.id ? 'page' : undefined} onClick={() => go(s.id)}>
                <span className="n-i">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="n-t">{t(s.name)}</span>
                  <br />
                  <span className="n-s">{t(s.blurb)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="rail-foot">
          {interventions.length ? <div className="chip teal">{interventions.length} plan{interventions.length > 1 ? 's' : ''} {t('accepted')}</div> : <div>{t('Synthetic data · anonymous journeys')}</div>}
          <div style={{ marginTop: 8 }}>{SCHOOL}</div>
          <button className="link" onClick={() => setAbout(true)}>{t('About, methods & credits')}</button>
        </div>
      </nav>
      <main className="main">
        <div className="page" id="page">
          <Screen />
        </div>
        <Transport />
      </main>
      <About />
    </div>
  );
}

export default function App() {
  return (
    <SayrProvider>
      <Shell />
    </SayrProvider>
  );
}
