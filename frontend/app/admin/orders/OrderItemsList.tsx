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
    <section className="overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-sm">
      <div className="border-b border-[#E5E7EB] bg-[#F7F7F5] px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B9954F]">Production & Inventory</span>
          <h2 className="text-base font-extrabold text-[#0A1B2E]">Ordered Products & Custom Assets</h2>
        </div>
        <span className="rounded-full bg-white border border-[#E5E7EB] px-3 py-1 text-xs font-bold text-[#0A1B2E] shadow-2xs">
          {items.reduce((acc, item) => acc + item.quantity, 0)} Total Units
        </span>
      </div>

      <div className="divide-y divide-[#E5E7EB]">
        {items.map((item, idx) => {
          const hasPrintFiles = Array.isArray(item.printUnits) && item.printUnits.length > 0;
          const totalImagesCount = item.printUnits ? item.printUnits.reduce((sum, u) => sum + u.images.length, 0) : 0;
          
          return (
            <div key={item._id || idx} className="p-6 transition-colors hover:bg-[#FBFAF8]/50">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex gap-4 items-start">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 shrink-0 rounded-[10px] border border-[#E5E7EB] object-cover shadow-2xs"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[10px] bg-[#F7F7F5] border border-[#E5E7EB] text-[10px] font-bold text-[#64748B]">
                      No image
                    </div>
                  )}

                  <div className="flex flex-col space-y-1">
                    <h3 className="text-base font-extrabold text-[#0A1B2E]">{item.name}</h3>
                    <p className="text-xs font-bold text-[#64748B]">
                      Quantity: <strong className="text-[#0A1B2E]">{item.quantity}</strong> × ₹{item.price.toLocaleString('en-IN')}
                    </p>
                    <p className="font-mono text-[10px] text-gray-400">
                      Key: {item.itemKey || item.productId}
                    </p>

                    {item.selections && Object.keys(item.selections).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(item.selections).map(([k, v]) => (
                          <span
                            key={k}
                            className="rounded-[6px] border border-[#E5E7EB] bg-[#F7F7F5] px-2.5 py-1 text-[10px] font-bold text-[#0A1B2E]"
                          >
                            <span className="text-[#64748B] font-medium">{k}:</span> {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] block sm:hidden">Item Total</span>
                  <p className="text-base font-black text-[#0A1B2E]">
                    {currency === "INR" ? "₹" : ""}{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {hasPrintFiles ? (
                <div className="mt-6 rounded-[12px] border border-[#E5E7EB] bg-[#F7F7F5]/70 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-[#E5E7EB] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#B9954F]" />
                        <p className="text-xs font-extrabold text-[#0A1B2E] uppercase tracking-wider">Print Assets Studio</p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#64748B]">
                        Customer custom upload files distributed across {item.quantity} physical production unit{item.quantity !== 1 ? 's' : ''}.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#E5E7EB] px-3 py-1 text-xs font-extrabold text-[#B9954F] shadow-2xs">
                      <span>{totalImagesCount} Print Asset{totalImagesCount !== 1 ? 's' : ''}</span>
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {item.printUnits!.map((unit, uIdx) => (
                      <div key={unit.unitId || uIdx} className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 shadow-2xs">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0A1B2E] uppercase tracking-wider">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#0A1B2E] text-white text-[10px]">
                              {uIdx + 1}
                            </span>
                            Physical Unit {uIdx + 1}
                          </span>
                          <span className="text-[11px] font-bold text-[#64748B] bg-[#F7F7F5] px-2.5 py-0.5 rounded-full border border-[#E5E7EB]">
                            {unit.images.length} file{unit.images.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {unit.images.map((img, iIdx) => {
                            const globalIndex = allImages.findIndex(i => i.url === img.url);
                            return (
                              <div key={img.publicId || iIdx} className="group/thumb flex flex-col gap-1 w-20">
                                <button
                                  type="button"
                                  onClick={() => onOpenViewer(globalIndex !== -1 ? globalIndex : 0)}
                                  className="relative h-20 w-20 overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-[#F7F7F5] transition-all hover:border-[#B9954F] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#B9954F]"
                                  title="Click to inspect high-resolution print asset"
                                >
                                  <img src={img.url} alt="Custom print upload preview" className="h-full w-full object-cover transition-transform group-hover/thumb:scale-105" />
                                  <span className="absolute inset-0 bg-[#0A1B2E]/40 opacity-0 transition-opacity group-hover/thumb:opacity-100 flex items-center justify-center text-white">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                  </span>
                                </button>
                                <p className="text-[9px] font-mono text-center text-[#64748B] truncate w-full" title={img.publicId}>
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
                <div className="mt-5 rounded-[12px] border border-dashed border-[#E5E7EB] bg-[#F7F7F5]/50 p-4 text-center">
                  <p className="text-xs font-semibold text-[#64748B]">No custom print files attached to this product</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}