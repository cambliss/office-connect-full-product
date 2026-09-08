"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SellerFeeCalculator } from "./SellerFeeCalculator";

export interface OnboardingData {
  // Step 1: Account
  fullName: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  otpCode: string;

  // Step 2: Entity Type
  businessType: "individual" | "partnership_llp" | "private_limited";
  legalBusinessName: string;
  agreedToTerms: boolean;

  // Step 3: GST & PAN
  isGstExempt: boolean;
  gstin: string;
  panNumber: string;
  panFileName: string;
  gstFileName: string;

  // Step 4: Storefront & Categories
  storeDisplayName: string;
  storeSlug: string;
  selectedCategories: string[];
  stockReadyState: "ready_to_ship" | "sourcing_in_progress";

  // Step 5: Pickup Address
  pickupAddressLine1: string;
  pickupAddressLine2: string;
  pickupCity: string;
  pickupState: string;
  pickupPincode: string;
  warehouseContactName: string;
  warehouseContactPhone: string;
  matchesGstAddress: boolean;

  // Step 6: Bank Account
  bankAccountHolderName: string;
  bankAccountNumber: string;
  confirmBankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  bankBranch: string;
  accountType: "current" | "savings";
  cancelledChequeFileName: string;
  pennyDropVerified: boolean;

  // Step 7: Tax & Invoicing
  defaultGstRate: string;
  enableAutoInvoicing: boolean;
  digitalSignatureName: string;
  acceptTcsDeclaration: boolean;

  // Step 8: Identity & KYC
  idType: "aadhaar" | "passport" | "voter_id" | "driving_license";
  idNumber: string;
  idProofFileName: string;
  liveSelfieCaptured: boolean;
  videoKycSlot: string;

  // Step 9: Fulfillment
  fulfillmentMethod: "foc" | "easyship" | "selfship";

  // Step 11: First Product (Optional)
  skipFirstProduct: boolean;
  productTitle: string;
  productBrand: string;
  productCategory: string;
  productHsn: string;
  productPrice: number;
  productMrp: number;
  productStock: number;
  productSku: string;
}

const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  fullName: "",
  email: "",
  phone: "",
  phoneVerified: false,
  otpCode: "",

  businessType: "individual",
  legalBusinessName: "",
  agreedToTerms: false,

  isGstExempt: false,
  gstin: "",
  panNumber: "",
  panFileName: "",
  gstFileName: "",

  storeDisplayName: "",
  storeSlug: "",
  selectedCategories: ["Consumer Electronics"],
  stockReadyState: "ready_to_ship",

  pickupAddressLine1: "",
  pickupAddressLine2: "",
  pickupCity: "",
  pickupState: "Maharashtra",
  pickupPincode: "",
  warehouseContactName: "",
  warehouseContactPhone: "",
  matchesGstAddress: true,

  bankAccountHolderName: "",
  bankAccountNumber: "",
  confirmBankAccountNumber: "",
  bankIfsc: "",
  bankName: "",
  bankBranch: "",
  accountType: "current",
  cancelledChequeFileName: "",
  pennyDropVerified: false,

  defaultGstRate: "18",
  enableAutoInvoicing: true,
  digitalSignatureName: "",
  acceptTcsDeclaration: true,

  idType: "aadhaar",
  idNumber: "",
  idProofFileName: "",
  liveSelfieCaptured: false,
  videoKycSlot: "Tomorrow, 11:00 AM - 12:00 PM IST",

  fulfillmentMethod: "easyship",

  skipFirstProduct: false,
  productTitle: "",
  productBrand: "",
  productCategory: "Consumer Electronics",
  productHsn: "85183000",
  productPrice: 2499,
  productMrp: 3999,
  productStock: 25,
  productSku: "SKU-INITIAL-001",
};

const STEP_LABELS = [
  { step: 1, title: "Account & Mobile", icon: "👤", desc: "OTP verification" },
  { step: 2, title: "Business Entity", icon: "🏢", desc: "Legal structure" },
  { step: 3, title: "GST & PAN", icon: "📄", desc: "Tax compliance" },
  { step: 4, title: "Store & Catalog", icon: "🏪", desc: "Categories & branding" },
  { step: 5, title: "Pickup Warehouse", icon: "📍", desc: "Dispatch address" },
  { step: 6, title: "Bank & Escrow", icon: "🏦", desc: "Payout settlement" },
  { step: 7, title: "Tax & Invoicing", icon: "🧾", desc: "HSN & digital sign" },
  { step: 8, title: "Identity & KYC", icon: "🪪", desc: "Selfie & document" },
  { step: 9, title: "Fulfillment Model", icon: "📦", desc: "FOC vs Easy Ship" },
  { step: 10, title: "Fee Preview", icon: "🧮", desc: "Margin calculation" },
  { step: 11, title: "First Listing", icon: "🏷️", desc: "Seed your catalog" },
  { step: 12, title: "Pre-Launch Review", icon: "🚀", desc: "Audit & submission" },
];

export const SellerOnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  // Restore saved draft if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("office_connect_seller_draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData((prev) => ({ ...prev, ...parsed }));
        } catch {
          // ignore corrupted draft
        }
      }
    }
  }, []);

  // Auto-save draft on updates
  const updateForm = (fields: Partial<OnboardingData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...fields };
      if (typeof window !== "undefined") {
        localStorage.setItem("office_connect_seller_draft", JSON.stringify(updated));
      }
      return updated;
    });
    setErrors({});
  };

  // IFSC Bank resolution mock
  useEffect(() => {
    if (formData.bankIfsc.length === 11) {
      const upper = formData.bankIfsc.toUpperCase();
      if (upper.startsWith("HDFC")) {
        updateForm({ bankName: "HDFC Bank Ltd", bankBranch: "Bandra Kurla Complex, Mumbai" });
      } else if (upper.startsWith("ICIC")) {
        updateForm({ bankName: "ICICI Bank", bankBranch: "Connaught Place, New Delhi" });
      } else if (upper.startsWith("SBIN")) {
        updateForm({ bankName: "State Bank of India", bankBranch: "MG Road, Bengaluru" });
      } else if (upper.startsWith("UTIB")) {
        updateForm({ bankName: "Axis Bank", bankBranch: "Salt Lake, Kolkata" });
      } else {
        updateForm({ bankName: "Scheduled Indian Commercial Bank", bankBranch: "Main Branch" });
      }
    }
  }, [formData.bankIfsc]);

  // Handle store slug auto-generation from store display name
  const handleStoreNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    updateForm({ storeDisplayName: name, storeSlug: slug });
  };

  // Validation rules per step
  const validateCurrentStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) errs.fullName = "Full name of legal owner / signatory is required.";
      if (!formData.email.trim() || !formData.email.includes("@")) errs.email = "Valid business email is required.";
      if (!formData.phone.trim() || formData.phone.length < 10) errs.phone = "10-digit Indian mobile number is required.";
      if (!formData.phoneVerified) errs.phoneVerified = "Please complete OTP verification for your mobile.";
    } else if (currentStep === 2) {
      if (!formData.legalBusinessName.trim()) errs.legalBusinessName = "Legal business name matching PAN is required.";
      if (!formData.agreedToTerms) errs.agreedToTerms = "You must agree to the Merchant Services Agreement.";
    } else if (currentStep === 3) {
      if (!formData.panNumber.trim() || formData.panNumber.length !== 10) {
        errs.panNumber = "Valid 10-character PAN number is required (e.g. ABCDE1234F).";
      }
      if (!formData.isGstExempt) {
        if (!formData.gstin.trim() || formData.gstin.length !== 15) {
          errs.gstin = "Valid 15-digit GSTIN is required (e.g. 27ABCDE1234F1Z5).";
        }
      }
    } else if (currentStep === 4) {
      if (!formData.storeDisplayName.trim()) errs.storeDisplayName = "Public Store Display Name is required.";
      if (formData.selectedCategories.length === 0) errs.selectedCategories = "Select at least 1 product category.";
    } else if (currentStep === 5) {
      if (!formData.pickupAddressLine1.trim()) errs.pickupAddressLine1 = "Pickup address is required.";
      if (!formData.pickupCity.trim()) errs.pickupCity = "City is required.";
      if (!formData.pickupPincode.trim() || formData.pickupPincode.length !== 6) {
        errs.pickupPincode = "Valid 6-digit Indian postal PIN code is required.";
      }
      if (!formData.warehouseContactName.trim()) errs.warehouseContactName = "Warehouse contact person name is required.";
    } else if (currentStep === 6) {
      if (!formData.bankAccountHolderName.trim()) errs.bankAccountHolderName = "Account holder name is required.";
      if (!formData.bankAccountNumber.trim()) errs.bankAccountNumber = "Bank account number is required.";
      if (formData.bankAccountNumber !== formData.confirmBankAccountNumber) {
        errs.confirmBankAccountNumber = "Account numbers do not match.";
      }
      if (!formData.bankIfsc.trim() || formData.bankIfsc.length !== 11) {
        errs.bankIfsc = "11-character IFSC code is required.";
      }
    } else if (currentStep === 7) {
      if (!formData.digitalSignatureName.trim()) errs.digitalSignatureName = "Authorized signatory name for tax invoices is required.";
      if (!formData.acceptTcsDeclaration) errs.acceptTcsDeclaration = "TCS & TDS compliance acceptance is required.";
    } else if (currentStep === 8) {
      if (!formData.idNumber.trim()) errs.idNumber = "Identity proof document number is required.";
      if (!formData.liveSelfieCaptured) errs.liveSelfieCaptured = "Please complete live webcam selfie verification.";
    } else if (currentStep === 11) {
      if (!formData.skipFirstProduct) {
        if (!formData.productTitle.trim()) errs.productTitle = "Product title is required.";
        if (formData.productPrice <= 0) errs.productPrice = "Enter a valid selling price.";
        if (formData.productStock <= 0) errs.productStock = "Enter initial available inventory.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 12) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSendOtp = () => {
    if (!formData.phone || formData.phone.length < 10) {
      setErrors({ phone: "Enter valid 10-digit mobile number first." });
      return;
    }
    setOtpSent(true);
    setOtpInput("8291"); // Mock demonstration OTP
  };

  const handleVerifyOtp = () => {
    if (otpInput === "8291" || otpInput.length === 4) {
      updateForm({ phoneVerified: true, otpCode: otpInput });
      setOtpSent(false);
    } else {
      setErrors({ otp: "Incorrect OTP code. Enter 8291 for test verification." });
    }
  };

  const handlePennyDropTest = () => {
    updateForm({ pennyDropVerified: true });
  };

  const handleSelfieCapture = () => {
    updateForm({ liveSelfieCaptured: true });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const appId = `OC-KYB-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const applicationPayload = {
      id: appId,
      businessName: formData.legalBusinessName || formData.fullName,
      tradeName: formData.storeDisplayName,
      category: formData.selectedCategories[0] || "General Merchandise",
      gstin: formData.isGstExempt ? "EXEMPT" : formData.gstin,
      pan: formData.panNumber,
      bankName: formData.bankName || "HDFC Bank Ltd",
      accountNumber: formData.bankAccountNumber.slice(-4) ? `•••• ${formData.bankAccountNumber.slice(-4)}` : "•••• 4091",
      warehouseCity: formData.pickupCity || "Mumbai",
      appliedDate: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      status: "Pending Review",
      details: formData,
    };

    // Store in localStorage so AdminSellerKybDesk picks it up immediately
    try {
      const existing = localStorage.getItem("office_connect_kyb_applications");
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(applicationPayload);
      localStorage.setItem("office_connect_kyb_applications", JSON.stringify(list));
      localStorage.removeItem("office_connect_seller_draft");
    } catch {
      // ignore
    }

    // Try sending to backend if live
    try {
      await fetch("/api/storefront/seller-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationPayload),
      });
    } catch {
      // fallback to offline store
    }

    setIsSubmitting(false);
    setSubmittedAppId(appId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SUCCESS STATE SCREEN
  if (submittedAppId) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 select-none font-sans">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-4xl text-emerald-600 animate-bounce">
            ✓
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              Application Successfully Submitted
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Welcome to Office Connect Seller Central!
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto mt-2">
              Your merchant application is now in our compliance vetting queue. Verification is typically completed within <strong>24 to 48 business hours</strong>.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 max-w-md mx-auto text-left space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Application Tracking ID:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                {submittedAppId}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Merchant Store:</span>
              <span className="font-bold text-[#404d85]">{formData.storeDisplayName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Fulfillment Channel:</span>
              <span className="font-bold text-slate-800 uppercase text-[11px]">
                {formData.fulfillmentMethod === "foc" ? "FOC Prime" : formData.fulfillmentMethod === "easyship" ? "Easy Ship" : "Self Ship"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Verification Status:</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                ● Document Review Pending
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/vendor-dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-sm shadow-md transition"
            >
              Open Seller Portal Cockpit →
            </Link>
            <Link
              href="/storefront"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition"
            >
              Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 select-none font-sans text-slate-900">
      
      {/* Top Header & Save Draft Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/seller-central" className="hover:text-slate-900 transition">Seller Central</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Merchant Registration</span>
            <span>/</span>
            <span className="text-[#404d85] font-semibold">Step {currentStep} of 12</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🛡️</span> Office Connect Seller Onboarding
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Indian Multi-Vendor Merchant Verification & Fulfillment Setup
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Draft Auto-saved
          </span>
          <Link
            href="/seller-central"
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs transition"
          >
            Save & Exit
          </Link>
        </div>
      </div>

      {/* 12-Step Horizontal Progress Stepper */}
      <div className="py-6 overflow-x-auto scrollbar-none">
        <div className="flex items-center min-w-[900px] justify-between relative">
          {/* Progress Bar background */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
          <div
            className="absolute top-1/2 left-0 h-1 bg-[#404d85] -translate-y-1/2 transition-all duration-300 z-0"
            style={{ width: `${((currentStep - 1) / 11) * 100}%` }}
          ></div>

          {STEP_LABELS.map((s) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <button
                key={s.step}
                type="button"
                onClick={() => s.step < currentStep && setCurrentStep(s.step)}
                disabled={s.step > currentStep}
                className={`relative z-10 flex flex-col items-center group transition ${
                  s.step > currentStep ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-[#404d85] text-white ring-4 ring-[#404d85]/20 scale-110"
                      : "bg-white border-2 border-slate-300 text-slate-500"
                  }`}
                >
                  {isCompleted ? "✓" : s.step}
                </div>
                <div className="text-[10px] font-bold text-slate-700 mt-1.5 whitespace-nowrap text-center">
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 transition-all">
        
        {/* Step Header Banner */}
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-[#404d85]/10 text-2xl flex items-center justify-center shrink-0">
            {STEP_LABELS[currentStep - 1].icon}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#404d85]">
              Step {currentStep} of 12 — {STEP_LABELS[currentStep - 1].desc}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {STEP_LABELS[currentStep - 1].title}
            </h2>
          </div>
        </div>

        {/* STEP CONTENT BODY */}
        <div className="space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: ACCOUNT & MOBILE OTP */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name of Business Owner / Authorized Signatory *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bhasker Advani"
                  value={formData.fullName}
                  onChange={(e) => updateForm({ fullName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
                />
                {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dedicated Business Email Address *
                </label>
                <input
                  type="email"
                  placeholder="seller@yourbusiness.com"
                  value={formData.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  All order notifications, commission settlement invoices, and customer messages will be dispatched here.
                </p>
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Indian Mobile Number (for 2-Step Verification) *
                </label>
                <div className="flex gap-2">
                  <span className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 flex items-center">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => updateForm({ phone: e.target.value.replace(/\D/g, "") })}
                    disabled={formData.phoneVerified}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
                  />
                  {!formData.phoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="px-4 py-2.5 rounded-xl bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs shrink-0 transition"
                    >
                      {otpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  )}
                  {formData.phoneVerified && (
                    <span className="px-3 py-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1">
                      ✓ Verified
                    </span>
                  )}
                </div>
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}

                {otpSent && !formData.phoneVerified && (
                  <div className="mt-3 p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <div className="text-xs text-blue-900 font-semibold">
                      An SMS OTP has been sent to +91 {formData.phone}. (Demo code: <strong>8291</strong>)
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Enter 4-digit OTP"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="w-40 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm font-mono font-bold tracking-widest text-center"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                      >
                        Confirm OTP
                      </button>
                    </div>
                    {errors.otp && <p className="text-xs text-red-600">{errors.otp}</p>}
                  </div>
                )}
                {errors.phoneVerified && <p className="text-xs text-red-600 mt-1">{errors.phoneVerified}</p>}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: BUSINESS ENTITY TYPE */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Legal Structure (Must match your PAN) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "individual",
                      title: "Individual / Sole Proprietor",
                      desc: "Personal PAN and individual/proprietorship GSTIN.",
                      badge: "Easiest",
                    },
                    {
                      id: "partnership_llp",
                      title: "Partnership / LLP",
                      desc: "Requires firm PAN card and partnership deed / LLP agreement.",
                      badge: "Standard",
                    },
                    {
                      id: "private_limited",
                      title: "Private Limited / OPC",
                      desc: "Requires company PAN, CIN, and Certificate of Incorporation (MCA).",
                      badge: "Corporate",
                    },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => updateForm({ businessType: type.id as any })}
                      className={`p-4 text-left rounded-2xl border transition relative ${
                        formData.businessType === type.id
                          ? "border-[#404d85] bg-[#404d85]/5 ring-2 ring-[#404d85]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#404d85]/10 text-[#404d85]">
                        {type.badge}
                      </span>
                      <div className="text-sm font-bold text-slate-900 mt-2">{type.title}</div>
                      <div className="text-xs text-slate-500 mt-1 leading-relaxed">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Legal Business Name (Exactly as printed on PAN card) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. CAMBLISS TECHNOLOGIES PRIVATE LIMITED"
                  value={formData.legalBusinessName}
                  onChange={(e) => updateForm({ legalBusinessName: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tracking-wide uppercase text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This will be automatically matched against the Income Tax Department and GST database.
                </p>
                {errors.legalBusinessName && <p className="text-xs text-red-600 mt-1">{errors.legalBusinessName}</p>}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) => updateForm({ agreedToTerms: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-[#404d85] focus:ring-[#404d85]"
                  />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    I agree to the <strong>Office Connect Merchant Services & Business Solutions Agreement</strong>, Marketplace Fair Pricing Policy, and Escrow Payout Schedule.
                  </div>
                </label>
                {errors.agreedToTerms && <p className="text-xs text-red-600">{errors.agreedToTerms}</p>}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: GSTIN & PAN VERIFICATION */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-2xl">
              {/* GST Exempt Toggle */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="gstExempt"
                  checked={formData.isGstExempt}
                  onChange={(e) => updateForm({ isGstExempt: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded text-amber-600"
                />
                <div>
                  <label htmlFor="gstExempt" className="text-xs font-bold text-amber-900 cursor-pointer">
                    I will sell ONLY GST-exempt products (e.g. Printed Books, Fresh Agricultural Produce)
                  </label>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    If checked, you will be restricted exclusively to zero-rated GST categories as per Section 23 of the CGST Act.
                  </p>
                </div>
              </div>

              {!formData.isGstExempt && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      15-Digit Indian GSTIN Number *
                    </label>
                    <span className="text-xs text-slate-400 font-mono">Format: 27AAAAA0000A1Z5</span>
                  </div>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="27AAACH1234F1Z8"
                    value={formData.gstin}
                    onChange={(e) => updateForm({ gstin: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
                  />
                  {errors.gstin && <p className="text-xs text-red-600 mt-1">{errors.gstin}</p>}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    10-Character Permanent Account Number (PAN) *
                  </label>
                  <span className="text-xs text-slate-400 font-mono">Format: AAAAA0000A</span>
                </div>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  value={formData.panNumber}
                  onChange={(e) => updateForm({ panNumber: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
                />
                {errors.panNumber && <p className="text-xs text-red-600 mt-1">{errors.panNumber}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition cursor-pointer">
                  <div className="text-2xl mb-1">🪪</div>
                  <div className="text-xs font-bold text-slate-800">Upload PAN Card Image</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Clear JPEG/PDF under 10MB</div>
                  <button
                    type="button"
                    onClick={() => updateForm({ panFileName: "pan_card_verified.jpg" })}
                    className="mt-2.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    {formData.panFileName ? `✓ ${formData.panFileName}` : "Browse File"}
                  </button>
                </div>

                {!formData.isGstExempt && (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition cursor-pointer">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-xs font-bold text-slate-800">Upload GST Certificate (REG-06)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Showing legal name & address</div>
                    <button
                      type="button"
                      onClick={() => updateForm({ gstFileName: "gst_certificate_reg06.pdf" })}
                      className="mt-2.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      {formData.gstFileName ? `✓ ${formData.gstFileName}` : "Browse File"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: STORE DISPLAY NAME & CATEGORIES */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer-Facing Store Display Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Hardware & Electronics"
                  value={formData.storeDisplayName}
                  onChange={(e) => handleStoreNameChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
                />
                {formData.storeSlug && (
                  <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    <span>Your Store URL:</span>
                    <strong className="text-[#404d85] font-mono">
                      https://theofficeconnect.com/store/{formData.storeSlug}
                    </strong>
                  </div>
                )}
                {errors.storeDisplayName && <p className="text-xs text-red-600 mt-1">{errors.storeDisplayName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Product Categories to Sell *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: "Consumer Electronics", label: "Consumer Electronics", gated: true, req: "BIS Mark" },
                    { id: "Computers & Laptops", label: "Computers & IT Hardware", gated: false },
                    { id: "Mobile & Accessories", label: "Mobile Phones & Gadgets", gated: false },
                    { id: "Office Supplies & Furniture", label: "Office Supplies & Furniture", gated: false },
                    { id: "Fashion, Apparel & Footwear", label: "Fashion, Clothing & Shoes", gated: false },
                    { id: "Beauty, Personal Care & Grooming", label: "Beauty & Grooming", gated: true, req: "Cosmetics NOC" },
                    { id: "Grocery, Gourmet & Beverages", label: "Food & Gourmet Groceries", gated: true, req: "FSSAI 14-Digit" },
                    { id: "Industrial, Hardware & Tools", label: "Industrial & Warehouse Tools", gated: false },
                    { id: "Books, Stationery & Media", label: "Books & Educational Media", gated: false },
                  ].map((cat) => {
                    const isChecked = formData.selectedCategories.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition ${
                          isChecked ? "border-[#404d85] bg-[#404d85]/5" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateForm({ selectedCategories: [...formData.selectedCategories, cat.id] });
                              } else {
                                updateForm({
                                  selectedCategories: formData.selectedCategories.filter((c) => c !== cat.id),
                                });
                              }
                            }}
                            className="w-4 h-4 mt-0.5 rounded text-[#404d85]"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800">{cat.label}</div>
                            {cat.gated && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                                Gated: {cat.req}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.selectedCategories && <p className="text-xs text-red-600 mt-1">{errors.selectedCategories}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Sourcing & Inventory Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "ready_to_ship", title: "Inventory In Stock", desc: "Ready to ship immediately upon launch" },
                    { id: "sourcing_in_progress", title: "Currently Sourcing", desc: "Catalog preparation in progress" },
                  ].map((status) => (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => updateForm({ stockReadyState: status.id as any })}
                      className={`p-3 text-left rounded-xl border transition ${
                        formData.stockReadyState === status.id
                          ? "border-[#404d85] bg-[#404d85]/5 ring-1 ring-[#404d85]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{status.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{status.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: PICKUP WAREHOUSE ADDRESS */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pickup Street Address (Line 1) *
                </label>
                <input
                  type="text"
                  placeholder="Plot / Shed / Building No., Industrial Area"
                  value={formData.pickupAddressLine1}
                  onChange={(e) => updateForm({ pickupAddressLine1: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
                />
                {errors.pickupAddressLine1 && <p className="text-xs text-red-600 mt-1">{errors.pickupAddressLine1}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={formData.pickupCity}
                    onChange={(e) => updateForm({ pickupCity: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
                  />
                  {errors.pickupCity && <p className="text-xs text-red-600 mt-1">{errors.pickupCity}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    State *
                  </label>
                  <select
                    value={formData.pickupState}
                    onChange={(e) => updateForm({ pickupState: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                  >
                    {[
                      "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Gujarat", 
                      "Telangana", "Haryana", "Uttar Pradesh", "West Bengal", "Rajasthan"
                    ].map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="400001"
                    value={formData.pickupPincode}
                    onChange={(e) => updateForm({ pickupPincode: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
                  />
                  {errors.pickupPincode && <p className="text-xs text-red-600 mt-1">{errors.pickupPincode}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Warehouse Dispatch Manager Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Contact person for courier pickup"
                    value={formData.warehouseContactName}
                    onChange={(e) => updateForm({ warehouseContactName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                  />
                  {errors.warehouseContactName && <p className="text-xs text-red-600 mt-1">{errors.warehouseContactName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Warehouse Dispatch Contact Phone
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={formData.warehouseContactPhone}
                    onChange={(e) => updateForm({ warehouseContactPhone: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.matchesGstAddress}
                  onChange={(e) => updateForm({ matchesGstAddress: e.target.checked })}
                  className="w-4 h-4 rounded text-[#404d85]"
                />
                <span className="text-xs text-slate-600">
                  This address matches the Principal Place of Business listed on my GST certificate.
                </span>
              </label>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 6: BANK ACCOUNT & ESCROW SETTLEMENT */}
          {/* ========================================================================= */}
          {currentStep === 6 && (
            <div className="space-y-5 max-w-2xl">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <span className="text-xl text-emerald-600">🛡️</span>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Escrow Account Settlement Protection</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Your sales revenue is held in 100% compliant Indian Banking Escrow and settled automatically every 7 days after delivery.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Holder Name (Must match legal name on PAN/GST) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. CAMBLISS TECHNOLOGIES PVT LTD"
                  value={formData.bankAccountHolderName}
                  onChange={(e) => updateForm({ bankAccountHolderName: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
                />
                {errors.bankAccountHolderName && <p className="text-xs text-red-600 mt-1">{errors.bankAccountHolderName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bank Account Number *
                  </label>
                  <input
                    type="password"
                    placeholder="Enter account number"
                    value={formData.bankAccountNumber}
                    onChange={(e) => updateForm({ bankAccountNumber: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800"
                  />
                  {errors.bankAccountNumber && <p className="text-xs text-red-600 mt-1">{errors.bankAccountNumber}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Account Number *
                  </label>
                  <input
                    type="text"
                    placeholder="Re-enter account number"
                    value={formData.confirmBankAccountNumber}
                    onChange={(e) => updateForm({ confirmBankAccountNumber: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800"
                  />
                  {errors.confirmBankAccountNumber && <p className="text-xs text-red-600 mt-1">{errors.confirmBankAccountNumber}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  11-Character IFSC Code *
                </label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="HDFC0000240"
                  value={formData.bankIfsc}
                  onChange={(e) => updateForm({ bankIfsc: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-800"
                />
                {formData.bankName && (
                  <p className="text-xs text-emerald-700 font-medium mt-1">
                    ✓ Resolved: <strong>{formData.bankName}</strong> ({formData.bankBranch})
                  </p>
                )}
                {errors.bankIfsc && <p className="text-xs text-red-600 mt-1">{errors.bankIfsc}</p>}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <div className="text-xs font-bold text-slate-800">Bank Penny-Drop Micro Deposit Verification</div>
                  <div className="text-[11px] text-slate-500">
                    Instant automated ₹1 penny deposit to verify IFSC and account holder name match.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePennyDropTest}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    formData.pennyDropVerified
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-[#404d85] hover:bg-[#323d6a] text-white shadow-xs"
                  }`}
                >
                  {formData.pennyDropVerified ? "✓ Penny-Drop Verified" : "Run Penny Drop"}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 7: TAX, HSN & AUTOMATED INVOICING */}
          {/* ========================================================================= */}
          {currentStep === 7 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Default Product GST Tax Slab *
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {["5", "12", "18", "28"].map((slab) => (
                    <button
                      key={slab}
                      type="button"
                      onClick={() => updateForm({ defaultGstRate: slab })}
                      className={`p-3 text-center rounded-xl border transition ${
                        formData.defaultGstRate === slab
                          ? "border-[#404d85] bg-[#404d85]/5 ring-2 ring-[#404d85]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-base font-extrabold text-slate-900">{slab}%</div>
                      <div className="text-[10px] text-slate-500 font-semibold">GST Rate</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableAutoInvoicing}
                    onChange={(e) => updateForm({ enableAutoInvoicing: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-[#404d85]"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Enable Office Connect Automated GST Invoicing System
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Platform automatically computes CGST, SGST, IGST per shipment, applies consecutive invoice numbers, and generates downloadable B2B / B2C tax invoices for buyers.
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Authorized Signatory Name for Invoice Digital Signatures *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authorized Signatory"
                  value={formData.digitalSignatureName}
                  onChange={(e) => updateForm({ digitalSignatureName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                />
                {errors.digitalSignatureName && <p className="text-xs text-red-600 mt-1">{errors.digitalSignatureName}</p>}
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formData.acceptTcsDeclaration}
                  onChange={(e) => updateForm({ acceptTcsDeclaration: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded text-[#404d85]"
                />
                <div className="text-xs text-slate-600">
                  I understand that Office Connect will deduct <strong>1% Tax Collected at Source (TCS)</strong> under GST Section 52 and deposit it to the Government against my GSTIN on a monthly basis.
                </div>
              </label>
              {errors.acceptTcsDeclaration && <p className="text-xs text-red-600">{errors.acceptTcsDeclaration}</p>}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 8: IDENTITY & KYC VERIFICATION */}
          {/* ========================================================================= */}
          {currentStep === 8 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Government Photo Identity Proof *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "aadhaar", label: "Aadhaar Card" },
                    { id: "passport", label: "Indian Passport" },
                    { id: "voter_id", label: "Voter ID" },
                    { id: "driving_license", label: "Driving Licence" },
                  ].map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => updateForm({ idType: doc.id as any })}
                      className={`p-3 text-center rounded-xl border transition text-xs font-bold ${
                        formData.idType === doc.id
                          ? "border-[#404d85] bg-[#404d85]/5 text-[#404d85] ring-1 ring-[#404d85]"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {doc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ID Number (Aadhaar / Passport / DL Number) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5482 9102 3819"
                  value={formData.idNumber}
                  onChange={(e) => updateForm({ idNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800"
                />
                {errors.idNumber && <p className="text-xs text-red-600 mt-1">{errors.idNumber}</p>}
              </div>

              {/* Live Webcam Selfie Simulation */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center text-2xl">
                    {formData.liveSelfieCaptured ? "📸" : "👤"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Live Selfie with Original ID Card
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Hold your physical ID next to your face for quick automated biometric verification.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSelfieCapture}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                    formData.liveSelfieCaptured
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-[#404d85] hover:bg-[#323d6a] text-white shadow-xs"
                  }`}
                >
                  {formData.liveSelfieCaptured ? "✓ Photo Verified" : "Capture Live Photo"}
                </button>
              </div>
              {errors.liveSelfieCaptured && <p className="text-xs text-red-600">{errors.liveSelfieCaptured}</p>}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Video KYC Associate Slot (Optional fallback)
                </label>
                <select
                  value={formData.videoKycSlot}
                  onChange={(e) => updateForm({ videoKycSlot: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="Today, 3:00 PM - 4:00 PM IST">Today, 3:00 PM - 4:00 PM IST</option>
                  <option value="Tomorrow, 11:00 AM - 12:00 PM IST">Tomorrow, 11:00 AM - 12:00 PM IST</option>
                  <option value="Tomorrow, 4:00 PM - 5:00 PM IST">Tomorrow, 4:00 PM - 5:00 PM IST</option>
                </select>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 9: FULFILLMENT METHOD SELECTION */}
          {/* ========================================================================= */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: "foc",
                    title: "Fulfillment by Office Connect (FOC)",
                    badge: "Fast-Track Prime Badge",
                    desc: "Ship inventory to our regional fulfillment center. We store, pack, dispatch, and handle all customer returns.",
                    bestFor: "Best for: Fast-moving items, highest buy-box win rate, hands-off logistics.",
                    tagColor: "bg-amber-100 text-amber-900 border-amber-200",
                  },
                  {
                    id: "easyship",
                    title: "Easy Ship",
                    badge: "Most Popular Channel",
                    desc: "You store and pack orders in your warehouse. Our courier partner collects from your doorstep and delivers with live tracking.",
                    bestFor: "Best for: Sellers with their own storage wanting marketplace delivery guarantees.",
                    tagColor: "bg-blue-100 text-blue-900 border-blue-200",
                  },
                  {
                    id: "selfship",
                    title: "Self Ship",
                    badge: "Direct Merchant Logistics",
                    desc: "You store, pack, and dispatch using your own registered logistics partner. You handle your own return pickup logistics.",
                    bestFor: "Best for: Custom manufactured items, heavy machinery, or fragile goods.",
                    tagColor: "bg-slate-100 text-slate-800 border-slate-200",
                  },
                ].map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => updateForm({ fulfillmentMethod: channel.id as any })}
                    className={`p-5 text-left rounded-2xl border transition flex flex-col justify-between ${
                      formData.fulfillmentMethod === channel.id
                        ? "border-[#404d85] bg-[#404d85]/5 ring-2 ring-[#404d85]"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border ${channel.tagColor}`}>
                        {channel.badge}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-2.5">{channel.title}</h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{channel.desc}</p>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-4 pt-3 border-t border-slate-100">
                      {channel.bestFor}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 10: INTERACTIVE FEE PREVIEW & MARGINS */}
          {/* ========================================================================= */}
          {currentStep === 10 && (
            <div>
              <SellerFeeCalculator />
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 11: FIRST PRODUCT LISTING (OPTIONAL) */}
          {/* ========================================================================= */}
          {currentStep === 11 && (
            <div className="space-y-6 max-w-2xl">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Seed Your Catalog Now or Later?</h4>
                  <p className="text-[11px] text-slate-500">
                    You can list your initial product now, or skip and use the bulk upload spreadsheet inside Seller Central.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.skipFirstProduct}
                    onChange={(e) => updateForm({ skipFirstProduct: e.target.checked })}
                    className="w-4 h-4 rounded text-[#404d85]"
                  />
                  <span className="text-xs font-bold text-slate-700">List later</span>
                </label>
              </div>

              {!formData.skipFirstProduct && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Product Title / Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ergonomic High-Back Executive Office Chair with Lumbar Support"
                      value={formData.productTitle}
                      onChange={(e) => updateForm({ productTitle: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                    />
                    {errors.productTitle && <p className="text-xs text-red-600 mt-1">{errors.productTitle}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Cambliss Workspace"
                        value={formData.productBrand}
                        onChange={(e) => updateForm({ productBrand: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        HSN / SAC Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 94031000"
                        value={formData.productHsn}
                        onChange={(e) => updateForm({ productHsn: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.productPrice}
                        onChange={(e) => updateForm({ productPrice: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800"
                      />
                      {errors.productPrice && <p className="text-xs text-red-600 mt-1">{errors.productPrice}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        MRP / List Price (₹)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.productMrp}
                        onChange={(e) => updateForm({ productMrp: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.productStock}
                        onChange={(e) => updateForm({ productStock: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800"
                      />
                      {errors.productStock && <p className="text-xs text-red-600 mt-1">{errors.productStock}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 12: PRE-LAUNCH CHECKLIST REVIEW & FINAL SUBMISSION */}
          {/* ========================================================================= */}
          {currentStep === 12 && (
            <div className="space-y-6">
              
              {/* Summary Audit Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                  <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <span>🏢</span> Business & Legal Identity
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Legal Entity:</span>
                    <span className="font-bold text-slate-800">{formData.legalBusinessName || formData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Store Display Name:</span>
                    <span className="font-bold text-[#404d85]">{formData.storeDisplayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PAN Number:</span>
                    <span className="font-mono font-bold text-slate-800">{formData.panNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GSTIN:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formData.isGstExempt ? "Exempted Goods" : formData.gstin}
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                  <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <span>🏦</span> Banking & Logistics
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Escrow Bank:</span>
                    <span className="font-bold text-slate-800">{formData.bankName || "Scheduled Commercial Bank"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Number:</span>
                    <span className="font-mono font-bold text-slate-800">
                      •••• {formData.bankAccountNumber.slice(-4) || "4091"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pickup City:</span>
                    <span className="font-bold text-slate-800">{formData.pickupCity} ({formData.pickupPincode})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fulfillment Model:</span>
                    <span className="font-bold text-emerald-700 uppercase">
                      {formData.fulfillmentMethod === "foc" ? "FOC Prime" : formData.fulfillmentMethod === "easyship" ? "Easy Ship" : "Self Ship"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 12-Point Launch Audit Checklist */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Pre-Launch Verification Audit Checklist (12 Points Verified)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 1. Legal Name matches across PAN & GST</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 2. Bank account name matches PAN record</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 3. 2-Step OTP mobile verification active</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 4. Pickup warehouse PIN code serviceable</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 5. Fulfillment method designated</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 6. Category commission fee schedule acknowledged</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 7. Automated GST tax invoicing configured</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 8. 1% TCS compliance declaration accepted</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 9. Identity proof & live selfie captured</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 10. Digital signature authorized</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 11. Initial catalog offerings selected</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">✓ 12. Terms of Merchant Solutions accepted</div>
                </div>
              </div>

              {/* Final Submit Action */}
              <div className="pt-2 text-center space-y-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#404d85] to-[#2e3760] hover:from-[#323d6a] hover:to-[#222949] text-white font-extrabold text-base shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting Application..." : "🚀 Submit Application & Launch Seller Central"}
                </button>
                <p className="text-xs text-slate-400">
                  By clicking Submit, your application will be routed to the Compliance Team for activation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation Controls */}
        {currentStep < 12 && (
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold transition ${
                currentStep === 1
                  ? "opacity-40 cursor-not-allowed bg-slate-50 text-slate-400"
                  : "bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-[#404d85] hover:bg-[#323d6a] text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <span>Save & Continue</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
