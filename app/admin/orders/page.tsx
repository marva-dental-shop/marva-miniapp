"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

type OrderProductItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  price: number;
};

type OrderItem = {
  id: number;
  full_name: string;
  phone: string;
  address: string;
  total_amount: number;
  order_status: string;
  delivery_status: string;
  courier_name: string | null;
  courier_phone: string | null;
  pickup_point: string | null;
  delivery_note: string | null;
  note: string | null;
  created_at: string;
  order_items?: OrderProductItem[];
};

type CourierDraft = {
  courier_name: string;
  courier_phone: string;
  pickup_point: string;
  delivery_note: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingOrderId, setSendingOrderId] = useState<number | null>(null);
  const [courierDrafts, setCourierDrafts] = useState<Record<number, CourierDraft>>({});

  const loadOrders = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("id", { ascending: false });

      if (ordersError) {
        console.log(ordersError);
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("id, order_id, product_id, product_name, quantity, price");

      if (itemsError) {
        console.log(itemsError);
        setOrders((ordersData as OrderItem[]) || []);
        setLoading(false);
        return;
      }

      const itemsByOrderId = new Map<number, OrderProductItem[]>();

      (itemsData || []).forEach((item: any) => {
        const orderId = Number(item.order_id);

        if (!itemsByOrderId.has(orderId)) {
          itemsByOrderId.set(orderId, []);
        }

        itemsByOrderId.get(orderId)?.push({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
        });
      });

      const mergedOrders: OrderItem[] = (ordersData || []).map((order: any) => ({
        ...order,
        order_items: itemsByOrderId.get(Number(order.id)) || [],
      }));

      setOrders(mergedOrders);

      const nextDrafts: Record<number, CourierDraft> = {};
      mergedOrders.forEach((order) => {
        nextDrafts[order.id] = {
          courier_name: order.courier_name || "",
          courier_phone: order.courier_phone || "",
          pickup_point: order.pickup_point || "",
          delivery_note: order.delivery_note || "",
        };
      });
      setCourierDrafts(nextDrafts);

      setLoading(false);
    } catch (err) {
      console.log(err);
      setOrders([]);
      setLoading(false);
    }
  };

  const updateOrderByApi = async (
    orderId: number,
    payload: Partial<{
      order_status: string;
      delivery_status: string;
      courier_name: string;
      courier_phone: string;
      pickup_point: string;
      delivery_note: string;
    }>
  ) => {
    try {
      const res = await fetch("/api/orders/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          ...payload,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Status update bo‘lmadi");
        return false;
      }

      return data.order as OrderItem;
    } catch (error) {
      console.log("updateOrderByApi error:", error);
      alert("Status update API xatosi");
      return false;
    }
  };

  const setCourierDraftField = (
    orderId: number,
    field: keyof CourierDraft,
    value: string
  ) => {
    setCourierDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {
          courier_name: "",
          courier_phone: "",
          pickup_point: "",
          delivery_note: "",
        }),
        [field]: value,
      },
    }));
  };

  const saveCourierDraft = async (orderId: number) => {
    const draft = courierDrafts[orderId];
    if (!draft) return true;

    const updated = await updateOrderByApi(orderId, {
      courier_name: draft.courier_name,
      courier_phone: draft.courier_phone,
      pickup_point: draft.pickup_point,
      delivery_note: draft.delivery_note,
    });

    return !!updated;
  };

  const sendCourierTelegramMessage = async (
    order: OrderItem,
    draft: CourierDraft
  ) => {
    try {
      const res = await fetch("/api/telegram/courier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          fullName: order.full_name,
          phone: order.phone,
          address: order.address,
          pickupPoint: draft.pickup_point,
          courierName: draft.courier_name,
          courierPhone: draft.courier_phone,
          deliveryNote: draft.delivery_note,
          items: order.order_items || [],
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || data.error?.description || "Telegramga yuborilmadi");
        return false;
      }

      return true;
    } catch (error) {
      console.log("Telegram fetch error:", error);
      alert("API route yoki fetch xatosi bor");
      return false;
    }
  };

  const isCourierAlreadySent = (order: OrderItem) => {
    return ["Dastavkaga berildi", "Yo‘lda", "Yetkazib berdi"].includes(
      order.delivery_status
    );
  };

  const getDeliveryBadge = (status: string) => {
    if (status === "Dastavkaga berildi") {
      return {
        label: "Kuryerga yuborildi",
        className: "bg-blue-100 text-blue-700",
      };
    }

    if (status === "Yo‘lda") {
      return {
        label: "Yo‘lda",
        className: "bg-amber-100 text-amber-700",
      };
    }

    if (status === "Yetkazib berdi") {
      return {
        label: "Yetkazildi",
        className: "bg-green-100 text-green-700",
      };
    }

    if (status === "Yetkazib bera olmadi") {
      return {
        label: "Yetkazib bera olmadi",
        className: "bg-red-100 text-red-700",
      };
    }

    return null;
  };

  const getOrderBadge = (status: string) => {
    if (status === "Yangi") {
      return {
        label: "Yangi buyurtma",
        className: "bg-slate-100 text-slate-700",
      };
    }

    if (status === "Tasdiqlandi") {
      return {
        label: "Tasdiqlandi",
        className: "bg-cyan-100 text-cyan-700",
      };
    }

    if (status === "Tayyorlanmoqda") {
      return {
        label: "Tayyorlanmoqda",
        className: "bg-violet-100 text-violet-700",
      };
    }

    if (status === "Upakovka qilindi") {
      return {
        label: "Upakovka qilindi",
        className: "bg-fuchsia-100 text-fuchsia-700",
      };
    }

    if (status === "Kuryerga topshirildi") {
      return {
        label: "Kuryerga topshirildi",
        className: "bg-blue-100 text-blue-700",
      };
    }

    if (status === "Yetkazildi") {
      return {
        label: "Yetkazildi",
        className: "bg-green-100 text-green-700",
      };
    }

    if (status === "Bekor qilindi") {
      return {
        label: "Bekor qilindi",
        className: "bg-red-100 text-red-700",
      };
    }

    return null;
  };

  const assignToCourier = async (order: OrderItem) => {
    try {
      if (isCourierAlreadySent(order)) {
        alert("Bu buyurtma allaqachon kuryerga yuborilgan");
        return;
      }

      const draft = courierDrafts[order.id] || {
        courier_name: order.courier_name || "",
        courier_phone: order.courier_phone || "",
        pickup_point: order.pickup_point || "",
        delivery_note: order.delivery_note || "",
      };

      const courierName = draft.courier_name.trim();
      const courierPhone = draft.courier_phone.trim();
      const pickupPoint = draft.pickup_point.trim();

      if (!courierName) {
        alert("Avval kuryer ismini kiriting");
        return;
      }

      if (!courierPhone) {
        alert("Avval kuryer telefonini kiriting");
        return;
      }

      if (!pickupPoint) {
        alert("Avval qayerdan olib ketishini kiriting");
        return;
      }

      setSendingOrderId(order.id);

      const saved = await saveCourierDraft(order.id);
      if (!saved) return;

      const telegramSent = await sendCourierTelegramMessage(order, draft);
      if (!telegramSent) return;

      const updated = await updateOrderByApi(order.id, {
        order_status: "Kuryerga topshirildi",
        delivery_status: "Dastavkaga berildi",
        courier_name: draft.courier_name,
        courier_phone: draft.courier_phone,
        pickup_point: draft.pickup_point,
        delivery_note: draft.delivery_note,
      });

      if (!updated) return;

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? {
                ...item,
                order_status: "Kuryerga topshirildi",
                delivery_status: "Dastavkaga berildi",
                courier_name: draft.courier_name,
                courier_phone: draft.courier_phone,
                pickup_point: draft.pickup_point,
                delivery_note: draft.delivery_note,
              }
            : item
        )
      );
    } catch (error) {
      console.log("assignToCourier error:", error);
      alert("Kuryerga yuborishda xato bo‘ldi");
    } finally {
      setSendingOrderId(null);
    }
  };

  const markAsDelivered = async (order: OrderItem) => {
    const updated = await updateOrderByApi(order.id, {
      order_status: "Yetkazildi",
      delivery_status: "Yetkazib berdi",
    });

    if (!updated) return;

    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id
          ? {
              ...item,
              order_status: "Yetkazildi",
              delivery_status: "Yetkazib berdi",
            }
          : item
      )
    );
  };

  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      loadOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAF9_0%,#EEF3F1_55%,#E8EFED_100%)] pb-28">
      <Header />

      <Container className="space-y-5 py-5">
        <div className="rounded-[28px] bg-white p-5 shadow-soft">
          <h1 className="text-2xl font-bold text-marva-900">Buyurtmalar</h1>
          <p className="mt-1 text-sm text-marva-700/70">
            Tushgan zakazlar va dostavka boshqaruvi
          </p>
        </div>

        {loading ? (
          <div className="rounded-[28px] bg-white p-5 shadow-soft">
            Yuklanmoqda...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[28px] bg-white p-5 shadow-soft">
            Hali buyurtma yo‘q
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const draft = courierDrafts[order.id] || {
                courier_name: "",
                courier_phone: "",
                pickup_point: "",
                delivery_note: "",
              };

              const isSending = sendingOrderId === order.id;
              const courierAlreadySent = isCourierAlreadySent(order);
              const deliveryBadge = getDeliveryBadge(order.delivery_status);
              const orderBadge = getOrderBadge(order.order_status);

              return (
                <div
                  key={order.id}
                  className="rounded-[24px] bg-white p-5 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-marva-900">
                        #{order.id} — {order.full_name}
                      </p>
                      <p className="mt-1 text-sm text-marva-700/80">{order.phone}</p>
                      <p className="mt-1 text-sm text-marva-700/80">{order.address}</p>
                      {order.note ? (
                        <p className="mt-2 text-sm text-marva-700/80">
                          Mijoz izohi: {order.note}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-marva-900">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {orderBadge ? (
                      <div
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${orderBadge.className}`}
                      >
                        {orderBadge.label}
                      </div>
                    ) : null}

                    {deliveryBadge ? (
                      <div
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${deliveryBadge.className}`}
                      >
                        {deliveryBadge.label}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-[20px] bg-marva-50 p-4">
                    <p className="text-sm font-semibold text-marva-900">
                      Buyurtma mahsulotlari
                    </p>

                    {!order.order_items || order.order_items.length === 0 ? (
                      <p className="mt-2 text-sm text-marva-700/70">
                        Mahsulotlar topilmadi
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-semibold text-marva-900">
                                {item.product_name}
                              </p>
                              <p className="mt-1 text-xs text-marva-700/70">
                                Soni: {item.quantity}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-semibold text-marva-900">
                                {formatPrice(item.price)}
                              </p>
                              <p className="mt-1 text-xs text-marva-700/70">
                                Jami: {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Buyurtma statusi
                      </label>
                      <select
                        value={order.order_status}
                        onChange={async (e) => {
                          const value = e.target.value;

                          const updated = await updateOrderByApi(order.id, {
                            order_status: value,
                          });

                          if (!updated) return;

                          setOrders((prev) =>
                            prev.map((item) =>
                              item.id === order.id
                                ? { ...item, order_status: value }
                                : item
                            )
                          );
                        }}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none"
                      >
                        <option value="Yangi">Yangi</option>
                        <option value="Tasdiqlandi">Tasdiqlandi</option>
                        <option value="Tayyorlanmoqda">Tayyorlanmoqda</option>
                        <option value="Upakovka qilindi">Upakovka qilindi</option>
                        <option value="Kuryerga topshirildi">Kuryerga topshirildi</option>
                        <option value="Yetkazildi">Yetkazildi</option>
                        <option value="Bekor qilindi">Bekor qilindi</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Dostavka statusi
                      </label>
                      <select
                        value={order.delivery_status}
                        onChange={async (e) => {
                          const value = e.target.value;

                          const updated = await updateOrderByApi(order.id, {
                            delivery_status: value,
                          });

                          if (!updated) return;

                          setOrders((prev) =>
                            prev.map((item) =>
                              item.id === order.id
                                ? { ...item, delivery_status: value }
                                : item
                            )
                          );
                        }}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none"
                      >
                        <option value="Dastavka biriktirilmagan">
                          Dastavka biriktirilmagan
                        </option>
                        <option value="Dastavkaga berildi">Dastavkaga berildi</option>
                        <option value="Yo‘lda">Yo‘lda</option>
                        <option value="Yetkazib berdi">Yetkazib berdi</option>
                        <option value="Yetkazib bera olmadi">
                          Yetkazib bera olmadi
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Kuryer ismi
                      </label>
                      <input
                        value={draft.courier_name}
                        onChange={(e) =>
                          setCourierDraftField(order.id, "courier_name", e.target.value)
                        }
                        onBlur={() => saveCourierDraft(order.id)}
                        placeholder="Masalan: Jasur"
                        disabled={courierAlreadySent}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Kuryer telefoni
                      </label>
                      <input
                        value={draft.courier_phone}
                        onChange={(e) =>
                          setCourierDraftField(order.id, "courier_phone", e.target.value)
                        }
                        onBlur={() => saveCourierDraft(order.id)}
                        placeholder="+998 90 123 45 67"
                        disabled={courierAlreadySent}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Qayerdan olib ketadi
                      </label>
                      <input
                        value={draft.pickup_point}
                        onChange={(e) =>
                          setCourierDraftField(order.id, "pickup_point", e.target.value)
                        }
                        onBlur={() => saveCourierDraft(order.id)}
                        placeholder="Masalan: MARVA ombori, Chilonzor"
                        disabled={courierAlreadySent}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Dastavka izohi
                      </label>
                      <textarea
                        value={draft.delivery_note}
                        onChange={(e) =>
                          setCourierDraftField(order.id, "delivery_note", e.target.value)
                        }
                        onBlur={() => saveCourierDraft(order.id)}
                        placeholder="Masalan: oldin telefon qilsin, 2-qavat, klinika kirish eshigi yonida"
                        rows={3}
                        disabled={courierAlreadySent}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => assignToCourier(order)}
                        disabled={isSending || courierAlreadySent}
                        className="rounded-2xl bg-marva-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        {isSending
                          ? "Yuborilmoqda..."
                          : courierAlreadySent
                          ? "Yuborildi"
                          : "Kuryerga berish"}
                      </button>

                      <button
                        onClick={() => markAsDelivered(order)}
                        className="rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white"
                      >
                        Yetkazildi
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>

      <BottomNav />
    </div>
  );
}