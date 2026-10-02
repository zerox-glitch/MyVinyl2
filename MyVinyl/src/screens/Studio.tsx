import { useEffect, useRef, useState } from 'react'
import { Btn, Eyebrow, Meter, Wave, fmt } from '../components/ui'
import { CRACKLES, MOODS, OCCASIONS, PRESETS, STYLES } from '../lib/presets'
import { MUSIC, musicBed } from '../lib/music'
import { SR, decodeToMono, demoSources, demoVoice, encodeWav, renderMaster, waveform } from '../lib/dsp'
import { db, type StoredRecord } from '../lib/db'
import Turntable from '../components/Turntable'
import { ProBadge, ProButton } from '../components/Paywall'
import { FREE, PRO_SECONDS, isFree, openPaywall, usePro, type Gate } from '../lib/pro'

const STEPS = ['Capture', 'Dedication', 'Character', 'Appearance', 'Press']

export default function Studio({ onDone, recordCount }: { onDone: (r: StoredRecord) => void; recordCount: number }) {
  const pro = usePro().pro
  const locked = (kind: Gate, id: string) => !pro && !isFree(kind, id)
  const gate = (kind: Gate, id: string, name: string, fn: () => void) => (locked(kind, id) ? openPaywall(`${name} is part of Vynyl Pro. Unlock it — and every other sound — below.`) : fn())
  const [step, setStep] = useState(0)
  const [source, setSource] = useState<Float32Array | null>(null)
  const [meta, setMeta] = useState({ title: 'The Porch Song', recipient: 'Nana Ruth', sender: 'Theo', dedication: 'For every summer evening you hummed this to me.', occasion: 'Grandparents', date: new Date().toISOString().slice(0, 10), sideA: 'Side A', sideB: 'Side B' })
  const [presetId, setPreset] = useState('warm')
  const [styleId, setStyle] = useState('ruby')
  const [crackleId, setCrackle] = useState('preset')
  const [music, setMusic] = useState('hearth')
  const [musicLevel, setMusicLevel] = useState(0.35)
  const [crackleLevel, setCrackleLevel] = useState(1)
  const [character, setCharacter] = useState(1)
  const [volume, setVolume] = useState(1)
  const [moodId, setMood] = useState<string | null>(null)
  const [withVoice, setWithVoice] = useState(false)
  const hasVoice = !!source && !demoSources.has(source)
  const preview = usePreview(withVoice && hasVoice ? source : null)
  useEffect(() => { if (step !== 2) preview.stop() }, [step])
  useEffect(() => { preview.apply({ musicLevel, crackleLevel, character, volume }) }, [musicLevel, crackleLevel, character, volume])
  const listen = (key: string, over: { presetId?: string; crackleId?: string; music?: string; musicLevel?: number }) =>
    preview.toggle(key, { presetId: over.presetId ?? presetId, crackleId: over.crackleId ?? crackleId, music: over.music ?? music, musicLevel: over.musicLevel ?? musicLevel, crackleLevel, character, volume })
  const applyMood = (id: string) => {
    const m = MOODS.find((x) => x.id === id)!
    setMood(id); setPreset(m.presetId); setCrackle(m.crackleId); setMusic(m.musicId); setMusicLevel(m.musicLevel); navigator.vibrate?.(8)
  }
  const [render, setRender] = useState<{ p: number; stage: string } | null>(null)
  const style = STYLES.find((s) => s.id === styleId)!

  return (
    <div className="flex h-full flex-col">
      <header className="px-6 pt-4">
        <div className="flex items-center justify-between gap-3"><Eyebrow>Studio · {STEPS[step]}</Eyebrow><ProButton /></div>
        <div className="mt-3 flex gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemax={5}>
          {STEPS.map((s, i) => <span key={s} className={`h-0.5 flex-1 rounded-full ${i <= step ? 'bg-amber' : 'bg-cream/10'}`} />)}
        </div>
      </header>
      <div className="no-scrollbar relative flex-1 overflow-y-auto bg-[radial-gradient(120%_60%_at_50%_0%,rgba(217,119,6,.10),transparent_60%)] px-6 pb-8 pt-6">
        {step === 0 && <Capture source={source} setSource={setSource} max={pro ? PRO_SECONDS : FREE.maxSeconds} pro={pro} />}
        {step === 1 && <Dedication meta={meta} setMeta={setMeta} />}
        {step === 2 && (
          <div className="space-y-7">
            <div>
              <h2 className="font-display text-[34px] leading-[1.05] tracking-tight">How should it <em className="text-amber-bright">sound?</em></h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Tap ▶ to hear just the crackle and music{withVoice && hasVoice ? ', with your recording on top' : ''}.</p>
              {hasVoice && (
                <button type="button" role="switch" aria-checked={withVoice} onClick={() => { preview.stop(); setWithVoice((v) => !v) }}
                  className="mt-3 flex min-h-11 items-center gap-3 rounded-full border border-brass/30 bg-panel py-1.5 pl-1.5 pr-4 text-xs text-cream">
                  <span className={`relative h-6 w-11 rounded-full transition ${withVoice ? 'bg-amber' : 'bg-cream/15'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream shadow transition-all ${withVoice ? 'left-[22px]' : 'left-0.5'}`} /></span>
                  Include my recording in previews
                </button>
              )}
            </div>

            <section aria-labelledby="moods-h">
              <SectionTitle id="moods-h" n="I">Moods</SectionTitle>
              <p className="mb-3 -mt-1 text-[12px] leading-relaxed text-muted"><span className="text-cream">Choose a ready-made mood</span> — one tap sets the character, crackle and music for you. <span className="text-cream">Or make your own</span> by picking each one in the sections below.</p>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <LevelBar label="Overall volume" value={volume} max={1} onChange={setVolume} />
                <LevelBar label="Music volume" value={musicLevel} max={1} onChange={setMusicLevel} ends={['Off', 'Full']} />
              </div>
              <div className="no-scrollbar -mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-1">
                {MOODS.map((m) => (
                  <div key={m.id} className={`relative w-44 shrink-0 snap-start rounded-2xl border p-3.5 transition ${moodId === m.id ? 'border-amber bg-[linear-gradient(160deg,rgba(217,119,6,.22),rgba(217,119,6,.04))] shadow-[0_14px_30px_-20px_rgba(217,119,6,.9)]' : 'border-brass/20 bg-panel'}`}>
                    <button type="button" onClick={() => gate('mood', m.id, m.name, () => applyMood(m.id))} aria-pressed={moodId === m.id} className="block w-full pr-8 text-left">
                      {locked('mood', m.id) && <ProBadge className="mb-1.5" />}
                      <span className="block font-display text-[17px] leading-tight">{m.name}</span>
                      <span className="mt-1.5 block text-[11px] leading-snug text-muted">{m.blurb}</span>
                    </button>
                    <Listen className="absolute right-2.5 top-2.5" state={preview.state('mood:' + m.id)} label={`Preview ${m.name}`}
                      onClick={() => listen('mood:' + m.id, { presetId: m.presetId, crackleId: m.crackleId, music: m.musicId, musicLevel: m.musicLevel })} />
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="char-h" className="space-y-3">
              <div className="flex items-center gap-3 pt-1 text-[11px] text-muted" aria-hidden="true"><span className="h-px flex-1 bg-brass/25" /><span className="deco text-[10px] text-amber-bright/80">Or customise your own</span><span className="h-px flex-1 bg-brass/25" /></div>
              <SectionTitle id="char-h" n="II">Character</SectionTitle>
              <LevelBar label="Character strength" value={character} max={1.5} onChange={setCharacter} ends={['Clean', 'Heavy']} locked={!pro} />
              {PRESETS.map((p, i) => (
                <div key={p.id} className={`relative rounded-2xl border transition ${presetId === p.id ? 'border-amber bg-[linear-gradient(135deg,rgba(217,119,6,.18),rgba(217,119,6,.04))] shadow-[0_16px_40px_-24px_rgba(217,119,6,.8)]' : 'border-brass/20 bg-panel hover:border-brass/50'}`}>
                  <button type="button" onClick={() => gate('preset', p.id, p.name, () => { setPreset(p.id); setMood(null); navigator.vibrate?.(8) })} aria-pressed={presetId === p.id} className="block w-full p-4 pr-16 text-left">
                    <span className="flex items-baseline gap-2 font-display text-xl"><span className="font-mono text-[11px] text-amber-bright/80">{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'][i]}</span>{p.name}{locked('preset', p.id) && <ProBadge className="self-center" />}</span>
                    <p className="mb-3 mt-1 text-[13px] text-muted">{p.blurb}</p>
                    <div className="space-y-1"><Meter n={p.warmth} label="Warmth" /><Meter n={p.age} label="Age" /><Meter n={p.texture} label="Texture" /></div>
                  </button>
                  <Listen className="absolute right-3 top-3" state={preview.state('preset:' + p.id)} label={`Preview ${p.name}`} onClick={() => listen('preset:' + p.id, { presetId: p.id })} />
                </div>
              ))}
            </section>

            <section aria-labelledby="crackle-h">
              <SectionTitle id="crackle-h" n="III">Crackle</SectionTitle>
              <p className="-mt-1 mb-3 text-[12px] text-muted">Every surface has its own voice. The strip shows how it falls across the groove.</p>
              <LevelBar label="Crackle volume" value={crackleLevel} max={2} onChange={setCrackleLevel} ends={['Off', 'Loud']} className="mb-3" locked={!pro} />
              <div className="grid grid-cols-2 gap-2.5">
                {CRACKLES.map((c) => {
                  const on = crackleId === c.id
                  // deterministic groove signature drawn from the crackle's character
                  let seed = [...c.id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0
                  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
                  const ticks = Array.from({ length: Math.round(c.density * 3.2) }, () => ({ x: rnd() * 120, h: 2 + rnd() * 7 * Math.min(c.amp, 1.4), w: 0.6 + c.len * 0.5 }))
                  const pops = Array.from({ length: Math.round(c.pops * 0.9) }, () => ({ x: 4 + rnd() * 112, h: 9 + rnd() * 4 }))
                  const hiss = Math.max(0, Math.min(1, (c.hissDb + 30) / 36))
                  const level = c.id === 'silent' ? 0 : Math.min(5, Math.max(1, Math.round((c.density * c.amp) / 2.4 + c.pops / 2.2 + hiss)))
                  return (
                    <div key={c.id} className={`group relative overflow-hidden rounded-xl border transition duration-300 ${on ? 'border-amber bg-gradient-to-b from-amber/15 to-amber/[0.04] shadow-[0_0_0_1px_rgba(245,158,11,.25),0_12px_28px_-14px_rgba(217,119,6,.55)]' : 'border-brass/20 bg-panel hover:border-brass/50'}`}>
                      <button type="button" onClick={() => gate('crackle', c.id, c.name, () => { setCrackle(c.id); setMood(null); navigator.vibrate?.(6) })} aria-pressed={on} className="block w-full p-3 pr-11 text-left">
                        {locked('crackle', c.id) && <ProBadge className="mb-1" />}
                        <span className={`block font-display text-[15px] leading-tight ${on ? 'text-amber-bright' : 'text-cream'}`}>{c.name}</span>
                        <span className="mt-1 block min-h-[30px] text-[11px] leading-snug text-muted">{c.blurb}</span>
                        <span className={`mt-2.5 block rounded-md border px-1.5 py-1 ${on ? 'border-amber/40 bg-obsidian/70' : 'border-brass/15 bg-obsidian/50'}`}>
                          <svg viewBox="0 0 120 26" className="block h-[26px] w-full" aria-hidden="true">
                            <line x1="0" y1="13" x2="120" y2="13" stroke="currentColor" strokeWidth={0.6 + hiss * 1.6} className="text-brass" opacity={0.15 + hiss * 0.35} strokeDasharray={c.hissTone < 0.8 ? '3 1.5' : c.hissTone > 1.05 ? '0.8 0.8' : undefined} />
                            {ticks.map((t, k) => <rect key={k} x={t.x} y={13 - t.h / 2} width={t.w} height={t.h} rx={t.w / 2} className={on ? 'fill-amber-bright' : 'fill-cream/55'} opacity={0.45 + (k % 3) * 0.2} />)}
                            {pops.map((t, k) => <rect key={'p' + k} x={t.x} y={13 - t.h} width="1.6" height={t.h * 2} rx="0.8" className={on ? 'fill-amber' : 'fill-ruby'} />)}
                            {c.id === 'silent' && <text x="60" y="16.5" textAnchor="middle" className="fill-muted font-mono text-[8px] tracking-[0.3em]">HUSH</text>}
                          </svg>
                        </span>
                        <span className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                          <span>{level === 0 ? 'None' : ['Whisper', 'Gentle', 'Present', 'Rich', 'Heavy'][level - 1]}</span>
                          <span className="flex gap-[3px]">{[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= level ? (on ? 'bg-amber-bright shadow-[0_0_6px_rgba(251,191,36,.8)]' : 'bg-brass') : 'bg-brass/20'}`} />)}</span>
                        </span>
                      </button>
                      <Listen small className="absolute right-2 top-2" state={preview.state('crackle:' + c.id)} label={`Preview ${c.name} crackle`} onClick={() => listen('crackle:' + c.id, { crackleId: c.id })} />
                    </div>
                  )
                })}
              </div>
            </section>

            <section aria-labelledby="music-h">
              <SectionTitle id="music-h" n="IV">Background music</SectionTitle>
              <div className="overflow-hidden rounded-2xl border border-brass/20 bg-panel">
                {MUSIC.map((m, i) => (
                  <div key={m.id} className={`relative flex items-center ${i ? 'border-t border-brass/10' : ''} ${music === m.id ? 'bg-amber/10' : ''}`}>
                    <button type="button" onClick={() => gate('music', m.id, m.name, () => { setMusic(m.id); setMood(null) })} aria-pressed={music === m.id} className="flex min-h-14 flex-1 items-center gap-3 px-4 py-2.5 text-left">
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${music === m.id ? 'border-amber-bright' : 'border-brass/40'}`}>{music === m.id && <span className="h-2 w-2 rounded-full bg-amber-bright" />}</span>
                      <span className="min-w-0"><span className="flex items-center gap-1.5 text-[13px] font-medium text-cream">{m.name}{locked('music', m.id) && <ProBadge />}{m.romantic && <span className="rounded-full bg-ruby/30 px-1.5 py-px text-[9px] font-normal uppercase tracking-wider text-[#fca5a5]">♥ Romantic</span>}</span><span className="block truncate text-[11px] text-muted">{m.blurb}</span></span>
                    </button>
                    {m.id !== 'none' && <Listen small className="mr-3 shrink-0" state={preview.state('music:' + m.id)} label={`Preview ${m.name}`} onClick={() => listen('music:' + m.id, { music: m.id })} />}
                  </div>
                ))}
              </div>
              {music !== 'none' && <LevelBar label="Music volume" value={musicLevel} max={1} onChange={setMusicLevel} className="mt-3" />}
            </section>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="font-display text-[34px] leading-[1.05] tracking-tight">Choose the <em className="text-amber-bright">wax.</em></h2>
            <div className="relative -mx-6 my-2 h-64"><Turntable className="absolute inset-0" style={style} label={{ title: meta.title, recipient: meta.recipient, side: meta.sideA, date: meta.date }} engaged={false} progress={0} /></div>
            <div className="grid grid-cols-5 gap-2">
              {STYLES.map((s) => (
                <button key={s.id} onClick={() => gate('style', s.id, s.name, () => setStyle(s.id))} aria-label={locked('style', s.id) ? `${s.name} (Pro)` : s.name} aria-pressed={styleId === s.id}
                  className={`relative aspect-square rounded-full border-2 p-1 transition ${styleId === s.id ? 'border-amber-bright scale-105' : 'border-transparent'}`}>
                  <span className="grid h-full place-items-center rounded-full" style={{ background: `repeating-radial-gradient(${s.disc} 0 2px, color-mix(in srgb, ${s.disc} 80%, white) 3px)` }}>
                    <span className="h-1/3 w-1/3 rounded-full" style={{ background: s.label }} />
                  </span>
                  {locked('style', s.id) && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 scale-90"><ProBadge /></span>}
                </button>
              ))}
            </div>
            <p className="mt-4 text-center font-display text-xl italic">{style.name}</p>
          </div>
        )}
        {step === 4 && (
          <div className="flex flex-col items-center pt-6 text-center">
            <div className={`relative grid h-52 w-52 place-items-center rounded-full shadow-[0_30px_60px_-20px_black,0_0_0_6px_rgba(180,83,9,.25),0_0_60px_-10px_rgba(217,119,6,.35)] ${render ? 'animate-spin [animation-duration:1.8s]' : ''}`} style={{ background: `repeating-radial-gradient(${style.disc} 0 2px, #2a2522 3px 4px)` }}>
              <span className="grid h-16 w-16 place-items-center rounded-full font-display text-xs" style={{ background: style.label, color: style.ink }}>VR</span>
            </div>
            <h2 className="mt-8 font-display text-3xl">{render ? 'Pressing your record' : 'Ready to press.'}</h2>
            <p className="mt-2 text-sm text-muted">{render ? render.stage : `${PRESETS.find((p) => p.id === presetId)!.name} · ${CRACKLES.find((c) => c.id === crackleId)!.name} · ${MUSIC.find((m) => m.id === music)!.name} · ${style.name}. Every crackle is computed on this device.`}</p>
            {render && <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-cream/10"><div className="h-full bg-amber transition-[width]" style={{ width: `${render.p * 100}%` }} /></div>}
            {render && <p className="mt-2 font-mono text-xs text-muted">{Math.round(render.p * 100)}%</p>}
          </div>
        )}
      </div>
      <footer className="flex items-center justify-between border-t border-brass/15 px-6 py-3">
        <Btn variant="quiet" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || !!render}>Back</Btn>
        {step < 4 ? (
          <Btn onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !source}>Continue</Btn>
        ) : (
          <Btn disabled={!!render || !source} onClick={async () => {
            if (!pro && recordCount >= FREE.maxRecords) return openPaywall(`Your free shelf holds ${FREE.maxRecords} records and it’s full. Go Pro for unlimited records.`)
            if (locked('preset', presetId) || locked('crackle', crackleId) || locked('music', music) || locked('style', styleId)) return openPaywall('This record uses Pro sounds or wax. Go Pro to press it, or pick free options.')
            const id = crypto.randomUUID(), preset = PRESETS.find((p) => p.id === presetId)!
            preview.stop(); setRender({ p: 0, stage: 'Preparing source' })
            const [l, r] = await renderMaster(source!, { preset, crackle: CRACKLES.find((c) => c.id === crackleId), seed: id, music: musicBed(music), musicLevel, crackleLevel, character, volume, onProgress: (p, stage) => setRender({ p: p * 0.9, stage }) })
            setRender({ p: 0.94, stage: 'Encoding' }); await new Promise((r) => setTimeout(r, 30))
            const master = encodeWav(l, r)
            setRender({ p: 0.98, stage: 'Generating waveform' })
            const rec: StoredRecord = { id, ...meta, presetId, crackleId, musicId: music, styleId, duration: l.length / SR, wave: waveform(l), createdAt: Date.now(), favorite: false, master }
            await db.put(rec); navigator.vibrate?.([10, 40, 20])
            setRender(null); setStep(0); setSource(null); onDone(rec)
          }}>Press record</Btn>
        )}
      </footer>
    </div>
  )
}

function Capture({ source, setSource, max: MAX, pro }: { source: Float32Array | null; setSource: (s: Float32Array | null) => void; max: number; pro: boolean }) {
  const [trimmed, setTrimmed] = useState(false)
  const [state, setState] = useState<'idle' | 'rec' | 'paused' | 'denied'>('idle')
  const [t, setT] = useState(0)
  const [level, setLevel] = useState(0)
  const [live, setLive] = useState<number[]>([])
  const mr = useRef<MediaRecorder | null>(null)
  const raf = useRef(0)
  const previewUrl = useRef<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [srcName, setSrcName] = useState<string | null>(null)
  const player = useRef<HTMLAudioElement>(null)
  const [pl, setPl] = useState({ on: false, t: 0 })

  useEffect(() => () => { cancelAnimationFrame(raf.current); mr.current?.stream.getTracks().forEach((t) => t.stop()) }, [])
  useEffect(() => {
    if (!source) return setUrl(null)
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = URL.createObjectURL(encodeWav(source, source)); setUrl(previewUrl.current); setPl({ on: false, t: 0 })
  }, [source])

  const start = async () => {
    let stream: MediaStream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { return setState('denied') }
    const ctx = new AudioContext(), an = ctx.createAnalyser(); an.fftSize = 1024
    ctx.createMediaStreamSource(stream).connect(an)
    const buf = new Float32Array(an.fftSize), chunks: Blob[] = []
    const rec = new MediaRecorder(stream); mr.current = rec
    rec.ondataavailable = (e) => chunks.push(e.data)
    rec.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); ctx.close(); setSource(await decodeToMono(new Blob(chunks, { type: rec.mimeType }))); setSrcName(`Microphone take · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`); setState('idle') }
    rec.start(250); setState('rec'); setLive([]); setT(0); navigator.vibrate?.(12)
    let lastT = performance.now()
    const loop = (now: number) => {
      raf.current = requestAnimationFrame(loop)
      if (rec.state === 'recording') {
        an.getFloatTimeDomainData(buf); let pk = 0
        for (const v of buf) pk = Math.max(pk, Math.abs(v))
        setLevel(pk); setLive((l) => [...l.slice(-59), pk])
        setT((x) => { const nx = x + (now - lastT) / 1000; if (nx >= MAX) rec.stop(); return nx })
      }
      lastT = now
    }
    raf.current = requestAnimationFrame(loop)
  }
  const stop = () => { cancelAnimationFrame(raf.current); mr.current?.stop() }

  return (
    <div>
      <h2 className="font-display text-[36px] leading-[1.02] tracking-tight">A voice they can <em className="text-amber-bright">return to.</em></h2>
      <div className="mt-4 flex items-center gap-3" aria-hidden><span className="h-px w-8 bg-brass" /><span className="h-1.5 w-1.5 rotate-45 bg-amber" /><span className="h-px flex-1 bg-gradient-to-r from-brass/60 to-transparent" /></div>
      <p className="mt-4 text-sm leading-relaxed text-muted">Speak, sing, or hum. Up to {pro ? 'twenty minutes' : 'three minutes free'}, kept on this device.{!pro && <> <button type="button" onClick={() => openPaywall('Record for up to twenty minutes with Vynyl Pro.')} className="text-amber-bright underline decoration-amber/40 underline-offset-2">Twenty with Pro.</button></>}</p>

      <div className="relative mt-7 rounded-[28px] bg-gradient-to-b from-brass/60 via-brass/15 to-brass/40 p-px shadow-[0_24px_60px_-28px_rgba(217,119,6,.55)]">
      <div className="relative overflow-hidden rounded-[27px] bg-[linear-gradient(180deg,#2a241e,#16130f)] p-5">
        <span className="pointer-events-none absolute inset-2 rounded-[22px] border border-cream/[.06]" aria-hidden />
        <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[repeating-radial-gradient(circle,rgba(254,243,199,.05)_0_1px,transparent_1px_5px)]" aria-hidden />
        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-2 deco text-[10px] tracking-[.2em] text-muted">
            <span className={`h-2 w-2 rounded-full ${state === 'rec' ? 'animate-pulse bg-err shadow-[0_0_10px_#f87171]' : state === 'paused' ? 'bg-amber' : 'bg-cream/20'}`} />
            {state === 'rec' ? 'On air' : state === 'paused' ? 'Paused' : 'Standby'}
          </span>
          <span className="font-mono text-[11px] text-muted">max {fmt(MAX)}</span>
        </div>
        <div className="relative mt-3 text-center font-mono text-5xl font-medium tabular-nums tracking-tight text-cream">{fmt(t)}</div>
        <div className="relative mt-4 h-16 rounded-xl bg-black/25 px-2 py-1 ring-1 ring-inset ring-cream/5"><Wave data={live.length ? live.map((v) => Math.min(1, v * 2.5)) : Array(60).fill(0.05)} /></div>
        <div className="relative mt-3 flex gap-[3px]" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-[1px] transition-colors ${level * 24 > i ? (i > 20 ? 'bg-err' : i > 15 ? 'bg-amber-bright' : 'bg-amber') : 'bg-cream/[.07]'}`} />)}
        </div>
        <p className="relative mt-2 h-4 text-center text-[11px] text-muted" aria-live="polite">
          {state === 'denied' ? 'Microphone access was declined — import a file instead.' : level > 0.95 ? 'Too loud — step back a little.' : state === 'rec' && level < 0.02 && t > 2 ? 'We can barely hear you.' : state === 'rec' ? 'Listening…' : state === 'paused' ? 'Paused' : ''}
        </p>
        <div className="relative mt-5 flex items-center justify-center gap-5">
          {state === 'rec' || state === 'paused' ? (
            <>
              <Btn variant="ghost" onClick={() => { if (state === 'rec') { mr.current?.pause(); setState('paused') } else { mr.current?.resume(); setState('rec') } navigator.vibrate?.(8) }}>{state === 'rec' ? 'Pause' : 'Resume'}</Btn>
              <button onClick={stop} aria-label="Stop recording" className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-[#c9a24a] to-[#7a4a12] p-[3px] shadow-[0_10px_30px_-8px_rgba(153,27,27,.8)]">
                {state === 'rec' && <span className="absolute inset-0 animate-ping rounded-full bg-ruby/30" />}
                <span className="relative grid h-full w-full place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#c0392b,#7f1d1d)]"><span className="h-5 w-5 rounded-[3px] bg-cream" /></span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button onClick={start} aria-label={source ? 'Record again' : 'Start recording'} className="group grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-[#e0b85a] to-[#7a4a12] p-[3px] shadow-[0_12px_30px_-10px_rgba(217,119,6,.7)] transition active:scale-95">
                <span className="grid h-full w-full place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#c0392b,#7f1d1d)] shadow-[inset_0_2px_6px_rgba(0,0,0,.5)]"><span className="h-6 w-6 rounded-full bg-cream shadow-[0_0_14px_rgba(254,243,199,.5)] transition group-hover:scale-110" /></span>
              </button>
              <span className="deco text-[10px] tracking-[.2em] text-muted">{source ? 'Record again' : 'Tap to record'}</span>
              </div>
          )}
        </div>
      </div>
      </div>

      <div className="mt-6 flex items-center gap-3 deco text-[10px] tracking-[.2em] text-muted/70" aria-hidden><span className="h-px flex-1 bg-brass/20" />or<span className="h-px flex-1 bg-brass/20" /></div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-brass/40 bg-panel/60 text-sm transition hover:border-amber-bright hover:bg-panel">
          <span className="text-amber-bright" aria-hidden>↥</span>Import audio<input type="file" accept="audio/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const raw = await decodeToMono(f).catch(() => null), d = raw && raw.length > MAX * SR ? raw.slice(0, MAX * SR) : raw; setSource(d); setSrcName(d ? f.name : null); setTrimmed(!!raw && raw.length > MAX * SR) } e.target.value = '' }} />
        </label>
        <Btn variant="ghost" onClick={() => { setSource(demoVoice()); setSrcName('Lullaby · built-in demo') }}>Use a lullaby</Btn>
      </div>

      {trimmed && <p className="mt-3 text-center text-[11px] text-muted">This file was trimmed to {fmt(MAX)}.{!pro && <> <button type="button" onClick={() => openPaywall('Import and record up to twenty minutes with Vynyl Pro.')} className="text-amber-bright underline underline-offset-2">Keep up to 20 min with Pro</button></>}</p>}
      {source && url && (
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-brass/30 bg-[linear-gradient(135deg,#2a231c,#17140f)] p-4 shadow-[0_18px_40px_-26px_rgba(217,119,6,.7)]">
          <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[repeating-radial-gradient(circle,rgba(254,243,199,.06)_0_1px,transparent_1px_4px)]" aria-hidden />
          <div className="relative flex items-center gap-3">
            <button type="button" onClick={() => { const a = player.current; if (!a) return; a.paused ? void a.play() : a.pause() }} aria-label={pl.on ? 'Pause preview' : 'Play preview'}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#e0b85a] to-[#8a5a1a] text-obsidian shadow-[0_6px_16px_-6px_rgba(217,119,6,.8)] transition active:scale-95">
              {pl.on ? <span className="flex gap-1"><span className="h-4 w-1.5 rounded-sm bg-obsidian" /><span className="h-4 w-1.5 rounded-sm bg-obsidian" /></span> : <span className="ml-1 h-0 w-0 border-y-[8px] border-l-[13px] border-y-transparent border-l-obsidian" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 deco text-[10px] tracking-[.2em] text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok shadow-[0_0_8px_#34d399]" />Source captured</p>
              <p className="mt-0.5 truncate font-display text-lg leading-tight text-cream" title={srcName ?? 'Your recording'}>{srcName ?? 'Your recording'}</p>
            </div>
          </div>
          <div className="relative mt-4">
            <input type="range" min={0} max={source.length / SR} step={0.01} value={pl.t} aria-label="Preview position"
              onChange={(e) => { const a = player.current; if (a) a.currentTime = +e.target.value; setPl((p) => ({ ...p, t: +e.target.value })) }}
              className="h-1 w-full cursor-pointer appearance-none rounded-full accent-amber-bright"
              style={{ background: `linear-gradient(90deg,#f59e0b ${(pl.t / (source.length / SR)) * 100}%,rgba(254,243,199,.12) 0)` }} />
            <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted"><span>{fmt(pl.t)}</span><span>{fmt(source.length / SR)}</span></div>
          </div>
          <audio ref={player} src={url} className="hidden" onPlay={() => setPl((p) => ({ ...p, on: true }))} onPause={() => setPl((p) => ({ ...p, on: false }))}
            onEnded={() => setPl({ on: false, t: 0 })} onTimeUpdate={(e) => { const t = e.currentTarget.currentTime; setPl((p) => ({ ...p, t })) }} />
        </div>
      )}
    </div>
  )
}

function Dedication({ meta, setMeta }: { meta: Record<string, string>; setMeta: (fn: (m: any) => any) => void }) {
  const field = (k: string, label: string, ph = '') => (
    <label className="block">
      <span className="deco text-[10px] text-muted">{label}</span>
      <input value={meta[k]} placeholder={ph} onChange={(e) => setMeta((m: any) => ({ ...m, [k]: e.target.value }))}
        className="mt-1 w-full border-b border-brass/30 bg-transparent py-2 text-cream outline-none placeholder:text-muted/50 focus:border-amber-bright" />
    </label>
  )
  return (
    <div className="space-y-5">
      <h2 className="font-display text-[34px] leading-[1.05] tracking-tight">Who is this <em className="text-amber-bright">voice</em> for?</h2>
      {field('title', 'Memory title', 'The night we met')}
      <div className="grid grid-cols-2 gap-4">{field('recipient', 'For')}{field('sender', 'From')}</div>
      <div>
        <span className="deco text-[10px] text-muted">Occasion</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {OCCASIONS.map((o) => <button key={o} onClick={() => setMeta((m: any) => ({ ...m, occasion: o }))} className={`rounded-full border px-3.5 py-2 text-xs transition ${meta.occasion === o ? 'border-amber bg-amber/15 text-cream shadow-[0_0_16px_-4px_rgba(217,119,6,.6)]' : 'border-brass/25 text-muted hover:border-brass/60'}`}>{o}</button>)}
        </div>
      </div>
      <label className="block">
        <span className="deco text-[10px] text-muted">Dedication</span>
        <textarea rows={3} value={meta.dedication} onChange={(e) => setMeta((m: any) => ({ ...m, dedication: e.target.value }))} placeholder="What do you want them to remember?"
          className="mt-2 w-full resize-none rounded-2xl border border-brass/25 bg-[linear-gradient(180deg,#26211c,#1a1714)] p-4 font-display text-lg italic leading-snug outline-none focus:border-amber-bright" />
      </label>
      <div className="grid grid-cols-3 gap-4">{field('date', 'Date')}{field('sideA', 'Side A')}{field('sideB', 'Side B')}</div>
    </div>
  )
}

function SectionTitle({ id, n, children }: { id: string; n: string; children: string }) {
  return <h3 id={id} className="mb-3 flex items-center gap-2 deco text-[11px] tracking-[.2em] text-amber-bright"><span className="font-mono text-[10px] text-brass">{n}</span>{children}<span className="h-px flex-1 bg-gradient-to-r from-brass/40 to-transparent" /></h3>
}

type ListenState = 'idle' | 'loading' | 'playing'
function Listen({ state, onClick, label, small, className = '' }: { state: ListenState; onClick: () => void; label: string; small?: boolean; className?: string }) {
  const size = small ? 'h-8 w-8' : 'h-10 w-10'
  return (
    <button type="button" onClick={onClick} aria-label={state === 'playing' ? `Stop ${label.replace(/^Preview /, '')}` : label} aria-pressed={state === 'playing'}
      className={`grid ${size} place-items-center rounded-full border transition active:scale-90 ${state === 'idle' ? 'border-brass/40 bg-obsidian/60 text-amber-bright hover:border-amber-bright' : 'border-amber bg-amber text-obsidian shadow-[0_0_18px_-4px_#f59e0b]'} ${className}`}>
      {state === 'loading' ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-obsidian border-t-transparent" />
        : state === 'playing' ? <span className="flex h-3 items-end gap-[2px]">{[0, 1, 2].map((i) => <span key={i} className="w-[3px] animate-pulse rounded-sm bg-obsidian" style={{ height: `${[60, 100, 75][i]}%`, animationDelay: `${i * 0.15}s` }} />)}</span>
        : <span className={`ml-0.5 h-0 w-0 border-y-transparent border-l-current ${small ? 'border-y-[5px] border-l-[8px]' : 'border-y-[6px] border-l-[10px]'}`} />}
    </button>
  )
}

type Levels = { musicLevel: number; crackleLevel: number; character: number; volume: number }

/**
 * Renders a short clip through the real vinyl pipeline as separate stems (voice and music at
 * clean and heavy character, plus crackle) and mixes them live, so the level bars respond in real time.
 */
function usePreview(source: Float32Array | null) {
  const [active, setActive] = useState<{ key: string; loading: boolean } | null>(null)
  const ctx = useRef<AudioContext | null>(null), nodes = useRef<AudioBufferSourceNode[]>([]), token = useRef(0)
  const gains = useRef<{ v0: GainNode; v1: GainNode; m0: GainNode; m1: GainNode; c: GainNode; out: GainNode; norm: number } | null>(null)
  const stop = () => { token.current++; nodes.current.forEach((n) => { try { n.stop() } catch { /* already stopped */ } }); nodes.current = []; gains.current = null; setActive(null) }
  useEffect(() => () => { stop(); ctx.current?.close() }, [])
  const apply = (lv: Levels, now = false) => {
    const g = gains.current, c = ctx.current
    if (!g || !c) return
    const w = Math.max(0, Math.min(1.5, lv.character)) / 1.5, t = c.currentTime
    const set = (n: GainNode, v: number) => (now ? n.gain.setValueAtTime(v, t) : n.gain.setTargetAtTime(v, t, 0.04))
    set(g.v0, 1 - w); set(g.v1, w); set(g.m0, (1 - w) * lv.musicLevel); set(g.m1, w * lv.musicLevel)
    set(g.c, lv.crackleLevel); set(g.out, g.norm * lv.volume)
  }
  const toggle = async (key: string, o: { presetId: string; crackleId: string; music: string } & Levels) => {
    if (active?.key === key) return stop()
    stop(); const my = token.current
    setActive({ key, loading: true })
    ctx.current ??= new AudioContext()
    const ac = ctx.current
    void ac.resume()
    // no recording yet → preview only the wax and music, no stand-in melody
    const voice = source && !demoSources.has(source) ? source : null
    const clip = voice ? voice.subarray(0, Math.min(voice.length, SR * 7)) : new Float32Array(SR * 7)
    const silent = new Float32Array(clip.length), bed = musicBed(o.music)
    const base = { preset: PRESETS.find((p) => p.id === o.presetId)!, crackle: CRACKLES.find((c) => c.id === o.crackleId), seed: 'preview:' + key, intro: 0.6, tail: 0.6, fixedGain: 1 }
    const stem = (src: Float32Array, character: number, music: boolean, crackle: boolean) =>
      renderMaster(src, { ...base, character, music: music ? bed : null, musicLevel: music ? 1 : 0, crackleLevel: crackle ? 1 : 0 })
    const v0 = voice ? await stem(clip, 0, false, false) : null
    const v1 = voice ? await stem(clip, 1.5, false, false) : null
    const m0 = bed ? await stem(silent, 0, true, false) : null
    const m1 = bed ? await stem(silent, 1.5, true, false) : null
    const cr = await stem(silent, 1, false, true)
    if (my !== token.current) return
    // normalise against the mix at its default levels so the bars move around a sensible loudness
    let peak = 1e-6
    const len = cr[0].length
    for (let i = 0; i < len; i += 4) for (let ch = 0; ch < 2; ch++) {
      const x = (v0 ? (v0[ch][i] + v1![ch][i]) / 2 : 0) + (m0 ? ((m0[ch][i] + m1![ch][i]) / 2) * o.musicLevel : 0) + cr[ch][i] * o.crackleLevel
      peak = Math.max(peak, Math.abs(x))
    }
    const out = ac.createGain(); out.connect(ac.destination)
    const mk = () => { const g = ac.createGain(); g.connect(out); return g }
    gains.current = { v0: mk(), v1: mk(), m0: mk(), m1: mk(), c: mk(), out, norm: Math.min(0.891 / peak, voice ? 8 : 2.5) }
    apply(o, true)
    const at = ac.currentTime + 0.05
    const play = (st: Float32Array[] | null, g: GainNode) => {
      if (!st) return
      const buf = ac.createBuffer(2, st[0].length, SR); buf.getChannelData(0).set(st[0]); buf.getChannelData(1).set(st[1])
      const n = ac.createBufferSource(); n.buffer = buf; n.loop = true; n.connect(g); n.start(at); nodes.current.push(n)
    }
    const g = gains.current
    play(v0, g.v0); play(v1, g.v1); play(m0, g.m0); play(m1, g.m1); play(cr, g.c)
    setActive({ key, loading: false })
  }
  const state = (key: string): ListenState => (active?.key !== key ? 'idle' : active.loading ? 'loading' : 'playing')
  return { toggle, stop, state, apply }
}

function LevelBar({ label, value, max, onChange, ends = ['Soft', 'Full'], className = '', locked = false }: { label: string; value: number; max: number; onChange: (v: number) => void; ends?: [string, string]; className?: string; locked?: boolean }) {
  const pct = (value / max) * 100
  return (
    <label className={`relative block rounded-xl border border-brass/20 bg-panel/70 px-3.5 py-2.5 ${className}`}>
      {locked && <button type="button" onClick={() => openPaywall(`${label} control is part of Vynyl Pro.`)} aria-label={`${label} — unlock with Pro`} className="absolute inset-0 z-10 rounded-xl" />}
      <span className="flex items-baseline justify-between">
        <span className="flex items-center gap-1.5 deco text-[10px] text-cream/80">{label}{locked && <ProBadge />}</span>
        <span className="font-mono text-[11px] text-amber-bright">{Math.round(pct)}%</span>
      </span>
      <input type="range" min={0} max={max} step={0.01} value={value} onChange={(e) => onChange(+e.target.value)} aria-label={label} disabled={locked}
        className="mt-2 disabled:opacity-40 h-1.5 w-full cursor-pointer appearance-none rounded-full accent-amber [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-bright [&::-webkit-slider-thumb]:bg-obsidian [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(251,191,36,.6)]"
        style={{ background: `linear-gradient(90deg, var(--color-amber-bright) ${pct}%, rgba(254,243,199,.12) ${pct}%)` }} />
      <span className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted"><span>{ends[0]}</span><span>{ends[1]}</span></span>
    </label>
  )
}
