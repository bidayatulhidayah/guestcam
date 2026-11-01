import type { ThumbnailRequest, ThumbnailResponse } from './thumbnailTypes';

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, (blob: Blob | null) => void>();
/** One photo at a time: decoding a large photo takes a lot of memory. */
let chain: Promise<unknown> = Promise.resolve();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./thumbnail.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<ThumbnailResponse>) => {
      pending.get(event.data.id)?.(event.data.blob);
      pending.delete(event.data.id);
    };
  }
  return worker;
}

function makeOne(file: Blob): Promise<Blob | null> {
  const id = nextId++;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve(null);
    }, 15_000);
    pending.set(id, (blob) => {
      clearTimeout(timer);
      resolve(blob);
    });
    try {
      getWorker().postMessage({ id, file } satisfies ThumbnailRequest);
    } catch {
      clearTimeout(timer);
      pending.delete(id);
      resolve(null);
    }
  });
}

/** A ~400 px preview of a photo, made in a Web Worker; null if it cannot be made. */
export function makeThumbnail(file: Blob): Promise<Blob | null> {
  const result = chain.then(() => makeOne(file));
  chain = result.catch(() => null);
  return result;
}
