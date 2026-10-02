import { useRef, useState } from 'react'

const KEY = 'vynyl.onboarded'

const SLIDES = [
  { kicker: 'Welcome to Vynyl', title: 'Press a moment into wax', body: 'Record a voice note — a birthday wish, a lullaby, a memory — and Vynyl presses it onto a one-of-a-kind vinyl record.', art: 'mic' },
  { kicker: 'Studio', title: 'Give it a character', body: 'Pick a sound like a 1950s radio or a dusty jazz club, add crackle, set background music, and choose the colour of the wax.', art: 'dials' },
  { kicker: 'Turntable', title: 'Drop the needle', body: 'Play your record on a real 3D turntable. Drag to look around, pinch to zoom, and add a loved-one photo to the centre label.', art: 'disc' },
  { kicker: 'Master Vault', title: 'Keep it, share it', body: 'Every record waits on your shelf. Export it as audio or a spinning-turntable video. Everything stays on this device unless you share it.', art: 'vault' },
] as const

function Art({ kind }: { kind: (typeof SLIDES)[number]['art'] }) {
  const s = { stroke: '#fbbf24', fill: 'none', strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 160 160" className="h-44 w-44 drop-shadow-[0_0_30px_rgba(245,158,11,.35)]" aria-hidden>
      <defs>
        <radialGradient id="ob-bg" cx=".5" cy=".35" r=".7"><stop offset="0" stopColor="#3a2a17" /><stop offset="1" stopColor="#15110e" /></radialGradient>
        <linearGradient id="ob-gold" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset=".55" stopColor="#f59e0b" /><stop offset="1" stopColor="#b45309" /></linearGradient>
      </defs>
      <circle cx="80" cy="80" r="76" fill="url(#ob-bg)" stroke="url(#ob-gold)" strokeWidth="1.5" strokeOpacity=".7" />
      <circle cx="80" cy="80" r="68" fill="none" stroke="#f59e0b" strokeOpacity=".15" />
      {kind === 'mic' && <g>
        <rect x="62" y="30" width="36" height="58" rx="18" fill="url(#ob-gold)" />
        {[44, 52, 60, 68, 76].map((y) => <path key={y} d={`M66 ${y}h28`} stroke="#7c3f0a" strokeWidth="1.6" strokeOpacity=".55" />)}
        <path d="M52 74a28 28 0 0 0 56 0M80 102v16M64 120h32" {...s} />
        {[0, 1, 2].map((i) => <path key={i} d={`M${114 + i * 8} ${56 - i * 4}q8 14 0 ${28 + i * 8}`} {...s} strokeWidth="2.5" strokeOpacity={0.9 - i * 0.28} />)}
      </g>}
      {kind === 'dials' && <g>
        <rect x="34" y="36" width="92" height="88" rx="12" fill="#1c1611" stroke="#f59e0b" strokeOpacity=".35" />
        {[54, 80, 106].map((x, i) => <g key={x}><path d={`M${x} 50v60`} stroke="#f59e0b" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" /><rect x={x - 10} y={[82, 56, 70][i]} width="20" height="12" rx="3" fill="url(#ob-gold)" /></g>)}
        {[54, 80, 106].map((x) => <circle key={x} cx={x} cy="118" r="2" fill="#fbbf24" />)}
      </g>}
      {kind === 'disc' && <g>
        <rect x="24" y="30" width="112" height="100" rx="10" fill="#2a1d12" stroke="#b45309" strokeOpacity=".6" />
        <circle cx="72" cy="80" r="40" fill="#0c0a09" />
        {[36, 31, 26, 21].map((r) => <circle key={r} cx="72" cy="80" r={r} fill="none" stroke="#fbbf24" strokeOpacity=".22" />)}
        <path d="M44 64a34 34 0 0 1 22-18" stroke="#fff7e6" strokeOpacity=".25" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="72" cy="80" r="13" fill="url(#ob-gold)" /><circle cx="72" cy="80" r="2.5" fill="#0c0a09" />
        <circle cx="120" cy="44" r="7" fill="#3a2a17" stroke="url(#ob-gold)" strokeWidth="2" />
        <path d="M120 44 112 96l-12 10" {...s} /><rect x="94" y="102" width="10" height="7" rx="1.5" transform="rotate(-40 99 105)" fill="url(#ob-gold)" />
      </g>}
      {kind === 'vault' && <g>
        <path d="M30 82h100M30 124h100" stroke="#b45309" strokeWidth="4" strokeLinecap="round" />
        {[[38, '#991b1b'], [52, '#f59e0b'], [66, '#0d3b2a'], [80, '#e9e1cf']].map(([x, c]) => <rect key={x as number} x={x as number} y="40" width="12" height="42" rx="2" fill={c as string} stroke="#fbbf24" strokeOpacity=".5" />)}
        <rect x="96" y="44" width="12" height="38" rx="2" transform="rotate(12 102 82)" fill="#3b1d55" stroke="#fbbf24" strokeOpacity=".5" />
        <circle cx="104" cy="106" r="17" fill="#0c0a09" stroke="#fbbf24" strokeOpacity=".4" /><circle cx="104" cy="106" r="6" fill="url(#ob-gold)" />
        <path d="M44 112h36M44 102h24" {...s} strokeWidth="2.5" strokeOpacity=".6" />
      </g>}
    </svg>
  )
}

/** First-launch welcome slides; shown once, after the splash. */
export default function Onboarding() {
  const [done, setDone] = useState(() => localStorage.getItem(KEY) === '1')
  const [i, setI] = useState(0)
  const x0 = useRef<number | null>(null)
  if (done) return null
  const finish = () => { localStorage.setItem(KEY, '1'); setDone(true) }
  const last = i === SLIDES.length - 1
  const go = (d: number) => setI((v) => Math.min(SLIDES.length - 1, Math.max(0, v + d)))

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-obsidian pt-[env(safe-area-inset-top)]" role="dialog" aria-modal aria-label="Welcome"
      style={{ background: 'radial-gradient(70% 45% at 50% 32%, rgba(217,119,6,.2), transparent 70%), #0c0a09' }}
      onPointerDown={(e) => { x0.current = e.clientX }} onPointerUp={(e) => { if (x0.current != null && Math.abs(e.clientX - x0.current) > 40) go(e.clientX < x0.current ? 1 : -1); x0.current = null }}>
      <div className="flex justify-end p-4"><button type="button" onClick={finish} className="min-h-11 rounded-full border border-cream/20 px-5 text-sm text-cream hover:border-amber">Skip</button></div>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex h-full transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ transform: `translateX(-${i * 100}%)` }}>
          {SLIDES.map((s, n) => (
            <section key={s.title} aria-hidden={n !== i} className="flex h-full w-full shrink-0 flex-col items-center justify-center px-8 text-center">
              <Art kind={s.art} />
              <p className="deco mt-10 text-[13px] text-amber-bright">{s.kicker}</p>
              <h2 className="mt-3 font-display text-[32px] leading-[1.05]">{s.title}</h2>
              <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-muted">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between px-6 pt-4 pb-[max(28px,env(safe-area-inset-bottom))]">
        <div className="flex gap-1.5">{SLIDES.map((s, n) => <button key={s.title} type="button" aria-label={`Slide ${n + 1}`} onClick={() => setI(n)} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-amber-bright' : 'w-1.5 bg-cream/25'}`} />)}</div>
        <button type="button" onClick={() => (last ? finish() : go(1))}
          className="flex min-h-12 items-center rounded-full bg-gradient-to-b from-[#f0c86a] via-[#c99234] to-[#8a5a1a] px-6 font-deco text-sm uppercase tracking-[0.2em] text-obsidian active:scale-95">
          {last ? 'Start recording' : 'Next'}
        </button>
      </div>
    </div>
  )
}
