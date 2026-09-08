"use client";

import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { SellerFeeCalculator } from "@/components/seller-portal/SellerFeeCalculator";

export default function SellerCentralLandingPage() {
  return (
    <StorefrontShell>
      <div className="bg-slate-50 min-h-screen select-none font-sans text-slate-900 pb-24">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#181e36] via-[#242b4d] to-[#181e36] text-white py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-xs text-white/90">
              <span>🇮🇳</span>
              <span>India Multi-Vendor Marketplace — Merchant Central</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
              Sell to Millions of Customers on{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-emerald-300">
                Office Connect
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Launch your independent digital storefront, leverage automated Pan-India fulfillment, and receive guaranteed 7-day bank escrow payouts with zero monthly subscription fees.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link
                href="/seller-central/onboarding"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                <span>Start Selling / Register Now</span>
              </Link>
              <Link
                href="#document-checklist"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm sm:text-base backdrop-blur-xs transition flex items-center justify-center gap-2"
              >
                <span>📋</span>
                <span>View Documents Checklist</span>
              </Link>
            </div>

            {/* Quick Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-white/10 text-left">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-slate-400">Zero Fixed Fees</div>
                <div className="text-sm font-bold text-white mt-0.5">Pay only when you sell</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-slate-400">Fast Escrow Settlement</div>
                <div className="text-sm font-bold text-white mt-0.5">7-day regular bank payout</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-slate-400">Pan-India Logistics</div>
                <div className="text-sm font-bold text-white mt-0.5">Doorstep pickup & delivery</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-slate-400">Tax & Invoicing</div>
                <div className="text-sm font-bold text-white mt-0.5">100% GST & HSN automated</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: DOCUMENT PREPARATION CHECKLIST */}
        <section id="document-checklist" className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-[#404d85] uppercase tracking-wider">Before You Begin</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Required Documents & Eligibility Checklist
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keep scanned copies (PDF / JPEG under 10MB) ready. The business name must match across your PAN, GST, and Bank account.
                </p>
              </div>
              <Link
                href="/seller-central/onboarding"
                className="px-4 py-2 rounded-xl bg-[#404d85] hover:bg-[#323d6a] text-white text-xs font-bold shrink-0 transition"
              >
                Proceed to Registration →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: "💳",
                  title: "PAN Card",
                  requiredFor: "All Merchants",
                  notes: "Individual PAN for proprietors; Corporate PAN for LLP or Pvt Ltd entities.",
                },
                {
                  icon: "📄",
                  title: "GSTIN Certificate",
                  requiredFor: "Taxable Categories",
                  notes: "Mandatory for all taxable goods. Form REG-06 must show active status and matching PAN.",
                },
                {
                  icon: "🏦",
                  title: "Bank Account Proof",
                  requiredFor: "All Merchants",
                  notes: "Cancelled cheque or bank statement showing legal name, account number, and IFSC code.",
                },
                {
                  icon: "🪪",
                  title: "Identity Proof",
                  requiredFor: "Authorized Signatory",
                  notes: "Aadhaar Card, Passport, Voter ID, or Driving License of the account owner.",
                },
                {
                  icon: "📍",
                  title: "Address Proof",
                  requiredFor: "Pickup Warehouse",
                  notes: "GST Certificate, rent agreement, or utility bill showing dispatch location.",
                },
                {
                  icon: "📜",
                  title: "Business Registration",
                  requiredFor: "Companies & LLPs",
                  notes: "Certificate of Incorporation (CIN), LLP Agreement, or Registered Partnership Deed.",
                },
              ].map((doc, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{doc.icon}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {doc.requiredFor}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 pt-1">{doc.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{doc.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2: 12-STEP ONBOARDING ROADMAP */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16">
          <div className="text-center space-y-2 mb-10">
            <span className="text-xs font-bold text-[#404d85] uppercase tracking-wider">Step-by-Step Registration</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              The 12-Step Guided Verification Process
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
              Set aside 15–20 minutes to complete the guided verification flow and launch your store.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: 1, title: "Account & Mobile", desc: "Verify email and 2-factor Indian mobile OTP." },
              { step: 2, title: "Legal Structure", desc: "Select Sole Proprietor, LLP, or Pvt Ltd entity." },
              { step: 3, title: "GST & PAN Entry", desc: "Validate 15-digit GSTIN & 10-character PAN." },
              { step: 4, title: "Store & Catalog", desc: "Pick your store URL slug and target categories." },
              { step: 5, title: "Pickup Warehouse", desc: "Add dispatch address with Indian PIN code validation." },
              { step: 6, title: "Bank Account", desc: "Connect escrow account with instant penny-drop test." },
              { step: 7, title: "Tax & Invoicing", desc: "Configure GST slabs and automated tax invoices." },
              { step: 8, title: "Identity & Video KYC", desc: "Upload ID proof and complete live selfie photo." },
              { step: 9, title: "Fulfillment Model", desc: "Choose between FOC Logistics, Easy Ship, or Self Ship." },
              { step: 10, title: "Fee Preview Tool", desc: "Simulate your net bank payout before listing." },
              { step: 11, title: "First Listing", desc: "Publish your initial product offer or seed SKU." },
              { step: 12, title: "Audit & Launch", desc: "12-point checklist review and KYB verification queue." },
            ].map((s) => (
              <div key={s.step} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <div className="w-6 h-6 rounded-full bg-[#404d85]/10 text-[#404d85] text-xs font-black flex items-center justify-center">
                  {s.step}
                </div>
                <h4 className="text-xs font-bold text-slate-900 pt-1">{s.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: FULFILLMENT CHANNELS COMPARISON */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16">
          <div className="text-center space-y-2 mb-10">
            <span className="text-xs font-bold text-[#404d85] uppercase tracking-wider">Logistics & Delivery</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Choose the Right Fulfillment Method for Your Business
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
              Mix and match per product based on item weight, volume, and customer expectations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Prime Fast-Track
              </div>
              <div className="space-y-3">
                <span className="text-3xl">⚡</span>
                <h3 className="text-lg font-black text-slate-900">Fulfillment by Office Connect (FOC)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Send your inventory to our regional fulfillment hubs. Office Connect handles warehousing, pick, pack, express shipping, and 100% of customer returns.
                </p>
                <div className="pt-2 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 font-medium">✓ Automatic Fast Delivery badge on PDPs</div>
                  <div className="flex items-center gap-1.5 font-medium">✓ Highest Buy Box win algorithm score</div>
                  <div className="flex items-center gap-1.5 font-medium">✓ 24/7 customer service handled by platform</div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
                Ideal for: Fast-moving, standardized goods seeking maximum sales velocity.
              </div>
            </div>

            <div className="bg-white rounded-3xl border-2 border-[#404d85] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#404d85] text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-3">
                <span className="text-3xl">🚚</span>
                <h3 className="text-lg font-black text-slate-900">Easy Ship</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You store and pack goods at your own warehouse. Our integrated courier partner arrives at your doorstep, collects the package, and delivers it safely.
                </p>
                <div className="pt-2 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 font-medium">✓ Doorstep courier pickup & live tracking</div>
                  <div className="flex items-center gap-1.5 font-medium">✓ Retain control of your physical stock</div>
                  <div className="flex items-center gap-1.5 font-medium">✓ Zero upfront storage charges</div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
                Ideal for: Sellers with their own warehouse space and packaging staff.
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-3xl">📦</span>
                <h3 className="text-lg font-black text-slate-900">Self Ship</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You store, pack, and ship using your own registered carrier partners. You coordinate delivery SLAs and direct return pickup operations.
                </p>
                <div className="pt-2 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 font-medium">✓ Zero logistics commission to marketplace</div>
                  <div className="flex items-center gap-1.5 font-medium">✓ Custom carrier tracking numbers supported</div>
                  <div className="flex items-center gap-1.5 font-medium">✓ Direct customer communication for delivery</div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
                Ideal for: Heavy machinery, customized goods, or remote PIN codes.
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: INTERACTIVE FEE CALCULATOR */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16">
          <SellerFeeCalculator />
        </section>

        {/* SECTION 5: FINAL CTA BANNER */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16">
          <div className="bg-gradient-to-r from-[#404d85] to-[#283259] rounded-3xl p-8 sm:p-12 text-white text-center space-y-5 shadow-xl">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to Expand Your Business Across India?
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed">
              Join thousands of certified merchants on Office Connect. Start your registration today and launch your storefront in under 48 hours.
            </p>
            <div className="pt-2">
              <Link
                href="/seller-central/onboarding"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm sm:text-base shadow-md transition transform hover:-translate-y-0.5"
              >
                <span>🚀</span>
                <span>Begin Seller Registration (12 Steps) →</span>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </StorefrontShell>
  );
}
