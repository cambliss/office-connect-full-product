"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatINR } from "@/components/commerce/CommercePrimitives";
import { AdminSellerKybDesk, SellerKybApplication } from "./AdminSellerKybDesk";
import { fetchGenuineKybApplications } from "@/lib/sellerKybDiscovery";
import {
  Building2,
  Store,
  Package,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Search,
  Users,
  Layers,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  PlusCircle,
  Filter,
} from "lucide-react";

type MarketplaceCustomer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: string;
  enterpriseName: string;
  gstin?: string;
  tier?: string;
  status: "Verified" | "Pending Review" | "Active";
  ordersCount?: number;
  sellerApp?: SellerKybApplication;
};

const DEFAULT_B2B_CUSTOMERS: MarketplaceCustomer[] = [
  {
    id: "cust-admin-01",
    name: "Super Admin",
    email: "admin@camblissstudio.com",
    phone: "+91 98000 00001",
    type: "Enterprise Platform Admin",
    enterpriseName: "Cambliss Studio",
    gstin: "29AABCU9603R1ZM",
    tier: "Super Admin Tier",
    status: "Verified",
    ordersCount: 0,
  },
  {
    id: "cust-bhasker-02",
    name: "Bhasker User",
    email: "bhaskeradv1@gmail.com",
    phone: "+91 98450 00002",
    type: "Registered Merchant Member",
    enterpriseName: "Cambliss Enterprise Demo",
    tier: "Standard Member",
    status: "Active",
    ordersCount: 0,
  },
  {
    id: "cust-sunaina-03",
    name: "SUNAINA MAHESH",
    email: "sunainamahesh1@gmail.com",
    phone: "+91 98000 00003",
    type: "Corporate Governance Member",
    enterpriseName: "Cambliss Enterprise Demo",
    tier: "Corporate Member",
    status: "Verified",
    ordersCount: 0,
  },
  {
    id: "cust-newadmin-04",
    name: "New Admin",
    email: "newadmin@camblissstudio.com",
    phone: "+91 98000 00004",
    type: "Operations Admin",
    enterpriseName: "Cambliss Enterprise Demo",
    tier: "Admin Member",
    status: "Active",
    ordersCount: 0,
  },
  {
    id: "cust-newuser-05",
    name: "New User",
    email: "newuser@camblissstudio.com",
    phone: "+91 98000 00005",
    type: "Enterprise Solutions Member",
    enterpriseName: "Cambliss Enterprise Demo",
    tier: "Standard Member",
    status: "Active",
    ordersCount: 0,
  },
  {
    id: "cust-global-06",
    name: "Global Admin",
    email: "global.admin@cambliss.local",
    phone: "+91 98000 00006",
    type: "Lead System Architect",
    enterpriseName: "Cambliss Studio",
    tier: "System Admin",
    status: "Verified",
    ordersCount: 0,
  },
];

const MARKETPLACE_CATEGORIES = [
  {
    id: "cat-1",
    name: "Fashion & Apparel",
    icon: "👗",
    gstRate: "12%",
    hsn: "6104 / 6203",
    subcategories: ["Ethnic Wear", "Western Wear", "Fabrics & Textiles", "Accessories"],
    sellersCount: 0,
    skusCount: 0,
    status: "Active",
  },
  {
    id: "cat-2",
    name: "Electronics & Computing",
    icon: "💻",
    gstRate: "18%",
    hsn: "8471 / 8517",
    subcategories: ["Laptops & PCs", "Smartphones", "Audio & Headphones", "Peripherals"],
    sellersCount: 0,
    skusCount: 0,
    status: "Active",
  },
  {
    id: "cat-3",
    name: "Office & IT Supplies",
    icon: "📎",
    gstRate: "18%",
    hsn: "4820 / 3926",
    subcategories: ["Paper Products", "Filing & Storage", "Desk Organizers", "Printers"],
    sellersCount: 0,
    skusCount: 0,
    status: "Active",
  },
  {
    id: "cat-4",
    name: "Furniture & Decor",
    icon: "🪑",
    gstRate: "18%",
    hsn: "9403 / 9401",
    subcategories: ["Ergonomic Chairs", "Standing Desks", "Conference Tables", "Lighting"],
    sellersCount: 0,
    skusCount: 0,
    status: "Active",
  },
  {
    id: "cat-5",
    name: "Industrial & MRO",
    icon: "⚙️",
    gstRate: "18% - 28%",
    hsn: "8205 / 8481",
    subcategories: ["Power Tools", "Safety Equipment", "Pumps & Valves", "Fasteners"],
    sellersCount: 0,
    skusCount: 0,
    status: "Active",
  },
  {
    id: "cat-6",
    name: "Health & Personal Care",
    icon: "🌿",
    gstRate: "12% - 18%",
    hsn: "3304 / 3004",
    subcategories: ["Wellness", "First Aid & Medical", "Sanitation", "Nutraceuticals"],
    sellersCount: 0,
    skusCount: 0,
    status: "Active",
  },
];

const MARKETPLACE_BRANDS = [
  {
    id: "br-1",
    name: "Office Connect Direct",
    logoText: "OC",
    tier: "Official Platform 1P Brand",
    category: "Office & Enterprise Solutions",
    authorizedDistributors: 1,
    activeSkus: 0,
    registryStatus: "Approved & Trademark Protected",
    verified: true,
  },
];

export const AdminMarketplaceDomain = ({
  subView,
  applications: initialPropsApps,
  onApprove,
  onInspect,
}: {
  subView: "customers" | "sellers" | "stores" | "products" | "categories" | "brands";
  applications?: SellerKybApplication[];
  onApprove?: (id: string) => void;
  onInspect?: (app: SellerKybApplication) => void;
}) => {
  const [applications, setApplications] = useState<SellerKybApplication[]>(
    initialPropsApps || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState<"ALL" | "MERCHANTS" | "ENTERPRISE" | "RETAIL">("ALL");

  useEffect(() => {
    if (initialPropsApps && initialPropsApps.length > 0) {
      setApplications(initialPropsApps);
      return;
    }

    const loadData = async () => {
      try {
        const genuine = await fetchGenuineKybApplications();
        setApplications(genuine);
      } catch (e) {
        console.error("Failed to load merchant applications:", e);
      }
    };

    loadData();
  }, [initialPropsApps]);

  const handleDirectApprove = (targetId: string, email?: string, tradeName?: string) => {
    const target = applications.find(
      (a) =>
        (!targetId || a.id === targetId || a.applicationId === targetId) ||
        (email && a.email && a.email.toLowerCase() === email.toLowerCase())
    );

    const targetEmail = email || target?.email;

    // 1. Mutate local UI state to "Approved"
    setApplications((prev) =>
      prev.map((a) =>
        (!targetId || a.id === targetId || a.applicationId === targetId) ||
        (targetEmail && a.email && a.email.toLowerCase() === targetEmail.toLowerCase())
          ? { ...a, status: "Approved" as const }
          : a
      )
    );

    // 2. Trigger parent handler
    if (onApprove) {
      onApprove(targetId);
    }

    // 3. Directly update localStorage and notify all windows
    if (targetEmail) {
      try {
        localStorage.setItem(
          `officeconnect_merchant_status_${targetEmail}`,
          JSON.stringify({
            status: "Approved",
            applicationId: target?.applicationId || targetId,
            approvedAt: new Date().toISOString(),
            payload: target
              ? { ...target, status: "Approved" }
              : { status: "Approved", email: targetEmail, tradeName },
          })
        );

        const allSubmitted = localStorage.getItem("officeconnect_submitted_applications");
        if (allSubmitted) {
          const list = JSON.parse(allSubmitted);
          const updated = list.map((item: any) =>
            !targetId ||
            item.id === targetId ||
            (item.email && item.email.toLowerCase() === targetEmail.toLowerCase())
              ? { ...item, status: "Approved" }
              : item
          );
          localStorage.setItem("officeconnect_submitted_applications", JSON.stringify(updated));
        }

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(
          new CustomEvent("officeconnect_kyb_approved", {
            detail: {
              email: targetEmail,
              businessName: tradeName || target?.tradeName || "Your Store",
            },
          })
        );
      } catch (e) {}
    }

    // 4. Patch server API
    fetch(`/api/storefront/seller-onboarding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: targetId, email: targetEmail, status: "Approved" }),
    }).catch(() => {});
  };

  // Compile combined customer registry: Merchants + Enterprise B2B Buyers + Retail Accounts
  const allCustomers = useMemo(() => {
    const merchantCustomers: MarketplaceCustomer[] = applications.map((app) => ({
      id: app.id || app.applicationId || `merchant-${app.email}`,
      name: app.ownerName || app.tradeName,
      email: app.email || "merchant@company.com",
      phone: app.phone,
      type: app.entityType || "Enterprise Merchant",
      enterpriseName: app.tradeName || app.businessName,
      gstin: app.gstin,
      tier: app.category,
      status: app.status === "Approved" ? "Verified" : "Pending Review",
      sellerApp: app,
    }));

    return [...merchantCustomers, ...DEFAULT_B2B_CUSTOMERS];
  }, [applications]);

  const filteredCustomers = useMemo(() => {
    return allCustomers.filter((c) => {
      // Type filter
      if (customerFilter === "MERCHANTS" && !c.sellerApp) return false;
      if (customerFilter === "ENTERPRISE" && (c.sellerApp || c.type.includes("Retail"))) return false;
      if (customerFilter === "RETAIL" && !c.type.includes("Retail")) return false;

      // Search term
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.enterpriseName.toLowerCase().includes(q) ||
        (c.gstin && c.gstin.toLowerCase().includes(q))
      );
    });
  }, [allCustomers, customerFilter, searchTerm]);

  const approvedSellers = applications.filter((a) => a.status === "Approved");

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none text-xs">
      
      {/* 1. CUSTOMERS & B2B BUYER ACCOUNTS */}
      {subView === "customers" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#404d85]" />
                Customer Registry & B2B Buyer Accounts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of verified marketplace retail, enterprise institutional buyers, and registered merchant accounts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#404d85]/10 font-black text-[#404d85] text-xs border border-[#404d85]/20">
                {filteredCustomers.length} {filteredCustomers.length === 1 ? "Registered Account" : "Registered Accounts"}
              </span>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search accounts by name, email, enterprise or GSTIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setCustomerFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  customerFilter === "ALL"
                    ? "bg-[#404d85] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({allCustomers.length})
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("MERCHANTS")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  customerFilter === "MERCHANTS"
                    ? "bg-[#404d85] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Merchants ({applications.length})
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("ENTERPRISE")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  customerFilter === "ENTERPRISE"
                    ? "bg-[#404d85] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Enterprise B2B (3)
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("RETAIL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  customerFilter === "RETAIL"
                    ? "bg-[#404d85] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Retail (1)
              </button>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Account Name & Email</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Enterprise / Store</th>
                  <th className="py-2.5 px-4 text-right">KYB Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400 space-y-2">
                      <Users className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-700">No accounts match your query</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setCustomerFilter("ALL");
                        }}
                        className="text-xs font-bold text-[#404d85] hover:underline"
                      >
                        Reset filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isMerchant = !!cust.sellerApp;
                    const app = cust.sellerApp;

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                        {/* Account Name & Email */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-xs shrink-0">
                              {cust.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <strong className="text-slate-900 block font-bold leading-tight">
                                {cust.name}
                              </strong>
                              <span className="text-[11px] text-slate-500 font-mono block">
                                {cust.email} {cust.phone && `• ${cust.phone}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Account Type */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1 ${
                              isMerchant
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : cust.type.includes("Enterprise") || cust.type.includes("Institutional")
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {isMerchant ? "🏪 " : cust.type.includes("Enterprise") ? "🏢 " : "🛍️ "}
                            {cust.type}
                          </span>
                        </td>

                        {/* Enterprise / Store */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-800 block text-xs">
                              {cust.enterpriseName}
                            </span>
                            {cust.gstin && (
                              <span className="font-mono text-[10px] text-slate-500 block">
                                GSTIN: {cust.gstin}
                              </span>
                            )}
                            {cust.ordersCount && (
                              <span className="text-[10px] text-slate-400 font-semibold block">
                                {cust.ordersCount} completed orders
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status & Actions */}
                        <td className="py-3 px-4 text-right">
                          {isMerchant && app ? (
                            app.status === "Approved" ? (
                              <span className="px-2.5 py-1 rounded-full font-black text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Verified Merchant ✓
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <span className="px-2 py-0.5 rounded font-black text-[10px] bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Pending Review
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDirectApprove(
                                      app.id || app.applicationId || "app-bhasker-default",
                                      app.email,
                                      app.tradeName
                                    )
                                  }
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <span>✓</span> Approve KYB
                                </button>
                                {onInspect && (
                                  <button
                                    type="button"
                                    onClick={() => onInspect(app)}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg transition border border-slate-300 cursor-pointer"
                                  >
                                    Review
                                  </button>
                                )}
                              </div>
                            )
                          ) : (
                            <span className="px-2.5 py-1 rounded-full font-black text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              {cust.tier || "Verified Account"} ✓
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SELLERS (KYB DESK) */}
      {subView === "sellers" && (
        <AdminSellerKybDesk onApprove={onApprove} />
      )}

      {/* 3. STORES */}
      {subView === "stores" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-[#404d85]" />
                Active Merchant Storefronts ({approvedSellers.length})
              </h3>
              <p className="text-xs text-slate-500">Live multi-vendor branded storefronts with verified compliance badges</p>
            </div>
            <Link
              href="/storefront"
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              Browse Public Storefront <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {approvedSellers.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <Store className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="font-bold text-slate-800 text-xs">No Approved Storefronts Yet</p>
                <p className="text-[11px] text-slate-500">
                  When you approve a merchant in the KYB Desk, their dedicated storefront URL will activate here.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {approvedSellers.map((seller) => {
                const slug = seller.storeSlug || seller.tradeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                return (
                  <div key={seller.id || seller.applicationId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-black text-slate-900 text-sm block">👑 {seller.tradeName}</span>
                        <span className="text-slate-500 text-[11px] font-mono">/store/{slug}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Active Verified Store
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-200/60 font-mono">
                      <div>GST: <strong>{seller.gstin}</strong></div>
                      <div>Bank: {seller.bankName} (₹1 Penny-Drop Verified)</div>
                    </div>

                    <div className="pt-1">
                      <Link
                        href={`/store/${slug}`}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1"
                      >
                        Visit Live Storefront <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. PRODUCTS & CATALOG */}
      {subView === "products" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-[#404d85]" />
                Merchant Catalog & SKU Moderation Engine
              </h3>
              <p className="text-xs text-slate-500">Products submitted during merchant onboarding & catalog indexing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {applications
              .filter((a) => a.sampleProduct && a.sampleProduct.title)
              .map((a, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                  <div className="flex items-start gap-3">
                    {a.sampleProduct?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.sampleProduct.image}
                        alt="Product"
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 font-bold text-xs">
                        SKU
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <strong className="font-extrabold text-slate-900 text-xs block leading-tight">
                        {a.sampleProduct?.title}
                      </strong>
                      <span className="text-[11px] text-slate-500 block">
                        Brand: {a.sampleProduct?.brand || "Generic"} • Seller: {a.tradeName}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700 block">
                        ₹{a.sampleProduct?.price} (MRP: ₹{a.sampleProduct?.mrp || a.sampleProduct?.price})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        SKU: {a.sampleProduct?.sku || `SKU-${a.id.slice(-6)}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 5. CATEGORIES */}
      {subView === "categories" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#404d85]" />
                Marketplace Category Taxonomy & GST Tiers
              </h3>
              <p className="text-xs text-slate-500">Master product categories, statutory tax rules, and subcategories</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-700 text-xs">
              {MARKETPLACE_CATEGORIES.length} Master Categories
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MARKETPLACE_CATEGORIES.map((cat) => (
              <div key={cat.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs">{cat.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">HSN: {cat.hsn}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-bold text-[10px]">
                    GST: {cat.gstRate}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {cat.subcategories.map((sub, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 text-[10px]">
                      {sub}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{cat.sellersCount} Active Sellers</span>
                  <span className="font-semibold text-slate-800">{cat.skusCount} Listed SKUs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. BRANDS */}
      {subView === "brands" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-[#404d85]" />
                Brand Registry & Verified OEM Network
              </h3>
              <p className="text-xs text-slate-500">Brand owners, authorized distributors, and intellectual property status</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-700 text-xs">
              {MARKETPLACE_BRANDS.length} Verified Brands
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MARKETPLACE_BRANDS.map((brand) => (
              <div key={brand.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {brand.logoText}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs flex items-center gap-1">
                        {brand.name}
                        {brand.verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 inline" />}
                      </h4>
                      <span className="text-[10px] text-slate-500 block">{brand.category}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                  <div className="text-[10px] font-bold text-[#404d85]">{brand.tier}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">✓ {brand.registryStatus}</div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{brand.authorizedDistributors} Authorized Sellers</span>
                  <span className="font-bold text-slate-800">{brand.activeSkus} SKUs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
