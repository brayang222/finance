// ponytail: browser-only — only called from client components after mount
const DB_NAME = "finance-offline";
const STORE = "pending";

export type QueueItem = {
  type: "ingreso" | "egreso";
  amount: number;
  desc?: string;
  category: string;
  date: string;
  accountId?: string;
  accountName?: string;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { autoIncrement: true });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function enqueue(item: QueueItem): Promise<void> {
  const db = await openDB();
  await new Promise<void>((res, rej) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).add(item);
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}

export async function pendingCount(): Promise<number> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, "readonly");
    const r = t.objectStore(STORE).count();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function flushQueue(addFn: (item: QueueItem) => Promise<void>): Promise<number> {
  const db = await openDB();
  const entries = await new Promise<Array<{ key: IDBValidKey; value: QueueItem }>>((res, rej) => {
    const t = db.transaction(STORE, "readonly");
    const rows: Array<{ key: IDBValidKey; value: QueueItem }> = [];
    const r = t.objectStore(STORE).openCursor();
    r.onsuccess = () => {
      if (r.result) { rows.push({ key: r.result.key, value: r.result.value }); r.result.continue(); }
      else res(rows);
    };
    r.onerror = () => rej(r.error);
  });

  let done = 0;
  for (const { key, value } of entries) {
    await addFn(value);
    await new Promise<void>((res, rej) => {
      const t = db.transaction(STORE, "readwrite");
      t.objectStore(STORE).delete(key);
      t.oncomplete = () => res();
      t.onerror = () => rej(t.error);
    });
    done++;
  }
  return done;
}
