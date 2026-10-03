export type RecordMeta = {
  id: string; title: string; recipient: string; sender: string; dedication: string
  occasion: string; date: string; sideA: string; sideB: string
  presetId: string; styleId: string; duration: number; wave: number[]
  createdAt: number; lastPlayedAt?: number; favorite: boolean
}
export type PhotoAdjust = { mode: 'fill' | 'fit'; zoom: number; x: number; y: number; rot: number; bg: 'blur' | 'label' }
/** Everything the Studio needs to re-press a record from its original voice. */
export type StudioSettings = { presetId: string; styleId: string; crackleId: string; music: string; musicLevel: number; crackleLevel: number; character: number; volume: number; moodId: string | null }
export type StoredRecord = RecordMeta & { master: Blob; voice?: Blob; settings?: StudioSettings; reedits?: number; labelPhoto?: Blob; labelPhotoOriginal?: Blob; labelPhotoAdjust?: PhotoAdjust; crackleId?: string; musicId?: string }

/** A raw take kept in the voice library so it can be pressed again later. `pcm` is mono 44.1k Float32. */
export type SavedVoice = { id: string; name: string; createdAt: number; duration: number; wave: number[]; pcm: Blob }

const open = () =>
  new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open('vynyl', 2)
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains('records')) r.result.createObjectStore('records', { keyPath: 'id' })
      if (!r.result.objectStoreNames.contains('voices')) r.result.createObjectStore('voices', { keyPath: 'id' })
    }
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>, store = 'records') {
  const db = await open()
  return new Promise<T>((res, rej) => {
    const q = fn(db.transaction(store, mode).objectStore(store))
    q.onsuccess = () => res(q.result)
    q.onerror = () => rej(q.error)
  })
}

export const db = {
  all: () => tx<StoredRecord[]>('readonly', (s) => s.getAll() as IDBRequest<StoredRecord[]>),
  get: (id: string) => tx<StoredRecord | undefined>('readonly', (s) => s.get(id) as IDBRequest<StoredRecord | undefined>),
  put: (r: StoredRecord) => tx('readwrite', (s) => s.put(r)),
  del: (id: string) => tx('readwrite', (s) => s.delete(id)),
}

export const voices = {
  all: () => tx<SavedVoice[]>('readonly', (s) => s.getAll() as IDBRequest<SavedVoice[]>, 'voices'),
  put: (v: SavedVoice) => tx('readwrite', (s) => s.put(v), 'voices'),
  del: (id: string) => tx('readwrite', (s) => s.delete(id), 'voices'),
}
