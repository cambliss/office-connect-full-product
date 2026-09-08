"use client";

import { Suspense } from "react";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { SellerOnboardingWizard } from "@/components/seller-portal/SellerOnboardingWizard";

export default function SellerOnboardingPage() {
  return (
    <StorefrontShell>
      <div className="bg-slate-50 min-h-screen py-8 pb-32">
        <Suspense fallback={<div className="text-center py-20 text-slate-500 font-bold">Loading Merchant Registration Wizard...</div>}>
          <SellerOnboardingWizard />
        </Suspense>
      </div>
    </StorefrontShell>
  );
}
