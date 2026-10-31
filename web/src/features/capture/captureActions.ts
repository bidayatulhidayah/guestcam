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
import type { PrivacyChoice } from '../privacy/privacyChoice';

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

/** My Uploads preview, made in the background; photos only (videos show an icon until Phase 3). */
async function savePreview(item: QueueItem, file: Blob): Promise<void> {
  if (item.type !== 'image') return;
  const { makeThumbnail } = await import('../../lib/media/thumbnail');
  const thumb = await makeThumbnail(file);
  if (thumb) await (await getQueue()).saveThumb(item.mediaId, thumb);
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
  /** Set when the photo was saved. */
  mediaId: string | null;
  unsupported: boolean;
  quotaFallback: boolean;
}

/**
 * Camera photo: saved to IndexedDB the moment the camera returns it, then
 * EXIF is read and the photo is released to the queue (rule 4). With
 * `awaitChoice` it waits for the first privacy question (`choosePrivacy`).
 */
export async function takePhoto(file: File, context: CaptureContext, awaitChoice: boolean): Promise<PhotoResult> {
  const described = describeCapture(file, 'snapshot', context);
  if (!described.ok) return { mediaId: null, unsupported: true, quotaFallback: false };
  void requestPersistentStorage();
  const queue = await getQueue();
  const { item, quotaFallback } = await queue.add({ ...described.item, status: 'preparing', awaitingChoice: awaitChoice }, file);
  // EXIF is read in the background; the privacy question can be answered meanwhile.
  void readCaptureDetails(item, file)
    .catch(() => ({}))
    .then((details) => queue.finishPreparing(item.mediaId, details));
  void savePreview(item, file).catch(() => undefined);
  return { mediaId: item.mediaId, unsupported: false, quotaFallback };
}

/** The first privacy question was answered (or skipped: Peribadi) for these camera photos. */
export async function choosePrivacy(mediaIds: string[], choice: PrivacyChoice): Promise<void> {
  if (mediaIds.length > 0) await (await getQueue()).choose(mediaIds, choice.visibility, choice.showName);
}

/** A gallery selection with the guest's privacy choice applied to every item. */
export function withChoice(selection: PreparedSelection, choice: PrivacyChoice): PreparedSelection {
  return {
    ...selection,
    ready: selection.ready.map(({ item, data }) => ({ item: { ...item, ...choice }, data })),
  };
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
    void savePreview(result.item, data).catch(() => undefined);
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
