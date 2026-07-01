const DB_NAME = "finance_fs";
const STORE = "handles";
const KEY = "data_file";

const openDB = () =>
  new Promise<any>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e: any) => e.target.result.createObjectStore(STORE);
    req.onsuccess = (e: any) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });

export const persistHandle = async (handle: any) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
};

export const getPersistedHandle = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
};

export const requestPermission = async (handle: any) => {
  const opts = { mode: "readwrite" };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  return (await handle.requestPermission(opts)) === "granted";
};

export const pickFile = async () => {
  // @ts-ignore - File System Access API
  const [handle] = await window.showOpenFilePicker({
    types: [{ description: "Finance data", accept: { "application/json": [".json"] } }],
    multiple: false
  });
  return handle;
};

export const createFile = async () => {
  // @ts-ignore - File System Access API
  return window.showSaveFilePicker({
    suggestedName: "finance-data.json",
    types: [{ description: "Finance data", accept: { "application/json": [".json"] } }]
  });
};

export const readFile = async (handle: any) => {
  const file = await handle.getFile();
  const text = await file.text();
  return JSON.parse(text);
};

export const writeFile = async (handle: any, data: any) => {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
};

export const isSupported = () => "showOpenFilePicker" in window;
