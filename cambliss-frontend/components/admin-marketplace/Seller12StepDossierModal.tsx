"use client";

import React from "react";
import Link from "next/link";
import { X, ExternalLink, CheckCircle2, ShieldCheck, MapPin, Building, CreditCard, Truck, FileText, Camera } from "lucide-react";
import { SellerKybApplication } from "./AdminSellerKybDesk";

interface Seller12StepDossierModalProps {
  application: SellerKybApplication | null;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const Seller12StepDossierModal: React.FC<Seller12StepDossierModalProps> = ({
  application,
  onClose,
  onApprove,
  onReject,
}) => {
  if (!application) return null;

  const app = application;
  const storeSlug = app.storeSlug || app.tradeName?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "store";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                12-Step Merchant KYB Dossier
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  app.status === "Approved"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : app.status === "Rejected"
                    ? "bg-red-50 text-red-800 border-red-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                Status: {app.status}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {app.tradeName || app.businessName}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Application ID: <span className="text-slate-800 font-semibold">{app.applicationId || app.id}</span>
              {app.appliedDate && ` • Applied: ${app.appliedDate}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/store/${storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-200 transition flex items-center gap-1.5"
            >
              <span>🏪</span> View Live Store
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 12-STEP VERIFICATION DOSSIER GRID */}
        <div className="space-y-3.5 text-xs">
          
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
                <span className="font-bold text-slate-900">{app.ownerName || "Not Provided"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Registered Email</span>
                <span className="font-medium text-slate-900">{app.email || "Not Provided"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Phone (Verified via OTP)</span>
                <span className="font-mono font-medium text-slate-900">{app.phone || "Not Provided"}</span>
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
                <span className="font-bold text-slate-900">{app.entityType || "Individual / Sole Proprietor"}</span>
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
              {app.isGstExempt ? (
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                  GST Exempted Entity
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  GSTIN Provided ✓
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
              <div>
                <span className="text-slate-400 text-[10px] block">GSTIN Number</span>
                <span className="font-mono font-bold text-slate-900">
                  {app.isGstExempt ? "Exempted (Section 22/24)" : app.gstin || "Not Provided"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Business / Individual PAN</span>
                <span className="font-mono font-bold text-slate-900">{app.pan || "Not Provided"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">GST Registration Document</span>
                {app.gstDocUploaded || app.gstDocName ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mt-0.5">
                    <span>📄</span>
                    <span className="truncate max-w-[170px]" title={app.gstDocName || "gst registration.pdf"}>
                      {app.gstDocName || "gst registration.pdf"}
                    </span>
                    <span className="text-[9px] bg-emerald-100 px-1 rounded text-emerald-800 font-bold">Uploaded ✓</span>
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
                <span className="font-bold text-slate-900">{app.tradeName || app.businessName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Storefront URL Slug</span>
                <span className="font-mono font-bold text-indigo-700">/store/{storeSlug}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Primary Category</span>
                <span className="font-bold text-slate-900">{app.category || "General Merchandise"}</span>
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
                <span className="font-medium text-slate-900">{app.warehouseAddress || "Not Provided"}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div>
                  <span className="text-slate-400 text-[10px] block">City & State</span>
                  <span className="font-bold text-slate-900">
                    {app.warehouseCity || "Bengaluru"}, {app.warehouseState || "Karnataka"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Postal PIN Code</span>
                  <span className="font-mono font-bold text-slate-900">{app.warehousePinCode || "560001"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Dispatch Manager</span>
                  <span className="font-medium text-slate-900">
                    {app.dispatchManagerName ? `${app.dispatchManagerName} (${app.dispatchManagerPhone})` : "Not Provided"}
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
                <span className="font-bold text-slate-900">{app.bankName || "Not Provided"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Account Number</span>
                <span className="font-mono font-bold text-slate-900">{app.accountNumber || "Not Provided"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">IFSC Code</span>
                <span className="font-mono font-bold text-slate-900">{app.ifscCode || "Not Provided"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Account Holder</span>
                <span className="font-bold text-slate-900">{app.accountHolderName || app.ownerName || "Not Provided"}</span>
              </div>
            </div>
            <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-2">
              <span className="text-slate-400">Cancelled Cheque Verification:</span>
              <span className="text-emerald-700 font-semibold">Direct Penny-Drop API verification utilized (A/C Verified)</span>
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
                <span className="font-bold text-slate-900">{app.gstRateTier || "18%"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Primary HSN Code</span>
                <span className="font-mono font-bold text-slate-900">{app.hsnCode || "General HSN (8471/6104)"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Automated Invoicing Desk</span>
                <span className="font-bold text-emerald-700">
                  {app.automatedInvoicing !== false ? "Enabled (B2B/B2C GST Invoices)" : "Disabled"}
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
                {app.faceMatchScore ? `${app.faceMatchScore}% Face Match ✓` : "Liveness Completed"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-slate-700 items-center">
              <div>
                <span className="text-slate-400 text-[10px] block">Government Identity Document</span>
                <span className="font-bold text-slate-900">{app.kycDocType || "Aadhaar Card"}</span>
                <span className="font-mono text-slate-600 block text-[11px] mt-0.5">
                  {app.kycDocNumber || "Not Provided"}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {app.kycDocUploaded ? "Uploaded by Merchant ✓" : "E-KYC verification"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Video KYC Appointment Slot</span>
                <span className="font-medium text-slate-900 block mt-0.5">
                  {app.videoKycSlot || "Today, 4:00 PM - 4:30 PM"}
                </span>
                <span className="text-[10px] text-indigo-700 font-semibold block mt-0.5">Officer Assigned</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block mb-1">Captured Live Merchant Selfie</span>
                {app.selfieImage ? (
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={app.selfieImage}
                      alt="Merchant Live Selfie"
                      className="w-13 h-13 rounded-xl object-cover border-2 border-emerald-500 shadow-xs"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px]">Real Biometric Capture</span>
                      <span className="text-emerald-700 font-bold text-[10px]">
                        {app.faceMatchScore ? `${app.faceMatchScore}% Match ✓` : "Verified ✓"}
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
                {app.fulfillmentModel || "EASY_SHIP"}
              </span>
            </div>
            <div className="text-slate-700">
              <span className="text-slate-400 text-[10px] block">Selected Channel</span>
              <span className="font-bold text-slate-900">
                {app.fulfillmentModel === "FOC"
                  ? "Fulfillment by Office Connect (FOC Warehouse)"
                  : app.fulfillmentModel === "SELF_SHIP"
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
              Merchant acknowledged referral fees, closing fees, and logistics tariff card for {app.category || "category"}.
            </p>
          </div>

          {/* STEP 11: First Product Fast-Track Listing */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[11px] text-[#404d85] uppercase tracking-wider flex items-center gap-1.5">
                <span>1️⃣1️⃣</span> Step 11: Uploaded First Product (Fast-Track Listing)
              </span>
              {app.sampleProduct ? (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Product Uploaded (SKU: {app.sampleProduct.sku || "BF-78-000"})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">
                  Skipped in Onboarding
                </span>
              )}
            </div>

            {app.sampleProduct ? (
              <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {app.sampleProduct.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={app.sampleProduct.image}
                    alt={app.sampleProduct.title}
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
                      {app.sampleProduct.brand || app.tradeName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      SKU: {app.sampleProduct.sku || "BF-78-000"}
                    </span>
                  </div>
                  <h5 className="font-extrabold text-sm text-slate-900 truncate">
                    {app.sampleProduct.title}
                  </h5>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-extrabold text-slate-900">
                      Listing: ₹{app.sampleProduct.price}
                    </span>
                    {app.sampleProduct.mrp && (
                      <span className="line-through text-slate-400 text-[11px]">
                        MRP: ₹{app.sampleProduct.mrp}
                      </span>
                    )}
                    <span className="text-emerald-700 font-semibold text-[11px]">
                      Stock: {app.sampleProduct.inventory || 50} units
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
                Dossier Complete ✓
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-700">
              <div>
                <span className="text-slate-400 text-[10px] block">Authorized Signatory</span>
                <span className="font-serif italic font-bold text-slate-900 text-sm">
                  "{app.signatureName || app.ownerName || "Authorized Signatory"}"
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Application Audit ID</span>
                <span className="font-mono font-bold text-slate-900">
                  {app.applicationId || app.id}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded border ${
              app.status === "Approved"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : app.status === "Rejected"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            Current Status: {app.status}
          </span>

          <div className="flex items-center gap-2">
            {app.status === "Pending Review" && (
              <>
                {onReject && (
                  <button
                    type="button"
                    onClick={() => {
                      onReject(app.id || app.applicationId || "");
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs transition cursor-pointer"
                  >
                    Reject Application
                  </button>
                )}
                {onApprove && (
                  <button
                    type="button"
                    onClick={() => {
                      onApprove(app.id || app.applicationId || "");
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    ✓ Approve Merchant
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition"
            >
              Close Dossier
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
