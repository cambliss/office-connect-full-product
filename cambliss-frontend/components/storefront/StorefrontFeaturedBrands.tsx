"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchGenuineKybApplications } from "@/lib/sellerKybDiscovery";

export const StorefrontFeaturedBrands = () => {
  const [brands, setBrands] = useState<Array<{ name: string; tag: string; icon: string; href?: string }>>([
    { name: "Office Connect Direct", tag: "Platform 1P", icon: "👑", href: "/storefront" },
  ]);

  useEffect(() => {
    async function loadApprovedBrands() {
      try {
        const apps = await fetchGenuineKybApplications();
        const activeMerchants = apps.filter((a) => a.tradeName || a.businessName);
        if (activeMerchants.length > 0) {
          const merchantBrands = activeMerchants.map((a) => ({
            name: a.tradeName || a.businessName,
            tag: a.status === "Approved" ? "Verified Merchant" : "Enrolled Merchant",
            icon: a.category?.toLowerCase().includes("fashion") ? "👗" : "🏬",
            href: `/store/${a.storeSlug || "store"}`,
          }));
          setBrands([
            { name: "Office Connect Direct", tag: "Platform 1P", icon: "👑", href: "/storefront" },
            ...merchantBrands,
          ]);
        }
      } catch (e) {}
    }
    loadApprovedBrands();
  }, []);

  return (
    <section className="py-6 border-t border-b border-slate-200 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Authorized Marketplace Brands & Merchants
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Registered merchant entities with official GST compliance and direct warranties
          </p>
        </div>
        <Link href="/seller-central" className="text-[11px] text-[#404d85] font-bold hover:underline">
          Register Your Brand →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {brands.map((b) => (
          <Link
            key={b.name}
            href={b.href || "/storefront"}
            className="p-3.5 border border-slate-200 rounded-[8px] bg-white hover:border-[#404d85] hover:shadow-xs transition flex items-center gap-3 group"
          >
            <span className="text-2xl group-hover:scale-105 transition-transform">{b.icon}</span>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 block truncate group-hover:text-[#404d85] transition-colors">
                {b.name}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block">{b.tag}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
