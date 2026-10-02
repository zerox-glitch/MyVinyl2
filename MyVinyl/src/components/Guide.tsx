import { useState } from 'react'
import { CRACKLES, MOODS, PRESETS, STYLES } from '../lib/presets'
import { MUSIC } from '../lib/music'

type Item = { name: string; text: string }
type Section = { id: string; title: string; intro: string; tip?: string; items?: Item[] }

/** Plain-language help for everyone — big type, short sentences, no jargon. Same wording as android Guide.kt. */
export const GUIDE: Section[] = [
  { id: 'steps', title: 'Making a record, step by step', intro: 'There are five simple steps. You can go back to any of them using the Back button at the bottom.', items: [
    { name: '1. Capture', text: 'Tap the big gold button and speak. Tap it again to stop. You can also choose a recording already on your device.' },
    { name: '2. Dedication', text: 'Write who the record is for, who it is from, and a short message. These words are printed on the record label.' },
    { name: '3. Character', text: 'Choose how your record sounds — the mood, the sound style, the crackle and the background music.' },
    { name: '4. Appearance', text: 'Choose the colour of your record.' },
    { name: '5. Press', text: 'Tap Press and wait a few seconds. Your record is made and saved on your shelf.' },
  ] },
  { id: 'moods', title: 'Moods — the easy choice', intro: 'A mood is a ready-made recipe. One tap chooses the sound style, the crackle and the music for you, all at once. If you are not sure what to pick, just choose a mood.', tip: 'Tap ▶ on any mood to hear it before you choose.', items: MOODS.map((m) => ({ name: m.name, text: m.blurb })) },
  { id: 'style', title: 'Sound style', intro: 'This changes how your voice sounds. Some styles keep your voice clear and modern. Others make it sound old — like a family record from long ago, or a radio broadcast.', tip: 'The little bars show Warmth (how soft and cosy), Age (how old it sounds) and Texture (how much grain and noise).', items: PRESETS.map((p) => ({ name: p.name, text: p.blurb })) },
  { id: 'crackle', title: 'Crackle', intro: 'Real records make small ticks, pops and a soft hiss as they spin. This is called crackle. It makes your record feel real and old-fashioned.', tip: 'Want no crackle at all? Choose “Silent Surface”.', items: CRACKLES.map((c) => ({ name: c.name, text: c.blurb })) },
  { id: 'music', title: 'Background music', intro: 'Soft music that plays quietly underneath your voice. Your voice always stays on top, so it is easy to hear.', tip: 'Want only your voice? Choose “No background”. Music marked ♥ is extra romantic.', items: MUSIC.map((m) => ({ name: m.romantic ? `♥ ${m.name}` : m.name, text: m.blurb })) },
  { id: 'sliders', title: 'The sliders', intro: 'Slide left for less, right for more.', items: [
    { name: 'Overall volume', text: 'How loud the whole record is.' },
    { name: 'Music volume', text: 'How loud the background music is. Slide all the way left to turn it off.' },
    { name: 'Character strength', text: 'How strong the sound style is. Left is clean, right is very old-sounding.' },
    { name: 'Crackle volume', text: 'How loud the ticks and hiss are. Slide all the way left to turn them off.' },
  ] },
  { id: 'colour', title: 'Record colour', intro: 'In the Appearance step you choose the colour of the vinyl and its label. It does not change the sound — only the look.', items: STYLES.map((s) => ({ name: s.name, text: '' })) },
  { id: 'play', title: 'Playing your record', intro: 'Your record plays on a turntable, just like the real thing.', items: [
    { name: 'Play', text: 'Tap play. The arm moves over and the needle drops onto the record — you will hear a soft thump, then your record.' },
    { name: 'Look around', text: 'Drag with one finger to turn the turntable. Pinch with two fingers to move closer or further away.' },
    { name: 'Add a photo', text: 'Put a photo of a loved one in the middle of the record.' },
    { name: 'Gold nameplate', text: 'Shows both your names in gold on the turntable.' },
    { name: 'Back to Studio', text: 'Changed your mind? Go back and change the music, crackle or mood. Your voice is kept, so you do not need to record again.' },
  ] },
  { id: 'shelf', title: 'Your shelf', intro: 'Every record you make is kept on your shelf. Tap a record to play it. You can share it as sound, or as a video of the record spinning. Your records stay on this device unless you share them.' },
  { id: 'pro', title: 'Free and Pro', intro: 'You can make records for free. Some extras — more sounds, colours, longer recordings, the gold nameplate and more changes after pressing — need Vynyl Pro. Anything marked PRO is part of it.' },
]

export default function Guide({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<string | null>('steps')
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-obsidian" role="dialog" aria-modal aria-label="Guide">
      <header className="flex items-center justify-between border-b border-cream/10 px-6 pt-[max(16px,env(safe-area-inset-top))] pb-4">
        <div>
          <p className="deco text-[11px] text-amber-bright">Guide</p>
          <h2 className="font-display text-[30px] leading-tight">How Vynyl works</h2>
        </div>
        <button type="button" onClick={onClose} className="min-h-12 rounded-full border border-cream/20 px-5 text-base text-cream hover:border-amber">Close</button>
      </header>
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {GUIDE.map((s) => {
          const on = open === s.id
          return (
            <section key={s.id} className={`overflow-hidden rounded-2xl border ${on ? 'border-amber/50 bg-stone' : 'border-cream/10 bg-stone/60'}`}>
              <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : s.id)} className="flex min-h-16 w-full items-center justify-between gap-3 px-5 text-left">
                <span className="text-lg font-medium leading-snug text-cream">{s.title}</span>
                <span aria-hidden className={`text-2xl text-amber-bright transition-transform ${on ? 'rotate-45' : ''}`}>+</span>
              </button>
              {on && (
                <div className="px-5 pb-5">
                  <p className="text-[17px] leading-relaxed text-cream/90">{s.intro}</p>
                  {s.tip && <p className="mt-3 rounded-xl bg-amber/10 px-4 py-3 text-base leading-relaxed text-amber-bright">💡 {s.tip}</p>}
                  {s.items && (
                    <ul className="mt-4 divide-y divide-cream/10">
                      {s.items.map((it) => (
                        <li key={it.name} className="py-3">
                          <p className="text-base font-semibold text-cream">{it.name}</p>
                          {it.text && <p className="mt-0.5 text-base leading-relaxed text-muted">{it.text}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          )
        })}
        <button type="button" onClick={onClose} className="mt-2 min-h-14 w-full rounded-full bg-gradient-to-b from-[#f0c86a] via-[#c99234] to-[#8a5a1a] font-deco text-sm uppercase tracking-[0.2em] text-obsidian">Got it</button>
      </div>
    </div>
  )
}
