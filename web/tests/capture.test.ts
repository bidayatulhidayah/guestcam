import { describe, expect, it } from 'vitest';
import { describeCapture, type CaptureContext } from '../src/lib/queue/capture';

const context: CaptureContext = { eventId: 'event-1', spaceId: 'space-1', visibility: 'private', showName: false };
const file = (name: string, type: string, size = 10) => new File([new Uint8Array(size)], name, { type });

describe('camera captures (Snap Gambar, D-088)', () => {
  it('a camera video is kept on the phone and goes after photos', () => {
    const video = describeCapture(file('VID_20261101.mp4', 'video/mp4'), 'snapshot', context);
    const photo = describeCapture(file('IMG_20261101.jpg', 'image/jpeg'), 'snapshot', context);
    expect(video.ok && video.item).toMatchObject({ type: 'video', contentType: 'video/mp4', storage: 'stored', priority: 1 });
    expect(photo.ok && photo.item).toMatchObject({ type: 'image', storage: 'stored', priority: 0 });
  });

  it('an iPhone video without a MIME type is recognised from its .MOV name', () => {
    const video = describeCapture(file('IMG_0042.MOV', ''), 'snapshot', context);
    expect(video.ok && video.item).toMatchObject({ type: 'video', contentType: 'video/quicktime' });
  });

  it('refuses what is neither a photo nor a video', () => {
    expect(describeCapture(file('note.txt', 'text/plain'), 'snapshot', context)).toEqual({ ok: false, reason: 'unsupported' });
  });
});
