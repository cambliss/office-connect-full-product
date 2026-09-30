"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MarketplacePageWrapper } from "@/components/storefront/MarketplacePageWrapper";
import {
  CheckoutStep1Address,
  DeliveryAddress,
} from "@/components/checkout/CheckoutStep1Address";
import { CheckoutStep2Delivery } from "@/components/checkout/CheckoutStep2Delivery";
import {
  CheckoutStep3Payment,
  PaymentMethodType,
} from "@/components/checkout/CheckoutStep3Payment";
import { CheckoutStep4Review } from "@/components/checkout/CheckoutStep4Review";
import { CheckoutStickySummary } from "@/components/checkout/CheckoutStickySummary";
import { SellerPackage } from "@/components/cart/MultiVendorPackageGroup";
import { formatINR } from "@/components/commerce/CommercePrimitives";
import { getStoredCart, clearCartStorage } from "@/lib/cart-wishlist";
import { ensureRazorpayScriptLoaded, openRazorpayCheckout } from "@/lib/onboarding/razorpay";

export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Address State
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress>({
    id: "addr-1",
    name: "Cambliss Studio & Tech HQ (Bhasker A.)",
    phone: "+91 98450 12345",
    line1: "Suite 402, Prestige Tech Park, Marathahalli-Sarjapur Outer Ring Rd",
    line2: "Kadubeesanahalli",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560103",
    isDefault: true,
    type: "Work / Office",
  });

  // B2B GSTIN State
  const [gstin, setGstin] = useState("29AABCU9603R1ZM");
  const [companyName, setCompanyName] = useState("Cambliss Studio Private Limited");

  // Payment Method State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("upi");

  // Multi-Vendor Packages populated from user's shopping cart
  const [packages, setPackages] = useState<SellerPackage[]>([]);

  useEffect(() => {
    const stored = getStoredCart();
    if (stored && stored.length > 0) {
      const sellerMap: Record<string, SellerPackage> = {};
      stored.forEach((item, idx) => {
        const sName = item.sellerName || "Office Connect Verified Seller";
        const sId = `seller_${sName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        if (!sellerMap[sId]) {
          sellerMap[sId] = {
            sellerId: sId,
            sellerName: sName,
            dispatchPincode: "560103",
            deliveryEstimate: "2 - 4 Business Days (Express)",
            deliveryFee: 0,
            items: [],
          };
        }
        sellerMap[sId].items.push({
          id: item.id || `item_${idx}`,
          productId: item.productId,
          title: item.title,
          price: item.price,
          originalPrice: item.originalPrice,
          image: item.image,
          quantity: item.quantity,
          sku: `SKU-${item.productId ? item.productId.substring(0, 8).toUpperCase() : "ITEM"}`,
          brand: "Office Connect Partner",
        });
      });
      setPackages(Object.values(sellerMap));
    }
  }, []);

  const subtotal = packages.reduce((acc, pkg) => acc + pkg.items.reduce((iAcc, item) => iAcc + (item.price * item.quantity), 0), 0);
  const originalTotal = packages.reduce((acc, pkg) => acc + pkg.items.reduce((iAcc, item) => iAcc + ((item.originalPrice || item.price) * item.quantity), 0), 0);
  const discountAmount = originalTotal > subtotal ? originalTotal - subtotal : 0;
  const deliveryFee = 0;
  const grandTotal = subtotal - discountAmount + deliveryFee > 0 ? subtotal - discountAmount + deliveryFee : 0;

  const handlePlaceOrder = async () => {
    if (packages.length === 0 || isPlacingOrder) return;
    setIsPlacingOrder(true);
    setPaymentError(null);

    try {
      // 1. Compile line items for the backend multi-seller financial ledger
      const itemsPayload = packages.flatMap((pkg) =>
        pkg.items.map((it) => ({
          productId: it.productId,
          title: it.title,
          sku: it.sku || `SKU-${it.productId}`,
          brand: it.brand || "Partner",
          category: "General",
          unitPrice: it.price,
          quantity: it.quantity,
          sellerId: pkg.sellerId,
          sellerName: pkg.sellerName,
        }))
      );

      // 2. Create Master Order record in backend
      const orderRes = await fetch("/api/ecommerce/finance/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: "cust_guest_buyer",
          customerName: selectedAddress.name,
          customerEmail: "bhaskeradv1@gmail.com",
          items: itemsPayload,
        }),
      });

      const orderData = await orderRes.json();
      const masterOrderId = orderData?.order?.id;
      const orderNumber = orderData?.order?.orderNumber || "OC-ORD";

      // 3. If Cash on Delivery (COD) selected, finalize directly
      if (selectedPaymentMethod === "cod") {
        clearCartStorage();
        router.push(`/orders?order_placed=${encodeURIComponent(orderNumber)}`);
        return;
      }

      // 4. Online Razorpay Checkout (UPI, Cards, Netbanking)
      const scriptReady = await ensureRazorpayScriptLoaded();
      if (!scriptReady) {
        throw new Error("Unable to initialize Razorpay checkout script. Please check your network connection.");
      }

      // Call backend to create Razorpay Order
      const rzpRes = await fetch("/api/ecommerce/finance/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterOrderId,
          amount: grandTotal,
          customerName: selectedAddress.name,
          customerEmail: "bhaskeradv1@gmail.com",
        }),
      });

      const rzpData = await rzpRes.json();
      if (!rzpData.success || !rzpData.order) {
        throw new Error(rzpData.error || "Failed to generate Razorpay payment order.");
      }

      const rzpKey =
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        rzpData.order.key ||
        "rzp_test_placeholder";

      // Trigger standard Razorpay modal
      const verificationPayload = await openRazorpayCheckout({
        key: rzpKey,
        order: {
          id: rzpData.order.id,
          amount: rzpData.order.amount,
          currency: rzpData.order.currency || "INR",
        },
        name: "The Office Connect",
        description: `Order ${orderNumber} - Escrow Protection Lock`,
        prefill: {
          name: selectedAddress.name,
          email: "bhaskeradv1@gmail.com",
          contact: selectedAddress.phone.replace(/[^0-9+]/g, "") || "+919845012345",
        },
      });

      // 5. Verify payment signature on backend
      const verifyRes = await fetch("/api/ecommerce/finance/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterOrderId,
          razorpay_order_id: verificationPayload.razorpay_order_id,
          razorpay_payment_id: verificationPayload.razorpay_payment_id,
          razorpay_signature: verificationPayload.razorpay_signature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || "Payment signature verification failed.");
      }

      // 6. Clear shopping bag and redirect to orders confirmation
      clearCartStorage();
      router.push(`/orders?order_placed=${encodeURIComponent(orderNumber)}&payment_id=${encodeURIComponent(verificationPayload.razorpay_payment_id)}`);
    } catch (err: any) {
      console.error("[Checkout] Payment execution failed:", err);
      setPaymentError(err?.message || "Payment process could not be completed. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (packages.length === 0) {
    return (
      <MarketplacePageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 select-none text-center">
          <div className="max-w-md mx-auto p-8 rounded-[12px] border border-slate-200 bg-white shadow-sm space-y-4">
            <span className="text-4xl">🛍️</span>
            <h1 className="text-xl font-black text-slate-900">Your Shopping Bag is Empty</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              No products are currently staged for checkout. Browse the marketplace to discover products uploaded by registered merchants.
            </p>
            <div className="pt-2">
              <Link
                href="/storefront"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs transition shadow-sm"
              >
                ← Explore Marketplace
              </Link>
            </div>
          </div>
        </div>
      </MarketplacePageWrapper>
    );
  }

  return (
    <MarketplacePageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-32 select-none">
        
        {/* Header */}
        <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Multi-Package Escrow Checkout
            </h1>
            <p className="text-xs text-slate-500">
              Complete your 4-step verified purchase with 100% Escrow Protection guarantee.
            </p>
          </div>

          <Link
            href="/cart"
            className="text-xs font-bold text-[#404d85] hover:underline self-start sm:self-auto"
          >
            ← Return to Shopping Bag
          </Link>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between max-w-2xl bg-white p-3 rounded-[8px] border border-slate-200 text-xs font-extrabold shadow-2xs">
          {[
            { num: 1, label: "1. Address" },
            { num: 2, label: "2. Delivery" },
            { num: 3, label: "3. Payment" },
            { num: 4, label: "4. Review" },
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => {
                if (currentStep > s.num) setCurrentStep(s.num as any);
              }}
              className={`flex items-center gap-1.5 cursor-pointer ${
                currentStep === s.num
                  ? "text-[#404d85]"
                  : currentStep > s.num
                  ? "text-emerald-700 font-bold"
                  : "text-slate-400 cursor-not-allowed"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  currentStep === s.num
                    ? "bg-[#404d85] text-white"
                    : currentStep > s.num
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {currentStep > s.num ? "✓" : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* 2-Column Desktop Grid / 1-Column Mobile Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: 4-Step Form Formations */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Step 1: Address */}
            <CheckoutStep1Address
              isActive={currentStep === 1}
              isCompleted={currentStep > 1}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              onContinue={() => setCurrentStep(2)}
              onEditStep={() => setCurrentStep(1)}
              gstin={gstin}
              onGstinChange={setGstin}
              companyName={companyName}
              onCompanyNameChange={setCompanyName}
            />

            {/* Step 2: Delivery */}
            <CheckoutStep2Delivery
              isActive={currentStep === 2}
              isCompleted={currentStep > 2}
              packages={packages}
              onContinue={() => setCurrentStep(3)}
              onEditStep={() => setCurrentStep(2)}
            />

            {/* Step 3: Payment */}
            <CheckoutStep3Payment
              isActive={currentStep === 3}
              isCompleted={currentStep > 3}
              selectedMethod={selectedPaymentMethod}
              onSelectMethod={setSelectedPaymentMethod}
              onContinue={() => setCurrentStep(4)}
              onEditStep={() => setCurrentStep(3)}
            />

            {/* Step 4: Final Review */}
            {paymentError && (
              <div className="p-4 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-3">
                <span>⚠️ {paymentError}</span>
                <button
                  type="button"
                  onClick={() => setPaymentError(null)}
                  className="text-rose-600 hover:text-rose-900 font-black text-sm"
                >
                  ✕
                </button>
              </div>
            )}

            <CheckoutStep4Review
              isActive={currentStep === 4}
              packages={packages}
              address={selectedAddress}
              paymentMethod={selectedPaymentMethod}
              grandTotal={grandTotal}
              onPlaceOrder={handlePlaceOrder}
              isPlacingOrder={isPlacingOrder}
            />

          </div>

          {/* Right Column: Sticky Order Summary */}
          <div className="lg:col-span-4">
            <CheckoutStickySummary
              packages={packages}
              subtotal={subtotal}
              originalTotal={originalTotal}
              discountAmount={discountAmount}
              deliveryFee={deliveryFee}
              grandTotal={grandTotal}
            />
          </div>

        </div>

        {/* Mobile Fixed Bottom Checkout Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-4 shadow-xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Final Amount:
            </span>
            <span className="text-xl font-black text-[#404d85]">
              {formatINR(grandTotal)}
            </span>
          </div>

          <button
            type="button"
            disabled={isPlacingOrder}
            onClick={() => {
              if (currentStep < 4) {
                setCurrentStep((currentStep + 1) as any);
              } else {
                handlePlaceOrder();
              }
            }}
            className="flex-1 py-3 px-4 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs text-center transition shadow-sm"
          >
            {isPlacingOrder ? (
              "Securing Escrow..."
            ) : currentStep < 4 ? (
              `Proceed to Step ${currentStep + 1} →`
            ) : (
              `Place Order (${formatINR(grandTotal)})`
            )}
          </button>
        </div>

      </div>
    </MarketplacePageWrapper>
  );
}
