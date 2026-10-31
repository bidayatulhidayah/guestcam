import type { ExifRequest, ExifResponse } from './exifTypes';

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, (response: ExifResponse) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./exif.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<ExifResponse>) => {
      pending.get(event.data.id)?.(event.data);
      pending.delete(event.data.id);
    };
  }
  return worker;
}

const empty = (id: number): ExifResponse => ({ id, exif: {}, latitude: null, longitude: null });

/** EXIF of a photo, read in a Web Worker. Gives up after 8 s so a capture is never blocked. */
export function readExif(file: Blob): Promise<ExifResponse> {
  const id = nextId++;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve(empty(id));
    }, 8000);
    pending.set(id, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
    try {
      getWorker().postMessage({ id, file } satisfies ExifRequest);
    } catch {
      clearTimeout(timer);
      pending.delete(id);
      resolve(empty(id));
    }
  });
}
