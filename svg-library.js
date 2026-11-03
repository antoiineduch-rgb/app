// Artwork stays on this device. Stored SVG text is data only: callers must
// pass it through prepareSVG again before displaying or exporting it.
const DATABASE_NAME = 'clock-factory-artwork';
const STORE_NAME = 'svgs';
const MAX_SAVED_SVGS = 8;
const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_THUMBNAIL_BYTES = 512 * 1024;
let databasePromise = null;
let fallbackId = 0;

function storageError(error, action = 'open') {
  if (error?.name === 'QuotaExceededError') return new Error('There isn’t enough storage on this device to save your SVG. Your current design is still available in this session.');
  if (error?.name === 'SecurityError' || error?.name === 'InvalidStateError') return new Error('Saved artwork is unavailable in this browser. Your current design is still available in this session.');
  return new Error(action === 'delete' ? 'The saved SVG couldn’t be removed. Please try again.' : 'Saved artwork couldn’t be opened or updated. Your current design is still available in this session.');
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  let indexedDB;
  try { indexedDB = globalThis.indexedDB; } catch (error) { return Promise.reject(storageError(error)); }
  if (!indexedDB) return Promise.reject(new Error('This browser cannot save SVG files locally. Your current design is still available in this session.'));
  const pending = new Promise((resolve, reject) => {
    let settled = false, request;
    try { request = indexedDB.open(DATABASE_NAME, 1); }
    catch (error) { reject(storageError(error)); return; }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onblocked = () => {
      settled = true;
      reject(new Error('Close any older Clock Factory windows, then try saving your SVG again.'));
    };
    request.onerror = () => { settled = true; reject(storageError(request.error)); };
    request.onsuccess = () => {
      const database = request.result;
      if (settled) { database.close(); return; }
      database.onversionchange = () => {
        database.close();
        if (databasePromise === pending) databasePromise = null;
      };
      database.onclose = () => { if (databasePromise === pending) databasePromise = null; };
      settled = true;
      resolve(database);
    };
  });
  databasePromise = pending;
  pending.catch(() => { if (databasePromise === pending) databasePromise = null; });
  return pending;
}

function cleanName(name) {
  const basename = typeof name === 'string' ? name.split(/[\\/]/).at(-1) : '';
  const text = basename.replace(/[\u0000-\u001f\u007f<>]/g, '').trim();
  let result = '', length = 0;
  for (const character of text) { if (length++ === 255) break; result += character; }
  return result || 'Imported SVG.svg';
}

function validThumbnail(value) {
  if (typeof value !== 'string' || value.length > Math.ceil(MAX_THUMBNAIL_BYTES/3)*4+22 || !/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(value)) return false;
  const base64 = value.slice('data:image/png;base64,'.length);
  const bytes = base64.length*3/4-(base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  return base64.length%4 === 0 && bytes <= MAX_THUMBNAIL_BYTES;
}

function checkedInput(input) {
  if (!input || typeof input.source !== 'string' || !input.source.trim()) throw new TypeError('Choose an SVG file before saving it.');
  if (input.source.length > MAX_SOURCE_BYTES) throw new RangeError('Please choose an SVG smaller than 5 MB.');
  const bytes = new TextEncoder().encode(input.source).byteLength;
  if (bytes > MAX_SOURCE_BYTES) throw new RangeError('Please choose an SVG smaller than 5 MB.');
  const size = input.size == null ? bytes : input.size;
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_SOURCE_BYTES) throw new RangeError('The SVG file size must be between 1 byte and 5 MB.');
  if (!validThumbnail(input.thumbnail)) throw new TypeError('The SVG thumbnail must be a PNG image smaller than 512 KB.');
  return { name: cleanName(input.name), source: input.source, thumbnail: input.thumbnail, size };
}

function validRecord(record) {
  return record && typeof record.id === 'string' && record.id.length > 0 && record.id.length <= 128
    && typeof record.source === 'string' && record.source.length <= MAX_SOURCE_BYTES
    && typeof record.name === 'string' && validThumbnail(record.thumbnail)
    && Number.isSafeInteger(record.size) && record.size > 0 && record.size <= MAX_SOURCE_BYTES
    && Number.isSafeInteger(record.updatedAt) && record.updatedAt > 0;
}
function metadata(record) {
  return { id: record.id, name: cleanName(record.name), size: record.size, updatedAt: record.updatedAt, thumbnail: record.thumbnail };
}
function fullRecord(record) {
  return { ...metadata(record), source: record.source };
}

async function transaction(mode, action, run) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    let tx, result, failure;
    try { tx = database.transaction(STORE_NAME, mode); }
    catch (error) { reject(storageError(error, action)); return; }
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(storageError(failure || tx.error, action));
    // Keep the default IndexedDB abort behavior; completion/abort settles once.
    tx.onerror = () => {};
    const setResult = value => { result = value; };
    const abort = error => { failure = error; try { tx.abort(); } catch { reject(storageError(error, action)); } };
    try { run(tx.objectStore(STORE_NAME), setResult, abort); }
    catch (error) { abort(error); }
  });
}

export async function listSavedSVGs() {
  return transaction('readonly', 'open', (store, result, abort) => {
    const request = store.getAll();
    request.onsuccess = () => {
      try { result(request.result.filter(validRecord).sort((a,b) => b.updatedAt-a.updatedAt).slice(0,MAX_SAVED_SVGS).map(metadata)); }
      catch (error) { abort(error); }
    };
  });
}

export async function getSavedSVG(id) {
  if (typeof id !== 'string' || !id || id.length > 128) return null;
  return transaction('readonly', 'open', (store, result, abort) => {
    const request = store.get(id);
    request.onsuccess = () => {
      try { result(validRecord(request.result) ? fullRecord(request.result) : null); }
      catch (error) { abort(error); }
    };
  });
}

export async function saveSVG(input) {
  const entry = checkedInput(input);
  return transaction('readwrite', 'save', (store, result, abort) => {
    const request = store.getAll();
    request.onsuccess = () => {
      try {
        const records = request.result.filter(validRecord);
        const matching = records.find(record => record.source === entry.source);
        const ids = new Set(request.result.map(record => record.id));
        let id = matching?.id;
        while (!id || (!matching && ids.has(id))) id = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${fallbackId++}`;
        const lastTime = Math.max(0,...records.map(record => record.updatedAt));
        const updatedAt = Math.max(Date.now(), lastTime < Number.MAX_SAFE_INTEGER ? lastTime+1 : 0);
        const saved = { id, ...entry, updatedAt };
        store.put(saved);
        const retained = [saved,...records.filter(record => record.id !== id)].sort((a,b) => b.updatedAt-a.updatedAt);
        const keep = new Set(retained.slice(0,MAX_SAVED_SVGS).map(record => record.id));
        for (const record of request.result) if (!keep.has(record.id)) store.delete(record.id);
        result(fullRecord(saved));
      } catch (error) { abort(error); }
    };
  });
}

export async function deleteSavedSVG(id) {
  if (typeof id !== 'string' || !id || id.length > 128) return false;
  return transaction('readwrite', 'delete', (store, result) => {
    const request = store.getKey(id);
    request.onsuccess = () => { result(request.result !== undefined); store.delete(id); };
  });
}
