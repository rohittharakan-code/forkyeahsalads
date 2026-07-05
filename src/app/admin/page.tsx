"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { SaladItem, SiteSettings, Order, OrderStatus, ProteinOption } from "@/lib/types";
import { OrderStatusBadge } from "@/components/order-status-badge";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  ExternalLink,
  X,
  Check,
  CalendarDays,
} from "lucide-react";

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function formatStatus(s: string) {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<"menu" | "orders" | "settings">("menu");

  const tabLabels: Record<typeof tab, string> = {
    menu: "Menu Items",
    orders: "Orders",
    settings: "Settings",
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-forest mb-6">
        Admin Dashboard
      </h1>

      <div className="flex gap-2 mb-8">
        {(["menu", "orders", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "bg-primary text-white"
                : "bg-white text-muted border border-black/[0.06] hover:text-forest"
            }`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === "menu" && <MenuTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

/* ========================================
   MENU ITEMS TAB
   ======================================== */

interface SaladForm {
  name: string;
  description: string;
  price: string;
  category: string;
  available_date: string;
}

const emptyForm: SaladForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  available_date: "",
};

function MenuTab() {
  const supabase = createClient();
  const [items, setItems] = useState<SaladItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SaladForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [ingredientsInput, setIngredientsInput] = useState("");
  const [proteinOptions, setProteinOptions] = useState<ProteinOption[]>([]);
  const [newProteinName, setNewProteinName] = useState("");
  const [newProteinPrice, setNewProteinPrice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchItems() {
    const { data } = await supabase
      .from("salad_items")
      .select("*")
      .order("available_date", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setIngredientsInput("");
    setProteinOptions([]);
    setImageFile(null);
    setShowForm(true);
  }

  function openEdit(item: SaladItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      available_date: item.available_date ?? "",
    });
    setIngredientsInput(item.ingredients?.join(", ") ?? "");
    setProteinOptions(item.protein_options ?? []);
    setImageFile(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setIngredientsInput("");
    setProteinOptions([]);
    setImageFile(null);
  }

  function addProtein() {
    if (!newProteinName.trim() || !newProteinPrice.trim()) return;
    setProteinOptions((prev) => [
      ...prev,
      { name: newProteinName.trim(), price: parseFloat(newProteinPrice) },
    ]);
    setNewProteinName("");
    setNewProteinPrice("");
  }

  function removeProtein(index: number) {
    setProteinOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("salad-images")
      .upload(path, file);
    if (error) throw error;
    const {
      data: { publicUrl },
    } = supabase.storage.from("salad-images").getPublicUrl(path);
    return publicUrl;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      let image_url: string | undefined;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        available_date: form.available_date || null,
        protein_options: proteinOptions,
        ingredients: ingredientsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (image_url) payload.image_url = image_url;

      if (editingId) {
        await supabase.from("salad_items").update(payload).eq("id", editingId);
      } else {
        if (!image_url) {
          alert("Please upload an image for the new salad.");
          setSaving(false);
          return;
        }
        payload.image_url = image_url;
        await supabase.from("salad_items").insert(payload);
      }

      closeForm();
      await fetchItems();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check the console for details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this salad item?")) return;
    await supabase.from("salad_items").delete().eq("id", id);
    await fetchItems();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold font-display text-forest">
          Menu Items
        </h2>
        {!showForm && (
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-primary rounded-xl px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            Add Salad
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[14px] p-6 border border-black/6 mb-8 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold font-display text-forest">
              {editingId ? "Edit Salad" : "New Salad"}
            </h3>
            <button type="button" onClick={closeForm}>
              <X className="h-5 w-5 text-muted hover:text-forest" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-forest mb-1">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-black/6 bg-white px-3 py-2 text-sm text-forest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest mb-1">Price (₹)</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-xl border border-black/6 bg-white px-3 py-2 text-sm text-forest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest mb-1">Category</label>
              <input
                type="text"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-black/6 bg-white px-3 py-2 text-sm text-forest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest mb-1">Available Date</label>
              <input
                type="date"
                required
                value={form.available_date}
                onChange={(e) => setForm({ ...form, available_date: e.target.value })}
                className="w-full rounded-xl border border-black/6 bg-white px-3 py-2 text-sm text-forest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest mb-1">Image</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-mint file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-sage/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-forest mb-1.5">Description</label>
            <textarea
              required
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest mb-1.5">
              Ingredients <span className="text-xs text-muted font-normal">(comma-separated)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Romaine, Parmesan, Croutons, Caesar Dressing"
              value={ingredientsInput}
              onChange={(e) => setIngredientsInput(e.target.value)}
              className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
            />
          </div>

          {/* Protein Options */}
          <div>
            <label className="block text-sm font-medium text-forest mb-1.5">
              Protein Add-ons
            </label>
            {proteinOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {proteinOptions.map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-mint text-primary text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    {p.name} +₹{p.price.toFixed(0)}
                    <button type="button" onClick={() => removeProtein(i)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Chicken"
                value={newProteinName}
                onChange={(e) => setNewProteinName(e.target.value)}
                className="flex-1 rounded-xl border border-black/6 bg-white px-3 py-2 text-sm text-forest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="number"
                placeholder="Price"
                min="0"
                step="1"
                value={newProteinPrice}
                onChange={(e) => setNewProteinPrice(e.target.value)}
                className="w-24 rounded-xl border border-black/6 bg-white px-3 py-2 text-sm text-forest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={addProtein}
                className="rounded-xl bg-mint px-3 py-2 text-sm font-medium text-primary hover:bg-sage/30 transition"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary rounded-xl px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-black/6 px-5 py-2 text-sm font-medium text-muted hover:bg-cream transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          No salad items yet. Click &ldquo;Add Salad&rdquo; to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-white rounded-[14px] p-4 border border-black/6"
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-forest truncate">{item.name}</p>
                <p className="text-sm text-muted">
                  ₹{item.price.toFixed(0)} &middot; {item.category}
                </p>
                {item.protein_options && item.protein_options.length > 0 && (
                  <p className="text-xs text-muted/70 mt-0.5">
                    Proteins: {item.protein_options.map((p) => `${p.name} +₹${p.price}`).join(", ")}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-mint text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                  <CalendarDays className="w-3 h-3" />
                  {item.available_date ? formatDate(item.available_date) : "No date"}
                </span>
              </div>

              <button
                onClick={() => openEdit(item)}
                className="rounded-lg p-2 text-muted hover:bg-cream hover:text-forest transition"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-500 transition"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========================================
   ORDERS TAB
   ======================================== */

function OrdersTab() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(full_name, email, phone)")
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    setUpdatingId(orderId);
    await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    await fetchOrders();
    setUpdatingId(null);
  }

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-white text-muted border border-black/6 hover:text-forest"
            }`}
          >
            {s === "all" ? "All" : formatStatus(s)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">No orders found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-[14px] p-5 border border-black/6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-mono text-xs text-muted">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm font-medium text-forest mt-0.5">
                    {order.profiles?.full_name ?? "Unknown Customer"}
                  </p>
                  <p className="text-xs text-muted">
                    {order.profiles?.email}
                    {order.profiles?.phone && ` · ${order.profiles.phone}`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <p className="text-xs text-muted">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <ul className="text-sm text-forest space-y-1 mb-3">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>
                      {item.name} &times; {item.quantity}
                      {item.proteins && item.proteins.length > 0 && (
                        <span className="text-xs text-muted ml-1">
                          ({item.proteins.map((p) => p.name).join(", ")})
                        </span>
                      )}
                      {item.delivery_date && (
                        <span className="text-xs text-muted ml-1">
                          — {formatDate(item.delivery_date)}
                        </span>
                      )}
                    </span>
                    <span className="text-primary font-display">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/6 pt-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted capitalize">
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
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Proof
                      </a>
                    )}

                  <p className="font-display font-bold text-forest text-base">
                    ₹{order.total.toFixed(0)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {updatingId === order.id && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateStatus(order.id, e.target.value as OrderStatus)
                    }
                    disabled={updatingId === order.id}
                    className="rounded-xl border border-black/6 bg-white px-3 py-1.5 text-sm text-forest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {formatStatus(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========================================
   SETTINGS TAB
   ======================================== */

function SettingsTab() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const [fssaiLicense, setFssaiLicense] = useState("");
  const [shopLatitude, setShopLatitude] = useState("");
  const [shopLongitude, setShopLongitude] = useState("");
  const [deliveryRadius, setDeliveryRadius] = useState("10");
  const [upiAddress, setUpiAddress] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const qrFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .single();
      if (data) {
        setSettings(data as SiteSettings);
        setFssaiLicense(data.fssai_license ?? "");
        setShopLatitude(data.shop_latitude != null ? String(data.shop_latitude) : "");
        setShopLongitude(data.shop_longitude != null ? String(data.shop_longitude) : "");
        setDeliveryRadius(String(data.delivery_radius_km ?? 10));
        setUpiAddress(data.upi_address ?? "");
        setQrCodeUrl(data.qr_code_url ?? "");
        setWhatsappNumber(data.whatsapp_number ?? "");
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaved(false);

    try {
      let uploadedQrUrl = qrCodeUrl;

      if (qrFile) {
        const ext = qrFile.name.split(".").pop() ?? "png";
        const path = `qr-code.${ext}`;
        await supabase.storage.from("salad-images").upload(path, qrFile, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from("salad-images").getPublicUrl(path);
        uploadedQrUrl = publicUrl;
      }

      const payload = {
        fssai_license: fssaiLicense || null,
        shop_latitude: shopLatitude ? parseFloat(shopLatitude) : null,
        shop_longitude: shopLongitude ? parseFloat(shopLongitude) : null,
        delivery_radius_km: parseFloat(deliveryRadius) || 10,
        upi_address: upiAddress || null,
        qr_code_url: uploadedQrUrl || null,
        whatsapp_number: whatsappNumber || null,
      };

      const { error } = await supabase
        .from("site_settings")
        .update(payload)
        .eq("id", settings.id);

      if (error) throw error;

      setQrCodeUrl(uploadedQrUrl);
      setQrFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save settings. Check console for details.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-forest mb-6">
        Site Settings
      </h2>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-[14px] p-5 border border-black/[0.06] space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-forest mb-1.5">
            FSSAI License Number
          </label>
          <input
            type="text"
            maxLength={14}
            placeholder="14-digit FSSAI license"
            value={fssaiLicense}
            onChange={(e) => setFssaiLicense(e.target.value)}
            className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-forest mb-1.5">
            Shop Location
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={shopLatitude}
              onChange={(e) => setShopLatitude(e.target.value)}
              className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={shopLongitude}
              onChange={(e) => setShopLongitude(e.target.value)}
              className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            />
          </div>
          <p className="text-xs text-muted mt-1">Enter your shop&apos;s GPS coordinates</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-forest mb-1.5">
            Delivery Radius (km)
          </label>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 10"
            value={deliveryRadius}
            onChange={(e) => setDeliveryRadius(e.target.value)}
            className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
          />
        </div>

        <hr className="border-black/[0.06]" />

        <div>
          <label className="block text-sm font-medium text-forest mb-1.5">
            UPI Address
          </label>
          <input
            type="text"
            placeholder="e.g. forkyeahsalads@upi"
            value={upiAddress}
            onChange={(e) => setUpiAddress(e.target.value)}
            className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
          />
          <p className="text-xs text-muted mt-1">Shown to customers at checkout for payment</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-forest mb-1.5">
            Payment QR Code
          </label>
          {qrCodeUrl && !qrFile && (
            <div className="mb-3">
              <img
                src={qrCodeUrl}
                alt="Payment QR Code"
                className="w-32 h-32 object-contain rounded-xl border border-black/[0.06]"
              />
            </div>
          )}
          <input
            ref={qrFileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setQrFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-mint file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-sage/30"
          />
          <p className="text-xs text-muted mt-1">Upload your UPI / payment QR code image</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-forest mb-1.5">
            WhatsApp Number for Order Alerts
          </label>
          <input
            type="tel"
            placeholder="e.g. +91 98765 43210"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
          />
          <p className="text-xs text-muted mt-1">New order notifications will be sent to this number</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Settings
          </button>

          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
              <Check className="h-4 w-4" />
              Settings saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
