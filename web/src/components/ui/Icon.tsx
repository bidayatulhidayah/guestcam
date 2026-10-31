import type { ReactNode } from 'react';

/**
 * One outline icon set: 24px grid, 2px stroke, round joins, current colour
 * (design.md, Icons). Drawn here so there is no icon library in the bundle.
 * Every icon is shown next to a word.
 */
const paths: Record<IconName, ReactNode> = {
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  upload: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="m3 16 5-5 4 4 3-3 6 6" />
      <circle cx="16" cy="8.5" r="1.5" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="1" />
      <path d="m16 10 5-3v10l-5-3" />
    </>
  ),
  boomerang: <path d="M7 15a4 4 0 1 1 0-6c2 0 3 1.5 5 3s3 3 5 3a4 4 0 1 0 0-6c-2 0-3 1.5-5 3s-3 3-5 3Z" />,
  phone: (
    <path d="M6 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2L21 15v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" />
  ),
  letter: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  folderLock: (
    <>
      <path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <rect x="9.5" y="12.5" width="5" height="4" rx="0.5" />
      <path d="M10.5 12.5v-1a1.5 1.5 0 0 1 3 0v1" />
    </>
  ),
  gallery: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  userHidden: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
      <path d="m3 3 18 18" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </>
  ),
};

export type IconName =
  | 'camera'
  | 'upload'
  | 'video'
  | 'boomerang'
  | 'phone'
  | 'letter'
  | 'folderLock'
  | 'gallery'
  | 'lock'
  | 'user'
  | 'userHidden'
  | 'trash';

export function Icon({ name, size = 28 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
