"use client";

import { useState, useMemo } from "react";

interface CategoryFeeConfig {
  name: string;
  referralRate: number; // as percentage
  gated: boolean;
  requiredLicense?: string;
}

const CATEGORIES_FEE_MAP: Record<string, CategoryFeeConfig> = {
  "Consumer Electronics": { name: "Consumer Electronics", referralRate: 7.0, gated: true, requiredLicense: "BIS Certification" },
  "Computers & Laptops": { name: "Computers & Laptops", referralRate: 6.0, gated: false },
  "Mobile & Accessories": { name: "Mobile & Accessories", referralRate: 8.5, gated: false },
  "Office Supplies & Furniture": { name: "Office Supplies & Furniture", referralRate: 9.0, gated: false },
  "Fashion, Apparel & Footwear": { name: "Fashion, Apparel & Footwear", referralRate: 13.5, gated: false },
  "Beauty, Personal Care & Grooming": { name: "Beauty, Personal Care & Grooming", referralRate: 10.0, gated: true, requiredLicense: "Drug/Cosmetic License" },
  "Grocery, Gourmet & Beverages": { name: "Grocery, Gourmet & Beverages", referralRate: 5.5, gated: true, requiredLicense: "FSSAI License" },
  "Industrial, Hardware & Tools": { name: "Industrial, Hardware & Tools", referralRate: 8.0, gated: false },
  "Books, Stationery & Media": { name: "Books, Stationery & Media", referralRate: 6.5, gated: false },
};

export const SellerFeeCalculator = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Consumer Electronics");
  const [sellingPrice, setSellingPrice] = useState<number>(2999);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"foc" | "easyship" | "selfship">("easyship");
  const [shippingDistance, setShippingDistance] = useState<"local" | "regional" | "national">("regional");
  const [itemWeightKg, setItemWeightKg] = useState<number>(1.0);

  const breakdown = useMemo(() => {
    const categoryConfig = CATEGORIES_FEE_MAP[selectedCategory] || { referralRate: 8.0, gated: false };
    const price = Math.max(10, sellingPrice || 0);

    // 1. Referral Fee
    const referralFee = (price * categoryConfig.referralRate) / 100;

    // 2. Closing Fee (tiered by price)
    let closingFee = 5;
    if (price > 1000) closingFee = 45;
    else if (price > 500) closingFee = 25;
    else if (price > 250) closingFee = 10;

    // 3. Shipping / Weight Handling Fee
    let shippingFee = 0;
    if (fulfillmentMethod === "foc") {
      const baseFee = shippingDistance === "local" ? 32 : shippingDistance === "regional" ? 45 : 68;
      const weightMultiplier = Math.max(1, Math.ceil(itemWeightKg / 0.5));
      shippingFee = baseFee + (weightMultiplier - 1) * 16;
    } else if (fulfillmentMethod === "easyship") {
      const baseFee = shippingDistance === "local" ? 38 : shippingDistance === "regional" ? 52 : 74;
      const weightMultiplier = Math.max(1, Math.ceil(itemWeightKg / 0.5));
      shippingFee = baseFee + (weightMultiplier - 1) * 19;
    } else {
      // Self Ship: merchant pays external courier, marketplace charges 0 logistics
      shippingFee = 0;
    }

    // 4. Subtotal Marketplace Fees
    const subtotalFees = referralFee + closingFee + shippingFee;

    // 5. 18% GST on Marketplace Fees (Input Tax Credit eligible)
    const gstOnFees = subtotalFees * 0.18;

    // 6. Total Deductions
    const totalDeductions = subtotalFees + gstOnFees;

    // 7. Net Seller Payout
    const netPayout = Math.max(0, price - totalDeductions);
    const profitMarginPercent = ((netPayout / price) * 100).toFixed(1);

    return {
      price,
      categoryConfig,
      referralFee,
      closingFee,
      shippingFee,
      subtotalFees,
      gstOnFees,
      totalDeductions,
      netPayout,
      profitMarginPercent,
    };
  }, [selectedCategory, sellingPrice, fulfillmentMethod, shippingDistance, itemWeightKg]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧮</span>
            <h3 className="text-lg font-bold text-slate-900">Interactive Merchant Fee & Payout Calculator</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#404d85]/10 text-[#404d85]">
              India GST Slabs (2026)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate your take-home payout per order before listing. No hidden fees or fixed subscription charges.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-slate-400">Estimated Net Margin</div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {breakdown.profitMarginPercent}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Product Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
            >
              {Object.keys(CATEGORIES_FEE_MAP).map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({CATEGORIES_FEE_MAP[cat].referralRate}% Referral Fee)
                  {CATEGORIES_FEE_MAP[cat].gated ? " [Gated Category]" : ""}
                </option>
              ))}
            </select>
            {CATEGORIES_FEE_MAP[selectedCategory]?.gated && (
              <p className="text-[11px] text-amber-700 bg-amber-50 rounded-md p-2 mt-1.5 border border-amber-200 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Requires <strong>{CATEGORIES_FEE_MAP[selectedCategory].requiredLicense}</strong> approval during KYB verification.</span>
              </p>
            )}
          </div>

          {/* Selling Price Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Selling Price to Customer (₹ INR)
              </label>
              <span className="text-xs text-slate-400 font-mono">Includes Product GST</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="50"
                step="50"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm sm:text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#404d85]/30 focus:border-[#404d85]"
              />
            </div>
          </div>

          {/* Fulfillment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Fulfillment Method
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "foc", label: "FOC Logistics", desc: "Office Connect Fulfilled", badge: "Prime Delivery" },
                { id: "easyship", label: "Easy Ship", desc: "Doorstep Pickup & Deliver", badge: "Most Popular" },
                { id: "selfship", label: "Self Ship", desc: "Merchant Own Courier", badge: "Custom SLA" },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setFulfillmentMethod(method.id as any)}
                  className={`p-3 text-left rounded-xl border transition relative ${
                    fulfillmentMethod === method.id
                      ? "border-[#404d85] bg-[#404d85]/5 ring-1 ring-[#404d85]"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-[10px] font-bold text-[#404d85] mb-0.5">{method.badge}</div>
                  <div className="text-xs font-bold text-slate-900">{method.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{method.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Shipping Distance & Weight (Only for FOC and Easy Ship) */}
          {fulfillmentMethod !== "selfship" && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Shipping Zone</label>
                <select
                  value={shippingDistance}
                  onChange={(e) => setShippingDistance(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800"
                >
                  <option value="local">Intra-City / Local</option>
                  <option value="regional">Within State / Regional</option>
                  <option value="national">Inter-State / National</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Package Weight (KG)</label>
                <select
                  value={itemWeightKg}
                  onChange={(e) => setItemWeightKg(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800"
                >
                  <option value={0.5}>Up to 500g</option>
                  <option value={1.0}>500g – 1.0 kg</option>
                  <option value={2.0}>1.0 kg – 2.0 kg</option>
                  <option value={5.0}>2.0 kg – 5.0 kg</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Calculation Summary Card (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-2xl p-5 sm:p-6 border border-slate-200/80 flex flex-col justify-between">
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Breakdown per Unit</h4>

            <div className="space-y-2 text-xs divide-y divide-slate-200/60">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600">Product Selling Price</span>
                <span className="font-bold text-slate-900 font-mono">₹{breakdown.price.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-600 flex items-center gap-1">
                  <span>Referral Fee ({breakdown.categoryConfig.referralRate}%)</span>
                </span>
                <span className="text-red-600 font-semibold font-mono">- ₹{breakdown.referralFee.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-600">Closing Fee</span>
                <span className="text-red-600 font-semibold font-mono">- ₹{breakdown.closingFee.toFixed(2)}</span>
              </div>

              {fulfillmentMethod !== "selfship" && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600">Weight Handling / Shipping</span>
                  <span className="text-red-600 font-semibold font-mono">- ₹{breakdown.shippingFee.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-slate-500 text-[11px]">
                <span>18% GST on Marketplace Fees</span>
                <span className="text-red-600 font-mono">- ₹{breakdown.gstOnFees.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 font-bold text-slate-800">
                <span>Total Deductions</span>
                <span className="text-red-700 font-mono">- ₹{breakdown.totalDeductions.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Net Take-Home Payout Highlight */}
          <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-300">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Net Bank Settlement
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                Direct to Bank A/C
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight flex items-baseline gap-1">
              <span className="text-xl text-slate-500">₹</span>
              <span>{Math.floor(breakdown.netPayout).toLocaleString("en-IN")}</span>
              <span className="text-sm font-semibold text-slate-400">
                .{(breakdown.netPayout % 1).toFixed(2).slice(2)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              *Payout settled automatically every 7 days directly to your verified bank account following customer delivery and return window completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
