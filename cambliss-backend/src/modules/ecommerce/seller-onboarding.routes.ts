import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

// In-memory persistent registry fallback if DB table is unmigrated
interface KybRecord {
  id: string;
  businessName: string;
  tradeName: string;
  category: string;
  gstin: string;
  pan: string;
  bankName: string;
  accountNumber: string;
  warehouseCity: string;
  appliedDate: string;
  status: "Pending Review" | "Approved" | "Rejected";
  details?: Record<string, any>;
  createdAt: string;
}

const IN_MEMORY_KYB_QUEUE: KybRecord[] = [
  {
    id: "OC-KYB-2026-1001",
    businessName: "Sony India Private Limited",
    tradeName: "Sony Official Store",
    category: "Consumer Electronics",
    gstin: "29AABCU9603R1ZM",
    pan: "AABCU9603R",
    bankName: "Citibank N.A. India",
    accountNumber: "•••• 8912",
    warehouseCity: "Bengaluru, KA",
    appliedDate: "Sep 05, 2026",
    status: "Approved",
    createdAt: new Date().toISOString(),
  },
  {
    id: "OC-KYB-2026-1002",
    businessName: "Keychron Peripherals LLP",
    tradeName: "Keychron India",
    category: "Computers & Laptops",
    gstin: "27AABCK8812R1ZZ",
    pan: "AABCK8812R",
    bankName: "HDFC Bank Ltd",
    accountNumber: "•••• 4091",
    warehouseCity: "Mumbai, MH",
    appliedDate: "Sep 06, 2026",
    status: "Approved",
    createdAt: new Date().toISOString(),
  },
];

// POST /api/storefront/seller-onboarding
router.post("/", (req: Request, res: Response) => {
  try {
    const data = req.body;
    const appId = data.id || `OC-KYB-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRecord: KybRecord = {
      id: appId,
      businessName: data.businessName || data.legalBusinessName || "Sole Proprietor",
      tradeName: data.tradeName || data.storeDisplayName || "New Merchant Store",
      category: data.category || "General Merchandise",
      gstin: data.gstin || "EXEMPT",
      pan: data.pan || data.panNumber || "PAN_PENDING",
      bankName: data.bankName || "HDFC Bank Ltd",
      accountNumber: data.accountNumber || "•••• 4091",
      warehouseCity: data.warehouseCity || data.pickupCity || "Mumbai",
      appliedDate: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      status: "Pending Review",
      details: data.details || data,
      createdAt: new Date().toISOString(),
    };

    IN_MEMORY_KYB_QUEUE.unshift(newRecord);

    return res.status(201).json({
      success: true,
      message: "Seller onboarding application submitted for KYB verification.",
      application: newRecord,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || "Failed to submit application" });
  }
});

// GET /api/storefront/seller-onboarding
router.get("/", (_req: Request, res: Response) => {
  return res.json({
    success: true,
    total: IN_MEMORY_KYB_QUEUE.length,
    applications: IN_MEMORY_KYB_QUEUE,
  });
});

// GET /api/storefront/seller-onboarding/:id
router.get("/:id", (req: Request, res: Response) => {
  const app = IN_MEMORY_KYB_QUEUE.find((a) => a.id === req.params.id);
  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }
  return res.json({ success: true, application: app });
});

// PATCH /api/storefront/seller-onboarding/:id/status
router.patch("/:id/status", (req: Request, res: Response) => {
  const { status } = req.body;
  const app = IN_MEMORY_KYB_QUEUE.find((a) => a.id === req.params.id);
  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }
  if (status !== "Approved" && status !== "Rejected" && status !== "Pending Review") {
    return res.status(400).json({ success: false, message: "Invalid status value" });
  }
  app.status = status;
  return res.json({ success: true, message: `Application status updated to ${status}`, application: app });
});

export default router;
