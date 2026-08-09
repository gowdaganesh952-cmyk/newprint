"use client";

export default function CategorySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex h-[200px] flex-col rounded-[9px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex animate-pulse items-center justify-between">
            <div className="h-5 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-12 rounded-full bg-gray-200" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-3 w-4/5 rounded bg-gray-200" />
          </div>
          <div className="mt-auto flex gap-2">
            <div className="h-4 w-8 rounded bg-gray-200" />
            <div className="h-4 w-8 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}