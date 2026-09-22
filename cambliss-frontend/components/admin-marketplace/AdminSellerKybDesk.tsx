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
import { Seller12StepDossierModal } from "./Seller12StepDossierModal";
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
        <Seller12StepDossierModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={(id) => handleApprove(id)}
          onReject={(id) => handleReject(id)}
        />
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
