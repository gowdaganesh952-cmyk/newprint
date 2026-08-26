import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

interface PrintImage {
  url: string;
  publicId: string;
}

interface PrintUnit {
  unitId: string;
  images: PrintImage[];
}

interface OrderItem {
  _id?: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  selections?: Record<
    string,
    unknown
  >;
  printUnits?: PrintUnit[];
}

interface ShippingAddress {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  items?: OrderItem[];
  shippingAddress?: ShippingAddress;
}

interface OrderResponse {
  order: Order;
}

async function fetchOrder(
  id: string,
  token: string | null
): Promise<Order | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/orders/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return null;
    }

    const data =
      (await res.json()) as OrderResponse;

    return data.order || null;
  } catch (error) {
    console.error(
      "Fetch order error:",
      error
    );

    return null;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "Delivered":
      return "border-green-100 bg-green-50 text-green-700";

    case "Shipped":
      return "border-blue-100 bg-blue-50 text-blue-700";

    case "Processing":
      return "border-[#B9954F]/20 bg-[#B9954F]/10 text-[#9A7839]";

    case "Cancelled":
      return "border-red-100 bg-red-50 text-red-600";

    default:
      return "border-slate-100 bg-slate-50 text-slate-600";
  }
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { getToken } = await auth();

  const token = await getToken();

  const order = await fetchOrder(
    id,
    token
  );

  if (!order) {
    notFound();
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#B9954F]">
            Order Details
          </p>

          <h2 className="mt-1 break-words text-xl font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-2xl">
            #{order.orderNumber}
          </h2>
        </div>

        <Link
          href="/dashboard/orders"
          className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#0A1B2E] transition-all hover:border-[#B9954F]/50 hover:bg-[#F7F7F5] active:scale-[0.98]"
        >
          ← Orders
        </Link>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        {/* ====================================================
            PRODUCTS
        ==================================================== */}

        <section className="min-w-0 overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
          <div className="border-b border-[#E5E7EB] bg-[#F7F7F5] px-4 py-4 sm:px-5">
            <h3 className="font-bold text-[#0A1B2E]">
              Products
            </h3>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {order.items?.map(
              (item, index) => (
                <div
                  key={
                    item._id ||
                    `${item.name}-${index}`
                  }
                  className="p-4 sm:p-5"
                >
                  <div className="flex min-w-0 gap-3 sm:gap-4">
                    {/* Image */}

                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 shrink-0 rounded-[10px] border border-[#E5E7EB] object-cover sm:h-24 sm:w-24"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-[#F7F7F5] sm:h-24 sm:w-24">
                        <span className="text-[10px] text-[#64748B]">
                          No Image
                        </span>
                      </div>
                    )}

                    {/* Information */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <h4 className="break-words text-sm font-bold text-[#0A1B2E] sm:text-base">
                          {item.name}
                        </h4>

                        <p className="shrink-0 text-sm font-extrabold text-[#0A1B2E] sm:ml-4">
                          ₹{item.price}
                        </p>
                      </div>

                      <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
                        Quantity:{" "}
                        {item.quantity}
                      </p>

                      {item.selections &&
                        Object.keys(
                          item.selections
                        ).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(
                              item.selections
                            ).map(
                              ([
                                key,
                                value,
                              ]) => (
                                <p
                                  key={key}
                                  className="break-words text-xs text-[#64748B]"
                                >
                                  <span className="font-medium text-[#0A1B2E]">
                                    {key}:
                                  </span>{" "}
                                  {String(
                                    value
                                  )}
                                </p>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* ====================================================
            RIGHT SIDE
        ==================================================== */}

        <div className="min-w-0 space-y-5">
          {/* Summary */}

          <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
            <h3 className="mb-4 font-bold text-[#0A1B2E]">
              Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 text-[#64748B]">
                <span>Subtotal</span>

                <span className="font-medium text-[#0A1B2E]">
                  ₹{order.subtotal}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-[#64748B]">
                <span>Delivery</span>

                <span className="font-medium text-[#0A1B2E]">
                  ₹{order.deliveryFee}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-[#E5E7EB] pt-3">
                <span className="font-bold text-[#0A1B2E]">
                  Total
                </span>

                <span className="text-lg font-extrabold text-[#0A1B2E]">
                  ₹{order.totalAmount}
                </span>
              </div>
            </div>
          </section>

          {/* Status */}

          <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
            <h3 className="mb-4 font-bold text-[#0A1B2E]">
              Status & Info
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[#64748B]">
                  Order Date
                </p>

                <p className="mt-1 font-medium text-[#0A1B2E]">
                  {new Date(
                    order.createdAt
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[#64748B]">
                  Order Status
                </p>

                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <div>
                <p className="text-[#64748B]">
                  Payment Status
                </p>

                <p className="mt-1 font-medium text-[#0A1B2E]">
                  {order.paymentStatus}
                </p>
              </div>
            </div>
          </section>

          {/* Shipping */}

          <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
            <h3 className="mb-4 font-bold text-[#0A1B2E]">
              Shipping Address
            </h3>

            <div className="space-y-1 text-sm leading-6 text-[#0A1B2E]">
              <p className="font-semibold">
                {
                  order.shippingAddress
                    ?.fullName
                }
              </p>

              <p>
                {
                  order.shippingAddress
                    ?.phone
                }
              </p>

              <p className="pt-1">
                {
                  order.shippingAddress
                    ?.addressLine1
                }
              </p>

              {order.shippingAddress
                ?.addressLine2 && (
                <p>
                  {
                    order.shippingAddress
                      .addressLine2
                  }
                </p>
              )}

              <p>
                {
                  order.shippingAddress
                    ?.city
                }
                ,{" "}
                {
                  order.shippingAddress
                    ?.state
                }{" "}
                {
                  order.shippingAddress
                    ?.pincode
                }
              </p>

              {order.shippingAddress
                ?.landmark && (
                <p className="pt-1 text-[#64748B]">
                  Landmark:{" "}
                  {
                    order.shippingAddress
                      .landmark
                  }
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Home */}

      <div className="pt-1">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-5 text-sm font-semibold text-[#0A1B2E] transition-all hover:border-[#B9954F]/50 hover:bg-[#F7F7F5] active:scale-[0.98]"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}