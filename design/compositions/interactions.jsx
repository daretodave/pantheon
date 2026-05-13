/* Live interaction demos: VotePair, CommentInput, RankShiftPill.
   Each is the real component the production app will render. */

const { useState, useRef, useEffect } = React;

/* -------------------------------------------------- VOTE PAIR */
/* +/- buttons with count between. Click:
   - count animates by 1
   - background flashes the sentiment color for 800ms
   - button locks for 800ms
   prefers-reduced-motion: drop the flash, fade the count instead.
*/

function VotePair({ initial = 274, label = "Survivor: Heroes vs. Villains" }) {
  const [count, setCount]   = useState(initial);
  const [last, setLast]     = useState(null);     // "up" | "down" | null  → drives flash
  const [bump, setBump]     = useState(0);        // 0/+1/-1 → drives count slide
  const [locked, setLocked] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const vote = (dir) => {
    if (locked) return;
    setLocked(true);
    setLast(dir);
    setBump(dir === "up" ? 1 : -1);
    setCount((n) => n + (dir === "up" ? 1 : -1));
    setTimeout(() => {
      setLocked(false);
      setLast(null);
      setBump(0);
    }, 800);
  };

  return (
    <div className="vote-pair" aria-label={`Vote on ${label}`}>
      <button
        className={`vote-btn vote-down ${last === "down" ? "flash" : ""}`}
        onClick={() => vote("down")}
        disabled={locked}
        aria-label={`Vote ${label} down`}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 12 L12 19 L19 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
        </svg>
      </button>

      <div className={`vote-count ${last ? "moving" : ""}`}>
        <div className={`vote-num ${reduced.current ? "reduced" : ""}`}
             style={{ transform: reduced.current ? "none" : `translateY(${bump * -8}px)`, opacity: reduced.current && last ? 0.6 : 1 }}>
          {count.toLocaleString()}
        </div>
        <div className="vote-label">net votes</div>
      </div>

      <button
        className={`vote-btn vote-up ${last === "up" ? "flash" : ""}`}
        onClick={() => vote("up")}
        disabled={locked}
        aria-label={`Vote ${label} up`}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 12 L12 5 L19 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="19" x2="12" y2="5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

/* -------------------------------------------------- COMMENT INPUT */
/* Single-line collapsed; expands on focus into a textarea with:
   - inline "no spoilers" reminder
   - light spoiler detection (substring match against a tiny demo list)
   - red border + tooltip pointing at the flagged phrase
*/

const SPOILER_PHRASES = [
  "wins", "winner", "wins it", "gets eliminated", "votes out",
  "final tribal", "season finale", "eliminated in the final"
];

function detectSpoiler(text) {
  const t = (text || "").toLowerCase();
  for (const p of SPOILER_PHRASES) {
    const i = t.indexOf(p);
    if (i !== -1) return { phrase: text.substr(i, p.length), at: i };
  }
  return null;
}

function CommentInput() {
  const [open, setOpen]   = useState(false);
  const [val, setVal]     = useState("");
  const [touched, setTouched] = useState(false);
  const taRef = useRef(null);
  const spoiler = touched ? detectSpoiler(val) : null;

  useEffect(() => {
    if (open && taRef.current) taRef.current.focus();
  }, [open]);

  return (
    <div className={`comment ${open ? "open" : ""} ${spoiler ? "warn" : ""}`}>
      {!open && (
        <button className="comment-stub" onClick={() => setOpen(true)}>
          <span className="comment-stub-text">Add a thought · no spoilers, please.</span>
          <span className="comment-stub-mono">⏎</span>
        </button>
      )}
      {open && (
        <div className="comment-open">
          <div className="comment-reminder">
            <span className="comment-shield">●</span>
            <span>No spoilers — past or future. Talk about the season, not the result.</span>
          </div>
          <textarea
            ref={taRef}
            className="comment-ta"
            placeholder="Say what you actually think."
            value={val}
            onChange={(e) => { setVal(e.target.value); if (!touched) setTouched(true); }}
            rows={3}
          />
          {spoiler && (
            <div className="comment-flag" role="alert">
              <span className="comment-flag-dot">✱</span>
              <span>“<b>{spoiler.phrase}</b>” reads like a spoiler. Reword before posting.</span>
            </div>
          )}
          <div className="comment-foot">
            <button className="comment-cancel" onClick={() => { setOpen(false); setVal(""); setTouched(false); }}>Cancel</button>
            <button className="comment-post" disabled={!val.trim() || !!spoiler}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------- RANK SHIFT PILL */
/* The little ↑3 / ↓2 / ◆ tag that appears on a card for 72h after a
   ranking change. Demo cycles through states.
*/

function RankShiftPill({ delta = 3, sentiment = "warm-up" }) {
  const sign  = delta > 0 ? "↑" : delta < 0 ? "↓" : "—";
  const num   = Math.abs(delta);
  const color = `var(--s-${sentiment})`;
  return (
    <span className="rank-pill" style={{ color, background: `color-mix(in oklab, ${color} 16%, transparent)` }}>
      {sign} {num !== 0 && num}
    </span>
  );
}

function RankShiftDemo() {
  const states = [
    { delta:  3, sentiment: "warm-up",   note: "Heroes vs. Villains climbed 3 spots after the finale-week reread." },
    { delta: -2, sentiment: "warm-down", note: "Cagayan dropped 2 after a cohort of new readers found the season slow." },
    { delta:  0, sentiment: "neutral",   note: "Pearl Islands held position — a stable consensus week." },
    { delta:  1, sentiment: "hold",      note: "Borneo locked at #1 for the 18th week running." },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % states.length), 2400);
    return () => clearInterval(t);
  }, []);
  const s = states[i];

  return (
    <div className="rank-demo">
      <div className="rank-card">
        <div className="rank-card-rank">#{i === 0 ? "07" : i === 1 ? "23" : i === 2 ? "04" : "01"}</div>
        <div>
          <div className="rank-card-title">
            {i === 0 ? "Heroes vs. Villains" : i === 1 ? "Cagayan" : i === 2 ? "Pearl Islands" : "Borneo"}
          </div>
          <div className="rank-card-meta">Season {i === 0 ? "20" : i === 1 ? "28" : i === 2 ? "07" : "01"} · Editor's Canon</div>
        </div>
        <RankShiftPill delta={s.delta} sentiment={s.sentiment} />
      </div>
      <p className="rank-note">{s.note}</p>
      <div className="rank-dots">
        {states.map((_, n) => (
          <button key={n} className={`rank-dot ${n === i ? "on" : ""}`} onClick={() => setI(n)} aria-label={`State ${n+1}`}/>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { VotePair, CommentInput, RankShiftPill, RankShiftDemo });
