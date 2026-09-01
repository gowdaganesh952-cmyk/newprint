// path: frontend/components/admin/orders/OrderItemsList.tsx
import { OrderItem } from "@/app/admin/orders/[id]/page";

interface OrderItemsListProps {
  items: OrderItem[];
  currency: string;
  allImages: { url: string; publicId: string; productName: string; unitIndex: number }[];
  onOpenViewer: (index: number) => void;
}

export default function OrderItemsList({ items, currency, allImages, onOpenViewer }: OrderItemsListProps) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h2 className="text-base font-bold text-[#0A1B2E]">
          Ordered Products & Custom Photos
        </h2>
      </div>

      <div className="divide-y divide-[#E5E7EB]">
        {items.map((item, idx) => {
          const hasPrintFiles = Array.isArray(item.printUnits) && item.printUnits.length > 0;
          
          return (
            <div key={item._id || idx} className="p-5">
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="flex gap-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 shrink-0 rounded-[8px] border border-[#E5E7EB] object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[8px] bg-[#F7F7F5] border border-[#E5E7EB] text-xs text-[#64748B]">
                      No image
                    </div>
                  )}

                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-[#0A1B2E]">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-[#64748B]">
                      Qty: {item.quantity} × {currency === "INR" ? "₹" : ""}{item.price}
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      Item Key: {item.itemKey || item.productId}
                    </p>

                    {item.selections && Object.keys(item.selections).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(item.selections).map(([k, v]) => (
                          <span
                            key={k}
                            className="rounded-[4px] border border-[#E5E7EB] bg-[#F7F7F5] px-2 py-1 text-[10px] font-medium text-[#64748B]"
                          >
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm font-extrabold text-[#0A1B2E]">
                  {currency === "INR" ? "₹" : ""}{item.price * item.quantity}
                </p>
              </div>

              {hasPrintFiles ? (
                <div className="mt-5 rounded-[8px] border border-[#E5E7EB] bg-[#FAFAF8] p-4">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-xs font-bold text-[#0A1B2E]">Attached Printing Files</p>
                      <p className="mt-0.5 text-[10px] text-[#64748B]">
                        Customer uploaded files distributed across {item.quantity} physical unit{item.quantity !== 1 ? 's' : ''}.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-[#B9954F] bg-white border border-[#E5E7EB] px-2 py-1 rounded">
                      {item.printUnits!.reduce((sum, u) => sum + u.images.length, 0)} Total Images
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {item.printUnits!.map((unit, uIdx) => (
                      <div key={unit.unitId || uIdx} className="border-t border-[#E5E7EB]/80 pt-3 first:border-t-0 first:pt-0">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#0A1B2E]">PHYSICAL UNIT {uIdx + 1}</span>
                          <span className="text-[10px] text-[#64748B]">{unit.images.length} file(s)</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {unit.images.map((img, iIdx) => {
                            const globalIndex = allImages.findIndex(i => i.url === img.url);
                            return (
                              <div key={img.publicId || iIdx} className="flex flex-col gap-1 w-[72px]">
                                <button
                                  type="button"
                                  onClick={() => onOpenViewer(globalIndex !== -1 ? globalIndex : 0)}
                                  className="group relative h-[72px] w-[72px] overflow-hidden rounded-[6px] border border-[#E5E7EB] bg-white transition-all hover:border-[#B9954F] shadow-sm"
                                >
                                  <img src={img.url} alt="Custom print upload" className="h-full w-full object-cover" />
                                  <span className="absolute inset-0 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                  </span>
                                </button>
                                <p className="text-[8px] text-center text-gray-400 truncate w-full" title={img.publicId}>
                                  {img.publicId.split('/').pop()}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[8px] border border-dashed border-[#E5E7EB] bg-gray-50/50 p-4 text-center">
                  <p className="text-xs font-semibold text-[#64748B]">No print files attached</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}