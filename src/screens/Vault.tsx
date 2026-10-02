import { useMemo, useState } from 'react'
import { Btn, Eyebrow, fmt } from '../components/ui'
import { PRESETS, STYLES } from '../lib/presets'
import { db, type StoredRecord } from '../lib/db'
import { FREE, openPaywall, usePro } from '../lib/pro'
import { ProButton } from '../components/Paywall'

export default function Vault({ records, refresh, onPlay, onNew }: { records: StoredRecord[]; refresh: () => void; onPlay: (r: StoredRecord) => void; onNew: () => void }) {
  const [q, setQ] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [fav, setFav] = useState(false)
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title' | 'duration'>('newest')
  const [confirm, setConfirm] = useState<StoredRecord | null>(null)
  const pro = usePro().pro

  const list = useMemo(() => {
    const s = q.toLowerCase()
    return records
      .filter((r) => (!fav || r.favorite) && [r.title, r.recipient, r.occasion].some((x) => x.toLowerCase().includes(s)))
      .sort((a, b) => sort === 'newest' ? b.createdAt - a.createdAt : sort === 'oldest' ? a.createdAt - b.createdAt : sort === 'title' ? a.title.localeCompare(b.title) : b.duration - a.duration)
  }, [records, q, fav, sort])

  const toggleFav = async (r: StoredRecord) => { await db.put({ ...r, favorite: !r.favorite }); refresh() }

  return (
    <div className="flex h-full flex-col">
      <header className="px-6 pt-4">
        <div className="flex items-center justify-between gap-3"><Eyebrow>Master Vault · {records.length} pressed</Eyebrow><ProButton /></div>
        <h1 className="mt-1 font-display text-4xl">Your shelf</h1>
        {!pro && (
          <button type="button" onClick={() => openPaywall('Free shelves hold three records. Go Pro to keep every voice you press.')} className="mt-3 block w-full rounded-xl border border-brass/25 bg-panel/70 px-3.5 py-2.5 text-left transition hover:border-amber/60">
            <span className="flex items-center justify-between text-[11px]"><span className="text-cream/85">{Math.min(records.length, FREE.maxRecords)} of {FREE.maxRecords} free shelf slots used</span><span className="deco text-[10px] text-amber-bright">Unlimited with Pro ›</span></span>
            <span className="mt-2 flex gap-1">{Array.from({ length: FREE.maxRecords }, (_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i < records.length ? 'bg-amber-bright' : 'bg-cream/10'}`} />)}</span>
          </button>
        )}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, people, occasions" aria-label="Search records"
          className="mt-4 w-full rounded-full border border-brass/25 bg-panel px-4 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-amber-bright" />
        <div className="mt-3 flex items-center gap-2 text-xs">
          <button onClick={() => setFav((f) => !f)} aria-pressed={fav} className={`rounded-full border px-3 py-1.5 ${fav ? 'border-amber text-cream' : 'border-brass/25 text-muted'}`}>♥ Favorites</button>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} aria-label="Sort" className="rounded-full border border-brass/25 bg-panel px-3 py-1.5 text-muted outline-none">
            <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="title">Title</option><option value="duration">Longest</option>
          </select>
          <div className="ml-auto flex rounded-full border border-brass/25 p-0.5">
            {(['grid', 'list'] as const).map((v) => <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`rounded-full px-3 py-1 capitalize ${view === v ? 'bg-amber/20 text-cream' : 'text-muted'}`}>{v}</button>)}
          </div>
        </div>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-5">
        {!records.length ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="h-32 w-32 rounded-full border border-dashed border-brass/40" style={{ background: 'repeating-radial-gradient(transparent 0 6px, rgba(180,83,9,.12) 7px 8px)' }} />
            <p className="mt-6 max-w-56 font-display text-2xl leading-snug">Your shelf is waiting for its first voice.</p>
            <Btn className="mt-6" onClick={onNew}>Press a record</Btn>
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid grid-cols-2 gap-x-4 gap-y-6' : 'space-y-2'}>
            {list.map((r) => {
              const st = STYLES.find((s) => s.id === r.styleId)!, pr = PRESETS.find((p) => p.id === r.presetId)!
              const sleeve = (
                <div className="relative aspect-square overflow-hidden rounded-md bg-stone shadow-[0_10px_30px_-10px_black]" style={{ background: `linear-gradient(140deg, ${st.label}, #0c0a09 120%)` }}>
                  <div className="absolute -right-1/4 top-[8%] h-[84%] aspect-square rounded-full" style={{ background: `repeating-radial-gradient(${st.disc} 0 2px, #00000055 3px 4px)` }}>
                    <span className="absolute inset-[34%] rounded-full" style={{ background: st.label }} />
                  </div>
                  <span className="absolute bottom-2 left-2 right-1/3 font-display text-sm leading-tight" style={{ color: st.ink === '#0c0a09' ? '#fef3c7' : st.ink }}>{r.title}</span>
                </div>
              )
              return view === 'grid' ? (
                <article key={r.id} className="group">
                  <button onClick={() => onPlay(r)} className="block w-full transition group-hover:-translate-y-1" aria-label={`Play ${r.title}`}>{sleeve}</button>
                  <div className="mt-2 flex items-start justify-between gap-1">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold">{r.title}</p><p className="truncate text-xs text-muted">for {r.recipient} · {r.occasion}</p></div>
                    <button onClick={() => toggleFav(r)} aria-label="Favorite" className={`p-1 ${r.favorite ? 'text-amber-bright' : 'text-muted/50'}`}>♥</button>
                  </div>
                  <div className="mt-1 flex items-center gap-2"><span className="rounded-full border border-brass/30 px-2 py-0.5 text-[10px] text-muted">{pr.name}</span><span className="font-mono text-[10px] text-muted">{fmt(r.duration)}</span></div>
                </article>
              ) : (
                <article key={r.id} className="flex items-center gap-3 rounded-xl border border-brass/15 bg-panel p-2 pr-3">
                  <button onClick={() => onPlay(r)} className="w-14 shrink-0" aria-label={`Play ${r.title}`}>{sleeve}</button>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{r.title}</p><p className="truncate text-xs text-muted">{r.recipient} · {pr.name} · <span className="font-mono">{fmt(r.duration)}</span></p></div>
                  <button onClick={() => toggleFav(r)} aria-label="Favorite" className={r.favorite ? 'text-amber-bright' : 'text-muted/50'}>♥</button>
                  <button onClick={() => setConfirm(r)} aria-label="Delete" className="text-xs text-muted hover:text-err">Delete</button>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {confirm && (
        <div className="absolute inset-0 z-20 flex items-end bg-obsidian/70 backdrop-blur-sm" role="dialog" aria-modal>
          <div className="w-full rounded-t-3xl border-t border-brass/30 bg-stone p-6">
            <h3 className="font-display text-2xl">Delete “{confirm.title}”?</h3>
            <p className="mt-2 text-sm text-muted">The master and its artwork will be removed from this device. This can’t be undone without a backup.</p>
            <div className="mt-6 flex gap-2"><Btn variant="ghost" className="flex-1" onClick={() => setConfirm(null)}>Keep it</Btn><Btn className="flex-1 !bg-err" onClick={async () => { await db.del(confirm.id); setConfirm(null); refresh() }}>Delete</Btn></div>
          </div>
        </div>
      )}
    </div>
  )
}
