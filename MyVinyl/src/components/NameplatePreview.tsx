import { openPaywall } from '../lib/pro'
import { ProBadge } from './Paywall'

const GOLD = 'linear-gradient(180deg,#fff1c1,#f5c451 50%,#d4952a)'
const goldText = { backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 6px rgba(245,182,56,.55))' } as const

/** The gold plinth nameplate drawn the same way the 3D texture is (FROM · deco divider · TO), for previewing before Pro. */
export function Nameplate({ from, to, className = '' }: { from: string; to: string; className?: string }) {
  return (
    <div className={`relative aspect-[320/600] rounded-[12px] border-[3px] border-[#c9963e] bg-[linear-gradient(180deg,#1d1611,#0e0b08)] shadow-[0_0_28px_-6px_rgba(255,195,90,.6),inset_0_0_18px_rgba(0,0,0,.6)] ${className}`}>
      <div className="absolute inset-[6px] rounded-[7px] border border-[#c9963e]/55" />
      <div className="relative flex h-full flex-col items-center justify-evenly px-2 py-4 text-center">
        <div>
          <p className="font-deco text-[12px] font-semibold tracking-[.4em]" style={goldText}>FROM</p>
          <p className="mt-1 max-w-full truncate font-display text-xl italic" style={goldText}>{from || 'Someone'}</p>
        </div>
        <svg viewBox="0 0 200 28" className="w-4/5" aria-hidden><defs><linearGradient id="np-g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff1c1" /><stop offset="1" stopColor="#d4952a" /></linearGradient></defs><path d="M10 14h70M120 14h70" stroke="url(#np-g)" strokeWidth="2" /><path d="M100 2l12 12-12 12-12-12z" fill="url(#np-g)" /></svg>
        <div>
          <p className="font-deco text-[12px] font-semibold tracking-[.4em]" style={goldText}>TO</p>
          <p className="mt-1 max-w-full truncate font-display text-xl italic" style={goldText}>{to || 'You'}</p>
        </div>
      </div>
    </div>
  )
}

/** Sheet shown to free users: what their nameplate would look like on the plinth, then the unlock button. */
export default function NameplatePreview({ from, to, onClose }: { from: string; to: string; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/70 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal aria-label="Gold nameplate preview">
      <div className="w-full rounded-t-[28px] border-t border-brass/40 bg-stone px-6 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-cream/25" />
        <div className="flex items-center justify-between">
          <p className="deco text-[12px] text-amber-bright">Preview</p>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-cream">✕</button>
        </div>
        <h2 className="font-display text-2xl leading-tight">Their names, in glowing gold</h2>

        {/* brushed plinth corner with the plate set into it */}
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-brass/25 bg-[linear-gradient(115deg,#3a3f52,#8b90a8_45%,#4b4f63_70%,#2b2e3b)] p-6">
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.04)_0_1px,transparent_1px_3px)]" />
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[radial-gradient(rgba(255,195,90,.45),transparent_70%)]" />
          <Nameplate from={from} to={to} className="relative mx-auto w-28" />
        </div>
        <p className="mt-3 text-center text-xs text-muted">Engraved on the turntable plinth for this record, and in every video you export.</p>

        <button type="button" onClick={() => { onClose(); openPaywall('Engrave their names in glowing gold on the turntable plinth with Vynyl Pro.') }}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#f0c86a] via-[#c99234] to-[#8a5a1a] font-deco text-sm uppercase tracking-[0.2em] text-obsidian shadow-[0_8px_24px_-10px_rgba(245,158,11,.9)] active:scale-[.98]">
          Unlock with Pro <ProBadge className="!border-obsidian/40 !bg-obsidian/15 !text-obsidian !shadow-none" />
        </button>
      </div>
    </div>
  )
}
