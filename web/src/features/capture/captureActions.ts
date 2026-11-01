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

/**
 * My Uploads preview (~400 px) for a photo or a video, made in the background
 * once the capture is saved. Kept after sending, until the guest deletes the
 * item; none on this phone means the neutral placeholder.
 */
async function savePreview(item: QueueItem, file: Blob): Promise<void> {
  const { makePreview } = await import('../../lib/media/preview');
  await (await getQueue()).savePreview(item.mediaId, await makePreview(file, item.type));
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

export interface CameraResult {
  /** Set when the photo or video was saved. */
  mediaId: string | null;
  unsupported: boolean;
  tooLarge: boolean;
  quotaFallback: boolean;
  /** A video over 50 MB, held until the "now or later on wifi" answer. */
  held: boolean;
}

/**
 * Snap Gambar: the phone's own camera returns a photo or a video (D-084). It
 * is saved to IndexedDB the moment it arrives (rule 4), unchanged and with no
 * length limit. A photo's EXIF is then read and it is released to the queue;
 * a video over 50 MB waits as `held` for the wifi question. With
 * `awaitChoice` it also waits for the first privacy question (`choosePrivacy`).
 */
export async function takeFromCamera(file: File, context: CaptureContext, awaitChoice: boolean): Promise<CameraResult> {
  const described = describeCapture(file, 'snapshot', context);
  if (!described.ok) {
    return {
      mediaId: null,
      unsupported: described.reason === 'unsupported',
      tooLarge: described.reason === 'tooLarge',
      quotaFallback: false,
      held: false,
    };
  }
  void requestPersistentStorage();
  const queue = await getQueue();
  const photo = described.item.type === 'image';
  const held = !photo && file.size > LARGE_FILE_PROMPT_BYTES;
  const status = held ? 'held' : photo ? 'preparing' : 'waiting';
  const { item, quotaFallback } = await queue.add({ ...described.item, status, awaitingChoice: awaitChoice }, file);
  if (photo) {
    // EXIF is read in the background; the privacy question can be answered meanwhile.
    void readCaptureDetails(item, file)
      .catch(() => ({}))
      .then((details) => queue.finishPreparing(item.mediaId, details));
  }
  void savePreview(item, file).catch(() => undefined);
  return { mediaId: item.mediaId, unsupported: false, tooLarge: false, quotaFallback, held };
}

/** The first privacy question was answered (or skipped: Peribadi) for these camera captures. */
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

/** "Hantar sekarang": every held item of the event, or only these. */
export async function sendHeld(eventId: string, mediaIds?: string[]) {
  await (await getQueue()).release(eventId, mediaIds);
}

export async function retryFailed(eventId: string) {
  await (await getQueue()).retryFailed(eventId);
}

/** Calls back after each item reaches the server. */
export async function onItemSent(listener: () => void): Promise<() => void> {
  return (await getQueue()).onSent(listener);
}
