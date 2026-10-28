/** Lazy, shared import of the Firebase core chunk (`./index`). */
let firebase: Promise<typeof import('./index')> | undefined;

export function loadFirebase(): Promise<typeof import('./index')> {
  firebase ??= import('./index');
  return firebase;
}
