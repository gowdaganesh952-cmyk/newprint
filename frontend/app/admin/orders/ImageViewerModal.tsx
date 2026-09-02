// path: frontend/components/admin/orders/ImageViewerModal.tsx
import { Dispatch, SetStateAction, useEffect } from "react";

interface ImageViewerModalProps {
  viewerIndex: number | null;
  setViewerIndex: Dispatch<SetStateAction<number | null>>;
  allImages: { url: string; publicId: string; productName: string; unitIndex: number }[];
}

export default function ImageViewerModal({ viewerIndex, setViewerIndex, allImages }: ImageViewerModalProps) {
  useEffect(() => {
    if (viewerIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerIndex(null);
      if (e.key === "ArrowRight") {
        setViewerIndex((prev) => (prev !== null && prev < allImages.length - 1 ? prev + 1 : 0));
      }
      if (e.key === "ArrowLeft") {
        setViewerIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : allImages.length - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewerIndex, allImages.length, setViewerIndex]);

  if (viewerIndex === null || allImages.length === 0) return null;

  const currentImage = allImages[viewerIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A1B2E]/95 p-4 backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between bg-black/40 px-6 py-4 backdrop-blur-sm border-b border-white/10 z-20">
        <div className="flex items-center gap-3">
          <span className="rounded bg-[#B9954F] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
            Asset {viewerIndex + 1} of {allImages.length}
          </span>
          <p className="text-xs font-bold text-white truncate max-w-xs md:max-w-md">
            {currentImage.productName} — Unit {currentImage.unitIndex}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={currentImage.url}
            target="_blank"
            download
            rel="noreferrer"
            className="flex h-9 items-center rounded-lg bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/20 transition-all border border-white/10"
          >
            Download Original
          </a>
          <button
            onClick={() => setViewerIndex(null)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-red-600/80 transition-all border border-white/10"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Side Navigation Arrows */}
      {allImages.length > 1 && (
        <>
          <button 
            onClick={() => setViewerIndex((prev) => (prev! > 0 ? prev! - 1 : allImages.length - 1))}
            className="absolute left-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#B9954F] transition-all border border-white/10 shadow-2xl backdrop-blur-sm hidden md:flex"
            title="Previous Image (Left Arrow)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={() => setViewerIndex((prev) => (prev! < allImages.length - 1 ? prev! + 1 : 0))}
            className="absolute right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#B9954F] transition-all border border-white/10 shadow-2xl backdrop-blur-sm hidden md:flex"
            title="Next Image (Right Arrow)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}

      {/* Main Image Framing & Metadata */}
      <div className="relative mt-12 max-h-[82dvh] max-w-5xl w-full flex flex-col items-center justify-center p-4">
        <div className="relative overflow-hidden rounded-[12px] border border-white/10 bg-black/50 shadow-2xl max-h-[68dvh] flex items-center justify-center p-2">
          <img
            src={currentImage.url}
            alt="High resolution print preview asset"
            className="max-h-[64dvh] max-w-full rounded-[8px] object-contain"
          />
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-white/60 font-mono text-[11px] tracking-wider select-all">
            PUBLIC ID: {currentImage.publicId}
          </p>
        </div>
        
        {allImages.length > 1 && (
          <div className="mt-4 flex gap-4 md:hidden">
            <button onClick={() => setViewerIndex((prev) => (prev! > 0 ? prev! - 1 : allImages.length - 1))} className="text-white px-5 py-2.5 bg-white/10 rounded-lg text-xs font-bold border border-white/10">← Prev</button>
            <button onClick={() => setViewerIndex((prev) => (prev! < allImages.length - 1 ? prev! + 1 : 0))} className="text-white px-5 py-2.5 bg-white/10 rounded-lg text-xs font-bold border border-white/10">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}