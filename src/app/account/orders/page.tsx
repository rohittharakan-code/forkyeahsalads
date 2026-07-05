"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Package, ExternalLink, Loader2 } from "lucide-react";

export default function OrderHistoryPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setOrders(data ?? []);
      setLoading(false);
    }

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <Package className="h-16 w-16 text-sage mb-4" />
        <h2 className="text-xl font-semibold font-display text-forest">
          No orders yet
        </h2>
        <p className="mt-2 text-sm text-muted">
          Once you place an order, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-forest mb-6">
        Your Orders
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-[14px] p-5 border border-black/6"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-mono text-xs text-muted">
                  #{order.id.slice(0, 8)}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Items */}
            <ul className="text-sm text-forest space-y-1 mb-3">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>
                    {item.name} &times; {item.quantity}
                  </span>
                  <span className="text-primary font-display">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-black/6 pt-3">
              <div className="flex items-center gap-3 text-sm text-muted">
                <span className="capitalize">
                  {order.payment_method === "proof_upload"
                    ? "Online (Proof)"
                    : "Cash on Delivery"}
                </span>

                {order.payment_method === "proof_upload" &&
                  order.payment_proof_url && (
                    <a
                      href={order.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View proof
                    </a>
                  )}
              </div>

              <p className="font-display font-bold text-forest text-base">
                ₹{order.total.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
