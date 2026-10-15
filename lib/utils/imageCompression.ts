/**
 * Client-side image compression utility
 * Compresses an image to max 256x256 using HTML5 Canvas and JPEG quality 0.7
 * Guarantees small payload (~15-25 KB) for minimal database & memory storage.
 */

export interface CompressionResult {
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
}

export async function compressImageClientSide(
  file: File,
  maxDimension = 256,
  quality = 0.7
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file is not an image"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio-preserving dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Create canvas and draw image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not initialize 2D canvas context"));
          return;
        }

        // Fill background with white (prevents transparent PNGs turning black when converted to JPEG)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG at 0.7 quality (~15-25 KB)
        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        // Calculate approximate size in KB
        const base64Data = dataUrl.split(",")[1] || "";
        const sizeBytes = Math.round((base64Data.length * 3) / 4);
        const sizeKb = Math.round((sizeBytes / 1024) * 10) / 10;

        resolve({
          dataUrl,
          sizeKb,
          width,
          height,
        });
      };

      img.onerror = () => {
        reject(new Error("Failed to parse and decode image data"));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };

    reader.readAsDataURL(file);
  });
}
