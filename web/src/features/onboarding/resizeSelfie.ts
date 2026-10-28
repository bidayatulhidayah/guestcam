/**
 * Shrinks a selfie to a small JPEG (longest side 800 px). The selfie is a
 * profile picture, not a capture, so resizing is allowed; captured photos and
 * videos are never modified (AGENTS.md rule 3).
 */
const MAX_SIDE = 800;

export async function resizeSelfie(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is not available');
    context.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the selfie'))), 'image/jpeg', 0.85),
    );
  } finally {
    bitmap.close();
  }
}
