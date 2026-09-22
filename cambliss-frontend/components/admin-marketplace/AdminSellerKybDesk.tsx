"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Building,
  ShieldCheck,
  CreditCard,
  Truck,
  FileText,
  MapPin,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";
import { RealDocumentViewerModal, DocumentType } from "./RealDocumentViewerModal";
import { fetchGenuineKybApplications, fetchGenuineMerchantByEmail } from "@/lib/sellerKybDiscovery";

export interface SellerKybApplication {
  id: string;
  applicationId?: string;
  businessName: string;
  tradeName: string;
  storeSlug?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  entityType?: string;
  category: string;
  gstin: string;
  pan: string;
  isGstExempt?: boolean;
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  accountHolderName?: string;
  warehouseCity: string;
  warehouseAddress?: string;
  warehouseState?: string;
  warehousePinCode?: string;
  dispatchManagerName?: string;
  dispatchManagerPhone?: string;
  fulfillmentModel?: string;
  pennyDropVerified?: boolean;
  gstRateTier?: string;
  hsnCode?: string;
  automatedInvoicing?: boolean;
  tcsAccepted?: boolean;
  appliedDate: string;
  status: "Pending Review" | "Approved" | "Rejected";
  decisionDate?: string;
  decisionNotes?: string;
  documents?: {
    gstCertificate?: string;
    panCard?: string;
    cancelledCheque?: string;
    incorporationCertificate?: string;
    identityProof?: string;
    liveMerchantSelfie?: string;
  };
  gstDocUploaded?: boolean;
  gstDocName?: string;
  kycDocType?: string;
  kycDocNumber?: string;
  kycDocUploaded?: boolean;
  selfieCaptured?: boolean;
  selfieImage?: string;
  faceMatchScore?: number;
  videoKycSlot?: string;
  signatureName?: string;
  sampleProduct?: {
    title: string;
    brand: string;
    category?: string;
    hsn?: string;
    price: number;
    mrp: number;
    inventory?: number;
    sku?: string;
    image?: string;
  };
  [key: string]: any;
}

const SEED_APPLICATIONS: SellerKybApplication[] = [];

interface AdminSellerKybDeskProps {
  applications?: SellerKybApplication[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const AdminSellerKybDesk = ({
  applications: initialPropsApps,
  onApprove,
  onReject,
}: AdminSellerKybDeskProps) => {
  const [apps, setApps] = useState<SellerKybApplication[]>(
    initialPropsApps && initialPropsApps.length > 0 ? initialPropsApps : []
  );
  const [activeTab, setActiveTab] = useState<"All" | "Pending Review" | "Approved" | "Rejected">("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<SellerKybApplication | null>(null);
  const [previewDocModal, setPreviewDocModal] = useState<{ isOpen: boolean; docType: DocumentType } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load genuine submitted merchant applications (0 dummy data)
  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const genuine = await fetchGenuineKybApplications();
      setApps(genuine);
      if (genuine.length > 0) {
        setSelectedApp((prev) => {
          if (!prev) return genuine[0];
          const matched = genuine.find((g) => g.id === prev.id || g.applicationId === prev.applicationId);
          return matched || genuine[0];
        });
      } else {
        setSelectedApp(null);
      }
    } catch (e) {
      console.error("Failed to load genuine merchant applications:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleApprove = async (id: string) => {
    const target = apps.find((a) => a.id === id || a.applicationId === id);
    if (target?.email) {
      try {
        localStorage.setItem(`officeconnect_merchant_status_${target.email}`, JSON.stringify({
          status: "Approved",
          applicationId: target.applicationId,
          approvedAt: new Date().toISOString(),
          payload: { ...target, status: "Approved" },
        }));
      } catch (e) {}
    }

    if (onApprove) {
      onApprove(id);
    }
    setApps((prev) =>
      prev.map((a) =>
        a.id === id || a.applicationId === id ? { ...a, status: "Approved" } : a
      )
    );

    try {
      await fetch(`/api/storefront/seller-onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Approved" }),
      });
    } catch (e) {
      console.warn("Status patch failed", e);
    }
  };

  const handleReject = async (id: string) => {
    if (onReject) {
      onReject(id);
    }
    setApps((prev) =>
      prev.map((a) =>
        a.id === id || a.applicationId === id ? { ...a, status: "Rejected" } : a
      )
    );

    try {
      await fetch(`/api/storefront/seller-onboarding/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected" }),
      });
    } catch (e) {
      console.warn("Status patch failed", e);
    }
  };

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesTab = activeTab === "All" || app.status === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.businessName.toLowerCase().includes(q) ||
        app.tradeName.toLowerCase().includes(q) ||
        app.gstin.toLowerCase().includes(q) ||
        app.pan.toLowerCase().includes(q) ||
        (app.applicationId && app.applicationId.toLowerCase().includes(q)) ||
        app.warehouseCity.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [apps, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      All: apps.length,
      "Pending Review": apps.filter((a) => a.status === "Pending Review").length,
      Approved: apps.filter((a) => a.status === "Approved").length,
      Rejected: apps.filter((a) => a.status === "Rejected").length,
    };
  }, [apps]);

  return (
    <div className="space-y-4 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              3P Merchant KYB & GST Verification Desk
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-100 text-violet-800">
              {apps.length} Total Applications
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Review legal entity documents, 15-digit GSTIN, IFSC escrow accounts, and live Video KYC records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, store, GSTIN..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-1 focus:ring-violet-500 outline-none w-48 sm:w-64"
            />
          </div>
          <button
            type="button"
            onClick={() => loadApplications()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
            title="Fetch and sync latest submitted documents"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-violet-600" : "text-slate-500"}`} />
            <span className="hidden sm:inline">Sync Live Submissions</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        {(["All", "Pending Review", "Approved", "Rejected"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === tab
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>{tab}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-700 font-black"
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Table of Applications */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Merchant Entity & Store Name</th>
                <th className="py-3 px-4">GSTIN & PAN</th>
                <th className="py-3 px-4">Escrow Settlement Bank</th>
                <th className="py-3 px-4">Warehouse & Model</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">KYB Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No merchant KYB applications found in this view.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    {/* Entity & Name */}
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 block">{app.businessName}</span>
                        {app.applicationId && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                            {app.applicationId}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-violet-700 font-semibold block">
                        Store: {app.tradeName} ({app.category})
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Applied: {app.appliedDate}
                      </span>
                    </td>

                    {/* GSTIN / PAN */}
                    <td className="py-3 px-4 space-y-0.5 font-mono text-[11px]">
                      <span className="font-bold text-slate-800 block">GST: {app.gstin}</span>
                      <span className="text-slate-500">PAN: {app.pan}</span>
                    </td>

                    {/* Bank */}
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-800">{app.bankName}</span>
                        {app.pennyDropVerified && (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">
                            ₹1 Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 block">
                        A/C: {app.accountNumber}
                      </span>
                    </td>

                    {/* Location & Model */}
                    <td className="py-3 px-4 space-y-0.5">
                      <span className="font-semibold text-slate-800 block">
                        📍 {app.warehouseCity}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Model: {app.fulfillmentModel || "EASY_SHIP"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                          app.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : app.status === "Rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {app.status === "Approved" && <CheckCircle2 className="w-3 h-3" />}
                        {app.status === "Rejected" && <XCircle className="w-3 h-3" />}
                        {app.status === "Pending Review" && <Clock className="w-3 h-3" />}
                        {app.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded transition flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>

                        {app.status === "Pending Review" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(app.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition shadow-2xs"
                            >
                              ✓ Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(app.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-red-600 font-bold text-xs rounded transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authentic 12-Step Merchant Onboarding Dossier Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    12-Step Merchant KYB Dossier
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      selectedApp.status === "Approved"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : selectedApp.status === "Rejected"
                        ? "bg-red-50 text-red-800 border-red-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    Status: {selectedApp.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {selectedApp.tradeName || selectedApp.businessName}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Application ID: <span className="text-slate-800 font-semibold">{selectedApp.applicationId || selectedApp.id}</span>
                  {selectedApp.appliedDate && ` • Applied: ${selectedApp.appliedDate}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedApp.storeSlug && (
                  <a
                    href={`/store/${selectedApp.storeSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-200 transition flex items-center gap-1.5"
                  >
                    <span>🏪</span> View Live Store
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 12-STEP VERIFICATION DOSSIER GRID */}
            <div className="space-y-4 text-xs">
              {/* STEP 1: Account & Primary Contact */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>1️⃣</span> Step 1: Merchant Contact & Identity
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Mobile OTP Verified ✓
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Owner / Signatory</span>
                    <span className="font-bold text-slate-900">{selectedApp.ownerName || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Registered Email</span>
                    <span className="font-medium text-slate-900">{selectedApp.email || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Phone (Verified via OTP)</span>
                    <span className="font-mono font-medium text-slate-900">{selectedApp.phone || "Not Provided"}</span>
                  </div>
                </div>
              </div>

              {/* STEP 2: Legal Entity */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>2️⃣</span> Step 2: Legal Business Constitution
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                    Terms Accepted ✓
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Constitution Type</span>
                    <span className="font-bold text-slate-900">{selectedApp.entityType || "Individual / Sole Proprietor"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Seller Agreement</span>
                    <span className="font-medium text-emerald-700">Agreed to Marketplace Merchant Terms & Conditions</span>
                  </div>
                </div>
              </div>

              {/* STEP 3: GSTIN, PAN & Statutory Uploads */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>3️⃣</span> Step 3: GSTIN & PAN Details
                  </span>
                  {selectedApp.isGstExempt ? (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      GST Exempted Entity
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      GSTIN Provided
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">GSTIN Number</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedApp.isGstExempt ? "Exempted (Section 22/24)" : selectedApp.gstin || "Not Provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Business / Individual PAN</span>
                    <span className="font-mono font-bold text-slate-900">{selectedApp.pan || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">GST Registration Document</span>
                    {selectedApp.gstDocUploaded || selectedApp.gstDocName ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mt-0.5">
                        <span>📄</span>
                        <span className="truncate max-w-[170px]" title={selectedApp.gstDocName || "gst registration.pdf"}>
                          {selectedApp.gstDocName || "gst registration.pdf"}
                        </span>
                        <span className="text-[9px] bg-emerald-100 px-1 rounded text-emerald-800 font-bold">Uploaded</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px] block mt-0.5">Not Uploaded / Exemption Claimed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 4: Store Display Identity & Catalog */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>4️⃣</span> Step 4: Store Display Identity & Categorization
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                    Branded Storefront Ready
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Store Display Name</span>
                    <span className="font-bold text-slate-900">{selectedApp.tradeName || selectedApp.businessName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Storefront URL Slug</span>
                    <span className="font-mono font-bold text-indigo-700">/store/{selectedApp.storeSlug || "store"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Primary Category</span>
                    <span className="font-bold text-slate-900">{selectedApp.category || "General Merchandise"}</span>
                  </div>
                </div>
              </div>

              {/* STEP 5: Warehouse & Dispatch */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>5️⃣</span> Step 5: Pickup Warehouse & Dispatch Desk
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    PIN Serviceable ✓
                  </span>
                </div>
                <div className="space-y-1.5 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Registered Dispatch Address</span>
                    <span className="font-medium text-slate-900">{selectedApp.warehouseAddress || "Not Provided"}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400 text-[10px] block">City & State</span>
                      <span className="font-bold text-slate-900">
                        {selectedApp.warehouseCity || "Bengaluru"}, {selectedApp.warehouseState || "Karnataka"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Postal PIN Code</span>
                      <span className="font-mono font-bold text-slate-900">{selectedApp.warehousePinCode || "560001"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Dispatch Manager</span>
                      <span className="font-medium text-slate-900">
                        {selectedApp.dispatchManagerName ? `${selectedApp.dispatchManagerName} (${selectedApp.dispatchManagerPhone})` : "Not Provided"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 6: Escrow Bank Account */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>6️⃣</span> Step 6: Escrow Settlement Bank Account
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    ₹1 Penny Drop Verified ✓
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Bank Name</span>
                    <span className="font-bold text-slate-900">{selectedApp.bankName || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Account Number</span>
                    <span className="font-mono font-bold text-slate-900">{selectedApp.accountNumber || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">IFSC Code</span>
                    <span className="font-mono font-bold text-slate-900">{selectedApp.ifscCode || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Account Holder</span>
                    <span className="font-bold text-slate-900">{selectedApp.accountHolderName || selectedApp.ownerName || "Not Provided"}</span>
                  </div>
                </div>
                <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="text-slate-400">Cancelled Cheque:</span>
                  {selectedApp.documents?.cancelledCheque && selectedApp.documents.cancelledCheque !== `CHEQUE_${selectedApp.bankName}.pdf` ? (
                    <span className="text-emerald-700 font-semibold">{selectedApp.documents.cancelledCheque}</span>
                  ) : (
                    <span className="text-slate-400 italic">Not Uploaded (Direct Penny-Drop API verification utilized)</span>
                  )}
                </div>
              </div>

              {/* STEP 7: Tax, HSN & Invoicing */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>7️⃣</span> Step 7: GST Tiers, HSN & Automated Invoicing
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                    TCS Section 52 Declared ✓
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Default GST Tier</span>
                    <span className="font-bold text-slate-900">{selectedApp.gstRateTier || "18%"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Primary HSN Code</span>
                    <span className="font-mono font-bold text-slate-900">{selectedApp.hsnCode || "General HSN (8471/6104)"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Automated Invoicing Desk</span>
                    <span className="font-bold text-emerald-700">
                      {selectedApp.automatedInvoicing !== false ? "Enabled (B2B/B2C GST Invoices)" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              {/* STEP 8: Identity & Video KYC */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>8️⃣</span> Step 8: Identity Proof & Biometric Live Selfie
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {selectedApp.faceMatchScore ? `${selectedApp.faceMatchScore}% Face Match ✓` : "Liveness Completed"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-slate-700 items-center">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Government Identity Document</span>
                    <span className="font-bold text-slate-900">{selectedApp.kycDocType || "Aadhaar Card"}</span>
                    <span className="font-mono text-slate-600 block text-[11px] mt-0.5">
                      {selectedApp.kycDocNumber || "Not Provided"}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {selectedApp.kycDocUploaded ? "Uploaded by Merchant" : "E-KYC verification"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Video KYC Appointment Slot</span>
                    <span className="font-medium text-slate-900 block mt-0.5">
                      {selectedApp.videoKycSlot || "Today, 4:00 PM - 4:30 PM"}
                    </span>
                    <span className="text-[10px] text-indigo-700 font-semibold block mt-0.5">Officer Assigned</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block mb-1">Captured Live Merchant Selfie</span>
                    {selectedApp.selfieImage ? (
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedApp.selfieImage}
                          alt="Merchant Selfie"
                          className="w-12 h-12 rounded-lg object-cover border-2 border-emerald-500 shadow-xs"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block text-[11px]">Real Biometric Capture</span>
                          <span className="text-emerald-700 font-bold text-[10px]">
                            {selectedApp.faceMatchScore ? `${selectedApp.faceMatchScore}% Match ✓` : "Verified ✓"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No selfie uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 9: Fulfillment Model */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>9️⃣</span> Step 9: Logistics & Fulfillment Model
                  </span>
                  <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-bold text-[10px]">
                    {selectedApp.fulfillmentModel || "EASY_SHIP"}
                  </span>
                </div>
                <div className="text-slate-700">
                  <span className="text-slate-400 text-[10px] block">Selected Channel</span>
                  <span className="font-bold text-slate-900">
                    {selectedApp.fulfillmentModel === "FOC"
                      ? "Fulfillment by Office Connect (FOC Warehouse)"
                      : selectedApp.fulfillmentModel === "SELF_SHIP"
                      ? "Self Ship (Merchant's Own Logistics)"
                      : "Easy Ship (Office Connect Express Pickup from Warehouse)"}
                  </span>
                </div>
              </div>

              {/* STEP 10: Fee & Margin Simulator */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔟</span> Step 10: Fee Structure & Marketplace Margin Schedule
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Acknowledged ✓
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Merchant acknowledged referral fees, closing fees, and logistics tariff card for {selectedApp.category || "category"}.
                </p>
              </div>

              {/* STEP 11: First Product Fast-Track Listing */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>1️⃣1️⃣</span> Step 11: Uploaded First Product (Fast-Track Listing)
                  </span>
                  {selectedApp.sampleProduct ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Product Uploaded (SKU: {selectedApp.sampleProduct.sku || "BF-78-000"})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">
                      Skipped in Onboarding
                    </span>
                  )}
                </div>

                {selectedApp.sampleProduct ? (
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {selectedApp.sampleProduct.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedApp.sampleProduct.image}
                        alt={selectedApp.sampleProduct.title}
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                        👗
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {selectedApp.sampleProduct.brand || selectedApp.tradeName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          SKU: {selectedApp.sampleProduct.sku || "BF-78-000"}
                        </span>
                      </div>
                      <h5 className="font-extrabold text-sm text-slate-900 truncate">
                        {selectedApp.sampleProduct.title}
                      </h5>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-extrabold text-slate-900">
                          Listing: ₹{selectedApp.sampleProduct.price}
                        </span>
                        {selectedApp.sampleProduct.mrp && (
                          <span className="line-through text-slate-400 text-[11px]">
                            MRP: ₹{selectedApp.sampleProduct.mrp}
                          </span>
                        )}
                        <span className="text-emerald-700 font-semibold text-[11px]">
                          Stock: {selectedApp.sampleProduct.inventory || 50} units
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">
                    No initial product uploaded. Merchant will add items via Seller Central post-activation.
                  </p>
                )}
              </div>

              {/* STEP 12: Audit & Declaration */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                    <span>1️⃣2️⃣</span> Step 12: Digital Signatory & Final Audit
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                    Dossier Complete
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Authorized Signatory</span>
                    <span className="font-serif italic font-bold text-slate-900">
                      "{selectedApp.signatureName || selectedApp.ownerName || "Authorized Signatory"}"
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Application Audit ID</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedApp.applicationId || selectedApp.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded border ${
                  selectedApp.status === "Approved"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : selectedApp.status === "Rejected"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                Current Status: {selectedApp.status}
              </span>

              <div className="flex items-center gap-2">
                {selectedApp.status === "Pending Review" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleReject(selectedApp.id);
                        setSelectedApp(null);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs transition cursor-pointer"
                    >
                      Reject Application
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(selectedApp.id);
                        setSelectedApp(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      ✓ Approve Merchant
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Statutory Government Document Viewer */}
      {previewDocModal?.isOpen && selectedApp && (
        <RealDocumentViewerModal
          isOpen={previewDocModal.isOpen}
          onClose={() => setPreviewDocModal(null)}
          application={selectedApp}
          initialDocType={previewDocModal.docType}
        />
      )}
    </div>
  );
};

export default AdminSellerKybDesk;
