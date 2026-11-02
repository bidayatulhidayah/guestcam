import { useEffect, useRef, useState, type RefObject } from 'react';
import type { UploadRow } from './mergeItems';

const queueModule = () => import('../../lib/queue');

/**
 * The small preview kept on this phone (photo, or a video's frame); null
 * shows the neutral placeholder. Items from another phone have none until
 * server thumbnails arrive (Phase 3). Loaded only once `enabled` (near the
 * screen), so a long list does not read every preview at once.
 */
export function usePreview(row: UploadRow, enabled = true): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled || !row.local || row.preview === 'none') return;
    let active = true;
    let objectUrl: string | undefined;
    queueModule()
      .then((m) => m.getQueueDb())
      .then((db) => db.thumbs.get(row.mediaId))
      .then((thumb) => {
        if (!active || !thumb) return;
        objectUrl = URL.createObjectURL(thumb.blob);
        setUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // The preview is made in the background: saving it sets `preview` on the item.
  }, [enabled, row.mediaId, row.local, row.preview]);
  return url;
}

/** True once the element comes within a screen of the viewport (then stays true). */
export function useNearViewport(ref: RefObject<Element | null>): boolean {
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  const done = useRef(near);
  useEffect(() => {
    const element = ref.current;
    if (done.current || !element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        done.current = true;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: '100% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return near;
}
