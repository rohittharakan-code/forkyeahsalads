import type { OrderStatus } from "@/lib/types";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-terracotta/15 text-terracotta",
  confirmed: "bg-primary/15 text-primary",
  preparing: "bg-sage/30 text-forest",
  out_for_delivery: "bg-golden/20 text-forest",
  delivered: "bg-mint text-primary",
  cancelled: "bg-red-100 text-red-700",
};

function formatStatus(status: OrderStatus): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}
