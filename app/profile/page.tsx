"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import {
  ArrowLeft,
  User,
  Package,
  Heart,
  Eye,
  MapPin,
  ChevronRight,
  LogOut,
} from "lucide-react";

type SavedUser = {
  fullName: string;
  phone: string;
  address: string;
  telegramUsername: string;
  telegramId?: number | null;
  age?: number | string | null;
  gender?: string | null;
  customerType?: string | null;
  clinicName?: string | null;
};

type MenuItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string | number;
  onClick?: () => void;
};

function MenuItem({ icon, title, subtitle, value, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F6F7] text-[#4B5563]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[18px] font-semibold leading-6 text-[#111827]">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 text-sm text-[#9CA3AF]">{subtitle}</div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {value !== undefined ? (
          <span className="text-[18px] font-medium text-[#111827]">
            {value}
          </span>
        ) : null}
        <ChevronRight size={20} className="text-[#9CA3AF]" />
      </div>
    </button>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
      <div className="px-5 pb-2 pt-5 text-[15px] font-extrabold uppercase tracking-[0.08em] text-[#4B5563]">
        {title}
      </div>
      <div className="divide-y divide-[#EEF2F3]">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SavedUser | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("marva-user");

    if (!saved) {
      router.push("/auth");
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      setUser(parsed);
    } catch {
      router.push("/auth");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("marva-user");
    router.push("/auth");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F3F6F5] pb-28">
        <div className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-md items-center justify-between px-4">
            <button
              onClick={() => router.back()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7F6] text-[#12332D]"
            >
              <ArrowLeft size={22} />
            </button>

            <div className="text-[20px] font-bold text-[#12332D]">Profil</div>

            <div className="h-12 w-12" />
          </div>
        </div>

        <Container className="py-6">
          <div className="rounded-[28px] bg-white p-5 text-center text-sm text-[#6B7280] shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
            Yuklanmoqda...
          </div>
        </Container>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6F5] pb-28">
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-md items-center justify-between px-4">
          <button
            onClick={() => router.back()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7F6] text-[#12332D]"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="text-[20px] font-bold text-[#12332D]">Profil</div>

          <div className="h-12 w-12" />
        </div>
      </div>

      <Container className="space-y-4 py-4">
        <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
          <button
            onClick={() => router.push("/profile/edit")}
            className="flex w-full items-center gap-4 text-left"
          >
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#EC4899_0%,#8B5CF6_100%)] p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[#9CA3AF]">
                <User size={34} />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[20px] font-bold text-[#111827]">
                {user.fullName || "Foydalanuvchi"}
              </div>
              <div className="mt-1 text-[17px] text-[#9CA3AF]">
                {user.phone || "Telefon yo‘q"}
              </div>
            </div>

            <ChevronRight size={24} className="text-[#9CA3AF]" />
          </button>
        </div>

        <SectionCard title="Xaridlar">
          <MenuItem
            icon={<Package size={24} />}
            title="Buyurtmalarim"
            value={0}
            onClick={() => router.push("/orders")}
          />

          <MenuItem
            icon={<Heart size={24} />}
            title="Sevimlilar"
            onClick={() => router.push("/favorites")}
          />

          <MenuItem
            icon={<Eye size={24} />}
            title="Ko‘rilgan mahsulotlar"
            onClick={() => router.push("/viewed")}
          />
        </SectionCard>

        <SectionCard title="Shaxsiy kabinet">
          <MenuItem
            icon={<User size={24} />}
            title="Profilim"
            subtitle={user.telegramUsername || "@username_mavjud_emas"}
            onClick={() => router.push("/profile/edit")}
          />

          <MenuItem
            icon={<MapPin size={24} />}
            title="Manzillarim"
            subtitle={user.address || "Manzil kiritilmagan"}
            onClick={() => router.push("/addresses")}
          />
        </SectionCard>

        <button
          onClick={handleLogout}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#004F45] text-base font-semibold text-white shadow-[0_14px_28px_rgba(0,79,69,0.22)]"
        >
          <LogOut size={20} />
          Chiqish
        </button>
      </Container>

      <BottomNav />
    </div>
  );
}