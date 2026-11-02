import { PREVIEW_MAX_SIDE } from './thumbnailTypes';

/** Draws a frame or image into a small JPEG, keeping its proportions. */
export function drawSmall(source: CanvasImageSource, width: number, height: number, maxSide: number): Promise<Blob | null> {
  if (!width || !height) return Promise.resolve(null);
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(null);
  try {
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
  } catch {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7));
}

/** HAVE_CURRENT_DATA: a frame can be drawn. */
const HAS_FRAME = 2;
/** iPhone Safari loads no frames for a video that is not playing: after this, play it muted. */
const NUDGE_MS = 2_500;

/**
 * One frame near the start of a video, as a small JPEG for My Uploads. The
 * `<video>` element reads the file through an object URL, which streams from
 * disk: the video is never loaded into memory. If no frame arrives after the
 * seek (iPhone Safari), the video plays muted for a moment (allowed without
 * a tap) and the first frame shown is taken. Null when this browser cannot
 * play it (e.g. HEVC on some Android phones) or it takes too long.
 */
export function grabVideoFrame(file: Blob, maxSide = PREVIEW_MAX_SIDE, timeoutMs = 10_000): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    let done = false;
    let drawing = false;
    const finish = (blob: Blob | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      clearTimeout(nudgeTimer);
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    const draw = () => {
      if (drawing || done) return;
      drawing = true;
      video.pause();
      void drawSmall(video, video.videoWidth, video.videoHeight, maxSide).then(finish);
    };
    const nudge = () => {
      if (drawing || done) return;
      video.ontimeupdate = () => {
        if (video.currentTime > 0 && video.readyState >= HAS_FRAME) draw();
      };
      void video.play().catch(() => undefined);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    const nudgeTimer = setTimeout(nudge, NUDGE_MS);
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.preload = 'auto';
    video.onerror = () => finish(null);
    video.onloadedmetadata = () => {
      // Half a second in, past a possible black first frame (or the middle of a very short clip).
      video.currentTime = Number.isFinite(video.duration) ? Math.min(0.5, video.duration / 2) : 0.5;
    };
    video.onseeked = () => {
      if (video.readyState >= HAS_FRAME) draw();
      else nudge();
    };
    video.src = url;
    video.load();
  });
}
