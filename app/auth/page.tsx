"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import { getTelegramUser } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";
import {
  Phone,
  Send,
  User,
  MapPin,
  ShieldCheck,
  Building2,
  Calendar,
} from "lucide-react";

type CustomerRow = {
  id: number;
  telegram_id: number | null;
  telegram_username: string | null;
  full_name: string;
  phone: string | null;
  address: string | null;
  age: string | null;
  gender: string | null;
  customer_type: string | null;
  clinic_name: string | null;
};

function normalizePhone(value: string) {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}

function toLocalUser(data: CustomerRow) {
  return {
    id: data.id,
    fullName: data.full_name,
    phone: data.phone || "",
    address: data.address || "",
    age: data.age || null,
    gender: data.gender || null,
    customerType: data.customer_type || null,
    clinicName: data.clinic_name || null,
    telegramUsername: data.telegram_username || "",
    telegramId: data.telegram_id || null,
  };
}

export default function AuthPage() {
  const router = useRouter();
  const tgUser = useMemo(() => getTelegramUser(), []);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingCustomer, setCheckingCustomer] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      const saved = localStorage.getItem("marva-user");
      if (saved) {
        router.push("/profile");
        return;
      }

      if (tgUser) {
        const name = `${tgUser.first_name ?? ""} ${tgUser.last_name ?? ""}`.trim();
        setFullName(name || "Telegram foydalanuvchi");
        setTelegramUsername(tgUser.username ? `@${tgUser.username}` : "");

        if (supabase && tgUser.id) {
          const { data, error } = await supabase
            .from("customers")
            .select("*")
            .eq("telegram_id", Number(tgUser.id))
            .maybeSingle();

          if (!error && data) {
            localStorage.setItem("marva-user", JSON.stringify(toLocalUser(data)));
            router.push("/profile");
            return;
          }
        }
      }

      setCheckingCustomer(false);
    };

    hydrate();
  }, [router, tgUser]);

  const saveUser = async () => {
    if (!fullName.trim()) {
      alert("Ismni kiriting");
      return;
    }

    if (!phone.trim()) {
      alert("Telefon raqamni kiriting");
      return;
    }

    if (!address.trim()) {
      alert("Manzilni kiriting");
      return;
    }

    if (!supabase) {
      alert("Supabase ulanmagan");
      return;
    }

    setLoading(true);

    try {
      const telegramId = tgUser?.id ? Number(tgUser.id) : null;
      const normalizedPhone = normalizePhone(phone);

      const payload = {
        full_name: fullName.trim(),
        phone: normalizedPhone,
        address: address.trim(),
        age: age.trim() || null,
        gender: gender || null,
        customer_type: customerType || null,
        clinic_name: clinicName.trim() || null,
        telegram_username: telegramUsername.trim() || null,
        telegram_id: telegramId,
        source: tgUser?.id ? "telegram_app" : "app",
      };

      let data: CustomerRow | null = null;
      let error: any = null;

      if (telegramId) {
        const result = await supabase
          .from("customers")
          .upsert(payload, { onConflict: "telegram_id" })
          .select("*")
          .single();

        data = result.data;
        error = result.error;
      } else {
        const { data: existingByPhone } = await supabase
          .from("customers")
          .select("*")
          .eq("phone", normalizedPhone)
          .maybeSingle();

        if (existingByPhone?.id) {
          const result = await supabase
            .from("customers")
            .update(payload)
            .eq("id", existingByPhone.id)
            .select("*")
            .single();

          data = result.data;
          error = result.error;
        } else {
          const result = await supabase
            .from("customers")
            .insert(payload)
            .select("*")
            .single();

          data = result.data;
          error = result.error;
        }
      }

      if (error) {
        alert(error.message);
        return;
      }

      if (!data) {
        alert("Mijoz saqlanmadi");
        return;
      }

      localStorage.setItem("marva-user", JSON.stringify(toLocalUser(data)));
      router.push("/profile");
    } catch (err: any) {
      alert(err?.message || "Xato yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (checkingCustomer) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAF9_0%,#EEF3F1_55%,#E8EFED_100%)] pb-28">
        <Header />
        <Container className="py-5">
          <div className="rounded-[32px] bg-white/95 p-6 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
            Tekshirilmoqda...
          </div>
        </Container>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAF9_0%,#EEF3F1_55%,#E8EFED_100%)] pb-28">
      <Header />
      <Container className="space-y-5 py-5">
        <div className="overflow-hidden rounded-[32px] bg-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
          <div className="bg-[#004F45] px-5 pb-6 pt-5 text-white">
            <p className="text-sm text-white/75">Kirish / Ro'yxatdan o'tish</p>
            <h1 className="mt-1 text-[28px] font-bold leading-9">
              Ma'lumotlaringizni kiriting
            </h1>
            <p className="mt-2 text-sm text-white/80">
              {tgUser?.id
                ? `✅ Telegram ulandi: ${tgUser.first_name}`
                : "ℹ️ Brauzerda ochilgan"}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
              <ShieldCheck size={16} /> Xavfsiz kirish
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <User size={14} /> Ism Familiya
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ismingizni kiriting"
                className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
              />
            </div>

            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <Phone size={14} /> Telefon
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
              />
            </div>

            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <MapPin size={14} /> Manzil
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Toshkent, O'zbekiston"
                className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
                <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                  <Calendar size={14} /> Yosh
                </label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="28"
                  type="number"
                  className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
                />
              </div>

              <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
                <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                  <User size={14} /> Jins
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
                >
                  <option value="">Tanlang</option>
                  <option value="male">Erkak</option>
                  <option value="female">Ayol</option>
                </select>
              </div>
            </div>

            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <Building2 size={14} /> Kimligi
              </label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
              >
                <option value="">Tanlang</option>
                <option value="dentist">Stomatolog</option>
                <option value="clinic_staff">Klinika xodimi</option>
                <option value="clinic_owner">Klinika egasi</option>
                <option value="company_representative">Kompaniya vakili</option>
                <option value="regular_customer">Oddiy mijoz</option>
              </select>
            </div>

            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <Building2 size={14} /> Klinika / kompaniya nomi
              </label>
              <input
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Dental Clinic"
                className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
              />
            </div>

            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <Send size={14} /> Telegram username
              </label>
              <input
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder="@username"
                className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
              />
            </div>

            <button
              onClick={saveUser}
              disabled={loading}
              className="flex h-14 w-full items-center justify-center rounded-full bg-[#004F45] text-base font-semibold text-white shadow-[0_14px_28px_rgba(0,79,69,0.22)] disabled:opacity-60"
            >
              {loading ? "Saqlanmoqda..." : "Davom etish"}
            </button>
          </div>
        </div>
      </Container>
      <BottomNav />
    </div>
  );
}