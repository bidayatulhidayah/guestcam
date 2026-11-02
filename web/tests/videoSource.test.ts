import { beforeEach, describe, expect, it, vi } from 'vitest';

const stored = new Map<string, Blob>();
const picked = new Map<string, Blob>();
const getDownloadUrl = vi.fn(async (path: string) => `https://files.example/${path}`);

vi.mock('../src/lib/queue', () => ({
  getQueueDb: async () => ({ blobs: { get: async (id: string) => (stored.has(id) ? { blob: stored.get(id) } : undefined) } }),
  getQueue: async () => ({ files: picked }),
}));
vi.mock('../src/lib/firebase/load', () => ({
  loadFirebase: async () => ({ ensureAnonymousUser: async () => ({ uid: 'guest-uid' }) }),
}));
vi.mock('../src/lib/storage', () => ({ storage: { getDownloadUrl } }));

const { videoSource } = await import('../src/features/uploads/videoSource');

beforeEach(() => {
  stored.clear();
  picked.clear();
  getDownloadUrl.mockClear();
  vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:local' });
});

describe('playing a guest’s own video (D-091)', () => {
  it('plays this phone’s copy while it is still here (not sent yet)', async () => {
    stored.set('m1', new Blob(['video']));
    expect(await videoSource('event1', 'm1')).toEqual({ url: 'blob:local', local: true });
    expect(getDownloadUrl).not.toHaveBeenCalled();
  });

  it('plays a gallery pick from the file picked on this page', async () => {
    picked.set('m2', new Blob(['video']));
    expect(await videoSource('event1', 'm2')).toEqual({ url: 'blob:local', local: true });
  });

  it('once sent, plays the guest’s own original from the server', async () => {
    const source = await videoSource('event1', 'm3');
    expect(source.local).toBe(false);
    expect(getDownloadUrl).toHaveBeenCalledWith('events/event1/media/guest-uid/original/m3');
  });
});
