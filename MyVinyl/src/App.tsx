import { useCallback, useEffect, useState } from 'react'
import Studio from './screens/Studio'
import Vault from './screens/Vault'
import Player from './screens/Player'
import Paywall from './components/Paywall'
import Splash from './components/Splash'
import Onboarding from './components/Onboarding'
import Guide from './components/Guide'
import Logo from './components/Logo'
import { db, voices as voiceDb, type SavedVoice, type StoredRecord } from './lib/db'

export default function App() {
  const [tab, setTab] = useState<'studio' | 'vault'>('studio')
  const [guide, setGuide] = useState(false)
  const [capture, setCapture] = useState(0)
  const [studioStep, setStudioStep] = useState(0)
  const [records, setRecords] = useState<StoredRecord[]>([])
  const [playing, setPlaying] = useState<StoredRecord | null>(null)
  const [editing, setEditing] = useState<StoredRecord | null>(null)
  const refresh = useCallback(() => { db.all().then(setRecords) }, [])
  useEffect(refresh, [refresh])
  const [voices, setVoices] = useState<SavedVoice[]>([])
  const refreshVoices = useCallback(() => { voiceDb.all().then(setVoices) }, [])
  useEffect(refreshVoices, [refreshVoices])
  const [reuse, setReuse] = useState<{ pcm: Float32Array; name: string; n: number } | null>(null)
  const useVoice = async (v: SavedVoice) => { setReuse({ pcm: new Float32Array(await v.pcm.arrayBuffer()), name: v.name, n: Date.now() }); setTab('studio') }

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
            {/* the Studio stays mounted so a half-made record survives a trip to the vault */}
            <div className={tab === 'studio' ? 'h-full' : 'hidden'}><Studio recordCount={records.length} edit={editing} capture={capture} active={tab === 'studio' && !playing && !guide} onStep={setStudioStep} reuse={reuse} onVoiceSaved={refreshVoices} onCancelEdit={() => setEditing(null)} onDone={() => refresh()} onPlay={setPlaying} /></div>
            {tab === 'vault' && <Vault records={records} refresh={refresh} onPlay={setPlaying} onNew={() => { setTab('studio'); setCapture((n) => n + 1) }} voices={voices} refreshVoices={refreshVoices} onUseVoice={(v) => void useVoice(v)} />}
            {playing && <Player record={playing} onClose={() => { setPlaying(null); refresh() }} onEdit={(r) => { setPlaying(null); setEditing(r); setTab('studio'); refresh() }} />}
            {guide && <Guide onClose={() => setGuide(false)} />}
            <Paywall />
          </main>
          <nav className="grid min-h-[72px] shrink-0 grid-cols-4 border-t border-brass/20 bg-stone pt-2 pb-[max(8px,env(safe-area-inset-bottom))]" aria-label="Main">
            {([['record', 'Record'], ['studio', 'Studio'], ['vault', 'Master Vault'], ['guide', 'Guide']] as const).map(([id, label]) => {
              const here = tab !== 'vault' && !playing && !guide
              const on = id === 'guide' ? guide : id === 'record' ? here && studioStep === 0 : id === 'studio' ? here && studioStep > 0 : tab === 'vault' && !playing && !guide
              return (
                <button key={id} type="button" aria-current={on || undefined} className={`flex min-h-12 touch-manipulation flex-col items-center gap-1 text-xs font-medium ${on ? 'text-amber-bright' : 'text-cream/70'}`}
                  onClick={() => {
                    if (id === 'guide') return setGuide(true)
                    setGuide(false); setPlaying(null); setTab(id === 'vault' ? 'vault' : 'studio')
                    if (id === 'record') setCapture((n) => n + 1)
                  }}>
                  <NavIcon id={id} on={on} />{label}
                </button>
              )
            })}
          </nav>
          <Onboarding />
          <Splash />
          <div className="hidden h-5 shrink-0 items-center justify-center bg-stone sm:flex" aria-hidden><span className="h-1 w-28 rounded-full bg-cream/50" /></div>
        </div>
      </div>
    </div>
  )
}

/** Bottom-bar icons, drawn on a 24-unit grid; the active one gets an amber fill accent. */
function NavIcon({ id, on }: { id: 'record' | 'studio' | 'vault' | 'guide'; on: boolean }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const fill = on ? 'currentColor' : 'none'
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      {id === 'record' && <g {...s}><rect x="9" y="3" width="6" height="11" rx="3" fill={fill} /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></g>}
      {id === 'studio' && <g {...s}><circle cx="11" cy="13" r="8" /><circle cx="11" cy="13" r="2.6" fill={fill} /><path d="M19.5 3.5 15 12" /><circle cx="19.5" cy="3.5" r="1.2" fill="currentColor" stroke="none" /></g>}
      {id === 'vault' && <g {...s}><path d="M3 20h18M3 12h18" /><rect x="4.5" y="4" width="3" height="8" rx=".6" /><rect x="8.5" y="4" width="3" height="8" rx=".6" fill={fill} /><rect x="12.5" y="5.5" width="3" height="6.5" rx=".6" /><circle cx="16" cy="16" r="3.2" /><circle cx="16" cy="16" r=".9" fill="currentColor" stroke="none" /></g>}
      {id === 'guide' && <g {...s}><circle cx="12" cy="12" r="9" fill={on ? 'currentColor' : 'none'} fillOpacity=".15" /><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></g>}
    </svg>
  )
}
