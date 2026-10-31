/** Lazy, shared import of the Firebase core chunk (`./index`). */
let firebase: Promise<typeof import('./index')> | undefined;

export function loadFirebase(): Promise<typeof import('./index')> {
  // A failed load (e.g. opened offline) is forgotten, so the next call tries again.
  firebase ??= import('./index').catch((error: unknown) => {
    firebase = undefined;
    throw error;
  });
  return firebase;
}
