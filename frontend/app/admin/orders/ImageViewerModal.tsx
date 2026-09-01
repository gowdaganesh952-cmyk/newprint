// path: frontend/components/admin/orders/ImageViewerModal.tsx
import { Dispatch, SetStateAction } from "react";

interface ImageViewerModalProps {
  viewerIndex: number | null;
  setViewerIndex: Dispatch<SetStateAction<number | null>>;
  allImages: { url: string; publicId: string; productName: string; unitIndex: number }[];
}

export default function ImageViewerModal({ viewerIndex, setViewerIndex, allImages }: ImageViewerModalProps) {
  if (viewerIndex === null || allImages.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm touch-none">
      <div className="absolute top-4 right-4 z-10 flex gap-4">
        <a
          href={allImages[viewerIndex].url}
          target="_blank"
          download
          rel="noreferrer"
          className="flex h-10 items-center rounded bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/20 transition"
        >
          Download Original
        </a>
        <button
          onClick={() => setViewerIndex(null)}
          className="flex h-10 items-center justify-center rounded bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/20 transition"
        >
          Close (✕)
        </button>
      </div>

      {allImages.length > 1 && (
        <>
          <button 
            onClick={() => setViewerIndex((prev) => (prev! > 0 ? prev! - 1 : allImages.length - 1))}
            className="absolute left-4 p-4 text-white/50 hover:text-white transition hidden md:block"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={() => setViewerIndex((prev) => (prev! < allImages.length - 1 ? prev! + 1 : 0))}
            className="absolute right-4 p-4 text-white/50 hover:text-white transition hidden md:block"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}

      <div className="relative max-h-[90dvh] max-w-5xl w-full flex flex-col items-center justify-center">
        <img
          src={allImages[viewerIndex].url}
          alt="High resolution print preview"
          className="max-h-[75dvh] max-w-full rounded-[4px] object-contain shadow-2xl"
        />
        <div className="mt-4 text-center">
          <p className="text-white font-bold text-sm">
            {allImages[viewerIndex].productName} — Unit {allImages[viewerIndex].unitIndex}
          </p>
          <p className="text-white/60 text-xs mt-1 font-mono">{allImages[viewerIndex].publicId}</p>
          <p className="text-white/40 text-[10px] mt-2 tracking-widest">
            IMAGE {viewerIndex + 1} OF {allImages.length}
          </p>
        </div>
        
        {allImages.length > 1 && (
          <div className="mt-6 flex gap-8 md:hidden">
            <button onClick={() => setViewerIndex((prev) => (prev! > 0 ? prev! - 1 : allImages.length - 1))} className="text-white px-4 py-2 bg-white/10 rounded">Prev</button>
            <button onClick={() => setViewerIndex((prev) => (prev! < allImages.length - 1 ? prev! + 1 : 0))} className="text-white px-4 py-2 bg-white/10 rounded">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}