import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { decodeImageFile } from '../../services/qrDecoder';

interface ImageUploaderProps {
  onScanSuccess: (payload: string, sourceType: 'upload') => void;
  isProcessing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onScanSuccess, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);

  const processFile = async (file: File) => {
    setDecodeError(null);
    setSelectedFile(file);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    setIsDecoding(true);
    try {
      const result = await decodeImageFile(file);
      if (result.success && result.data) {
        onScanSuccess(result.data, 'upload');
      } else {
        setDecodeError(
          result.error || 'No QR code detected. Try a clearer image or use the live scanner.'
        );
      }
    } catch (err: any) {
      setDecodeError(`Decoding failed: ${err.message || 'Unknown processing error'}`);
    } finally {
      setIsDecoding(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const resetUploader = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setDecodeError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <div className="rounded-2xl border border-[#DCE9DE] bg-white p-5 sm:p-6 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE9DE]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAF7EC] text-[#2E8B57] flex items-center justify-center">
              <UploadCloud size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F5135]">Upload QR Image</h3>
              <p className="text-[11px] text-[#647067]">PNG, JPG, JPEG, or WebP (Max 10MB)</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#2E8B57] bg-[#EAF7EC] px-2 py-0.5 rounded border border-[#DCE9DE]">
            Client-Side
          </span>
        </div>

        {/* Dropzone */}
        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center space-y-3 ${
              isDragging
                ? 'border-[#2E8B57] bg-[#EAF7EC]/60 scale-[1.01]'
                : 'border-[#DCE9DE] hover:border-[#2E8B57] bg-[#F7FBF7] hover:bg-[#EAF7EC]/30'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white text-[#2E8B57] border border-[#DCE9DE] flex items-center justify-center shadow-xs">
              <UploadCloud size={26} />
            </div>

            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-[#1F5135]">
                Drag and drop your QR code image here, or{' '}
                <span className="text-[#2E8B57] underline">browse files</span>
              </p>
              <p className="text-[11px] text-[#647067]">
                Screenshots, photos from flyers, parking meters, or menus
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          /* Preview and decode result card */
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-[#DCE9DE] bg-[#F7FBF7] flex items-center justify-center max-h-64 p-2">
              <img
                src={previewUrl}
                alt="Selected QR Preview"
                className="max-h-60 w-auto object-contain rounded-lg"
              />
              {(isDecoding || isProcessing) && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-2">
                  <Loader2 size={28} className="text-[#2E8B57] animate-spin" />
                  <span className="text-xs font-bold text-[#1F5135]">Decoding QR Code...</span>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between text-xs text-[#647067] bg-[#F7FBF7] p-2.5 rounded-xl border border-[#DCE9DE] font-mono">
                <div className="flex items-center gap-2 truncate">
                  <ImageIcon size={14} className="text-[#2E8B57] shrink-0" />
                  <span className="truncate">{selectedFile.name}</span>
                </div>
                <span className="shrink-0">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}

            {decodeError && (
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 flex items-start gap-2.5 text-xs text-[#991B1B]">
                <AlertCircle size={16} className="shrink-0 text-[#DC2626] mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-[#DC2626]">No QR Code Detected</span>
                  <p>{decodeError}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={resetUploader}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#24312A] hover:bg-[#F7FBF7] bg-white border border-[#DCE9DE] transition flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Upload Another Image</span>
              </button>
            </div>
          </div>
        )}

        {/* Privacy Note */}
        <div className="pt-2 text-[11px] text-[#647067] flex items-center justify-between border-t border-[#DCE9DE]">
          <span>Images are decoded in your browser. No files are uploaded to third parties.</span>
          <span className="font-mono text-[#2E8B57]">100% Client-Side</span>
        </div>
      </div>
    </div>
  );
};
