// A raw phone-camera photo (12-48MP, often 5-15MB) uploaded as-is has to
// cross two real network hops before it's usable (browser -> this app's
// backend -> Cloudinary) - on a free/shared-bandwidth host that's most of
// what "image upload feels slow" actually is. Downscaling to a sane
// display ceiling and re-encoding at a still-sharp quality in the browser
// (via <canvas>, no new dependency) cuts that payload by 80-95% before it
// ever leaves the device, with no visible quality loss at the sizes this
// storefront actually displays images at (review photos, support
// attachments - nothing here needs a 4000px-wide source).
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

export async function compressImage(file) {
  // Never touch anything that isn't a compressible raster image - GIFs
  // (animation would be destroyed by a canvas round-trip) and anything
  // already small enough that compressing it isn't worth the CPU time.
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 300 * 1024) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    // PNG stays PNG (re-encoding a lossless format at a "quality" setting
    // does nothing useful and could reintroduce transparency bugs) - only
    // JPEG/WebP get the quality pass, on top of the resize every format gets.
    const outputType = file.type === 'image/png' ? 'image/png' : file.type;
    const quality = outputType === 'image/png' ? undefined : JPEG_QUALITY;

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
    if (!blob || blob.size >= file.size) return file; // never ship a "compressed" file that's actually bigger

    return new File([blob], file.name, { type: outputType, lastModified: Date.now() });
  } catch {
    // Any failure (unsupported format, browser quirk, canvas tainted) just
    // falls back to the original file - compression is an optimization,
    // never a requirement for the upload to work.
    return file;
  }
}
