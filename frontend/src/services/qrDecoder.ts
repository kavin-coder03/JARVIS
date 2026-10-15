import jsQR from 'jsqr';

export interface DecodeResult {
  success: boolean;
  data?: string;
  error?: string;
}

let nativeDetector: any = null;
let nativeDetectorTested = false;

function getNativeBarcodeDetector(): any {
  if (nativeDetectorTested) return nativeDetector;
  nativeDetectorTested = true;
  try {
    if (typeof (window as any).BarcodeDetector !== 'undefined') {
      nativeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
    }
  } catch (e) {
    nativeDetector = null;
  }
  return nativeDetector;
}

/**
 * Decodes a QR code from a video frame or canvas element.
 * Strategy:
 * 1. Hardware-accelerated BarcodeDetector (fast path on Chrome / Android / Safari 17+)
 * 2. jsQR full-frame with attemptBoth inversions
 * 3. jsQR center Region-of-Interest (ROI) for distant/small codes
 */
export async function decodeFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<string | null> {
  if (video.videoWidth <= 0 || video.videoHeight <= 0) {
    return null;
  }

  // 1. Try Native BarcodeDetector first if available
  const detector = getNativeBarcodeDetector();
  if (detector) {
    try {
      const barcodes = await detector.detect(video);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue.trim();
      }
    } catch {
      // Fall through to canvas jsQR fallback
    }
  }

  // 2. jsQR Canvas fallback
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });

  if (code && code.data && code.data.trim()) {
    return code.data.trim();
  }

  // 3. Center ROI Crop fallback (user usually aligns QR code inside the center 60% box)
  if (canvas.width >= 400 && canvas.height >= 400) {
    const cropSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.65);
    const cropX = Math.floor((canvas.width - cropSize) / 2);
    const cropY = Math.floor((canvas.height - cropSize) / 2);

    const croppedData = ctx.getImageData(cropX, cropY, cropSize, cropSize);
    const roiCode = jsQR(croppedData.data, croppedData.width, croppedData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (roiCode && roiCode.data && roiCode.data.trim()) {
      return roiCode.data.trim();
    }
  }

  return null;
}

/**
 * Decodes an uploaded image file with multi-pass scanning.
 */
export async function decodeImageFile(file: File): Promise<DecodeResult> {
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeBytes) {
    return {
      success: false,
      error: 'File exceeds 10MB limit. Please upload a smaller image file.',
    };
  }

  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp', 'image/svg+xml'];
  if (file.type && !validTypes.includes(file.type.toLowerCase())) {
    return {
      success: false,
      error: `Unsupported image format (${file.type}). Please upload PNG, JPG, JPEG, or WebP.`,
    };
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      try {
        // 1. Try Native BarcodeDetector on image
        const detector = getNativeBarcodeDetector();
        if (detector) {
          try {
            const barcodes = await detector.detect(img);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              resolve({ success: true, data: barcodes[0].rawValue.trim() });
              return;
            }
          } catch {
            // Fall through to jsQR
          }
        }

        // 2. jsQR Canvas passes
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Cap extreme dimensions to prevent memory exhaustion while retaining fidelity
        const maxDim = 2048;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve({ success: false, error: 'Could not create image processing context.' });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        // Pass A: Normal attemptBoth
        const codeA = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (codeA && codeA.data && codeA.data.trim()) {
          resolve({ success: true, data: codeA.data.trim() });
          return;
        }

        // Pass B: Center Crop
        const cropSize = Math.floor(Math.min(width, height) * 0.7);
        const cropX = Math.floor((width - cropSize) / 2);
        const cropY = Math.floor((height - cropSize) / 2);
        const croppedData = ctx.getImageData(cropX, cropY, cropSize, cropSize);
        const codeB = jsQR(croppedData.data, croppedData.width, croppedData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (codeB && codeB.data && codeB.data.trim()) {
          resolve({ success: true, data: codeB.data.trim() });
          return;
        }

        // If not found after passes:
        resolve({
          success: false,
          error: 'No QR code detected. Try a clearer image or use the live scanner.',
        });
      } catch (err: any) {
        resolve({
          success: false,
          error: `Decoding error: ${err.message || 'Failed to parse image pixels.'}`,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        success: false,
        error: 'Unable to render the uploaded image file. It may be corrupt or an invalid image format.',
      });
    };

    img.src = objectUrl;
  });
}
