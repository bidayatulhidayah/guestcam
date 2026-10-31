/**
 * What happens after the camera or the gallery picker returns files. Loaded
 * lazily with the queue (import('./captureActions')).
 */
import { LARGE_FILE_PROMPT_BYTES } from '@guestcam/shared';
import {
  describeCapture,
  getQueue,
  prepareCapture,
  readCaptureDetails,
  requestPersistentStorage,
  type CaptureContext,
} from '../../lib/queue';
import type { QueueItem } from '../../lib/queue/types';

export interface PreparedSelection {
  ready: { item: QueueItem; data: File }[];
  tooLarge: number;
  unsupported: number;
  /** Re-picked files that continued an earlier item instead of a new one (pitfall U5). */
  resumed: number;
  /** Largest new file, for the "now or later on wifi" question. */
  largestBytes: number;
}

export interface CommitResult {
  /** Some captures could only be kept in memory (storage full, pitfall U4). */
  quotaFallback: boolean;
}

async function prepareAll(
  files: File[],
  source: QueueItem['source'],
  context: CaptureContext,
): Promise<PreparedSelection> {
  const queue = await getQueue();
  const selection: PreparedSelection = { ready: [], tooLarge: 0, unsupported: 0, resumed: 0, largestBytes: 0 };
  for (const file of files) {
    if (source === 'galleryUpload' && (await queue.reattach(context.eventId, file))) {
      selection.resumed++;
      continue;
    }
    const prepared = await prepareCapture(file, source, context);
    if (!prepared.ok) {
      selection[prepared.reason]++;
      continue;
    }
    selection.ready.push(prepared);
    selection.largestBytes = Math.max(selection.largestBytes, file.size);
  }
  return selection;
}

export interface PhotoResult {
  saved: boolean;
  unsupported: boolean;
  quotaFallback: boolean;
}

/**
 * Camera photo: saved to IndexedDB the moment the camera returns it, then
 * EXIF is read and the photo is released to the queue (rule 4).
 */
export async function takePhoto(file: File, context: CaptureContext): Promise<PhotoResult> {
  const described = describeCapture(file, 'snapshot', context);
  if (!described.ok) return { saved: false, unsupported: true, quotaFallback: false };
  void requestPersistentStorage();
  const queue = await getQueue();
  const { item, quotaFallback } = await queue.add({ ...described.item, status: 'preparing' }, file);
  await queue.finishPreparing(item.mediaId, await readCaptureDetails(item, file));
  return { saved: true, unsupported: false, quotaFallback };
}

/** Gallery picks (photos and videos, any length up to 4 GB). */
export async function pickFromGallery(files: File[], context: CaptureContext) {
  return prepareAll(files, 'galleryUpload', context);
}

export function needsWifiQuestion(selection: PreparedSelection): boolean {
  return selection.largestBytes > LARGE_FILE_PROMPT_BYTES;
}

/** Adds the prepared items to the queue; "later on wifi" holds only the large files. */
export async function commit(selection: PreparedSelection, holdLargeFiles: boolean): Promise<CommitResult> {
  void requestPersistentStorage();
  const queue = await getQueue();
  let quotaFallback = false;
  for (const { item, data } of selection.ready) {
    const held = holdLargeFiles && item.sizeBytes > LARGE_FILE_PROMPT_BYTES;
    const result = await queue.add({ ...item, status: held ? 'held' : 'waiting' }, data);
    quotaFallback ||= result.quotaFallback;
  }
  return { quotaFallback };
}

export async function sendHeld(eventId: string) {
  await (await getQueue()).release(eventId);
}

export async function retryFailed(eventId: string) {
  await (await getQueue()).retryFailed(eventId);
}

/** Calls back after each item reaches the server. */
export async function onItemSent(listener: () => void): Promise<() => void> {
  return (await getQueue()).onSent(listener);
}
