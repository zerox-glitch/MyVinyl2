import { useCallback, useEffect, useState } from 'react'
import Studio from './screens/Studio'
import Vault from './screens/Vault'
import Player from './screens/Player'
import Paywall from './components/Paywall'
import Splash from './components/Splash'
import Logo from './components/Logo'
import { db, type StoredRecord } from './lib/db'

export default function App() {
  const [tab, setTab] = useState<'studio' | 'vault'>('studio')
  const [records, setRecords] = useState<StoredRecord[]>([])
  const [playing, setPlaying] = useState<StoredRecord | null>(null)
  const refresh = useCallback(() => { db.all().then(setRecords) }, [])
  useEffect(refresh, [refresh])

  return (
    <div className="grain relative min-h-[100dvh] overflow-hidden" style={{ background: 'radial-gradient(60% 50% at 20% 20%, rgba(217,119,6,.18), transparent 70%), radial-gradient(50% 50% at 85% 80%, rgba(153,27,27,.2), transparent 70%), #0c0a09' }}>
      <div className="mx-auto grid min-h-[100dvh] max-w-6xl items-center sm:gap-12 sm:px-6 sm:py-10 lg:grid-cols-[1fr_auto]">
        <aside className="hidden lg:block">
          <Logo size={64} className="mb-8" />
          <p className="deco text-xs text-amber-bright">Digital Wax Preserver</p>
          <h1 className="mt-4 font-display text-7xl leading-[0.95]">Vynyl<br />Record</h1>
          <div className="mt-8 h-px w-24 bg-brass" />
          <p className="mt-8 max-w-sm text-muted">An Android app prototype. Record a voice, press it through a real on-device vinyl pipeline — saturation, wow, flutter, surface noise, seeded crackle and pops — and play it back on a procedural 3D turntable.</p>
          <p className="mt-6 max-w-sm font-display text-lg italic text-cream/80">“Your recordings stay on this device unless you choose to export or share them.”</p>
        </aside>

        <div className="relative mx-auto flex h-[100dvh] w-full flex-col overflow-hidden bg-obsidian pt-[env(safe-area-inset-top)] sm:h-[860px] sm:max-h-[calc(100dvh-40px)] sm:w-[400px] sm:rounded-[36px] sm:border-[8px] sm:border-[#1a1715] sm:pt-0 sm:shadow-[0_40px_120px_-20px_black,0_0_0_1px_rgba(180,83,9,.35)]">
          <div className="hidden h-8 shrink-0 items-center justify-between px-6 font-mono text-[11px] text-cream/75 sm:flex" aria-hidden>
            <span>12:30</span>
            <span className="h-3 w-3 rounded-full bg-black ring-2 ring-[#1a1715]" />
            <span className="flex items-center gap-1.5"><span>▾</span><span>▴▴</span><span className="inline-block h-2.5 w-5 rounded-[2px] border border-cream/70 p-px"><span className="block h-full w-4/5 bg-cream/70" /></span></span>
          </div>
          <main className="relative min-h-0 flex-1">
            {tab === 'studio' ? <Studio recordCount={records.length} onDone={(r) => { refresh(); setTab('vault'); setPlaying(r) }} /> : <Vault records={records} refresh={refresh} onPlay={setPlaying} onNew={() => setTab('studio')} />}
            {playing && <Player record={playing} onClose={() => { setPlaying(null); refresh() }} />}
            <Paywall />
          </main>
          <nav className="flex min-h-[68px] shrink-0 items-start justify-around border-t border-brass/20 bg-stone pt-2 pb-[max(8px,env(safe-area-inset-bottom))]" aria-label="Main">
            {([['studio', 'Studio', '●'], ['vault', 'Master Vault', '◎']] as const).map(([id, label, glyph]) => (
              <button key={id} onClick={() => { setTab(id); setPlaying(null) }} aria-current={tab === id && !playing} className={`flex min-h-12 min-w-24 touch-manipulation flex-col items-center gap-0.5 text-[11px] ${tab === id ? 'text-amber-bright' : 'text-muted'}`}>
                <span className="text-lg leading-none">{glyph}</span>{label}
              </button>
            ))}
          </nav>
          <Splash />
          <div className="hidden h-5 shrink-0 items-center justify-center bg-stone sm:flex" aria-hidden><span className="h-1 w-28 rounded-full bg-cream/50" /></div>
        </div>
      </div>
    </div>
  )
}
