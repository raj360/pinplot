import { BUILDING_IMAGE } from "@plotpin/shared-types";

export type CompressedBuildingImages = {
  full: File;
  thumb: File;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };
    img.src = url;
  });
}

function scaleDimensions(
  width: number,
  height: number,
  maxDim: number,
): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) {
    return { width, height };
  }
  if (width >= height) {
    return {
      width: maxDim,
      height: Math.round((height * maxDim) / width),
    };
  }
  return {
    width: Math.round((width * maxDim) / height),
    height: maxDim,
  };
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not compress image."));
      },
      "image/jpeg",
      quality,
    );
  });
}

async function renderJpeg(
  img: HTMLImageElement,
  maxDim: number,
  quality: number,
  maxBytes: number,
  label: string,
): Promise<File> {
  const { width, height } = scaleDimensions(
    img.naturalWidth,
    img.naturalHeight,
    maxDim,
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image.");

  ctx.drawImage(img, 0, 0, width, height);

  let currentQuality = quality;
  let blob = await canvasToJpegBlob(canvas, currentQuality);
  while (blob.size > maxBytes && currentQuality > 0.55) {
    currentQuality -= 0.05;
    blob = await canvasToJpegBlob(canvas, currentQuality);
  }

  if (blob.size > maxBytes) {
    throw new Error(
      `${label} is still too large after compression. Try a smaller photo.`,
    );
  }

  return new File([blob], `${label}.jpg`, { type: "image/jpeg" });
}

/** Resize + JPEG compress for full gallery and explore thumb variants. */
export async function compressBuildingImages(
  file: File,
): Promise<CompressedBuildingImages> {
  const img = await loadImage(file);
  const [full, thumb] = await Promise.all([
    renderJpeg(
      img,
      BUILDING_IMAGE.FULL_MAX_PX,
      BUILDING_IMAGE.FULL_JPEG_QUALITY,
      BUILDING_IMAGE.FULL_MAX_BYTES,
      "full",
    ),
    renderJpeg(
      img,
      BUILDING_IMAGE.THUMB_MAX_PX,
      BUILDING_IMAGE.THUMB_JPEG_QUALITY,
      BUILDING_IMAGE.THUMB_MAX_BYTES,
      "thumb",
    ),
  ]);
  return { full, thumb };
}
