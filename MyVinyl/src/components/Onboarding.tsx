import { useRef, useState } from 'react'

const KEY = 'vynyl.onboarded'

const SLIDES = [
  { kicker: 'Welcome to Vynyl', title: 'Press a moment into wax', body: 'Record a voice note — a birthday wish, a lullaby, a memory — and Vynyl presses it onto a one-of-a-kind vinyl record.', art: 'mic' },
  { kicker: 'Studio', title: 'Give it a character', body: 'Pick a sound like a 1950s radio or a dusty jazz club, add crackle, set background music, and choose the colour of the wax.', art: 'dials' },
  { kicker: 'Turntable', title: 'Drop the needle', body: 'Play your record on a real 3D turntable. Drag to look around, pinch to zoom, and add a loved-one photo to the centre label.', art: 'disc' },
  { kicker: 'Master Vault', title: 'Keep it, share it', body: 'Every record waits on your shelf. Export it as audio or a spinning-turntable video. Everything stays on this device unless you share it.', art: 'vault' },
] as const

function Art({ kind }: { kind: (typeof SLIDES)[number]['art'] }) {
  const s = { stroke: 'currentColor', fill: 'none', strokeWidth: 2.5, strokeLinecap: 'round' as const }
  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40 text-amber-bright drop-shadow-[0_0_24px_rgba(245,158,11,.35)]" aria-hidden>
      <circle cx="80" cy="80" r="74" fill="#1c1917" stroke="#b45309" strokeOpacity=".4" />
      {kind === 'mic' && <g {...s}><rect x="64" y="38" width="32" height="54" rx="16" /><path d="M52 80a28 28 0 0 0 56 0M80 108v14M66 122h28" />{[0, 1, 2].map((i) => <path key={i} d={`M${118 + i * 7} ${70 - i * 4}q6 10 0 20`} strokeOpacity={1 - i * 0.3} />)}</g>}
      {kind === 'dials' && <g {...s}>{[52, 80, 108].map((x, i) => <g key={x}><path d={`M${x} 40v80`} strokeOpacity=".35" /><rect x={x - 9} y={[86, 54, 72][i]} width="18" height="12" rx="3" fill="#f59e0b" stroke="none" /></g>)}</g>}
      {kind === 'disc' && <g><circle cx="80" cy="80" r="50" fill="#0c0a09" />{[44, 38, 32].map((r) => <circle key={r} cx="80" cy="80" r={r} {...s} strokeWidth="1" strokeOpacity=".35" />)}<circle cx="80" cy="80" r="18" fill="#f59e0b" /><circle cx="80" cy="80" r="3" fill="#0c0a09" /><path d="M128 34 104 92" {...s} /><circle cx="128" cy="34" r="6" fill="#f59e0b" /></g>}
      {kind === 'vault' && <g {...s}><path d="M38 112h84M38 76h84" strokeOpacity=".4" />{[48, 64, 80].map((x, i) => <rect key={x} x={x} y="40" width="12" height="36" rx="2" fill={i === 1 ? '#f59e0b' : 'none'} />)}<circle cx="104" cy="96" r="14" /><circle cx="104" cy="96" r="4" fill="#f59e0b" stroke="none" /></g>}
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
      <div className="flex justify-end p-4"><button type="button" onClick={finish} className="min-h-10 px-3 text-xs text-muted hover:text-cream">Skip</button></div>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex h-full transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ transform: `translateX(-${i * 100}%)` }}>
          {SLIDES.map((s, n) => (
            <section key={s.title} aria-hidden={n !== i} className="flex h-full w-full shrink-0 flex-col items-center justify-center px-8 text-center">
              <Art kind={s.art} />
              <p className="deco mt-10 text-[10px] text-amber-bright">{s.kicker}</p>
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
