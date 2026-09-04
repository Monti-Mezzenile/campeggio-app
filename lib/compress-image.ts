import imageCompression from "browser-image-compression";

const DEFAULT_OPTIONS = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  try {
    return await imageCompression(file, DEFAULT_OPTIONS);
  } catch (error) {
    console.warn("Compressione immagine non riuscita, uso il file originale:", error);
    return file;
  }
}
