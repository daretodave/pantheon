/* Reusable per-show artwork: sigils + mini facades.
   Pulled straight from Phase 2 — facade-cropped-to-square, no new artwork. */

const SHOWS = {
  survivor: { name: "Survivor",       paper: "#0E2A2A", ink: "#EFE2BD", primary: "#D55E36",
              seasons: 47, blurb: "47 seasons. One torch at a time.",
              tagline: "Equatorial dusk. Carved teak. A single coral flame held against the gathering dark." },
  topchef:  { name: "Top Chef",       paper: "#1B2418", ink: "#ECDFC6", primary: "#B86A2E",
              seasons: 22, blurb: "22 seasons. Knives drawn, herbs fresh.",
              tagline: "A pantry at midnight. Brass cellars line a deep olive wall. The knives are already drawn." },
  dragrace: { name: "RuPaul's Drag Race", paper: "#2D0B2A", ink: "#F2E1D2", primary: "#E64B86",
              seasons: 17, blurb: "17 seasons. Quiet velvet, loud pink.",
              tagline: "A scallop-pink temple. Sequins from floor to apex. Loud in the only color it permits itself." },
};

/* ---------- SIGILS (320×320, cropped from facades) ---------- */

function SurvivorSigil({ size = 80 }) {
  const c = SHOWS.survivor;
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{ background: c.paper, borderRadius: 4 }}>
      <g stroke={c.ink} strokeWidth="1.5" fill="none" strokeLinejoin="round">
        <path d="M 8 32 L 40 8 L 72 32"/>
      </g>
      <rect x="38" y="22" width="4" height="14" fill={c.ink}/>
      <path d="M 40 12 Q 34 18 36 26 Q 38 23 40 24 Q 42 23 44 26 Q 46 18 40 12 Z" fill={c.primary}/>
      <g stroke={c.ink} strokeWidth="1" fill="none">
        <path d="M 40 36 Q 22 50 14 70"/>
        <path d="M 40 36 Q 32 56 30 70"/>
        <path d="M 40 36 Q 40 56 40 72"/>
        <path d="M 40 36 Q 48 56 50 70"/>
        <path d="M 40 36 Q 58 50 66 70"/>
      </g>
    </svg>
  );
}

function TopChefSigil({ size = 80 }) {
  const c = SHOWS.topchef;
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{ background: c.paper, borderRadius: 4 }}>
      <g stroke={c.ink} strokeWidth="1.5" fill="none" strokeLinejoin="round">
        <path d="M 8 32 L 40 8 L 72 32"/>
      </g>
      <g strokeLinecap="round">
        <line x1="52" y1="32" x2="28" y2="14" stroke={c.primary} strokeWidth="4"/>
        <line x1="28" y1="32" x2="52" y2="14" stroke={c.primary} strokeWidth="4"/>
        <ellipse cx="26" cy="13" rx="5" ry="3" transform="rotate(-30 26 13)" fill={c.primary} stroke={c.ink} strokeWidth="0.8"/>
        <ellipse cx="54" cy="13" rx="5" ry="3" transform="rotate(30 54 13)" fill={c.primary} stroke={c.ink} strokeWidth="0.8"/>
      </g>
      <g stroke={c.ink} strokeWidth="1" fill="none">
        <ellipse cx="40" cy="56" rx="12" ry="14"/>
        <line x1="32" y1="42" x2="48" y2="42"/>
        <line x1="34" y1="50" x2="46" y2="50" opacity="0.5"/>
      </g>
    </svg>
  );
}

function DragRaceSigil({ size = 80 }) {
  const c = SHOWS.dragrace;
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{ background: c.paper, borderRadius: 4 }}>
      <g stroke={c.ink} strokeWidth="1.5" fill="none" strokeLinejoin="round">
        <path d="M 8 32 L 40 8 L 72 32"/>
      </g>
      <path d="M 22 31 Q 40 -2 58 31 Z" fill={c.primary}/>
      <g stroke={c.ink} strokeWidth="0.6" fill="none" opacity="0.85">
        <path d="M 40 31 L 40 4"/>
        <path d="M 40 31 Q 32 18 28 8"/>
        <path d="M 40 31 Q 48 18 52 8"/>
      </g>
      <circle cx="40" cy="22" r="2" fill={c.ink}/>
      <g fill="none" stroke={c.ink} strokeWidth="1">
        <circle cx="40" cy="44" r="4" fill={c.primary}/>
        <circle cx="32" cy="56" r="4"/>
        <circle cx="48" cy="56" r="4" fill={c.primary}/>
        <circle cx="40" cy="68" r="4"/>
      </g>
    </svg>
  );
}

const SIGILS = { survivor: SurvivorSigil, topchef: TopChefSigil, dragrace: DragRaceSigil };
function Sigil({ show, size }) { const C = SIGILS[show]; return <C size={size}/>; }

/* ---------- MINI FACADE for home hero ---------- */

function SurvivorMiniFacade() {
  const c = SHOWS.survivor;
  return (
    <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" style={{ background: c.paper }}>
      <g transform="translate(0 40)">
        <g stroke={c.ink} strokeWidth="6" fill="none" strokeLinejoin="round">
          <path d="M 30 230 L 600 18 L 1170 230 Z"/>
          <line x1="20" y1="230" x2="1180" y2="230"/>
          <line x1="14" y1="218" x2="1186" y2="218"/>
        </g>
        <g stroke={c.ink} strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M 600 210 Q 420 180 320 95"/>
          <path d="M 600 210 Q 780 180 880 95"/>
          <path d="M 380 115 L 360 95"/><path d="M 430 145 L 410 130"/><path d="M 490 175 L 472 160"/>
          <path d="M 820 115 L 840 95"/><path d="M 770 145 L 790 130"/><path d="M 710 175 L 728 160"/>
        </g>
        <rect x="590" y="100" width="20" height="100" fill={c.ink}/>
        <path d="M 600 30 Q 568 70 580 110 Q 590 95 600 100 Q 610 95 620 110 Q 632 70 600 30 Z"
              fill={c.primary} stroke={c.ink} strokeWidth="3" strokeLinejoin="round"/>
        <rect x="578" y="98" width="44" height="12" fill={c.ink}/>
      </g>
      <g transform="translate(0 280)">
        <g stroke={c.ink} strokeWidth="3" fill="none" strokeLinecap="round">
          <line x1="0" y1="10" x2="1200" y2="10"/>
          <line x1="0" y1="70" x2="1200" y2="70"/>
        </g>
        <g stroke={c.ink} strokeWidth="3" fill="none" strokeLinecap="round">
          {Array.from({length: 16}, (_, i) => (
            <g key={i} transform={`translate(${i*80} 0)`}>
              <path d="M 0 40 Q 20 10 40 40 Q 60 70 80 40"/>
              <path d="M 0 40 Q 20 70 40 40 Q 60 10 80 40"/>
            </g>
          ))}
        </g>
      </g>
      {[120, 320, 520, 720, 920].map(x => (
        <g key={x} transform={`translate(${x} 280)`}>
          <g stroke={c.ink} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="20" y="408" width="120" height="28"/>
            <rect x="30" y="392" width="100" height="16"/>
          </g>
          <path d="M 56 392 L 64 140 L 96 140 L 104 392 Z" fill="none" stroke={c.ink} strokeWidth="3" strokeLinejoin="round"/>
          <g stroke={c.ink} strokeWidth="2" fill="none" opacity="0.7">
            <path d="M 59 360 Q 80 365 101 360"/><path d="M 60 320 Q 80 325 100 320"/>
            <path d="M 61 280 Q 80 285 99 280"/><path d="M 62 240 Q 80 245 98 240"/>
            <path d="M 63 200 Q 80 205 97 200"/><path d="M 63 165 Q 80 170 97 165"/>
          </g>
          <circle cx="68" cy="148" r="10" fill={c.primary}/>
          <circle cx="92" cy="155" r="9" fill={c.primary}/>
          <g stroke={c.ink} strokeWidth="3" fill="none" strokeLinecap="round">
            <path d="M 80 140 Q 30 100 8 30"/>
            <path d="M 80 140 Q 50 80 38 8"/>
            <path d="M 80 140 Q 80 70 78 4"/>
            <path d="M 80 140 Q 110 80 122 8"/>
            <path d="M 80 140 Q 130 100 152 30"/>
          </g>
        </g>
      ))}
      <g stroke={c.ink} strokeWidth="5" fill="none">
        <line x1="0" y1="720" x2="1200" y2="720"/>
        <line x1="0" y1="740" x2="1200" y2="740"/>
        <line x1="0" y1="760" x2="1200" y2="760"/>
      </g>
    </svg>
  );
}

Object.assign(window, { SHOWS, Sigil, SurvivorMiniFacade });
