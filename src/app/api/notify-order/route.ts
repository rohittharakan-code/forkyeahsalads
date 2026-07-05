import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { total, items, address, phone, payment_method } = body;

    const supabase = await createClient();

    const { data: settings } = await supabase
      .from("site_settings")
      .select("whatsapp_number")
      .single();

    const whatsappNumber = settings?.whatsapp_number;
    if (!whatsappNumber) {
      return NextResponse.json({ ok: false, reason: "no_whatsapp" });
    }

    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");

    const itemLines = items
      .map((i: { name: string; quantity: number; price: number }) => `  ${i.name} x${i.quantity} — ₹${(i.price * i.quantity).toFixed(0)}`)
      .join("\n");

    const paymentLabel = payment_method === "proof_upload" ? "Online (Proof Uploaded)" : "Cash on Delivery";

    const message = `🥗 New Order on Fork Yeah Salads!

${itemLines}

Total: ₹${Number(total).toFixed(0)}
Payment: ${paymentLabel}
Phone: ${phone}
Address: ${address}`;

    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({ ok: true, whatsapp_url: waUrl });
  } catch {
    return NextResponse.json({ ok: false, reason: "error" }, { status: 500 });
  }
}
