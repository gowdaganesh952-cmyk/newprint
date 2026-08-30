export default function LoadingSkeleton() {
  return (
    <div className="min-w-0 animate-pulse space-y-6 pb-8 sm:space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-[#E5E7EB]"></div>
          <div className="h-8 w-48 rounded bg-[#E5E7EB]"></div>
          <div className="h-4 w-32 rounded bg-[#E5E7EB]"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-11 w-32 rounded-[10px] bg-[#E5E7EB]"></div>
          <div className="h-11 w-32 rounded-[10px] bg-[#E5E7EB]"></div>
        </div>
      </div>

      {/* Main Tracking Card Skeleton */}
      <div className="rounded-[14px] border border-[#E5E7EB] bg-white">
        <div className="border-b border-[#E5E7EB] bg-[#F7F7F5] px-5 py-4">
          <div className="h-5 w-32 rounded bg-[#E5E7EB]"></div>
        </div>
        <div className="p-5 sm:p-8 space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[#E5E7EB]"></div>
              <div className="space-y-2 flex-1 pt-1">
                <div className="h-5 w-32 rounded bg-[#E5E7EB]"></div>
                <div className="h-4 w-64 rounded bg-[#E5E7EB]"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Layout Skeleton */}
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <div className="h-64 rounded-[14px] bg-white border border-[#E5E7EB]"></div>
        <div className="space-y-5">
          <div className="h-48 rounded-[14px] bg-white border border-[#E5E7EB]"></div>
          <div className="h-40 rounded-[14px] bg-white border border-[#E5E7EB]"></div>
        </div>
      </div>
    </div>
  );
}