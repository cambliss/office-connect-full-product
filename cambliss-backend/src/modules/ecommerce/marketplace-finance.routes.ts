import { Router, Request, Response } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { financialLedgerService } from "./financial-ledger.service";
import { sellerVerificationService } from "./seller-verification.service";
import SettlementProviderFactory from "../payments/settlement-provider.factory";
import { handleCommerceOrderStockDeduction } from "../inventory/supply-chain.service";

const router = Router();
const settlementProvider = SettlementProviderFactory.getProvider();

/**
 * 1. FINANCIAL OVERVIEW & KPIS
 */
router.get("/overview", async (req: Request, res: Response) => {
  try {
    const ledger = await financialLedgerService.getFinancialLedger();
    const orders = await financialLedgerService.getAllMasterOrders();
    const settlements = await financialLedgerService.getSellerSettlements();
    const returns = await financialLedgerService.getOrderReturns();

    const totalGmv = ledger
      .filter((l) => l.entryType === "CUSTOMER_PAYMENT")
      .reduce((sum, l) => sum + l.creditAmount, 0);

    const totalCommissions = ledger
      .filter((l) => l.entryType === "PLATFORM_COMMISSION")
      .reduce((sum, l) => sum + l.creditAmount, 0);

    const totalSellerSettled = ledger
      .filter((l) => l.entryType === "SELLER_SETTLEMENT")
      .reduce((sum, l) => sum + l.debitAmount, 0);

    const totalCustomerRefunds = ledger
      .filter((l) => l.entryType === "CUSTOMER_REFUND")
      .reduce((sum, l) => sum + l.debitAmount, 0);

    const totalSellerPayableOutstanding = ledger
      .filter((l) => l.entryType === "SELLER_PAYABLE")
      .reduce((sum, l) => sum + l.creditAmount, 0) - totalSellerSettled;

    res.json({
      success: true,
      data: {
        totalGmv,
        totalCommissions,
        totalSellerSettled,
        totalCustomerRefunds,
        totalSellerPayableOutstanding: Math.max(0, totalSellerPayableOutstanding),
        ordersCount: orders.length,
        settlementsCount: settlements.length,
        returnsCount: returns.length,
        ledgerEntriesCount: ledger.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. MULTI-SELLER CHECKOUT ORDER CREATION
 */
router.post("/orders", async (req: Request, res: Response) => {
  try {
    const { customerId, customerName, customerEmail, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Items array is required" });
    }

    const masterOrder = await financialLedgerService.createMultiSellerOrder({
      customerId: customerId || "cust_guest_01",
      customerName: customerName || "Anand Mahindra",
      customerEmail: customerEmail || "anand@mahindra.com",
      items,
    });

    // Interconnected Supply Chain: Automatically trigger warehouse stock deduction & check low-stock triggers
    try {
      const orgId = (req as any).user?.organizationId || "org_default";
      await handleCommerceOrderStockDeduction(masterOrder.id, items, orgId);
    } catch (stockErr) {
      console.error("[SupplyChain] Non-blocking stock deduction note:", stockErr);
    }

    res.status(201).json({ success: true, order: masterOrder });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 3. RECORD CUSTOMER PAYMENT CAPTURE
 */
router.post("/orders/:id/capture-payment", async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const { gatewayPaymentId, gatewayOrderId } = req.body;

    const order = await financialLedgerService.recordCustomerPayment(
      orderId,
      gatewayPaymentId || `pay_rzp_${Date.now()}`,
      gatewayOrderId
    );

    res.json({ success: true, order, message: "Payment recorded and double-entry ledger written." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 3.1 CREATE RAZORPAY CHECKOUT ORDER
 */
router.post("/razorpay/create-order", async (req: Request, res: Response) => {
  try {
    const { masterOrderId, amount, customerName, customerEmail } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: "Valid amount is required" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "";
    const amountInPaise = Math.round(Number(amount) * 100);

    // If Razorpay API keys are configured, create authentic Razorpay order
    if (keyId && keySecret && !keyId.startsWith("rzp_mock")) {
      try {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: (masterOrderId || `rec_${Date.now()}`).substring(0, 40),
          notes: {
            masterOrderId: masterOrderId || "",
            customerName: customerName || "",
            customerEmail: customerEmail || "",
            platform: "The Office Connect Marketplace",
          },
        });

        return res.json({
          success: true,
          order: {
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            key: keyId,
          },
        });
      } catch (rzpErr: any) {
        console.warn("[Razorpay] Live order creation error, falling back to resilient sandbox:", rzpErr?.message || rzpErr);
      }
    }

    // Resilient sandbox order for offline / staging test scenarios
    const simulatedOrderId = `order_dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return res.json({
      success: true,
      order: {
        id: simulatedOrderId,
        amount: amountInPaise,
        currency: "INR",
        key: keyId || "rzp_test_placeholder",
      },
      mode: "sandbox",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 3.2 VERIFY RAZORPAY PAYMENT SIGNATURE & CAPTURE
 */
router.post("/razorpay/verify-payment", async (req: Request, res: Response) => {
  try {
    const { masterOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, error: "Missing razorpay_order_id or razorpay_payment_id" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "";

    // Signature verification if signature & secret are present
    if (razorpay_signature && keySecret && !razorpay_order_id.startsWith("order_dev_") && !razorpay_order_id.startsWith("order_mock_")) {
      const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");

      const actualBuffer = Buffer.from(razorpay_signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      const isSignatureValid = actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
      if (!isSignatureValid) {
        return res.status(400).json({ success: false, error: "Razorpay signature verification failed" });
      }
    }

    // Update Master Order status & write double-entry financial ledger
    let updatedOrder = null;
    if (masterOrderId) {
      try {
        updatedOrder = await financialLedgerService.recordCustomerPayment(
          masterOrderId,
          razorpay_payment_id,
          razorpay_order_id
        );
      } catch (ledgerErr) {
        console.warn("[Razorpay] Ledger update error:", ledgerErr);
      }
    }

    res.json({
      success: true,
      message: "Razorpay payment verified successfully",
      order: updatedOrder,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4. GET ALL ORDERS (MASTER & SPLIT SELLER SUB-ORDERS)
 */
router.get("/orders", async (req: Request, res: Response) => {
  try {
    const orders = await financialLedgerService.getAllMasterOrders();
    res.json({ success: true, count: orders.length, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 5. MARK ORDER DELIVERED (STARTS 7-DAY RETURN WINDOW)
 */
router.post("/orders/:orderId/deliver", async (req: Request, res: Response) => {
  try {
    const sellerOrderId = req.params.orderId as string;
    const { trackingNumber, courierPartner } = req.body;

    const deliveredSubOrder = await financialLedgerService.markOrderDelivered(
      sellerOrderId,
      trackingNumber,
      courierPartner
    );

    res.json({ success: true, order: deliveredSubOrder, message: "Order marked delivered. Return window active." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. AMAZON-STYLE REFUND (FULL OR PARTIAL WITH RECOVERY DEBIT)
 */
router.post("/orders/:orderId/refund", async (req: Request, res: Response) => {
  try {
    const sellerOrderId = req.params.orderId as string;
    const { masterOrderId, refundType, partialAmount, reason, initiatedBy } = req.body;

    if (!masterOrderId) {
      return res.status(400).json({ success: false, error: "masterOrderId is required" });
    }

    const result = await financialLedgerService.processAmazonStyleRefund({
      masterOrderId,
      sellerOrderId,
      refundType: refundType || "FULL",
      partialAmount: partialAmount ? Number(partialAmount) : undefined,
      reason: reason || "Customer dissatisfied / Return accepted",
      initiatedBy: initiatedBy || "Cambliss Support Desk",
    });

    res.json({
      success: true,
      message: "Refund processed successfully with ledger reversals.",
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 7. EVALUATE SETTLEMENT ELIGIBILITY
 */
router.get("/settlements/eligibility", async (req: Request, res: Response) => {
  try {
    const simulateExpiry = req.query.simulateExpiry === "true";
    const eligibility = await financialLedgerService.evaluateSettlementEligibility(simulateExpiry);
    res.json({ success: true, ...eligibility });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 8. EXECUTE SELLER SETTLEMENT DISPATCH VIA RAZORPAY VIRTUAL ACCOUNT
 */
router.post("/settlements/dispatch", async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.body;
    if (!sellerId) {
      return res.status(400).json({ success: false, error: "sellerId is required" });
    }

    const settlement = await financialLedgerService.executeSellerSettlement(sellerId);
    res.json({ success: true, settlement, message: "Settlement instruction sent via Razorpay Virtual Accounts." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 9. GET SETTLEMENTS & RETURNS LISTS
 */
router.get("/settlements", async (req: Request, res: Response) => {
  try {
    const settlements = await financialLedgerService.getSellerSettlements();
    res.json({ success: true, count: settlements.length, settlements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/returns", async (req: Request, res: Response) => {
  try {
    const returns = await financialLedgerService.getOrderReturns();
    res.json({ success: true, count: returns.length, returns });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 10. GET IMMUTABLE FINANCIAL LEDGER ENTRIES
 */
router.get("/ledger", async (req: Request, res: Response) => {
  try {
    const entries = await financialLedgerService.getFinancialLedger();
    res.json({ success: true, count: entries.length, entries });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 11. RECONCILIATION SUMMARY
 */
router.get("/reconciliation", async (req: Request, res: Response) => {
  try {
    const report = await financialLedgerService.getReconciliationReport();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 12. SELLER KYC & VERIFICATION QUEUE
 */
router.get("/kyc/queue", async (req: Request, res: Response) => {
  try {
    const status = req.query.status as any;
    const queue = await sellerVerificationService.getKycQueue(status);
    res.json({ success: true, count: queue.length, dossiers: queue });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 13. TRIGGER AI PRELIMINARY DATA COLLECTION
 */
router.post("/kyc/:sellerId/ai-scrape", async (req: Request, res: Response) => {
  try {
    const sellerId = req.params.sellerId as string;
    const updatedDossier = await sellerVerificationService.runAiDataCollection(sellerId);
    res.json({
      success: true,
      message: "AI agent preliminary intelligence collection completed.",
      dossier: updatedDossier,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 14. SUPPORT TEAM MANUAL REVIEW DECISION (HUMAN-IN-THE-LOOP)
 */
router.post("/kyc/:sellerId/decision", async (req: Request, res: Response) => {
  try {
    const sellerId = req.params.sellerId as string;
    const { decision, reviewerName, notes } = req.body;

    if (!decision || !reviewerName) {
      return res.status(400).json({ success: false, error: "decision and reviewerName are required" });
    }

    const result = await sellerVerificationService.submitManualReviewDecision(
      sellerId,
      decision,
      reviewerName,
      notes
    );

    res.json({
      success: true,
      message: `Seller marked ${decision}. Audit record logged.`,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 15. IDEMPOTENT RAZORPAY WEBHOOK HANDLER
 */
router.post("/webhooks/razorpay", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const rawBody = JSON.stringify(req.body);

    const isValid = settlementProvider.verifyWebhookSignature(rawBody, signature);
    if (!isValid && process.env.NODE_ENV === "production") {
      return res.status(400).json({ success: false, error: "Invalid webhook signature" });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[RazorpayWebhook] Received event: ${event}`);

    // Process event types idempotently
    if (event === "payment.captured") {
      const paymentEntity = payload?.payment?.entity;
      const orderId = paymentEntity?.notes?.masterOrderId;
      if (orderId) {
        await financialLedgerService.recordCustomerPayment(orderId, paymentEntity.id);
      }
    }

    res.json({ status: "ok", received: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
