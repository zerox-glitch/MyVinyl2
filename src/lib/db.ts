export type RecordMeta = {
  id: string; title: string; recipient: string; sender: string; dedication: string
  occasion: string; date: string; sideA: string; sideB: string
  presetId: string; styleId: string; duration: number; wave: number[]
  createdAt: number; lastPlayedAt?: number; favorite: boolean
}
export type PhotoAdjust = { mode: 'fill' | 'fit'; zoom: number; x: number; y: number; rot: number; bg: 'blur' | 'label' }
export type StoredRecord = RecordMeta & { master: Blob; labelPhoto?: Blob; labelPhotoOriginal?: Blob; labelPhotoAdjust?: PhotoAdjust; crackleId?: string; musicId?: string }

const open = () =>
  new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open('vynyl', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('records', { keyPath: 'id' })
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await open()
  return new Promise<T>((res, rej) => {
    const q = fn(db.transaction('records', mode).objectStore('records'))
    q.onsuccess = () => res(q.result)
    q.onerror = () => rej(q.error)
  })
}

export const db = {
  all: () => tx<StoredRecord[]>('readonly', (s) => s.getAll() as IDBRequest<StoredRecord[]>),
  put: (r: StoredRecord) => tx('readwrite', (s) => s.put(r)),
  del: (id: string) => tx('readwrite', (s) => s.delete(id)),
}
